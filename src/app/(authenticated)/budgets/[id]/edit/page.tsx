"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { RoleGuard } from "@/components/role-guard";
import { BudgetLineForm } from "@/components/forms/budget-line-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditBudgetLinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const budgetLine = useQuery(api.budgetLines.getBudgetLine, {
    budgetLineId: id as Id<"budgetLines">,
  });

  return (
    <RoleGuard allowedRoles={["Admin"]}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Edit Budget Line</h1>
        {budgetLine === undefined ? (
          <Skeleton className="h-[400px]" />
        ) : budgetLine === null ? (
          <div className="p-8 text-center text-muted-foreground">Budget line not found.</div>
        ) : (
          <BudgetLineForm
            mode="edit"
            budgetLineId={budgetLine._id}
            defaultValues={{
              name: budgetLine.name,
              categoryId: budgetLine.categoryId,
              fiscalYear: budgetLine.fiscalYear,
              budgetedAmount: budgetLine.budgetedAmount,
              department: budgetLine.department,
              notes: budgetLine.notes,
            }}
          />
        )}
      </div>
    </RoleGuard>
  );
}
