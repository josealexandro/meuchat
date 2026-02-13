"use client";

import { AuthProvider } from "@/providers/AuthProvider";
import { UserSync } from "@/components/auth/UserSync";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <UserSync />
      {children}
    </AuthProvider>
  );
}
