import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUserOrThrow, requireRole, createAuditLog } from "./helpers";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});

export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication required. Please sign in to continue.");
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("The requested resource was not found.");
    return user;
  },
});

export const listUsers = query({
  args: {
    role: v.optional(v.union(v.literal("Admin"), v.literal("Approver"), v.literal("Submitter"))),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireRole(ctx, "Admin");
    let usersQuery;
    if (args.role) {
      usersQuery = ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", args.role!));
    } else {
      usersQuery = ctx.db.query("users");
    }
    const users = await usersQuery.collect();
    if (args.isActive !== undefined) {
      return users.filter((u) => u.isActive === args.isActive);
    }
    return users;
  },
});

export const createUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (existing) return existing._id;

    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      phone: args.phone,
      avatarUrl: args.avatarUrl,
      role: "Submitter",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    await createAuditLog(ctx, userId, "Create", "users", userId, "User account created");
    return userId;
  },
});

export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    department: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("The requested resource was not found.");
    if (currentUser._id !== args.userId && currentUser.role !== "Admin") {
      throw new Error("You do not have permission to perform this action.");
    }
    const { userId, ...fields } = args;
    const updates: Record<string, any> = {};
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) updates[key] = val;
    }
    updates.updatedAt = Date.now();
    await ctx.db.patch(args.userId, updates);
    await createAuditLog(ctx, currentUser._id, "Update", "users", args.userId, `Updated fields: ${Object.keys(updates).join(", ")}`);
    return args.userId;
  },
});

export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("Admin"), v.literal("Approver"), v.literal("Submitter")),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireRole(ctx, "Admin");
    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("The requested resource was not found.");
    const oldRole = target.role;
    await ctx.db.patch(args.userId, { role: args.role, updatedAt: Date.now() });
    await createAuditLog(ctx, currentUser._id, "Update", "users", args.userId, `Role changed from ${oldRole} to ${args.role}`);
    return args.userId;
  },
});
