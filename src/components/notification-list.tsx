// @ts-nocheck
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Bell,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  FileText,
  Info,
  CheckCheck,
} from "lucide-react";

const typeIcons: Record<string, React.ElementType> = {
  ReportSubmitted: FileText,
  ReportApproved: CheckCircle,
  ReportRejected: XCircle,
  ExpenseReimbursed: DollarSign,
  BudgetWarning: AlertTriangle,
  BudgetExceeded: AlertTriangle,
  SystemAlert: Info,
};

const typeColors: Record<string, string> = {
  ReportSubmitted: "text-info",
  ReportApproved: "text-success",
  ReportRejected: "text-destructive",
  ExpenseReimbursed: "text-success",
  BudgetWarning: "text-warning",
  BudgetExceeded: "text-destructive",
  SystemAlert: "text-muted-foreground",
};

export function NotificationList() {
  const router = useRouter();
  const notifications = useQuery(api.notifications.listMyNotifications, { limit: 50 });
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  if (!notifications) {
    return <div className="p-8 text-center text-muted-foreground">Loading notifications...</div>;
  }

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const handleClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead({ notificationId: notification._id });
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllAsRead()}>
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark All Read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground border border-border">
          <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No notifications yet.</p>
        </div>
      ) : (
        <ScrollArea className="max-h-[600px]">
          <div className="space-y-1">
            {notifications.map((notification: any) => {
              const Icon = typeIcons[notification.type] ?? Bell;
              const iconColor = typeColors[notification.type] ?? "text-muted-foreground";

              return (
                <Card
                  key={notification._id}
                  className={cn(
                    "border border-border cursor-pointer transition-colors hover:bg-accent/50",
                    !notification.isRead && "bg-info/5 border-info/20"
                  )}
                  onClick={() => handleClick(notification)}
                >
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start gap-3">
                      <div className={cn("mt-0.5", iconColor)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            "text-sm font-medium truncate",
                            !notification.isRead && "font-semibold"
                          )}>
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <div className="h-2 w-2 bg-info shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}