import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/providers/AuthProvider";
import { UserSync } from "@/components/auth/UserSync";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chat da Família",
  description: "Chat privado para a família",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FamChat",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={inter.className}>
        <AuthProvider>
          <UserSync />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
