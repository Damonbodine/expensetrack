"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";

interface ComplianceCheck {
  policy: string;
  result: "pass" | "warning" | "fail";
  message: string;
}

interface ComplianceResult {
  status: "pass" | "warning" | "fail";
  checks: ComplianceCheck[];
  summary: string;
}

interface ComplianceCheckerProps {
  title: string;
  amount: number;
  categoryName: string;
  merchant: string;
  description?: string;
  hasReceipt: boolean;
}

export function ComplianceChecker({ title, amount, categoryName, merchant, description, hasReceipt }: ComplianceCheckerProps) {
  const checkCompliance = useAction(api.ai.checkPolicyCompliance);
  const [result, setResult] = useState<ComplianceResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheck() {
    setIsChecking(true);
    setError(null);
    try {
      const response = await checkCompliance({
        title,
        amount,
        categoryName,
        merchant,
        description,
        hasReceipt,
      });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check compliance.");
    } finally {
      setIsChecking(false);
    }
  }

  const statusIcon = {
    pass: <ShieldCheck className="h-4 w-4 text-green-500" />,
    warning: <ShieldAlert className="h-4 w-4 text-yellow-500" />,
    fail: <ShieldX className="h-4 w-4 text-destructive" />,
  };

  const statusVariant = {
    pass: "outline" as const,
    warning: "secondary" as const,
    fail: "destructive" as const,
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Policy Compliance Check
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!result ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCheck}
            disabled={isChecking || !title || amount <= 0}
          >
            {isChecking ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <ShieldCheck className="mr-2 h-3 w-3" />
                Check Policy Compliance
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {statusIcon[result.status]}
              <Badge variant={statusVariant[result.status]}>
                {result.status.toUpperCase()}
              </Badge>
              <span className="text-sm text-muted-foreground">{result.summary}</span>
            </div>
            <div className="space-y-2">
              {result.checks.map((check, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5">{statusIcon[check.result]}</span>
                  <div>
                    <span className="font-medium">{check.policy}:</span>{" "}
                    <span className="text-muted-foreground">{check.message}</span>
                  </div>
                </div>
              ))}
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={handleCheck} disabled={isChecking}>
              {isChecking ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
              Re-check
            </Button>
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
