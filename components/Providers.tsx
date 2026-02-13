"use client";

import { AuthProvider } from "@/providers/AuthProvider";
import { UserSync } from "@/components/auth/UserSync";
import { NotificationSetup } from "@/components/notifications/NotificationSetup";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

// NotificationSetup syncs token when permission already granted

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <UserSync />
      <NotificationSetup />
      {children}
      <InstallPrompt />
    </AuthProvider>
  );
}
