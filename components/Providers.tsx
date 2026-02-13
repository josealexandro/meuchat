"use client";

import { AuthProvider } from "@/providers/AuthProvider";
import { UserSync } from "@/components/auth/UserSync";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <UserSync />
      {children}
      <InstallPrompt />
    </AuthProvider>
  );
}
