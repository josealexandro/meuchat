"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FIRESTORE_COLLECTIONS } from "@/lib/constants";
import { useAuth } from "@/providers/AuthProvider";

/**
 * Debug panel to verify notification setup. Shows permission, token status, etc.
 */
export function NotificationStatus() {
  const { user } = useAuth();
  const [status, setStatus] = useState<{
    permission: string;
    hasToken: boolean;
    swRegistered: boolean;
  } | null>(null);

  useEffect(() => {
    if (!user || typeof window === "undefined") return;
    if (!("Notification" in window)) {
      setStatus({ permission: "unsupported", hasToken: false, swRegistered: false });
      return;
    }

    let cancelled = false;

    async function check() {
      const permission = Notification.permission;
      let hasToken = false;
      let swRegistered = false;

      try {
        const userSnap = await getDoc(doc(db, FIRESTORE_COLLECTIONS.USERS, user.uid));
        hasToken = !!userSnap.data()?.fcmToken;
      } catch {}

      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        swRegistered = regs.some((r) => r.active?.scriptURL.includes("firebase-messaging"));
      } catch {}

      if (!cancelled) {
        setStatus({ permission, hasToken, swRegistered });
      }
    }

    check();
    return () => { cancelled = true; };
  }, [user]);

  if (!user || !status) return null;

  return (
    <details className="mx-2 mb-2 p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
      <summary className="cursor-pointer text-white/70 hover:text-white">
        Status das notificações
      </summary>
      <div className="mt-2 space-y-1 text-white/80">
        <p>Permissão: <span className={status.permission === "granted" ? "text-green-400" : ""}>{status.permission}</span></p>
        <p>Token salvo: <span className={status.hasToken ? "text-green-400" : "text-amber-400"}>{status.hasToken ? "Sim" : "Não"}</span></p>
        <p>Service worker: <span className={status.swRegistered ? "text-green-400" : "text-amber-400"}>{status.swRegistered ? "OK" : "Não"}</span></p>
        {status.permission !== "granted" && (
          <p className="text-amber-400 mt-2">Clique em &quot;Ativar&quot; no banner para habilitar.</p>
        )}
        {status.permission === "granted" && !status.hasToken && (
          <p className="text-amber-400 mt-2">Permissão OK mas token não salvo. Abra o console (F12) e veja erros.</p>
        )}
      </div>
    </details>
  );
}
