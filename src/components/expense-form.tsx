// @ts-nocheck
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface ExpenseFormProps {
  expense?: {
    _id: Id<"expenses">;
    title: string;
    description?: string;
    amount: number;
    date: number;
    categoryId: Id<"categories">;
    merchant: string;
    paymentMethod: string;
    notes?: string;
  };
}

const PAYMENT_METHODS = [
  { value: "CreditCard", label: "Credit Card" },
  { value: "DebitCard", label: "Debit Card" },
  { value: "Cash", label: "Cash" },
  { value: "Check", label: "Check" },
  { value: "BankTransfer", label: "Bank Transfer" },
  { value: "Other", label: "Other" },
];

export function ExpenseForm({ expense }: ExpenseFormProps) {
  const router = useRouter();
  const categories = useQuery(api.categories.listCategories, { isActive: true });
  const createExpense = useMutation(api.expenses.createExpense);
  const updateExpense = useMutation(api.expenses.updateExpense);
  const isEdit = !!expense;

  const [title, setTitle] = useState(expense?.title ?? "");
  const [description, setDescription] = useState(expense?.description ?? "");
  const [amount, setAmount] = useState(expense?.amount?.toString() ?? "");
  const [date, setDate] = useState(
    expense?.date
      ? new Date(expense.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [categoryId, setCategoryId] = useState<string>(expense?.categoryId ?? "");
  const [merchant, setMerchant] = useState(expense?.merchant ?? "");
  const [paymentMethod, setPaymentMethod] = useState(expense?.paymentMethod ?? "");
  const [notes, setNotes] = useState(expense?.notes ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error("Amount must be a positive number");
      }

      const parsedDate = new Date(date).getTime();

      if (isEdit && expense) {
        await updateExpense({
          expenseId: expense._id,
          title,
          description: description || undefined,
          amount: parsedAmount,
          date: parsedDate,
          categoryId: categoryId as Id<"categories">,
          merchant,
          paymentMethod: paymentMethod as any,
          notes: notes || undefined,
        });
        router.push(`/expenses/${expense._id}`);
      } else {
        const id = await createExpense({
          title,
          description: description || undefined,
          amount: parsedAmount,
          date: parsedDate,
          categoryId: categoryId as Id<"categories">,
          merchant,
          paymentMethod: paymentMethod as any,
          notes: notes || undefined,
        });
        router.push(`/expenses/${id}`);
      }
    } catch (err: any) {
      setError(err.message ?? "Failed to save expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto border border-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold">
          {isEdit ? "Edit Expense" : "New Expense"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/30">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the expense"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">
                  $
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-7 font-mono"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="merchant">Merchant *</Label>
            <Input
              id="merchant"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="Vendor or merchant name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat: any) => (
                    <SelectItem key={cat._id} value={cat._id}>
                      {cat.name} ({cat.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((pm) => (
                    <SelectItem key={pm.value} value={pm.value}>
                      {pm.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed notes about the expense"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes (not visible on reports)"
              rows={2}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Saving...
                </>
              ) : isEdit ? (
                "Update Expense"
              ) : (
                "Create Expense"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}