"use client";

import { RoleGuard } from "@/components/role-guard";
import { BudgetTable } from "@/components/budget-table";

export default function BudgetLinesListPage() {
  return (
    <RoleGuard allowedRoles={["Admin"]}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Budget Lines</h1>
        <BudgetTable />
      </div>
    </RoleGuard>
  );
}
