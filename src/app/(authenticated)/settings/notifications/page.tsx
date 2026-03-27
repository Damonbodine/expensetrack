"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const NOTIFICATION_PREFS = [
  { key: "reportSubmitted", label: "Report Submitted", description: "When a new report is submitted for approval" },
  { key: "reportApproved", label: "Report Approved", description: "When your report is approved" },
  { key: "reportRejected", label: "Report Rejected", description: "When your report is rejected or returned" },
  { key: "expenseReimbursed", label: "Expense Reimbursed", description: "When your expense is reimbursed" },
  { key: "budgetWarning", label: "Budget Warning", description: "When a budget line exceeds 80% utilization" },
  { key: "budgetExceeded", label: "Budget Exceeded", description: "When a budget line is exceeded" },
];

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NOTIFICATION_PREFS.map((p) => [p.key, true]))
  );

  const toggle = (key: string) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Notification Settings</h1>
      <Card className="border border-border max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Email Notifications</CardTitle>
          <CardDescription>Choose which notifications you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {NOTIFICATION_PREFS.map((pref) => (
            <div key={pref.key} className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label htmlFor={pref.key} className="text-sm font-medium">{pref.label}</Label>
                <p className="text-xs text-muted-foreground">{pref.description}</p>
              </div>
              <Switch
                id={pref.key}
                checked={prefs[pref.key]}
                onCheckedChange={() => toggle(pref.key)}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
