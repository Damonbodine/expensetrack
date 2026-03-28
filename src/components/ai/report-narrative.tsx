"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText, Copy, Check } from "lucide-react";

interface ReportNarrativeProps {
  reportTitle: string;
  reportPeriod?: string;
  totalAmount: number;
  expenses: Array<{
    title: string;
    amount: number;
    merchant: string;
    categoryName: string;
    date: number;
  }>;
}

export function ReportNarrative({ reportTitle, reportPeriod, totalAmount, expenses }: ReportNarrativeProps) {
  const generateNarrative = useAction(api.ai.generateReportNarrative);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateNarrative({
        reportTitle,
        reportPeriod,
        totalAmount,
        expenses,
      });
      setNarrative(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate narrative.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCopy() {
    if (!narrative) return;
    await navigator.clipboard.writeText(narrative);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            AI Narrative Summary
          </CardTitle>
          {narrative && (
            <Button type="button" variant="ghost" size="sm" onClick={handleCopy}>
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!narrative ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating || expenses.length === 0}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-3 w-3" />
                Generate Narrative for Finance Committee
              </>
            )}
          </Button>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {narrative.split("\n\n").map((paragraph, i) => (
              <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {narrative && (
          <Button type="button" variant="ghost" size="sm" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
            Regenerate
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
