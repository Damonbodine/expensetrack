// @ts-nocheck
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Pencil, Trash2, Send, FileText } from "lucide-react";
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

interface ReportDetailProps {
  reportId: Id<"expenseReports">;
}

export function ReportDetail({ reportId }: ReportDetailProps) {
  const router = useRouter();
  const report = useQuery(api.expenseReports.getReport, { reportId });
  const expenses = useQuery(api.expenses.listExpensesByReport, { reportId });
  const deleteReport = useMutation(api.expenseReports.deleteReport);
  const submitReport = useMutation(api.expenseReports.submitReport);

  if (!report) {
    return <div className="p-8 text-center text-muted-foreground">Loading report...</div>;
  }

  const isDraft = report.status === "Draft";

  const handleDelete = async () => {
    await deleteReport({ reportId });
    router.push("/reports");
  };

  const handleSubmit = async () => {
    await submitReport({ reportId });
  };

  return (
    <div className="space-y-6">
      <Card className="border border-border">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-semibold">{report.title}</CardTitle>
              {report.description && (
                <p className="text-sm text-muted-foreground">{report.description}</p>
              )}
            </div>
            <StatusBadge status={report.status} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Amount</p>
              <p className="font-mono font-bold text-lg">
                {formatCurrency(report.totalAmount)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Period</p>
              <p className="font-medium">{report.period ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Submitted</p>
              <p className="font-medium">
                {report.submittedAt ? formatDate(report.submittedAt) : "Not submitted"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Expenses</p>
              <p className="font-medium">{expenses?.length ?? 0} items</p>
            </div>
          </div>

          {isDraft && (
            <div className="flex items-center gap-2 mt-6 pt-4 border-t border-border">
              <Button onClick={handleSubmit}>
                <Send className="h-4 w-4 mr-1" />
                Submit for Approval
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/reports/${reportId}/edit`}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Report</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this report? All expenses will be unassigned
                      but not deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={handleDelete}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Included Expenses
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!expenses || expenses.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No expenses in this report.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((exp: any) => (
                  <TableRow key={exp._id}>
                    <TableCell>
                      <Link
                        href={`/expenses/${exp._id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {exp.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{exp.merchant}</TableCell>
                    <TableCell className="font-mono font-medium">
                      {formatCurrency(exp.amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(exp.date)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {exp.categoryName ?? "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={exp.status} />
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={2} className="font-semibold">
                    Total
                  </TableCell>
                  <TableCell className="font-mono font-bold">
                    {formatCurrency(report.totalAmount)}
                  </TableCell>
                  <TableCell colSpan={3} />
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}