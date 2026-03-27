"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { BudgetProgressBar } from "@/components/budget-progress-bar";
import { formatCurrency } from "@/lib/utils";
import { Eye, Pencil, Plus } from "lucide-react";

export function BudgetTable() {
  const router = useRouter();
  const [fiscalYear, setFiscalYear] = useState<string>("all");
  const [department, setDepartment] = useState<string>("all");

  const budgetLines = useQuery(api.budgetLines.listBudgetLines, {
    ...(fiscalYear !== "all" ? { fiscalYear } : {}),
    ...(department !== "all" ? { department } : {}),
  });

  if (!budgetLines) {
    return <div className="p-8 text-center text-muted-foreground">Loading budgets...</div>;
  }

  const fiscalYears = [...new Set(budgetLines.map((bl: any) => bl.fiscalYear))].sort();
  const departments = [...new Set(budgetLines.map((bl: any) => bl.department))].sort();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={fiscalYear} onValueChange={(v) => v !== null && setFiscalYear(v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Fiscal Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {fiscalYears.map((fy: string) => (
              <SelectItem key={fy} value={fy}>
                {fy}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={department} onValueChange={(v) => v !== null && setDepartment(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((dept: string) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button onClick={() => router.push("/budgets/new")}>
          <Plus className="h-4 w-4 mr-1" />
          New Budget
        </Button>
      </div>

      {budgetLines.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground border border-border">
          No budget lines found.
        </div>
      ) : (
        <div className="border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Fiscal Year</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Budgeted</TableHead>
                <TableHead>Spent</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead className="w-[200px]">Utilization</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgetLines.map((bl: any) => (
                <TableRow key={bl._id}>
                  <TableCell className="font-medium">{bl.name}</TableCell>
                  <TableCell className="text-muted-foreground">{bl.fiscalYear}</TableCell>
                  <TableCell className="text-muted-foreground">{bl.department}</TableCell>
                  <TableCell className="font-mono">
                    {formatCurrency(bl.budgetedAmount)}
                  </TableCell>
                  <TableCell className="font-mono">
                    {formatCurrency(bl.spentAmount)}
                  </TableCell>
                  <TableCell className="font-mono">
                    {formatCurrency(bl.remainingAmount)}
                  </TableCell>
                  <TableCell>
                    <BudgetProgressBar spent={bl.spentAmount} budgeted={bl.budgetedAmount} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link href={`/budgets/${bl._id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link href={`/budgets/${bl._id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
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