import app from "@/lib/firebase";

const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export type FCMTokenResult = { ok: true; token: string } | { ok: false; error: string };

export async function getFCMToken(): Promise<FCMTokenResult> {
  if (typeof window === "undefined") return { ok: false, error: "Ambiente não suportado" };
  if (!vapidKey) return { ok: false, error: "VAPID key não configurada" };
  if (!("Notification" in window)) return { ok: false, error: "Notificações não suportadas" };
  if (!("serviceWorker" in navigator)) return { ok: false, error: "Service Worker não suportado" };

  try {
    const { getMessaging, getToken } = await import("firebase/messaging");
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey });
    return token ? { ok: true, token } : { ok: false, error: "Token não retornado" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("404") || msg.includes("failed-service-worker-registration")) {
      return { ok: false, error: "Arquivo firebase-messaging-sw.js não encontrado (404). Verifique o deploy." };
    }
    if (msg.includes("applicationServerKey") || msg.includes("not valid")) {
      return { ok: false, error: "Chave VAPID inválida. Firebase Console → Configurações → Cloud Messaging → Web Push → gere novamente e atualize na Vercel." };
    }
    return { ok: false, error: msg };
  }
}