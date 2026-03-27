import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUserOrThrow, createAuditLog } from "./helpers";

export const getByExpense = query({
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
    return await ctx.db.query("receipts").withIndex("by_expenseId", (q) => q.eq("expenseId", args.expenseId)).collect();
  },
});

export const createReceipt = mutation({
  args: {
    expenseId: v.id("expenses"),
    fileUrl: v.string(),
    fileName: v.string(),
    fileSize: v.float64(),
    fileType: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const expense = await ctx.db.get(args.expenseId);
    if (!expense) throw new Error("The requested resource was not found.");
    if (expense.submittedById !== currentUser._id) {
      throw new Error("You do not have permission to perform this action.");
    }
    const now = Date.now();
    const receiptId = await ctx.db.insert("receipts", {
      expenseId: args.expenseId,
      fileUrl: args.fileUrl,
      fileName: args.fileName,
      fileSize: args.fileSize,
      fileType: args.fileType,
      uploadedAt: now,
      createdAt: now,
    });
    await createAuditLog(ctx, currentUser._id, "Create", "receipts", receiptId, `Uploaded receipt: ${args.fileName} for expense ${args.expenseId}`);
    return receiptId;
  },
});

export const deleteReceipt = mutation({
  args: { receiptId: v.id("receipts") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const receipt = await ctx.db.get(args.receiptId);
    if (!receipt) throw new Error("The requested resource was not found.");
    const expense = await ctx.db.get(receipt.expenseId);
    if (!expense) throw new Error("The requested resource was not found.");
    if (expense.submittedById !== currentUser._id) {
      throw new Error("You do not have permission to perform this action.");
    }
    if (expense.status !== "Draft") {
      throw new Error("This expense can only be modified while in Draft status.");
    }
    await ctx.db.delete(args.receiptId);
    await createAuditLog(ctx, currentUser._id, "Delete", "receipts", args.receiptId, `Deleted receipt: ${receipt.fileName}`);
    return null;
  },
});
