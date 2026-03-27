"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { RoleGuard } from "@/components/role-guard";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Eye } from "lucide-react";
import Link from "next/link";

export default function ApprovalsListPage() {
  const pendingReports = useQuery(api.expenseReports.listPendingForApproval);

  return (
    <RoleGuard allowedRoles={["Admin", "Approver"]}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Pending Approvals</h1>

        {!pendingReports ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : pendingReports.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground border border-border">
            No reports pending approval.
          </div>
        ) : (
          <div className="border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Submitter</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingReports.map((report) => (
                  <TableRow key={report._id}>
                    <TableCell className="font-medium">{report.title}</TableCell>
                    <TableCell className="text-muted-foreground">{report.submitter?.name ?? "Unknown"}</TableCell>
                    <TableCell className="font-mono font-medium">{formatCurrency(report.totalAmount)}</TableCell>
                    <TableCell><StatusBadge status={report.status} /></TableCell>
                    <TableCell className="text-muted-foreground">
                      {report.submittedAt ? formatDate(report.submittedAt) : "--"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link href={`/approvals/${report._id}`}><Eye className="h-4 w-4" /></Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
