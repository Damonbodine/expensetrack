"use client";

import { UserProfileForm } from "@/components/forms/user-profile-form";

export default function ProfileSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Profile Settings</h1>
      <UserProfileForm />
    </div>
  );
}
