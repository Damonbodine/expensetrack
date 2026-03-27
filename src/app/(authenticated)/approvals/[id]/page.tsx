"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { RoleGuard } from "@/components/role-guard";
import { ReportDetail } from "@/components/report-detail";
import { ApprovalActions } from "@/components/approval-actions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ApprovalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const report = useQuery(api.expenseReports.getReport, {
    reportId: id as Id<"expenseReports">,
  });

  return (
    <RoleGuard allowedRoles={["Admin", "Approver"]}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/approvals"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-2xl font-bold">Review Report</h1>
        </div>

        {report === undefined ? (
          <Skeleton className="h-[400px]" />
        ) : report === null ? (
          <div className="p-8 text-center text-muted-foreground">Report not found.</div>
        ) : (
          <>
            <ReportDetail reportId={id as Id<"expenseReports">} />
            {(report.status === "Submitted" || report.status === "UnderReview") && (
              <ApprovalActions reportId={id as Id<"expenseReports">} submittedById={report.submittedById} />
            )}
          </>
        )}
      </div>
    </RoleGuard>
  );
}
