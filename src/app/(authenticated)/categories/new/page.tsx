"use client";

import { RoleGuard } from "@/components/role-guard";
import { CategoryForm } from "@/components/forms/category-form";

export default function NewCategoryPage() {
  return (
    <RoleGuard allowedRoles={["Admin"]}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">New Category</h1>
        <CategoryForm mode="create" />
      </div>
    </RoleGuard>
  );
}
