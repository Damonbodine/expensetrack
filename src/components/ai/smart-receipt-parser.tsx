"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, AlertTriangle } from "lucide-react";

interface ParsedReceipt {
  amount: number | null;
  vendor: string | null;
  date: string | null;
  category: string | null;
  purpose: string | null;
  receiptNeeded: boolean;
}

interface SmartReceiptParserProps {
  onParsed: (data: ParsedReceipt) => void;
}

export function SmartReceiptParser({ onParsed }: SmartReceiptParserProps) {
  const parseReceipt = useAction(api.ai.parseReceipt);
  const [description, setDescription] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ParsedReceipt | null>(null);

  async function handleParse() {
    if (!description.trim()) return;
    setIsParsing(true);
    setError(null);
    try {
      const result = await parseReceipt({ description: description.trim() });
      setLastResult(result);
      onParsed(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse receipt.");
    } finally {
      setIsParsing(false);
    }
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Receipt Parser
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder="Describe your expense... e.g. 'Lunch meeting with client at Olive Garden on March 15, spent $47.50 for team of 3'"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="text-sm"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleParse}
          disabled={isParsing || !description.trim()}
        >
          {isParsing ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              Parsing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-3 w-3" />
              Auto-fill from Description
            </>
          )}
        </Button>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {lastResult?.receiptNeeded && (
          <div className="flex items-center gap-2 text-sm text-warning">
            <AlertTriangle className="h-3 w-3" />
            Receipt recommended for this expense
          </div>
        )}
      </CardContent>
    </Card>
  );
}
