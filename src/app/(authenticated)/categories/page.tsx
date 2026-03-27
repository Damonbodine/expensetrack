"use client";

import { RoleGuard } from "@/components/role-guard";
import { CategoryTable } from "@/components/category-table";

export default function CategoriesListPage() {
  return (
    <RoleGuard allowedRoles={["Admin"]}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Expense Categories</h1>
        <CategoryTable />
      </div>
    </RoleGuard>
  );
}
