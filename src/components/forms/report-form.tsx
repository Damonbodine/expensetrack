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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface ReportFormProps {
  mode: "create" | "edit";
  reportId?: Id<"expenseReports">;
  defaultValues?: {
    title: string;
    description?: string;
    period?: string;
  };
}

export function ReportForm({ mode, reportId, defaultValues }: ReportFormProps) {
  const router = useRouter();
  const unassignedExpenses = useQuery(api.expenses.listUnassignedExpenses);
  const createReport = useMutation(api.expenseReports.createReport);
  const updateReport = useMutation(api.expenseReports.updateReport);

  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [period, setPeriod] = useState(defaultValues?.period ?? "");
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<Id<"expenses">[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!title || title.length < 2) newErrors.title = "Title is required (min 2 characters)";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function toggleExpense(expenseId: Id<"expenses">) {
    setSelectedExpenseIds((prev) =>
      prev.includes(expenseId) ? prev.filter((id) => id !== expenseId) : [...prev, expenseId]
    );
  }

  const selectedTotal = unassignedExpenses
    ?.filter((e) => selectedExpenseIds.includes(e._id))
    .reduce((sum, e) => sum + e.amount, 0) ?? 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await createReport({
          title,
          description: description || undefined,
          period: period || undefined,
          expenseIds: selectedExpenseIds.length > 0 ? selectedExpenseIds : undefined,
        });
      } else {
        await updateReport({
          reportId: reportId!,
          title,
          description: description || undefined,
          period: period || undefined,
        });
      }
      router.push("/reports");
    } catch (error) {
      console.error("Failed to save report:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "New Expense Report" : "Edit Expense Report"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Report title" />
              {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="period">Period</Label>
              <Input id="period" value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="e.g. March 2026" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Report description or justification" rows={3} />
          </div>
          {mode === "create" && (
            <div className="space-y-2">
              <Label>Select Expenses to Include</Label>
              {selectedExpenseIds.length > 0 && (
                <p className="text-sm text-muted-foreground">{selectedExpenseIds.length} selected -- Total: ${selectedTotal.toFixed(2)}</p>
              )}
              <div className="border rounded-md max-h-64 overflow-y-auto">
                {!unassignedExpenses ? (
                  <div className="p-4 text-center text-muted-foreground">Loading expenses...</div>
                ) : unassignedExpenses.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">No unassigned expenses available</div>
                ) : (
                  unassignedExpenses.map((expense) => (
                    <div key={expense._id} className="flex items-center space-x-3 p-3 border-b last:border-b-0 hover:bg-muted/50">
                      <Checkbox checked={selectedExpenseIds.includes(expense._id)} onCheckedChange={() => toggleExpense(expense._id)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{expense.title}</p>
                        <p className="text-xs text-muted-foreground">{expense.merchant} -- {new Date(expense.date).toLocaleDateString()}</p>
                      </div>
                      <Badge variant="outline">${expense.amount.toFixed(2)}</Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create Report" : "Save Changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}