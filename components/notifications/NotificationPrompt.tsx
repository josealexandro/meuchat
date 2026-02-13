"use client";

import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FIRESTORE_COLLECTIONS } from "@/lib/constants";
import { getFCMToken } from "@/lib/firebase-messaging";
import { useAuth } from "@/providers/AuthProvider";

const DISMISS_KEY = "notification-prompt-dismissed";

function wasDismissed(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(DISMISS_KEY) === "1";
}

function setDismissed() {
  try {
    localStorage.setItem(DISMISS_KEY, "1");
  } catch {}
}

export function NotificationPrompt() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user || typeof window === "undefined") return null;
  if (!("Notification" in window)) return null;
  if (Notification.permission === "denied") return null;
  if ((wasDismissed() || hidden) && !error) return null;

  const handleActivate = async () => {
    setLoading(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setHidden(true);
        return;
      }
      const result = await getFCMToken();
      if (result.ok) {
        const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, user.uid);
        await setDoc(userRef, { fcmToken: result.token, fcmTokenUpdatedAt: new Date() }, { merge: true });
        setHidden(true);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao ativar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-2 mb-2 p-3 rounded-xl bg-accent-500/20 border border-accent-500/40">
      <p className="text-xs text-white font-medium mb-2">Receba notificações de novas mensagens</p>
      {error && (
        <p className="text-xs text-amber-300 mb-2">{error}</p>
      )}
      <div className="flex gap-2">
        <button
          onClick={handleActivate}
          disabled={loading}
          className="flex-1 py-2 rounded-lg bg-accent-500 hover:bg-accent-600 text-white text-sm font-medium disabled:opacity-50 touch-manipulation"
        >
          {loading ? "Ativando..." : error ? "Tentar novamente" : "Ativar"}
        </button>
        <button
          onClick={() => {
            setDismissed();
            setHidden(true);
          }}
          className="px-3 py-2 rounded-lg text-white/70 hover:text-white text-sm touch-manipulation"
        >
          Agora não
        </button>
      </div>
    </div>
  );
}
