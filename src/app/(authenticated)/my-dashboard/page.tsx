"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DollarSign, FileText, CheckCircle, Wallet } from "lucide-react";
import Link from "next/link";

export default function SubmitterDashboardPage() {
  const dashboard = useQuery(api.dashboard.getSubmitterDashboard);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Dashboard</h1>

      {!dashboard ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[120px]" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="This Month"
              value={formatCurrency(dashboard.myExpensesTotal)}
              icon={DollarSign}
            />
            <StatCard
              title="Pending Reports"
              value={dashboard.pendingReportsCount}
              icon={FileText}
            />
            <StatCard
              title="Approved"
              value={formatCurrency(dashboard.approvedAmount)}
              icon={CheckCircle}
            />
            <StatCard
              title="Reimbursed"
              value={formatCurrency(dashboard.reimbursedAmount)}
              icon={Wallet}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Recent Expenses</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {dashboard.recentExpenses.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">No expenses yet.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboard.recentExpenses.map((e) => (
                        <TableRow key={e._id}>
                          <TableCell>
                            <Link href={`/expenses/${e._id}`} className="font-medium text-primary hover:underline">
                              {e.title}
                            </Link>
                          </TableCell>
                          <TableCell className="font-mono">{formatCurrency(e.amount)}</TableCell>
                          <TableCell><StatusBadge status={e.status} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Recent Reports</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {dashboard.recentReports.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">No reports yet.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboard.recentReports.map((r) => (
                        <TableRow key={r._id}>
                          <TableCell>
                            <Link href={`/reports/${r._id}`} className="font-medium text-primary hover:underline">
                              {r.title}
                            </Link>
                          </TableCell>
                          <TableCell className="font-mono">{formatCurrency(r.totalAmount)}</TableCell>
                          <TableCell><StatusBadge status={r.status} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
