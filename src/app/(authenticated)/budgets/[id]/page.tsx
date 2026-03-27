"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { RoleGuard } from "@/components/role-guard";
import { BudgetProgressBar } from "@/components/budget-progress-bar";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";

export default function BudgetLineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const budgetLine = useQuery(api.budgetLines.getBudgetLineWithExpenses, {
    budgetLineId: id as Id<"budgetLines">,
  });

  return (
    <RoleGuard allowedRoles={["Admin"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/budgets"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <h1 className="text-2xl font-bold">Budget Details</h1>
          </div>
          {budgetLine && (
            <Button variant="outline" asChild>
              <Link href={`/budgets/${id}/edit`}>
                <Pencil className="h-4 w-4 mr-1" /> Edit
              </Link>
            </Button>
          )}
        </div>

        {budgetLine === undefined ? (
          <Skeleton className="h-[400px]" />
        ) : budgetLine === null ? (
          <div className="p-8 text-center text-muted-foreground">Budget line not found.</div>
        ) : (
          <>
            <Card className="border border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">{budgetLine.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Category</p>
                    <p className="font-medium">{budgetLine.category?.name ?? "Unknown"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fiscal Year</p>
                    <p className="font-medium">{budgetLine.fiscalYear}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Department</p>
                    <p className="font-medium">{budgetLine.department}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Notes</p>
                    <p className="font-medium">{budgetLine.notes ?? "--"}</p>
                  </div>
                </div>
                <BudgetProgressBar spent={budgetLine.spentAmount} budgeted={budgetLine.budgetedAmount} />
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Expenses Against This Budget</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {budgetLine.expenses.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">No expenses charged to this budget.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {budgetLine.expenses.map((exp) => (
                        <TableRow key={exp._id}>
                          <TableCell className="font-medium">{exp.title}</TableCell>
                          <TableCell className="font-mono">{formatCurrency(exp.amount)}</TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(exp.date)}</TableCell>
                          <TableCell><StatusBadge status={exp.status} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </RoleGuard>
  );
}
