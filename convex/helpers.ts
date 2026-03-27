import { MutationCtx, QueryCtx } from "./_generated/server";
import { Id, Doc } from "./_generated/dataModel";

type ConvexCtx = { auth: { getUserIdentity: () => Promise<{ subject?: string; tokenIdentifier?: string } | null> }; db: any };

export async function getCurrentUserOrThrow(ctx: ConvexCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Authentication required. Please sign in to continue.");
  // Try tokenIdentifier first (includes issuer prefix), fallback to subject for backwards compat
  const clerkId = identity.tokenIdentifier ?? identity.subject ?? "";
  // tokenIdentifier is typically "https://clerk.xxx|user_xxx" -- we store just the user_xxx part
  const subjectPart = clerkId.includes("|") ? clerkId.split("|").pop()! : clerkId;
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q: any) => q.eq("clerkId", subjectPart))
    .unique();
  if (!user) throw new Error("User profile not found. Please complete registration.");
  return user;
}

export async function requireRole(ctx: ConvexCtx, ...roles: string[]): Promise<Doc<"users">> {
  const user = await getCurrentUserOrThrow(ctx);
  if (!roles.includes(user.role)) {
    throw new Error("You do not have permission to perform this action.");
  }
  return user;
}

export async function createAuditLog(
  ctx: { db: any },
  userId: Id<"users">,
  action: "Create" | "Update" | "Delete" | "StatusChange" | "Approve" | "Reject" | "Reimburse" | "Login",
  entityType: string,
  entityId: string,
  details?: string
) {
  await ctx.db.insert("auditLogs", {
    userId,
    action,
    entityType,
    entityId,
    details,
    createdAt: Date.now(),
  });
}

export async function createNotification(
  ctx: { db: any },
  userId: Id<"users">,
  type: "ReportSubmitted" | "ReportApproved" | "ReportRejected" | "ExpenseReimbursed" | "BudgetWarning" | "BudgetExceeded" | "SystemAlert",
  title: string,
  message: string,
  link?: string
) {
  await ctx.db.insert("notifications", {
    userId,
    type,
    title,
    message,
    link,
    isRead: false,
    createdAt: Date.now(),
  });
}
