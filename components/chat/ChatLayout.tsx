"use client";

import { ReactNode } from "react";

interface ChatLayoutProps {
  header: ReactNode;
  children: ReactNode;
  input: ReactNode;
}

export function ChatLayout({ header, children, input }: ChatLayoutProps) {
  return (
    <div className="flex flex-col h-screen max-h-[100dvh] bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="shrink-0 sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
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
