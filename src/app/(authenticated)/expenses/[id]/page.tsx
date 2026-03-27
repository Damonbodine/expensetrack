"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { StatusBadge } from "@/components/status-badge";
import { ReceiptUpload } from "@/components/receipt-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Pencil, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const expense = useQuery(api.expenses.getExpense, {
    expenseId: id as Id<"expenses">,
  });

  if (expense === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  if (expense === null) {
    return (
      <div className="p-8 text-center text-muted-foreground">Expense not found.</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/expenses"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-2xl font-bold">{expense.title}</h1>
          <StatusBadge status={expense.status} />
        </div>
        {expense.status === "Draft" && (
          <Button variant="outline" asChild>
            <Link href={`/expenses/${id}/edit`}>
              <Pencil className="h-4 w-4 mr-1" /> Edit
            </Link>
          </Button>
        )}
      </div>

      <Card className="border border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Expense Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Amount</p>
              <p className="font-mono font-bold text-lg">{formatCurrency(expense.amount)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Date</p>
              <p className="font-medium">{formatDate(expense.date)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Merchant</p>
              <p className="font-medium">{expense.merchant}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Category</p>
              <p className="font-medium">{expense.category?.name ?? "Unknown"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Payment Method</p>
              <p className="font-medium">{expense.paymentMethod}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Submitted By</p>
              <p className="font-medium">{expense.submitter?.name ?? "Unknown"}</p>
            </div>
            {expense.description && (
              <div className="col-span-full">
                <p className="text-muted-foreground">Description</p>
                <p className="font-medium">{expense.description}</p>
              </div>
            )}
            {expense.notes && (
              <div className="col-span-full">
                <p className="text-muted-foreground">Notes</p>
                <p className="font-medium">{expense.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ReceiptUpload expenseId={id as Id<"expenses">} />
    </div>
  );
}
