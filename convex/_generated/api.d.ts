/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as approvals from "../approvals.js";
import type * as auditLogs from "../auditLogs.js";
import type * as budgetLines from "../budgetLines.js";
import type * as categories from "../categories.js";
import type * as dashboard from "../dashboard.js";
import type * as expenseReports from "../expenseReports.js";
import type * as expenses from "../expenses.js";
import type * as files from "../files.js";
import type * as helpers from "../helpers.js";
import type * as notifications from "../notifications.js";
import type * as receipts from "../receipts.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  approvals: typeof approvals;
  auditLogs: typeof auditLogs;
  budgetLines: typeof budgetLines;
  categories: typeof categories;
  dashboard: typeof dashboard;
  expenseReports: typeof expenseReports;
  expenses: typeof expenses;
  files: typeof files;
  helpers: typeof helpers;
  notifications: typeof notifications;
  receipts: typeof receipts;
  seed: typeof seed;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
