"use client";

import { ReactNode } from "react";

interface ChatLayoutProps {
  header: ReactNode;
  children: ReactNode;
  input: ReactNode;
}

export function ChatLayout({ header, children, input }: ChatLayoutProps) {
  return (
    <div className="flex flex-col h-screen max-h-[100dvh]">
      {/* Header */}
      <header className="shrink-0 sticky top-0 z-10 border-b border-white/20 shadow-sm">
        {header}
      </header>

      {/* Messages area */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {children}
      </main>

      {/* Input area */}
      <footer className="shrink-0">{input}</footer>
    </div>
  );
}
