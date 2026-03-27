import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ExpenseStatus = "Draft" | "Submitted" | "Approved" | "Rejected" | "Reimbursed";
type ReportStatus = "Draft" | "Submitted" | "UnderReview" | "Approved" | "Rejected" | "Reimbursed";
type ApprovalAction = "Approved" | "Rejected" | "ReturnedForRevision";

interface StatusBadgeProps {
  status: ExpenseStatus | ReportStatus | ApprovalAction;
}

const statusStyles: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground border-muted",
  Submitted: "bg-info/10 text-info border-info/30",
  UnderReview: "bg-warning/10 text-warning border-warning/30",
  Approved: "bg-success/10 text-success border-success/30",
  Rejected: "bg-destructive/10 text-destructive border-destructive/30",
  Reimbursed: "bg-purple-100 text-purple-700 border-purple-300",
  ReturnedForRevision: "bg-warning/10 text-warning border-warning/30",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const label = status === "UnderReview"
    ? "Under Review"
    : status === "ReturnedForRevision"
      ? "Returned"
      : status;

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium text-xs px-2 py-0.5 border",
        statusStyles[status] ?? "bg-muted text-muted-foreground"
      )}
    >
      {label}
    </Badge>
  );
}