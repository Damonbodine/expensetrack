import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUserOrThrow } from "./helpers";

export const listMyNotifications = query({
  args: { limit: v.optional(v.float64()) },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    return await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", currentUser._id))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_isRead", (q) => q.eq("userId", currentUser._id).eq("isRead", false))
      .collect();
    return unread.length;
  },
});

export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) throw new Error("The requested resource was not found.");
    if (notification.userId !== currentUser._id) {
      throw new Error("You do not have permission to perform this action.");
    }
    await ctx.db.patch(args.notificationId, { isRead: true, readAt: Date.now() });
    return args.notificationId;
  },
});

export const deleteNotification = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) throw new Error("The requested resource was not found.");
    if (notification.userId !== currentUser._id) {
      throw new Error("You do not have permission to perform this action.");
    }
    await ctx.db.delete(args.notificationId);
    return null;
  },
});

export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_isRead", (q) => q.eq("userId", currentUser._id).eq("isRead", false))
      .collect();
    const now = Date.now();
    for (const notification of unread) {
      await ctx.db.patch(notification._id, { isRead: true, readAt: now });
    }
    return unread.length;
  },
});
