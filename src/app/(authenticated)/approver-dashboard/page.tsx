"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { RoleGuard } from "@/components/role-guard";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { BudgetProgressBar } from "@/components/budget-progress-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DemoModeStartButton } from "@/components/demo-mode";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CheckSquare, Clock, Building2 } from "lucide-react";
import Link from "next/link";

export default function ApproverDashboardPage() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const dashboard = useQuery(
    api.dashboard.getApproverDashboard,
    currentUser?.role === "Approver" || currentUser?.role === "Admin" ? {} : "skip",
  );

  if (currentUser === undefined || currentUser === null) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-[120px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={["Approver", "Admin"]}>
      <div className="space-y-6" data-demo="approver-dashboard-overview">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Approver Dashboard</h1>
          <DemoModeStartButton
            scenarioId="expense-approver-review"
            label="Start approver demo"
          />
        </div>

        {!dashboard ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-[120px]" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-demo="approver-dashboard-queue">
              <StatCard
                title="Pending Reviews"
                value={dashboard.pendingReviewsCount}
                icon={Clock}
              />
              <StatCard
                title="Recent Decisions"
                value={dashboard.recentDecisions.length}
                icon={CheckSquare}
              />
              <StatCard
                title="Departments"
                value={Object.keys(dashboard.departmentSpending).length}
                icon={Building2}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Recent Decisions</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {dashboard.recentDecisions.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">No recent decisions.</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Report</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dashboard.recentDecisions.map((d) => (
                          <TableRow key={d._id}>
                            <TableCell>
                              <Link href={`/reports/${d.reportId}`} className="font-medium text-primary hover:underline">
                                {d.report?.title ?? "Unknown"}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={d.action} />
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDate(d.actionAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Department Spending</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(dashboard.departmentSpending).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No department data.</p>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(dashboard.departmentSpending).map(([dept, data]) => (
                        <div key={dept} className="space-y-1">
                          <span className="text-sm font-medium">{dept}</span>
                          <BudgetProgressBar spent={data.spent} budgeted={data.budgeted} />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </RoleGuard>
  );
}
