"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";
import { CheckCircle, XCircle, RotateCcw, Loader2, MessageSquare } from "lucide-react";

interface ApprovalActionsProps {
  reportId: Id<"expenseReports">;
  submittedById: Id<"users">;
}

export function ApprovalActions({ reportId, submittedById }: ApprovalActionsProps) {
  const router = useRouter();
  const approveReport = useMutation(api.approvals.approveReport);
  const rejectReport = useMutation(api.approvals.rejectReport);
  const returnReport = useMutation(api.approvals.returnReport);
  const approvalHistory = useQuery(api.approvals.listByReport, { reportId });

  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (action: "approve" | "reject" | "return") => {
    setError(null);

    if ((action === "reject" || action === "return") && !comments.trim()) {
      setError("Comments are required when rejecting or returning a report.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (action === "approve") {
        await approveReport({ reportId, comments: comments || undefined });
      } else if (action === "reject") {
        await rejectReport({ reportId, comments });
      } else {
        await returnReport({ reportId, comments });
      }
      router.push("/approvals");
    } catch (err: any) {
      setError(err.message ?? "Action failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Review Decision
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/30">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="comments">Comments</Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add comments (required for reject/return)..."
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleAction("approve")}
              disabled={isSubmitting}
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-1" />
              )}
              Approve
            </Button>
            <Button
              onClick={() => handleAction("return")}
              disabled={isSubmitting}
              variant="outline"
              className="text-warning border-warning hover:bg-warning/10"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Return for Revision
            </Button>
            <Button
              onClick={() => handleAction("reject")}
              disabled={isSubmitting}
              variant="outline"
              className="text-destructive border-destructive hover:bg-destructive/10"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        </CardContent>
      </Card>

      {approvalHistory && approvalHistory.length > 0 && (
        <Card className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Approval History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reviewer</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Comments</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvalHistory.map((entry: any) => (
                  <TableRow key={entry._id}>
                    <TableCell className="font-medium">
                      {entry.approverName ?? "Unknown"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={entry.action} />
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {entry.comments ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(entry.actionAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}