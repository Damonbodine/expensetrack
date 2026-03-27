import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

interface BudgetProgressBarProps {
  spent: number;
  budgeted: number;
}

export function BudgetProgressBar({ spent, budgeted }: BudgetProgressBarProps) {
  const percentage = budgeted > 0 ? (spent / budgeted) * 100 : 0;
  const clampedWidth = Math.min(percentage, 100);

  const barColor =
    percentage >= 100
      ? "bg-destructive"
      : percentage >= 80
        ? "bg-warning"
        : "bg-success";

  const textColor =
    percentage >= 100
      ? "text-destructive"
      : percentage >= 80
        ? "text-warning"
        : "text-success";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono text-muted-foreground">
          {formatCurrency(spent)} / {formatCurrency(budgeted)}
        </span>
        <span className={cn("font-mono font-medium", textColor)}>
          {percentage.toFixed(1)}%
        </span>
      </div>
      <div className="h-2 w-full bg-muted overflow-hidden">
        <div
          className={cn("h-full transition-all duration-300", barColor)}
          style={{ width: `${clampedWidth}%` }}
        />
      </div>
    </div>
  );
}