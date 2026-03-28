"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Eye, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { withPreservedDemoQuery } from "@/lib/demo";

type ReportStatus = "Draft" | "Submitted" | "UnderReview" | "Approved" | "Rejected" | "Reimbursed";

export default function ReportsListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const reports = useQuery(api.expenseReports.listReports, {
    ...(statusFilter !== "all" ? { status: statusFilter as ReportStatus } : {}),
  });

  return (
    <div className="space-y-6" data-demo="reports-list">
      <h1 className="text-2xl font-bold">Expense Reports</h1>

      <div className="flex items-center gap-3 flex-wrap">
        <Select value={statusFilter} onValueChange={(v) => v !== null && setStatusFilter(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Submitted">Submitted</SelectItem>
            <SelectItem value="UnderReview">Under Review</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
            <SelectItem value="Reimbursed">Reimbursed</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button onClick={() => router.push(withPreservedDemoQuery("/reports/new", searchParams))}>
          <Plus className="h-4 w-4 mr-1" /> New Report
        </Button>
      </div>

      {!reports ? (
        <div className="p-8 text-center text-muted-foreground">Loading reports...</div>
      ) : reports.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground border border-border">
          No reports found. Create your first expense report.
        </div>
      ) : (
        <div className="border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Submitter</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report, index) => (
                <TableRow key={report._id}>
                  <TableCell className="font-medium">{report.title}</TableCell>
                  <TableCell className="text-muted-foreground">{report.submitter?.name ?? "Unknown"}</TableCell>
                  <TableCell className="font-mono font-medium">{formatCurrency(report.totalAmount)}</TableCell>
                  <TableCell className="text-muted-foreground">{report.period ?? "--"}</TableCell>
                  <TableCell><StatusBadge status={report.status} /></TableCell>
                  <TableCell className="text-muted-foreground">
                    {report.submittedAt ? formatDate(report.submittedAt) : "--"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link
                          href={withPreservedDemoQuery(`/reports/${report._id}`, searchParams)}
                          data-demo={index === 0 ? "primary-report-link" : undefined}
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      {report.status === "Draft" && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <Link href={withPreservedDemoQuery(`/reports/${report._id}/edit`, searchParams)}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
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
