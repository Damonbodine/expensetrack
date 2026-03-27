// @ts-nocheck
"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, CheckCircle } from "lucide-react";

export function UserProfileForm() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const updateUser = useMutation(api.users.updateUser);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);

  if (currentUser && !initialized) {
    setName(currentUser.name);
    setPhone(currentUser.phone ?? "");
    setDepartment(currentUser.department ?? "");
    setInitialized(true);
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!name || name.length < 2) newErrors.name = "Name is required (min 2 characters)";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !currentUser) return;
    setIsSubmitting(true);
    try {
      let avatarUrl: string | undefined;
      if (avatarFile) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": avatarFile.type }, body: avatarFile });
        const { storageId } = await result.json();
        avatarUrl = storageId;
      }
      await updateUser({
        userId: currentUser._id,
        name,
        phone: phone || undefined,
        department: department || undefined,
        avatarUrl,
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!currentUser) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const initials = currentUser.name.split(" ").map((n) => n[0]).join("").toUpperCase();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>Update your personal information</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <Label htmlFor="avatar">Profile Photo</Label>
              <Input id="avatar" type="file" accept=".jpg,.jpeg,.png" onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} className="max-w-xs" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={currentUser.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed here</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Your department" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            {showSuccess && (
              <div className="flex items-center text-sm text-green-600">
                <CheckCircle className="mr-1 h-4 w-4" /> Profile updated successfully
              </div>
            )}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}