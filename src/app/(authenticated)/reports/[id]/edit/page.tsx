"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ReportForm } from "@/components/forms/report-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const report = useQuery(api.expenseReports.getReport, {
    reportId: id as Id<"expenseReports">,
  });

  if (report === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (report === null) {
    return <div className="p-8 text-center text-muted-foreground">Report not found.</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit Report</h1>
      <ReportForm
        mode="edit"
        reportId={report._id}
        defaultValues={{
          title: report.title,
          description: report.description,
          period: report.period,
        }}
      />
    </div>
  );
}
