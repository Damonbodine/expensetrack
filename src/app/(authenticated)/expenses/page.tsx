"use client";

import { ExpenseTable } from "@/components/expense-table";

export default function ExpensesListPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Expenses</h1>
      <ExpenseTable />
    </div>
  );
}
