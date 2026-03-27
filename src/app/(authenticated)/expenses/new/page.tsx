"use client";

import { ExpenseForm } from "@/components/forms/expense-form";

export default function NewExpensePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">New Expense</h1>
      <ExpenseForm mode="create" />
    </div>
  );
}
