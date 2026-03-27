"use client";

import { use } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import { ReportDetail } from "@/components/report-detail";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/reports"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Report Details</h1>
      </div>
      <ReportDetail reportId={id as Id<"expenseReports">} />
    </div>
  );
}
