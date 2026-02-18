import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "meuchat",
  description: "Chat privado para a família",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "meuchat",
  },
  // Ícone na tela inicial do iPhone (Add to Home Screen)
  icons: {
    apple: "/icons/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
