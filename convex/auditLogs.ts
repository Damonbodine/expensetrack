import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireRole } from "./helpers";

export const listByEntity = query({
  args: {
    entityType: v.string(),
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireRole(ctx, "Admin");
    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_entityType_entityId", (q) => q.eq("entityType", args.entityType).eq("entityId", args.entityId))
      .order("desc")
      .collect();
    const enriched = await Promise.all(
      logs.map(async (log) => {
        const user = await ctx.db.get(log.userId);
        return { ...log, user };
      })
    );
    return enriched;
  },
});

export const listRecent = query({
  args: { limit: v.optional(v.float64()) },
  handler: async (ctx, args) => {
    const currentUser = await requireRole(ctx, "Admin");
    const logs = await ctx.db.query("auditLogs").order("desc").take(args.limit ?? 50);
    const enriched = await Promise.all(
      logs.map(async (log) => {
        const user = await ctx.db.get(log.userId);
        return { ...log, user };
      })
    );
    return enriched;
  },
});
