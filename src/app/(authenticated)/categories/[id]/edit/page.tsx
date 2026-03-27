"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { RoleGuard } from "@/components/role-guard";
import { CategoryForm } from "@/components/forms/category-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const category = useQuery(api.categories.getCategory, {
    categoryId: id as Id<"categories">,
  });

  return (
    <RoleGuard allowedRoles={["Admin"]}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Edit Category</h1>
        {category === undefined ? (
          <Skeleton className="h-[400px]" />
        ) : category === null ? (
          <div className="p-8 text-center text-muted-foreground">Category not found.</div>
        ) : (
          <CategoryForm
            mode="edit"
            categoryId={category._id}
            defaultValues={{
              name: category.name,
              description: category.description,
              code: category.code,
              isActive: category.isActive,
              budgetLineId: category.budgetLineId,
            }}
          />
        )}
      </div>
    </RoleGuard>
  );
}
