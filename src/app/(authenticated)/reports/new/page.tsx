"use client";

import { ReportForm } from "@/components/forms/report-form";

export default function NewReportPage() {
  return (
    <div className="space-y-6" data-demo="report-create">
      <h1 className="text-2xl font-bold">New Expense Report</h1>
      <ReportForm mode="create" />
    </div>
  );
}
