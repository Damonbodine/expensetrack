"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { RoleGuard } from "@/components/role-guard";
import { StatCard } from "@/components/stat-card";
import { RecentActivityFeed } from "@/components/recent-activity-feed";
import { BudgetProgressBar } from "@/components/budget-progress-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, FileText, TrendingUp, Wallet } from "lucide-react";
import { DemoModeStartButton } from "@/components/demo-mode";

export default function AdminDashboardPage() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const dashboard = useQuery(
    api.dashboard.getAdminDashboard,
    currentUser?.role === "Admin" ? {} : "skip",
  );

  if (currentUser === undefined || currentUser === null) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[120px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={["Admin"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4" data-demo="dashboard-overview">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <DemoModeStartButton />
        </div>

        {!dashboard ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[120px]" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-demo="dashboard-stats">
              <StatCard
                title="Total Spending"
                value={formatCurrency(dashboard.totalSpending)}
                icon={DollarSign}
              />
              <StatCard
                title="Pending Approvals"
                value={dashboard.pendingReportsCount}
                icon={FileText}
              />
              <StatCard
                title="Approved This Month"
                value={formatCurrency(dashboard.approvedThisMonth)}
                icon={TrendingUp}
              />
              <StatCard
                title="Reimbursed Total"
                value={formatCurrency(dashboard.reimbursedTotal)}
                icon={Wallet}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border border-border" data-demo="budget-utilization">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Spending by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboard.spendingByCategory.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No spending data yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {dashboard.spendingByCategory.map((cat) => (
                        <div key={cat.categoryId} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{cat.categoryName}</span>
                          <span className="text-sm font-mono font-medium">{formatCurrency(cat.total)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <RecentActivityFeed />
            </div>

            {dashboard.topBudgetUtilization.length > 0 && (
              <Card className="border border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Budget Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboard.topBudgetUtilization.map((bl) => (
                      <div key={bl.budgetLineId} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{bl.name}</span>
                          <span className="text-muted-foreground">{bl.categoryName}</span>
                        </div>
                        <BudgetProgressBar spent={bl.spentAmount} budgeted={bl.budgetedAmount} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </RoleGuard>
  );
}
