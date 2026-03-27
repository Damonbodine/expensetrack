import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUserOrThrow, requireRole, createAuditLog, createNotification } from "./helpers";

export const listReports = query({
  args: {
    status: v.optional(v.union(v.literal("Draft"), v.literal("Submitted"), v.literal("UnderReview"), v.literal("Approved"), v.literal("Rejected"), v.literal("Reimbursed"))),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    let reports;
    if (currentUser.role === "Admin") {
      if (args.status) {
        reports = await ctx.db.query("expenseReports").withIndex("by_status", (q) => q.eq("status", args.status!)).collect();
      } else {
        reports = await ctx.db.query("expenseReports").order("desc").collect();
      }
    } else if (currentUser.role === "Approver") {
      const allReports = args.status
        ? await ctx.db.query("expenseReports").withIndex("by_status", (q) => q.eq("status", args.status!)).collect()
        : await ctx.db.query("expenseReports").order("desc").collect();
      reports = allReports.filter(
        (r) => r.submittedById === currentUser._id || r.status === "Submitted" || r.status === "UnderReview"
      );
    } else {
      if (args.status) {
        reports = await ctx.db.query("expenseReports").withIndex("by_submittedById_status", (q) => q.eq("submittedById", currentUser._id).eq("status", args.status!)).collect();
      } else {
        reports = await ctx.db.query("expenseReports").withIndex("by_submittedById", (q) => q.eq("submittedById", currentUser._id)).collect();
      }
    }
    const enriched = await Promise.all(
      reports.map(async (report) => {
        const submitter = await ctx.db.get(report.submittedById);
        return { ...report, submitter };
      })
    );
    return enriched;
  },
});

export const getReport = query({
  args: { reportId: v.id("expenseReports") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("The requested resource was not found.");
    if (currentUser.role !== "Admin" && report.submittedById !== currentUser._id && currentUser.role !== "Approver") {
      throw new Error("You do not have permission to perform this action.");
    }
    const submitter = await ctx.db.get(report.submittedById);
    const approver = report.approverId ? await ctx.db.get(report.approverId) : null;
    const expenses = await ctx.db.query("expenses").withIndex("by_reportId", (q) => q.eq("reportId", args.reportId)).collect();
    const enrichedExpenses = await Promise.all(
      expenses.map(async (expense) => {
        const category = await ctx.db.get(expense.categoryId);
        return { ...expense, category };
      })
    );
    return { ...report, submitter, approver, expenses: enrichedExpenses };
  },
});

export const listPendingForApproval = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    if (currentUser.role !== "Admin" && currentUser.role !== "Approver") {
      throw new Error("You do not have permission to perform this action.");
    }
    const submitted = await ctx.db.query("expenseReports").withIndex("by_status", (q) => q.eq("status", "Submitted")).collect();
    const underReview = await ctx.db.query("expenseReports").withIndex("by_status", (q) => q.eq("status", "UnderReview")).collect();
    const pending = [...submitted, ...underReview];
    const enriched = await Promise.all(
      pending.map(async (report) => {
        const submitter = await ctx.db.get(report.submittedById);
        return { ...report, submitter };
      })
    );
    return enriched;
  },
});

export const createReport = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    period: v.optional(v.string()),
    expenseIds: v.optional(v.array(v.id("expenses"))),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const now = Date.now();
    const reportId = await ctx.db.insert("expenseReports", {
      title: args.title,
      description: args.description,
      submittedById: currentUser._id,
      totalAmount: 0,
      status: "Draft",
      period: args.period,
      createdAt: now,
      updatedAt: now,
    });
    // Add expenses to report if provided
    let totalAmount = 0;
    if (args.expenseIds && args.expenseIds.length > 0) {
      for (const expenseId of args.expenseIds) {
        const expense = await ctx.db.get(expenseId);
        if (!expense) continue;
        if (expense.submittedById !== currentUser._id) continue;
        if (expense.status !== "Draft" || expense.reportId) continue;
        await ctx.db.patch(expenseId, { reportId, updatedAt: now });
        totalAmount += expense.amount;
      }
      await ctx.db.patch(reportId, { totalAmount });
    }
    await createAuditLog(ctx, currentUser._id, "Create", "expenseReports", reportId, `Created report: ${args.title}`);
    return reportId;
  },
});

export const updateReport = mutation({
  args: {
    reportId: v.id("expenseReports"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("The requested resource was not found.");
    if (report.submittedById !== currentUser._id) {
      throw new Error("You do not have permission to perform this action.");
    }
    if (report.status !== "Draft") {
      throw new Error("This expense report can only be modified while in Draft status.");
    }
    const { reportId, ...fields } = args;
    const updates: Record<string, any> = {};
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) updates[key] = val;
    }
    updates.updatedAt = Date.now();
    await ctx.db.patch(args.reportId, updates);
    await createAuditLog(ctx, currentUser._id, "Update", "expenseReports", args.reportId, `Updated report fields: ${Object.keys(updates).join(", ")}`);
    return args.reportId;
  },
});

export const deleteReport = mutation({
  args: { reportId: v.id("expenseReports") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("The requested resource was not found.");
    if (report.submittedById !== currentUser._id) {
      throw new Error("You do not have permission to perform this action.");
    }
    if (report.status !== "Draft") {
      throw new Error("This expense report can only be modified while in Draft status.");
    }
    // Unassign all expenses from this report
    const expenses = await ctx.db.query("expenses").withIndex("by_reportId", (q) => q.eq("reportId", args.reportId)).collect();
    for (const expense of expenses) {
      await ctx.db.patch(expense._id, { reportId: undefined, updatedAt: Date.now() });
    }
    await ctx.db.delete(args.reportId);
    await createAuditLog(ctx, currentUser._id, "Delete", "expenseReports", args.reportId, `Deleted report: ${report.title}`);
    return null;
  },
});

export const submitReport = mutation({
  args: { reportId: v.id("expenseReports") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("The requested resource was not found.");
    if (report.submittedById !== currentUser._id) {
      throw new Error("You do not have permission to perform this action.");
    }
    if (report.status !== "Draft") {
      throw new Error("Invalid status transition for this expense report.");
    }
    // Get all expenses in this report
    const expenses = await ctx.db.query("expenses").withIndex("by_reportId", (q) => q.eq("reportId", args.reportId)).collect();
    if (expenses.length === 0) {
      throw new Error("Cannot submit an empty expense report. Please add at least one expense.");
    }
    // Validate receipt requirement for expenses > $25
    for (const expense of expenses) {
      if (expense.amount > 25) {
        const receipts = await ctx.db.query("receipts").withIndex("by_expenseId", (q) => q.eq("expenseId", expense._id)).collect();
        if (receipts.length === 0 && !expense.receiptUrl) {
          throw new Error(`A receipt is required for expenses over $25.00. Please attach a receipt to "${expense.title}" before submitting.`);
        }
      }
    }
    // Recalculate total
    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
    const now = Date.now();
    // Update report status
    await ctx.db.patch(args.reportId, {
      status: "Submitted",
      totalAmount,
      submittedAt: now,
      updatedAt: now,
    });
    // Lock all expenses by setting status to Submitted
    for (const expense of expenses) {
      await ctx.db.patch(expense._id, { status: "Submitted", updatedAt: now });
    }
    // Notify approvers
    const approvers = await ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "Approver")).collect();
    const admins = await ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "Admin")).collect();
    const notifyUsers = [...approvers, ...admins];
    for (const user of notifyUsers) {
      await createNotification(ctx, user._id, "ReportSubmitted", "New Report Submitted", `${currentUser.name} submitted "${report.title}" for $${totalAmount.toFixed(2)}`, `/reports/${args.reportId}`);
    }
    await createAuditLog(ctx, currentUser._id, "StatusChange", "expenseReports", args.reportId, `Report submitted for approval. Total: $${totalAmount.toFixed(2)}`);
    return args.reportId;
  },
});
