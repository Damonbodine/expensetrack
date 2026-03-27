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

const PAYMENT_METHODS = [
  { value: "CreditCard", label: "Credit Card" },
  { value: "DebitCard", label: "Debit Card" },
  { value: "Cash", label: "Cash" },
  { value: "Check", label: "Check" },
  { value: "BankTransfer", label: "Bank Transfer" },
  { value: "Other", label: "Other" },
] as const;

type PaymentMethod = "CreditCard" | "DebitCard" | "Cash" | "Check" | "BankTransfer" | "Other";

interface ExpenseFormProps {
  mode: "create" | "edit";
  expenseId?: Id<"expenses">;
  defaultValues?: {
    title: string;
    amount: number;
    date: string;
    merchant: string;
    categoryId: Id<"categories">;
    paymentMethod: PaymentMethod;
    description?: string;
    notes?: string;
  };
}

export function ExpenseForm({ mode, expenseId, defaultValues }: ExpenseFormProps) {
  const router = useRouter();
  const categories = useQuery(api.categories.listCategories, { isActive: true });
  const createExpense = useMutation(api.expenses.createExpense);
  const updateExpense = useMutation(api.expenses.updateExpense);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const createReceipt = useMutation(api.receipts.createReceipt);

  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [amount, setAmount] = useState(defaultValues?.amount?.toString() ?? "");
  const [date, setDate] = useState(defaultValues?.date ?? new Date().toISOString().split("T")[0]);
  const [merchant, setMerchant] = useState(defaultValues?.merchant ?? "");
  const [categoryId, setCategoryId] = useState<string>(defaultValues?.categoryId ?? "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">(defaultValues?.paymentMethod ?? "");
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [notes, setNotes] = useState(defaultValues?.notes ?? "");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!title || title.length < 2) newErrors.title = "Title is required (min 2 characters)";
    if (!amount || parseFloat(amount) <= 0) newErrors.amount = "Amount must be a positive number";
    if (!date) newErrors.date = "Date is required";
    if (!merchant || merchant.length < 2) newErrors.merchant = "Merchant is required (min 2 characters)";
    if (!categoryId) newErrors.categoryId = "Category is required";
    if (!paymentMethod) newErrors.paymentMethod = "Payment method is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      let newExpenseId: Id<"expenses">;
      if (mode === "create") {
        newExpenseId = await createExpense({
          title,
          amount: parseFloat(amount),
          date: new Date(date).getTime(),
          merchant,
          categoryId: categoryId as Id<"categories">,
          paymentMethod: paymentMethod as PaymentMethod,
          description: description || undefined,
          notes: notes || undefined,
        });
      } else {
        newExpenseId = await updateExpense({
          expenseId: expenseId!,
          title,
          amount: parseFloat(amount),
          date: new Date(date).getTime(),
          merchant,
          categoryId: categoryId as Id<"categories">,
          paymentMethod: paymentMethod as PaymentMethod,
          description: description || undefined,
          notes: notes || undefined,
        });
      }
      if (receiptFile) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": receiptFile.type }, body: receiptFile });
        const { storageId } = await result.json();
        await createReceipt({
          expenseId: newExpenseId,
          fileUrl: storageId,
          fileName: receiptFile.name,
          fileSize: receiptFile.size,
          fileType: receiptFile.type,
        });
      }
      router.push("/expenses");
    } catch (error) {
      console.error("Failed to save expense:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "New Expense" : "Edit Expense"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Expense title" />
              {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($) *</Label>
              <Input id="amount" type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="merchant">Merchant *</Label>
              <Input id="merchant" value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="Vendor name" />
              {errors.merchant && <p className="text-sm text-destructive">{errors.merchant}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category *</Label>
              <Select value={categoryId} onValueChange={(v) => v !== null && setCategoryId(v)}>
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
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={(v) => v !== null && setPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((pm) => (
                    <SelectItem key={pm.value} value={pm.value}>{pm.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.paymentMethod && <p className="text-sm text-destructive">{errors.paymentMethod}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detailed description" rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes" rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="receipt">Receipt</Label>
            <Input id="receipt" type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)} />
            <p className="text-xs text-muted-foreground">Accepts JPEG, PNG, or PDF up to 10MB</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create Expense" : "Save Changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}