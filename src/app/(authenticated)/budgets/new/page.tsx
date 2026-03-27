"use client";

import { RoleGuard } from "@/components/role-guard";
import { BudgetLineForm } from "@/components/forms/budget-line-form";

export default function NewBudgetLinePage() {
  return (
    <RoleGuard allowedRoles={["Admin"]}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">New Budget Line</h1>
        <BudgetLineForm mode="create" />
      </div>
    </RoleGuard>
  );
}
