"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "pwa-install-dismissed";
const DISMISSED_DAYS = 7;

function wasDismissedRecently(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (!raw) return false;
    const time = parseInt(raw, 10);
    const days = (Date.now() - time) / (1000 * 60 * 60 * 24);
    return days < DISMISSED_DAYS;
  } catch {
    return false;
  }
}

function setDismissed() {
  try {
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
  } catch {}
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone() || wasDismissedRecently()) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    if (isIOS() && !isStandalone()) {
      setIosHint(true);
      setVisible(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setVisible(false);
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    setDeferredPrompt(null);
    setDismissed();
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-slate-800 dark:bg-slate-900 border-t border-slate-700 shadow-lg">
      <div className="max-w-lg mx-auto flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
        <div className="flex-1 text-center sm:text-left">
          <p className="text-sm font-medium text-white">
            {iosHint ? "Adicione à tela inicial" : "Baixe o app"}
          </p>
          <p className="text-xs text-slate-300">
            {iosHint
              ? "Toque em Compartilhar e depois em Adicionar à Tela de Início"
              : "Adicione à tela inicial para usar como app"}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {!iosHint && (
            <button
              onClick={handleInstall}
              disabled={installing}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium text-sm disabled:opacity-70 touch-manipulation"
            >
              {installing ? "Instalando..." : "Instalar"}
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700 text-sm touch-manipulation"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}
