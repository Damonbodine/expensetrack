import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUserOrThrow, requireRole, createAuditLog } from "./helpers";

export const listExpenses = query({
  args: {
    status: v.optional(v.union(v.literal("Draft"), v.literal("Submitted"), v.literal("Approved"), v.literal("Rejected"), v.literal("Reimbursed"))),
    categoryId: v.optional(v.id("categories")),
    startDate: v.optional(v.float64()),
    endDate: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    let expenses;
    if (currentUser.role === "Admin") {
      if (args.status) {
        expenses = await ctx.db.query("expenses").withIndex("by_status", (q) => q.eq("status", args.status!)).collect();
      } else {
        expenses = await ctx.db.query("expenses").order("desc").collect();
      }
    } else {
      if (args.status) {
        expenses = await ctx.db.query("expenses").withIndex("by_submittedById_status", (q) => q.eq("submittedById", currentUser._id).eq("status", args.status!)).collect();
      } else {
        expenses = await ctx.db.query("expenses").withIndex("by_submittedById", (q) => q.eq("submittedById", currentUser._id)).collect();
      }
    }
    if (args.categoryId) {
      expenses = expenses.filter((e) => e.categoryId === args.categoryId);
    }
    if (args.startDate) {
      expenses = expenses.filter((e) => e.date >= args.startDate!);
    }
    if (args.endDate) {
      expenses = expenses.filter((e) => e.date <= args.endDate!);
    }
    const enriched = await Promise.all(
      expenses.map(async (expense) => {
        const category = await ctx.db.get(expense.categoryId);
        const submitter = await ctx.db.get(expense.submittedById);
        return { ...expense, categoryName: category?.name, submitter };
      })
    );
    return enriched;
  },
});

export const getExpense = query({
  args: { expenseId: v.id("expenses") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const expense = await ctx.db.get(args.expenseId);
    if (!expense) throw new Error("The requested resource was not found.");
    if (currentUser.role !== "Admin" && expense.submittedById !== currentUser._id) {
      if (currentUser.role === "Approver" && expense.reportId) {
        const report = await ctx.db.get(expense.reportId);
        if (!report || (report.status !== "Submitted" && report.status !== "UnderReview")) {
          throw new Error("You do not have permission to perform this action.");
        }
      } else {
        throw new Error("You do not have permission to perform this action.");
      }
    }
    const category = await ctx.db.get(expense.categoryId);
    const submitter = await ctx.db.get(expense.submittedById);
    const receipts = await ctx.db.query("receipts").withIndex("by_expenseId", (q) => q.eq("expenseId", args.expenseId)).collect();
    return { ...expense, category, submitter, receipts };
  },
});

export const listExpensesByReport = query({
  args: { reportId: v.id("expenseReports") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("The requested resource was not found.");
    if (currentUser.role !== "Admin" && report.submittedById !== currentUser._id && currentUser.role !== "Approver") {
      throw new Error("You do not have permission to perform this action.");
    }
    return await ctx.db.query("expenses").withIndex("by_reportId", (q) => q.eq("reportId", args.reportId)).collect();
  },
});

export const listUnassignedExpenses = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const drafts = await ctx.db.query("expenses").withIndex("by_submittedById_status", (q) => q.eq("submittedById", currentUser._id).eq("status", "Draft")).collect();
    return drafts.filter((e) => !e.reportId);
  },
});

export const createExpense = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    amount: v.float64(),
    date: v.float64(),
    categoryId: v.id("categories"),
    merchant: v.string(),
    paymentMethod: v.union(v.literal("CreditCard"), v.literal("DebitCard"), v.literal("Cash"), v.literal("Check"), v.literal("BankTransfer"), v.literal("Other")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const category = await ctx.db.get(args.categoryId);
    if (!category) throw new Error("The requested resource was not found.");
    const now = Date.now();
    const expenseId = await ctx.db.insert("expenses", {
      title: args.title,
      description: args.description,
      amount: args.amount,
      date: args.date,
      categoryId: args.categoryId,
      merchant: args.merchant,
      paymentMethod: args.paymentMethod,
      notes: args.notes,
      submittedById: currentUser._id,
      status: "Draft",
      createdAt: now,
      updatedAt: now,
    });
    await createAuditLog(ctx, currentUser._id, "Create", "expenses", expenseId, `Created expense: ${args.title} ($${args.amount})`);
    return expenseId;
  },
});

export const updateExpense = mutation({
  args: {
    expenseId: v.id("expenses"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    amount: v.optional(v.float64()),
    date: v.optional(v.float64()),
    categoryId: v.optional(v.id("categories")),
    merchant: v.optional(v.string()),
    paymentMethod: v.optional(v.union(v.literal("CreditCard"), v.literal("DebitCard"), v.literal("Cash"), v.literal("Check"), v.literal("BankTransfer"), v.literal("Other"))),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const expense = await ctx.db.get(args.expenseId);
    if (!expense) throw new Error("The requested resource was not found.");
    if (expense.submittedById !== currentUser._id && currentUser.role !== "Admin") {
      throw new Error("You do not have permission to perform this action.");
    }
    if (expense.status !== "Draft") {
      throw new Error("This expense can only be modified while in Draft status.");
    }
    if (expense.reportId) {
      const report = await ctx.db.get(expense.reportId);
      if (report && report.status !== "Draft") {
        throw new Error("This expense is locked because it belongs to a submitted expense report.");
      }
    }
    const { expenseId, ...fields } = args;
    const updates: Record<string, any> = {};
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) updates[key] = val;
    }
    updates.updatedAt = Date.now();
    await ctx.db.patch(args.expenseId, updates);
    // Recalculate report total if expense belongs to a report
    if (expense.reportId) {
      const reportExpenses = await ctx.db.query("expenses").withIndex("by_reportId", (q) => q.eq("reportId", expense.reportId!)).collect();
      const total = reportExpenses.reduce((sum, e) => sum + (e._id === args.expenseId ? (args.amount ?? e.amount) : e.amount), 0);
      await ctx.db.patch(expense.reportId, { totalAmount: total, updatedAt: Date.now() });
    }
    await createAuditLog(ctx, currentUser._id, "Update", "expenses", args.expenseId, `Updated expense fields: ${Object.keys(updates).join(", ")}`);
    return args.expenseId;
  },
});

export const deleteExpense = mutation({
  args: { expenseId: v.id("expenses") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const expense = await ctx.db.get(args.expenseId);
    if (!expense) throw new Error("The requested resource was not found.");
    if (expense.submittedById !== currentUser._id && currentUser.role !== "Admin") {
      throw new Error("You do not have permission to perform this action.");
    }
    if (expense.status !== "Draft") {
      throw new Error("This expense can only be modified while in Draft status.");
    }
    if (expense.reportId) {
      const report = await ctx.db.get(expense.reportId);
      if (report && report.status !== "Draft") {
        throw new Error("This expense is locked because it belongs to a submitted expense report.");
      }
    }
    // Delete associated receipts
    const receipts = await ctx.db.query("receipts").withIndex("by_expenseId", (q) => q.eq("expenseId", args.expenseId)).collect();
    for (const receipt of receipts) {
      await ctx.db.delete(receipt._id);
    }
    await ctx.db.delete(args.expenseId);
    // Recalculate report total if expense was in a report
    if (expense.reportId) {
      const remainingExpenses = await ctx.db.query("expenses").withIndex("by_reportId", (q) => q.eq("reportId", expense.reportId!)).collect();
      const total = remainingExpenses.reduce((sum, e) => sum + e.amount, 0);
      await ctx.db.patch(expense.reportId, { totalAmount: total, updatedAt: Date.now() });
    }
    await createAuditLog(ctx, currentUser._id, "Delete", "expenses", args.expenseId, `Deleted expense: ${expense.title}`);
    return null;
  },
});

export const addToReport = mutation({
  args: {
    expenseId: v.id("expenses"),
    reportId: v.id("expenseReports"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const expense = await ctx.db.get(args.expenseId);
    if (!expense) throw new Error("The requested resource was not found.");
    if (expense.submittedById !== currentUser._id) {
      throw new Error("You do not have permission to perform this action.");
    }
    if (expense.status !== "Draft") {
      throw new Error("This expense can only be modified while in Draft status.");
    }
    if (expense.reportId) {
      throw new Error("This expense is already assigned to a report.");
    }
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("The requested resource was not found.");
    if (report.submittedById !== currentUser._id) {
      throw new Error("You do not have permission to perform this action.");
    }
    if (report.status !== "Draft") {
      throw new Error("This expense report can only be modified while in Draft status.");
    }
    await ctx.db.patch(args.expenseId, { reportId: args.reportId, updatedAt: Date.now() });
    // Recalculate report total (the patched expense is already included in the query)
    const reportExpenses = await ctx.db.query("expenses").withIndex("by_reportId", (q) => q.eq("reportId", args.reportId)).collect();
    const total = reportExpenses.reduce((sum, e) => sum + e.amount, 0);
    await ctx.db.patch(args.reportId, { totalAmount: total, updatedAt: Date.now() });
    await createAuditLog(ctx, currentUser._id, "Update", "expenses", args.expenseId, `Added expense to report ${args.reportId}`);
    return args.expenseId;
  },
});

export const removeFromReport = mutation({
  args: { expenseId: v.id("expenses") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const expense = await ctx.db.get(args.expenseId);
    if (!expense) throw new Error("The requested resource was not found.");
    if (expense.submittedById !== currentUser._id) {
      throw new Error("You do not have permission to perform this action.");
    }
    if (!expense.reportId) {
      throw new Error("This expense is not assigned to any report.");
    }
    const report = await ctx.db.get(expense.reportId);
    if (!report) throw new Error("The requested resource was not found.");
    if (report.status !== "Draft") {
      throw new Error("This expense report can only be modified while in Draft status.");
    }
    const reportId = expense.reportId;
    await ctx.db.patch(args.expenseId, { reportId: undefined, updatedAt: Date.now() });
    // Recalculate report total
    const remainingExpenses = await ctx.db.query("expenses").withIndex("by_reportId", (q) => q.eq("reportId", reportId)).collect();
    const total = remainingExpenses.filter((e) => e._id !== args.expenseId).reduce((sum, e) => sum + e.amount, 0);
    await ctx.db.patch(reportId, { totalAmount: total, updatedAt: Date.now() });
    await createAuditLog(ctx, currentUser._id, "Update", "expenses", args.expenseId, `Removed expense from report ${reportId}`);
    return args.expenseId;
  },
});
