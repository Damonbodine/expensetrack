import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getCurrentUserOrThrow, requireRole, createAuditLog, createNotification } from "./helpers";

export const listByReport = query({
  args: { reportId: v.id("expenseReports") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("The requested resource was not found.");
    if (currentUser.role !== "Admin" && report.submittedById !== currentUser._id && currentUser.role !== "Approver") {
      throw new Error("You do not have permission to perform this action.");
    }
    const approvals = await ctx.db.query("approvals").withIndex("by_reportId", (q) => q.eq("reportId", args.reportId)).collect();
    const enriched = await Promise.all(
      approvals.map(async (approval) => {
        const approver = await ctx.db.get(approval.approverId);
        return { ...approval, approver };
      })
    );
    return enriched;
  },
});

export const listByApprover = query({
  args: {
    approverId: v.optional(v.id("users")),
    limit: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    if (currentUser.role !== "Admin" && currentUser.role !== "Approver") {
      throw new Error("You do not have permission to perform this action.");
    }
    const targetId = args.approverId ?? currentUser._id;
    // Approvers can only see their own history
    if (currentUser.role === "Approver" && targetId !== currentUser._id) {
      throw new Error("You do not have permission to perform this action.");
    }
    const approvals = await ctx.db.query("approvals").withIndex("by_approverId", (q) => q.eq("approverId", targetId)).order("desc").take(args.limit ?? 50);
    const enriched = await Promise.all(
      approvals.map(async (approval) => {
        const report = await ctx.db.get(approval.reportId);
        return { ...approval, report };
      })
    );
    return enriched;
  },
});

export const approveReport = mutation({
  args: {
    reportId: v.id("expenseReports"),
    comments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    if (currentUser.role !== "Admin" && currentUser.role !== "Approver") {
      throw new Error("You do not have permission to perform this action.");
    }
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("The requested resource was not found.");
    if (report.status !== "Submitted" && report.status !== "UnderReview") {
      throw new Error("Invalid status transition for this expense report.");
    }
    // No self-approval
    if (report.submittedById === currentUser._id) {
      throw new Error("You cannot approve, reject, or return your own expense report.");
    }
    const now = Date.now();
    // Create approval record
    const approvalId = await ctx.db.insert("approvals", {
      reportId: args.reportId,
      approverId: currentUser._id,
      action: "Approved",
      comments: args.comments,
      actionAt: now,
      createdAt: now,
    });
    // Update report status
    await ctx.db.patch(args.reportId, {
      status: "Approved",
      approverId: currentUser._id,
      reviewedAt: now,
      reviewNotes: args.comments,
      updatedAt: now,
    });
    // Cascade status to expenses
    const expenses = await ctx.db.query("expenses").withIndex("by_reportId", (q) => q.eq("reportId", args.reportId)).collect();
    for (const expense of expenses) {
      await ctx.db.patch(expense._id, { status: "Approved", updatedAt: now });
    }
    // Update budget spent amounts
    const categoryTotals = new Map<string, number>();
    for (const expense of expenses) {
      const catId = expense.categoryId as string;
      categoryTotals.set(catId, (categoryTotals.get(catId) ?? 0) + expense.amount);
    }
    for (const [categoryId, amount] of categoryTotals) {
      const category = await ctx.db.get(categoryId as any as Id<"categories">);
      if (category && category.budgetLineId) {
        const budgetLine = await ctx.db.get(category.budgetLineId);
        if (budgetLine) {
          const newSpent = budgetLine.spentAmount + amount;
          const newRemaining = budgetLine.budgetedAmount - newSpent;
          await ctx.db.patch(budgetLine._id, {
            spentAmount: newSpent,
            remainingAmount: newRemaining,
          });
          // Check budget thresholds
          const utilization = budgetLine.budgetedAmount > 0 ? (newSpent / budgetLine.budgetedAmount) * 100 : 0;
          if (utilization >= 100) {
            // Budget exceeded notification
            const admins = await ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "Admin")).collect();
            for (const admin of admins) {
              await createNotification(ctx, admin._id, "BudgetExceeded", "Budget Exceeded", `Budget line "${budgetLine.name}" has been exceeded. Spent: $${newSpent.toFixed(2)} / $${budgetLine.budgetedAmount.toFixed(2)}`, `/budget/${budgetLine._id}`);
            }
          } else if (utilization >= 80) {
            // Budget warning notification
            const admins = await ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "Admin")).collect();
            for (const admin of admins) {
              await createNotification(ctx, admin._id, "BudgetWarning", "Budget Warning", `Budget line "${budgetLine.name}" has reached ${utilization.toFixed(1)}% utilization. Spent: $${newSpent.toFixed(2)} / $${budgetLine.budgetedAmount.toFixed(2)}`, `/budget/${budgetLine._id}`);
            }
          }
        }
      }
    }
    // Notify submitter
    await createNotification(ctx, report.submittedById, "ReportApproved", "Report Approved", `Your expense report "${report.title}" has been approved by ${currentUser.name}.`, `/reports/${args.reportId}`);
    await createAuditLog(ctx, currentUser._id, "Approve", "expenseReports", args.reportId, `Approved report: ${report.title}`);
    return approvalId;
  },
});

export const rejectReport = mutation({
  args: {
    reportId: v.id("expenseReports"),
    comments: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    if (currentUser.role !== "Admin" && currentUser.role !== "Approver") {
      throw new Error("You do not have permission to perform this action.");
    }
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("The requested resource was not found.");
    if (report.status !== "Submitted" && report.status !== "UnderReview") {
      throw new Error("Invalid status transition for this expense report.");
    }
    if (report.submittedById === currentUser._id) {
      throw new Error("You cannot approve, reject, or return your own expense report.");
    }
    const now = Date.now();
    const approvalId = await ctx.db.insert("approvals", {
      reportId: args.reportId,
      approverId: currentUser._id,
      action: "Rejected",
      comments: args.comments,
      actionAt: now,
      createdAt: now,
    });
    await ctx.db.patch(args.reportId, {
      status: "Rejected",
      approverId: currentUser._id,
      reviewedAt: now,
      reviewNotes: args.comments,
      updatedAt: now,
    });
    // Cascade Rejected status to expenses
    const expenses = await ctx.db.query("expenses").withIndex("by_reportId", (q) => q.eq("reportId", args.reportId)).collect();
    for (const expense of expenses) {
      await ctx.db.patch(expense._id, { status: "Rejected", updatedAt: now });
    }
    // Notify submitter
    await createNotification(ctx, report.submittedById, "ReportRejected", "Report Rejected", `Your expense report "${report.title}" has been rejected by ${currentUser.name}. Reason: ${args.comments}`, `/reports/${args.reportId}`);
    await createAuditLog(ctx, currentUser._id, "Reject", "expenseReports", args.reportId, `Rejected report: ${report.title}. Reason: ${args.comments}`);
    return approvalId;
  },
});

export const returnReport = mutation({
  args: {
    reportId: v.id("expenseReports"),
    comments: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    if (currentUser.role !== "Admin" && currentUser.role !== "Approver") {
      throw new Error("You do not have permission to perform this action.");
    }
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("The requested resource was not found.");
    if (report.status !== "Submitted" && report.status !== "UnderReview") {
      throw new Error("Invalid status transition for this expense report.");
    }
    if (report.submittedById === currentUser._id) {
      throw new Error("You cannot approve, reject, or return your own expense report.");
    }
    const now = Date.now();
    const approvalId = await ctx.db.insert("approvals", {
      reportId: args.reportId,
      approverId: currentUser._id,
      action: "ReturnedForRevision",
      comments: args.comments,
      actionAt: now,
      createdAt: now,
    });
    // Revert report to Draft
    await ctx.db.patch(args.reportId, {
      status: "Draft",
      reviewedAt: now,
      reviewNotes: args.comments,
      updatedAt: now,
    });
    // Revert expenses to Draft
    const expenses = await ctx.db.query("expenses").withIndex("by_reportId", (q) => q.eq("reportId", args.reportId)).collect();
    for (const expense of expenses) {
      await ctx.db.patch(expense._id, { status: "Draft", updatedAt: now });
    }
    // Notify submitter
    await createNotification(ctx, report.submittedById, "ReportRejected", "Report Returned for Revision", `Your expense report "${report.title}" has been returned for revision by ${currentUser.name}. Reason: ${args.comments}`, `/reports/${args.reportId}`);
    await createAuditLog(ctx, currentUser._id, "StatusChange", "expenseReports", args.reportId, `Returned report for revision: ${report.title}. Reason: ${args.comments}`);
    return approvalId;
  },
});
