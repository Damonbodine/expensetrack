"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Role = "Admin" | "Approver" | "Submitter";

interface RoleGuardProps {
  allowedRoles: Role[];
  children: ReactNode;
  fallbackMessage?: string;
}

export function RoleGuard({ allowedRoles, children, fallbackMessage }: RoleGuardProps) {
  const currentUser = useQuery(api.users.getCurrentUser);
  const router = useRouter();

  if (currentUser === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (currentUser === null || !allowedRoles.includes(currentUser.role as Role)) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <ShieldAlert className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              {fallbackMessage || `This page requires one of the following roles: ${allowedRoles.join(", ")}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}