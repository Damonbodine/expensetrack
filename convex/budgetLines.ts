import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUserOrThrow, requireRole, createAuditLog } from "./helpers";

export const listBudgetLines = query({
  args: {
    fiscalYear: v.optional(v.string()),
    department: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    let budgetLines;
    if (args.fiscalYear && args.department) {
      budgetLines = await ctx.db.query("budgetLines").withIndex("by_fiscalYear_department", (q) => q.eq("fiscalYear", args.fiscalYear!).eq("department", args.department!)).collect();
    } else if (args.fiscalYear) {
      budgetLines = await ctx.db.query("budgetLines").withIndex("by_fiscalYear", (q) => q.eq("fiscalYear", args.fiscalYear!)).collect();
    } else if (args.department) {
      budgetLines = await ctx.db.query("budgetLines").withIndex("by_department", (q) => q.eq("department", args.department!)).collect();
    } else {
      budgetLines = await ctx.db.query("budgetLines").collect();
    }
    // Non-admin users only see their department's budget lines
    if (currentUser.role !== "Admin" && currentUser.department) {
      budgetLines = budgetLines.filter((bl) => bl.department === currentUser.department);
    }
    const enriched = await Promise.all(
      budgetLines.map(async (bl) => {
        const category = await ctx.db.get(bl.categoryId);
        const utilization = bl.budgetedAmount > 0 ? (bl.spentAmount / bl.budgetedAmount) * 100 : 0;
        return { ...bl, category, utilizationPercentage: Math.round(utilization * 100) / 100 };
      })
    );
    return enriched;
  },
});

export const getBudgetLine = query({
  args: { budgetLineId: v.id("budgetLines") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication required. Please sign in to continue.");
    const budgetLine = await ctx.db.get(args.budgetLineId);
    if (!budgetLine) throw new Error("The requested resource was not found.");
    const category = await ctx.db.get(budgetLine.categoryId);
    return { ...budgetLine, category };
  },
});

export const getBudgetLineWithExpenses = query({
  args: { budgetLineId: v.id("budgetLines") },
  handler: async (ctx, args) => {
    const currentUser = await requireRole(ctx, "Admin");
    const budgetLine = await ctx.db.get(args.budgetLineId);
    if (!budgetLine) throw new Error("The requested resource was not found.");
    const category = await ctx.db.get(budgetLine.categoryId);
    // Get all approved/reimbursed expenses for this category
    const allExpenses = await ctx.db.query("expenses").withIndex("by_categoryId", (q) => q.eq("categoryId", budgetLine.categoryId)).collect();
    const relevantExpenses = allExpenses.filter((e) => e.status === "Approved" || e.status === "Reimbursed");
    return { ...budgetLine, category, expenses: relevantExpenses };
  },
});

export const createBudgetLine = mutation({
  args: {
    name: v.string(),
    categoryId: v.id("categories"),
    fiscalYear: v.string(),
    budgetedAmount: v.float64(),
    department: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireRole(ctx, "Admin");
    const category = await ctx.db.get(args.categoryId);
    if (!category) throw new Error("The requested resource was not found.");
    const budgetLineId = await ctx.db.insert("budgetLines", {
      name: args.name,
      categoryId: args.categoryId,
      fiscalYear: args.fiscalYear,
      budgetedAmount: args.budgetedAmount,
      spentAmount: 0,
      remainingAmount: args.budgetedAmount,
      department: args.department,
      notes: args.notes,
      createdAt: Date.now(),
    });
    await createAuditLog(ctx, currentUser._id, "Create", "budgetLines", budgetLineId, `Created budget line: ${args.name} ($${args.budgetedAmount})`);
    return budgetLineId;
  },
});

export const updateBudgetLine = mutation({
  args: {
    budgetLineId: v.id("budgetLines"),
    name: v.optional(v.string()),
    budgetedAmount: v.optional(v.float64()),
    department: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireRole(ctx, "Admin");
    const budgetLine = await ctx.db.get(args.budgetLineId);
    if (!budgetLine) throw new Error("The requested resource was not found.");
    const { budgetLineId, ...fields } = args;
    const updates: Record<string, any> = {};
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) updates[key] = val;
    }
    // Recompute remainingAmount if budgetedAmount changes
    if (args.budgetedAmount !== undefined) {
      updates.remainingAmount = args.budgetedAmount - budgetLine.spentAmount;
    }
    await ctx.db.patch(args.budgetLineId, updates);
    await createAuditLog(ctx, currentUser._id, "Update", "budgetLines", args.budgetLineId, `Updated budget line fields: ${Object.keys(updates).join(", ")}`);
    return args.budgetLineId;
  },
});

export const deleteBudgetLine = mutation({
  args: { budgetLineId: v.id("budgetLines") },
  handler: async (ctx, args) => {
    const currentUser = await requireRole(ctx, "Admin");
    const budgetLine = await ctx.db.get(args.budgetLineId);
    if (!budgetLine) throw new Error("The requested resource was not found.");
    // Check if any categories reference this budget line
    const linkedCategories = await ctx.db.query("categories").collect();
    const hasRef = linkedCategories.some((c) => c.budgetLineId === args.budgetLineId);
    if (hasRef) {
      throw new Error("This budget line cannot be deleted because it has linked categories. Remove the link first.");
    }
    await ctx.db.delete(args.budgetLineId);
    await createAuditLog(ctx, currentUser._id, "Delete", "budgetLines", args.budgetLineId, `Deleted budget line: ${budgetLine.name}`);
    return null;
  },
});
