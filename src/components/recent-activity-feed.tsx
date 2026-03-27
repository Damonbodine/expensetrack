"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";
import { Activity, FileText, CheckSquare, DollarSign } from "lucide-react";

const actionIcons: Record<string, React.ElementType> = {
  Create: FileText,
  StatusChange: Activity,
  Approve: CheckSquare,
  Reject: CheckSquare,
  Reimburse: DollarSign,
  Update: FileText,
  Delete: FileText,
  Login: Activity,
};

export function RecentActivityFeed() {
  const auditLogs = useQuery(api.auditLogs.listRecent, { limit: 15 });

  if (!auditLogs) {
    return (
      <Card className="border border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {auditLogs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No recent activity.</div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="divide-y divide-border">
              {auditLogs.map((log: any) => {
                const Icon = actionIcons[log.action] ?? Activity;
                return (
                  <div key={log._id} className="flex items-start gap-3 px-4 py-3">
                    <div className="mt-0.5 text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{log.userName ?? "System"}</span>
                        {" "}
                        <span className="text-muted-foreground">
                          {log.action.toLowerCase()}d
                        </span>
                        {" "}
                        <span className="font-medium">{log.entityType}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(log.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}