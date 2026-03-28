"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, Copy, Check } from "lucide-react";

interface BudgetVarianceExplainerProps {
  budgetLineName: string;
  categoryName: string;
  department: string;
  fiscalYear: string;
  budgetedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  expenses: Array<{
    title: string;
    amount: number;
    merchant: string;
    date: number;
    status: string;
  }>;
}

export function BudgetVarianceExplainer({
  budgetLineName,
  categoryName,
  department,
  fiscalYear,
  budgetedAmount,
  spentAmount,
  remainingAmount,
  expenses,
}: BudgetVarianceExplainerProps) {
  const explainVariance = useAction(api.ai.explainBudgetVariance);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const variance = budgetedAmount > 0
    ? Math.abs(((spentAmount - budgetedAmount) / budgetedAmount) * 100).toFixed(1)
    : "0";
  const isOverBudget = spentAmount > budgetedAmount;

  async function handleExplain() {
    setIsExplaining(true);
    setError(null);
    try {
      const result = await explainVariance({
        budgetLineName,
        categoryName,
        department,
        fiscalYear,
        budgetedAmount,
        spentAmount,
        remainingAmount,
        expenses,
      });
      setExplanation(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate explanation.");
    } finally {
      setIsExplaining(false);
    }
  }

  async function handleCopy() {
    if (!explanation) return;
    await navigator.clipboard.writeText(explanation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            AI Budget Variance Analysis
            {(isOverBudget || parseFloat(variance) > 20) && (
              <span className={`text-xs ${isOverBudget ? "text-destructive" : "text-muted-foreground"}`}>
                ({isOverBudget ? "+" : ""}{variance}% variance)
              </span>
            )}
          </CardTitle>
          {explanation && (
            <Button type="button" variant="ghost" size="sm" onClick={handleCopy}>
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!explanation ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExplain}
            disabled={isExplaining}
          >
            {isExplaining ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <TrendingUp className="mr-2 h-3 w-3" />
                Explain Budget Variance
              </>
            )}
          </Button>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {explanation.split("\n\n").map((paragraph, i) => (
              <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {explanation && (
          <Button type="button" variant="ghost" size="sm" onClick={handleExplain} disabled={isExplaining}>
            {isExplaining ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
            Regenerate
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
