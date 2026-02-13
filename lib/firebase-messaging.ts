import app from "@/lib/firebase";

const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export async function getFCMToken(): Promise<string | null> {
  if (typeof window === "undefined" || !vapidKey) return null;
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return null;

  try {
    const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });
    const { getMessaging, getToken } = await import("firebase/messaging");
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: reg });
    return token;
  } catch (err) {
    console.warn("[meuchat] getFCMToken failed:", err);
    return null;
  }
}