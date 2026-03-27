import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    role: v.union(v.literal("Admin"), v.literal("Approver"), v.literal("Submitter")),
    department: v.optional(v.string()),
    isActive: v.boolean(),
    lastLoginAt: v.optional(v.float64()),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  expenses: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    amount: v.float64(),
    date: v.float64(),
    categoryId: v.id("categories"),
    receiptUrl: v.optional(v.string()),
    merchant: v.string(),
    paymentMethod: v.union(v.literal("CreditCard"), v.literal("DebitCard"), v.literal("Cash"), v.literal("Check"), v.literal("BankTransfer"), v.literal("Other")),
    reportId: v.optional(v.id("expenseReports")),
    submittedById: v.id("users"),
    status: v.union(v.literal("Draft"), v.literal("Submitted"), v.literal("Approved"), v.literal("Rejected"), v.literal("Reimbursed")),
    notes: v.optional(v.string()),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  })
    .index("by_submittedById", ["submittedById"])
    .index("by_categoryId", ["categoryId"])
    .index("by_reportId", ["reportId"])
    .index("by_status", ["status"])
    .index("by_submittedById_status", ["submittedById", "status"]),

  expenseReports: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    submittedById: v.id("users"),
    approverId: v.optional(v.id("users")),
    totalAmount: v.float64(),
    status: v.union(v.literal("Draft"), v.literal("Submitted"), v.literal("UnderReview"), v.literal("Approved"), v.literal("Rejected"), v.literal("Reimbursed")),
    submittedAt: v.optional(v.float64()),
    reviewedAt: v.optional(v.float64()),
    reviewNotes: v.optional(v.string()),
    period: v.optional(v.string()),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  })
    .index("by_submittedById", ["submittedById"])
    .index("by_approverId", ["approverId"])
    .index("by_status", ["status"])
    .index("by_submittedById_status", ["submittedById", "status"]),

  categories: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    code: v.string(),
    isActive: v.boolean(),
    budgetLineId: v.optional(v.id("budgetLines")),
    createdAt: v.float64(),
  })
    .index("by_code", ["code"])
    .index("by_isActive", ["isActive"]),

  budgetLines: defineTable({
    name: v.string(),
    categoryId: v.id("categories"),
    fiscalYear: v.string(),
    budgetedAmount: v.float64(),
    spentAmount: v.float64(),
    remainingAmount: v.float64(),
    department: v.string(),
    notes: v.optional(v.string()),
    createdAt: v.float64(),
  })
    .index("by_categoryId", ["categoryId"])
    .index("by_fiscalYear", ["fiscalYear"])
    .index("by_department", ["department"])
    .index("by_fiscalYear_department", ["fiscalYear", "department"]),

  approvals: defineTable({
    reportId: v.id("expenseReports"),
    approverId: v.id("users"),
    action: v.union(v.literal("Approved"), v.literal("Rejected"), v.literal("ReturnedForRevision")),
    comments: v.optional(v.string()),
    actionAt: v.float64(),
    createdAt: v.float64(),
  })
    .index("by_reportId", ["reportId"])
    .index("by_approverId", ["approverId"]),

  receipts: defineTable({
    expenseId: v.id("expenses"),
    fileUrl: v.string(),
    fileName: v.string(),
    fileSize: v.float64(),
    fileType: v.string(),
    uploadedAt: v.float64(),
    createdAt: v.float64(),
  })
    .index("by_expenseId", ["expenseId"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("ReportSubmitted"), v.literal("ReportApproved"), v.literal("ReportRejected"), v.literal("ExpenseReimbursed"), v.literal("BudgetWarning"), v.literal("BudgetExceeded"), v.literal("SystemAlert")),
    title: v.string(),
    message: v.string(),
    link: v.optional(v.string()),
    isRead: v.boolean(),
    readAt: v.optional(v.float64()),
    createdAt: v.float64(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_isRead", ["userId", "isRead"]),

  auditLogs: defineTable({
    userId: v.id("users"),
    action: v.union(v.literal("Create"), v.literal("Update"), v.literal("Delete"), v.literal("StatusChange"), v.literal("Approve"), v.literal("Reject"), v.literal("Reimburse"), v.literal("Login")),
    entityType: v.string(),
    entityId: v.string(),
    details: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    createdAt: v.float64(),
  })
    .index("by_userId", ["userId"])
    .index("by_entityType_entityId", ["entityType", "entityId"]),
});