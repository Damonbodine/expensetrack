import { v } from "convex/values";
import { query } from "./_generated/server";
import { getCurrentUserOrThrow, requireRole } from "./helpers";

export const getAdminDashboard = query({
  args: { fiscalYear: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const currentUser = await requireRole(ctx, "Admin");
    const fy = args.fiscalYear ?? new Date().getFullYear().toString();
    // Total spending: sum of all approved/reimbursed expenses
    const allExpenses = await ctx.db.query("expenses").collect();
    const approvedExpenses = allExpenses.filter((e) => e.status === "Approved" || e.status === "Reimbursed");
    const totalSpending = approvedExpenses.reduce((sum, e) => sum + e.amount, 0);
    // Pending reports count
    const submittedReports = await ctx.db.query("expenseReports").withIndex("by_status", (q) => q.eq("status", "Submitted")).collect();
    const underReviewReports = await ctx.db.query("expenseReports").withIndex("by_status", (q) => q.eq("status", "UnderReview")).collect();
    const pendingReportsCount = submittedReports.length + underReviewReports.length;
    // Approved this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const approvedThisMonth = approvedExpenses
      .filter((e) => e.updatedAt >= startOfMonth)
      .reduce((sum, e) => sum + e.amount, 0);
    // Reimbursed total
    const reimbursedTotal = allExpenses
      .filter((e) => e.status === "Reimbursed")
      .reduce((sum, e) => sum + e.amount, 0);
    // Top budget utilization
    const budgetLines = await ctx.db.query("budgetLines").withIndex("by_fiscalYear", (q) => q.eq("fiscalYear", fy)).collect();
    const topBudgetUtilization = await Promise.all(
      budgetLines.map(async (bl) => {
        const category = await ctx.db.get(bl.categoryId);
        const utilization = bl.budgetedAmount > 0 ? (bl.spentAmount / bl.budgetedAmount) * 100 : 0;
        return {
          budgetLineId: bl._id,
          name: bl.name,
          categoryName: category?.name ?? "Unknown",
          budgetedAmount: bl.budgetedAmount,
          spentAmount: bl.spentAmount,
          utilizationPercentage: Math.round(utilization * 100) / 100,
        };
      })
    );
    topBudgetUtilization.sort((a, b) => b.utilizationPercentage - a.utilizationPercentage);
    // Spending by category
    const categories = await ctx.db.query("categories").collect();
    const spendingByCategory = categories.map((cat) => {
      const catExpenses = approvedExpenses.filter((e) => e.categoryId === cat._id);
      const total = catExpenses.reduce((sum, e) => sum + e.amount, 0);
      return { categoryId: cat._id, categoryName: cat.name, total };
    }).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);
    return {
      totalSpending,
      pendingReportsCount,
      approvedThisMonth,
      reimbursedTotal,
      topBudgetUtilization: topBudgetUtilization.slice(0, 10),
      spendingByCategory,
    };
  },
});

export const getApproverDashboard = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    if (currentUser.role !== "Admin" && currentUser.role !== "Approver") {
      throw new Error("You do not have permission to perform this action.");
    }
    // Pending reviews count
    const submitted = await ctx.db.query("expenseReports").withIndex("by_status", (q) => q.eq("status", "Submitted")).collect();
    const underReview = await ctx.db.query("expenseReports").withIndex("by_status", (q) => q.eq("status", "UnderReview")).collect();
    const pendingReviewsCount = submitted.length + underReview.length;
    // Recent decisions by this approver
    const recentDecisions = await ctx.db
      .query("approvals")
      .withIndex("by_approverId", (q) => q.eq("approverId", currentUser._id))
      .order("desc")
      .take(10);
    const enrichedDecisions = await Promise.all(
      recentDecisions.map(async (d) => {
        const report = await ctx.db.get(d.reportId);
        return { ...d, report };
      })
    );
    // Department spending summary
    const budgetLines = await ctx.db.query("budgetLines").collect();
    const departmentSpending: Record<string, { budgeted: number; spent: number }> = {};
    for (const bl of budgetLines) {
      if (!departmentSpending[bl.department]) {
        departmentSpending[bl.department] = { budgeted: 0, spent: 0 };
      }
      departmentSpending[bl.department].budgeted += bl.budgetedAmount;
      departmentSpending[bl.department].spent += bl.spentAmount;
    }
    return {
      pendingReviewsCount,
      recentDecisions: enrichedDecisions,
      departmentSpending,
    };
  },
});

export const getSubmitterDashboard = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    // My expenses this month
    const myExpenses = await ctx.db
      .query("expenses")
      .withIndex("by_submittedById", (q) => q.eq("submittedById", currentUser._id))
      .collect();
    const thisMonthExpenses = myExpenses.filter((e) => e.createdAt >= startOfMonth);
    const myExpensesTotal = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    // Pending reports
    const myReports = await ctx.db
      .query("expenseReports")
      .withIndex("by_submittedById", (q) => q.eq("submittedById", currentUser._id))
      .collect();
    const pendingReportsCount = myReports.filter((r) => r.status === "Submitted" || r.status === "UnderReview").length;
    // Approved amount
    const approvedAmount = myExpenses
      .filter((e) => e.status === "Approved")
      .reduce((sum, e) => sum + e.amount, 0);
    // Reimbursed amount
    const reimbursedAmount = myExpenses
      .filter((e) => e.status === "Reimbursed")
      .reduce((sum, e) => sum + e.amount, 0);
    // Recent expenses (last 10)
    const recentExpenses = myExpenses
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);
    const enrichedExpenses = await Promise.all(
      recentExpenses.map(async (e) => {
        const category = await ctx.db.get(e.categoryId);
        return { ...e, category };
      })
    );
    // Recent reports (last 5)
    const recentReports = myReports
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);
    return {
      myExpensesTotal,
      pendingReportsCount,
      approvedAmount,
      reimbursedAmount,
      recentExpenses: enrichedExpenses,
      recentReports,
    };
  },
});
