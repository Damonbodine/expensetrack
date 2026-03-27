// @ts-nocheck
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface BudgetLineFormProps {
  mode: "create" | "edit";
  budgetLineId?: Id<"budgetLines">;
  defaultValues?: {
    name: string;
    categoryId: Id<"categories">;
    fiscalYear: string;
    budgetedAmount: number;
    department: string;
    notes?: string;
  };
}

export function BudgetLineForm({ mode, budgetLineId, defaultValues }: BudgetLineFormProps) {
  const router = useRouter();
  const categories = useQuery(api.categories.listCategories, {});
  const createBudgetLine = useMutation(api.budgetLines.createBudgetLine);
  const updateBudgetLine = useMutation(api.budgetLines.updateBudgetLine);

  const [name, setName] = useState(defaultValues?.name ?? "");
  const [categoryId, setCategoryId] = useState<string>(defaultValues?.categoryId ?? "");
  const [fiscalYear, setFiscalYear] = useState(defaultValues?.fiscalYear ?? "FY2026");
  const [budgetedAmount, setBudgetedAmount] = useState(defaultValues?.budgetedAmount?.toString() ?? "");
  const [department, setDepartment] = useState(defaultValues?.department ?? "");
  const [notes, setNotes] = useState(defaultValues?.notes ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!name || name.length < 2) newErrors.name = "Name is required (min 2 characters)";
    if (mode === "create" && !categoryId) newErrors.categoryId = "Category is required";
    if (!fiscalYear) newErrors.fiscalYear = "Fiscal year is required";
    if (!budgetedAmount || parseFloat(budgetedAmount) <= 0) newErrors.budgetedAmount = "Budget amount must be positive";
    if (!department || department.length < 2) newErrors.department = "Department is required (min 2 characters)";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await createBudgetLine({
          name,
          categoryId: categoryId as Id<"categories">,
          fiscalYear,
          budgetedAmount: parseFloat(budgetedAmount),
          department,
          notes: notes || undefined,
        });
      } else {
        await updateBudgetLine({
          budgetLineId: budgetLineId!,
          name,
          budgetedAmount: parseFloat(budgetedAmount),
          department,
          notes: notes || undefined,
        });
      }
      router.push("/budgets");
    } catch (error) {
      console.error("Failed to save budget line:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "New Budget Line" : "Edit Budget Line"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Budget line name" />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category *</Label>
              <Select value={categoryId} onValueChange={setCategoryId} disabled={mode === "edit"}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && <p className="text-sm text-destructive">{errors.categoryId}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fiscalYear">Fiscal Year *</Label>
              <Input id="fiscalYear" value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} placeholder="e.g. FY2026" disabled={mode === "edit"} />
              {errors.fiscalYear && <p className="text-sm text-destructive">{errors.fiscalYear}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="budgetedAmount">Budgeted Amount ($) *</Label>
              <Input id="budgetedAmount" type="number" step="0.01" min="0" value={budgetedAmount} onChange={(e) => setBudgetedAmount(e.target.value)} placeholder="0.00" />
              {errors.budgetedAmount && <p className="text-sm text-destructive">{errors.budgetedAmount}</p>}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="department">Department *</Label>
              <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Department name" />
              {errors.department && <p className="text-sm text-destructive">{errors.department}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Budget notes or justification" rows={3} />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create Budget Line" : "Save Changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}