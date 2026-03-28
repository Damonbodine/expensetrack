"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useClerk } from "@clerk/nextjs";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Receipt,
  FileText,
  CheckSquare,
  FolderOpen,
  DollarSign,
  Bell,
  Settings,
  Users,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { withPreservedDemoQuery } from "@/lib/demo";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
  badge?: number;
};

export function AppSidebar() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const unreadCount = useQuery(api.notifications.getUnreadCount);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { signOut } = useClerk();

  const role = currentUser?.role ?? "Submitter";

  const navItems: NavItem[] = [
    ...(role === "Admin"
      ? [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["Admin"] }]
      : []),
    ...(role === "Approver"
      ? [{ label: "Dashboard", href: "/approver-dashboard", icon: LayoutDashboard, roles: ["Approver"] }]
      : []),
    ...(role === "Submitter"
      ? [{ label: "My Dashboard", href: "/my-dashboard", icon: LayoutDashboard, roles: ["Submitter"] }]
      : []),
    { label: "Expenses", href: "/expenses", icon: Receipt, roles: ["Admin", "Approver", "Submitter"] },
    { label: "Reports", href: "/reports", icon: FileText, roles: ["Admin", "Approver", "Submitter"] },
    ...(role === "Admin" || role === "Approver"
      ? [{ label: "Approvals", href: "/approvals", icon: CheckSquare, roles: ["Admin", "Approver"] }]
      : []),
    ...(role === "Admin"
      ? [
          { label: "Categories", href: "/categories", icon: FolderOpen, roles: ["Admin"] },
          { label: "Budgets", href: "/budgets", icon: DollarSign, roles: ["Admin"] },
          { label: "Users", href: "/users", icon: Users, roles: ["Admin"] },
        ]
      : []),
    { label: "Notifications", href: "/notifications", icon: Bell, roles: ["Admin", "Approver", "Submitter"] },
    { label: "Settings", href: "/settings/profile", icon: Settings, roles: ["Admin", "Approver", "Submitter"] },
  ];

  const filteredItems = navItems.filter((item) => item.roles.includes(role));

  const initials = currentUser?.name
    ? currentUser.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="px-4 py-4 border-b border-sidebar-border">
        <Link href={withPreservedDemoQuery("/", searchParams)} className="flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-sidebar-primary" />
          <span className="text-lg font-bold tracking-tight text-sidebar-foreground">
            ExpenseTrack
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-2 py-2">
        <SidebarMenu>
          {filteredItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  render={<Link href={withPreservedDemoQuery(item.href, searchParams)} />}
                  isActive={isActive}
                  className={cn(
                    "gap-3 px-3 py-2 text-sm font-medium",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
                {item.label === "Notifications" && unreadCount && unreadCount > 0 ? (
                  <SidebarMenuBadge className="bg-destructive text-destructive-foreground text-xs">
                    {unreadCount}
                  </SidebarMenuBadge>
                ) : null}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={currentUser?.avatarUrl} />
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {currentUser?.name ?? "Loading..."}
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              {currentUser?.role}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
