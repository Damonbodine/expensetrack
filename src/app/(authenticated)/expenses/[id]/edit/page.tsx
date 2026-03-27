"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ExpenseForm } from "@/components/forms/expense-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const expense = useQuery(api.expenses.getExpense, {
    expenseId: id as Id<"expenses">,
  });

  if (expense === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (expense === null) {
    return <div className="p-8 text-center text-muted-foreground">Expense not found.</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit Expense</h1>
      <ExpenseForm
        mode="edit"
        expenseId={expense._id}
        defaultValues={{
          title: expense.title,
          amount: expense.amount,
          date: new Date(expense.date).toISOString().split("T")[0],
          merchant: expense.merchant,
          categoryId: expense.categoryId,
          paymentMethod: expense.paymentMethod,
          description: expense.description,
          notes: expense.notes,
        }}
      />
    </div>
  );
}
