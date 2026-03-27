import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUserOrThrow, requireRole, createAuditLog } from "./helpers";

export const listCategories = query({
  args: { isActive: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication required. Please sign in to continue.");
    if (args.isActive !== undefined) {
      return await ctx.db.query("categories").withIndex("by_isActive", (q) => q.eq("isActive", args.isActive!)).collect();
    }
    return await ctx.db.query("categories").collect();
  },
});

export const getCategory = query({
  args: { categoryId: v.id("categories") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication required. Please sign in to continue.");
    const category = await ctx.db.get(args.categoryId);
    if (!category) throw new Error("The requested resource was not found.");
    let budgetLine = null;
    if (category.budgetLineId) {
      budgetLine = await ctx.db.get(category.budgetLineId);
    }
    return { ...category, budgetLine };
  },
});

export const createCategory = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    code: v.string(),
    isActive: v.boolean(),
    budgetLineId: v.optional(v.id("budgetLines")),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireRole(ctx, "Admin");
    // Check for duplicate code
    const existingCode = await ctx.db.query("categories").withIndex("by_code", (q) => q.eq("code", args.code)).unique();
    if (existingCode) {
      throw new Error("A category with this code already exists. Please use a unique category code.");
    }
    const categoryId = await ctx.db.insert("categories", {
      name: args.name,
      description: args.description,
      code: args.code,
      isActive: args.isActive,
      budgetLineId: args.budgetLineId,
      createdAt: Date.now(),
    });
    await createAuditLog(ctx, currentUser._id, "Create", "categories", categoryId, `Created category: ${args.name} (${args.code})`);
    return categoryId;
  },
});

export const updateCategory = mutation({
  args: {
    categoryId: v.id("categories"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    code: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    budgetLineId: v.optional(v.id("budgetLines")),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireRole(ctx, "Admin");
    const category = await ctx.db.get(args.categoryId);
    if (!category) throw new Error("The requested resource was not found.");
    // Check for duplicate code if code is being changed
    if (args.code && args.code !== category.code) {
      const existingCode = await ctx.db.query("categories").withIndex("by_code", (q) => q.eq("code", args.code!)).unique();
      if (existingCode) {
        throw new Error("A category with this code already exists. Please use a unique category code.");
      }
    }
    const { categoryId, ...fields } = args;
    const updates: Record<string, any> = {};
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) updates[key] = val;
    }
    await ctx.db.patch(args.categoryId, updates);
    await createAuditLog(ctx, currentUser._id, "Update", "categories", args.categoryId, `Updated category fields: ${Object.keys(updates).join(", ")}`);
    return args.categoryId;
  },
});

export const deleteCategory = mutation({
  args: { categoryId: v.id("categories") },
  handler: async (ctx, args) => {
    const currentUser = await requireRole(ctx, "Admin");
    const category = await ctx.db.get(args.categoryId);
    if (!category) throw new Error("The requested resource was not found.");
    // Check if any expenses reference this category
    const expenses = await ctx.db.query("expenses").withIndex("by_categoryId", (q) => q.eq("categoryId", args.categoryId)).first();
    if (expenses) {
      throw new Error("This category cannot be deleted because it has associated expenses.");
    }
    await ctx.db.delete(args.categoryId);
    await createAuditLog(ctx, currentUser._id, "Delete", "categories", args.categoryId, `Deleted category: ${category.name} (${category.code})`);
    return null;
  },
});
