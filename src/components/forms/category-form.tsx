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
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface CategoryFormProps {
  mode: "create" | "edit";
  categoryId?: Id<"categories">;
  defaultValues?: {
    name: string;
    description?: string;
    code: string;
    isActive: boolean;
    budgetLineId?: Id<"budgetLines">;
  };
}

export function CategoryForm({ mode, categoryId, defaultValues }: CategoryFormProps) {
  const router = useRouter();
  const budgetLines = useQuery(api.budgetLines.listBudgetLines, {});
  const createCategory = useMutation(api.categories.createCategory);
  const updateCategory = useMutation(api.categories.updateCategory);

  const [name, setName] = useState(defaultValues?.name ?? "");
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [code, setCode] = useState(defaultValues?.code ?? "");
  const [isActive, setIsActive] = useState(defaultValues?.isActive ?? true);
  const [budgetLineId, setBudgetLineId] = useState<string>(defaultValues?.budgetLineId ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!name || name.length < 2) newErrors.name = "Name is required (min 2 characters)";
    if (!code || code.length < 2 || code.length > 6) newErrors.code = "Code is required (2-6 characters)";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await createCategory({
          name,
          description: description || undefined,
          code: code.toUpperCase(),
          isActive,
          budgetLineId: budgetLineId ? (budgetLineId as Id<"budgetLines">) : undefined,
        });
      } else {
        await updateCategory({
          categoryId: categoryId!,
          name,
          description: description || undefined,
          code: code.toUpperCase(),
          isActive,
          budgetLineId: budgetLineId ? (budgetLineId as Id<"budgetLines">) : undefined,
        });
      }
      router.push("/categories");
    } catch (error) {
      console.error("Failed to save category:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "New Category" : "Edit Category"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input id="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. TRV" maxLength={6} />
              {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Category description" rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budgetLineId">Budget Line</Label>
            <Select value={budgetLineId} onValueChange={setBudgetLineId}>
              <SelectTrigger><SelectValue placeholder="Select budget line (optional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {budgetLines?.map((bl) => (
                  <SelectItem key={bl._id} value={bl._id}>{bl.name} ({bl.fiscalYear})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
            <Label htmlFor="isActive">Active</Label>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create Category" : "Save Changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}