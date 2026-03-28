"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Eye, Pencil, Trash2, ArrowUpDown, Plus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { withPreservedDemoQuery } from "@/lib/demo";

type SortField = "title" | "amount" | "date" | "merchant";
type SortDir = "asc" | "desc";

export function ExpenseTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const expenses = useQuery(api.expenses.listExpenses, {
    ...(statusFilter !== "all" ? { status: statusFilter as any } : {}),
    ...(categoryFilter !== "all" ? { categoryId: categoryFilter as Id<"categories"> } : {}),
  });
  const categories = useQuery(api.categories.listCategories, { isActive: true });
  const deleteExpense = useMutation(api.expenses.deleteExpense);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const handleDelete = async (expenseId: Id<"expenses">) => {
    await deleteExpense({ expenseId });
  };

  if (!expenses) {
    return <div className="p-8 text-center text-muted-foreground">Loading expenses...</div>;
  }

  const filtered = expenses.filter((e: any) => {
    if (search) {
      const q = search.toLowerCase();
      return (
        e.title?.toLowerCase().includes(q) ||
        e.merchant?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const sorted = [...filtered].sort((a: any, b: any) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortField === "amount") return (a.amount - b.amount) * dir;
    if (sortField === "date") return (a.date - b.date) * dir;
    const aVal = (a[sortField] ?? "").toLowerCase();
    const bVal = (b[sortField] ?? "").toLowerCase();
    return aVal.localeCompare(bVal) * dir;
  });

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead
      className="cursor-pointer select-none hover:text-foreground"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className="h-3 w-3" />
      </div>
    </TableHead>
  );

  return (
    <div className="space-y-4" data-demo="expenses-list">
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Search by title or merchant..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={(v) => v !== null && setStatusFilter(v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Submitted">Submitted</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
            <SelectItem value="Reimbursed">Reimbursed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={(v) => v !== null && setCategoryFilter(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories?.map((cat: any) => (
              <SelectItem key={cat._id} value={cat._id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button
          data-demo="primary-new-expense"
          onClick={() => router.push(withPreservedDemoQuery("/expenses/new", searchParams))}
        >
          <Plus className="h-4 w-4 mr-1" />
          New Expense
        </Button>
      </div>

      {sorted.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground border border-border">
          No expenses found. Create your first expense to get started.
        </div>
      ) : (
        <div className="border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHeader field="title">Title</SortHeader>
                <SortHeader field="merchant">Merchant</SortHeader>
                <SortHeader field="amount">Amount</SortHeader>
                <SortHeader field="date">Date</SortHeader>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((expense: any, index: number) => (
                <TableRow key={expense._id}>
                  <TableCell className="font-medium">{expense.title}</TableCell>
                  <TableCell className="text-muted-foreground">{expense.merchant}</TableCell>
                  <TableCell className="font-mono font-medium">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(expense.date)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {expense.categoryName ?? "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={expense.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        asChild
                      >
                        <Link
                          href={withPreservedDemoQuery(`/expenses/${expense._id}`, searchParams)}
                          data-demo={index === 0 ? "primary-expense-link" : undefined}
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      {expense.status === "Draft" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            asChild
                          >
                            <Link href={withPreservedDemoQuery(`/expenses/${expense._id}/edit`, searchParams)}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              }
                            />
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete &quot;{expense.title}&quot;? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => handleDelete(expense._id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
