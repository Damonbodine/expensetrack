import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp));
}

export function getBudgetUtilization(spent: number, budgeted: number): number {
  if (budgeted === 0) return 0;
  return Math.round((spent / budgeted) * 100);
}

export function getUtilizationColor(percent: number): string {
  if (percent >= 100) return "text-destructive";
  if (percent >= 80) return "text-warning";
  return "text-success";
}

export function getProgressColor(percent: number): string {
  if (percent >= 100) return "bg-destructive";
  if (percent >= 80) return "bg-warning";
  return "bg-success";
}