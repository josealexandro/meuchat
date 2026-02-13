import { app } from "@/lib/firebase";

const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export async function getFCMToken(): Promise<string | null> {
  if (typeof window === "undefined" || !vapidKey) return null;
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return null;

  try {
    const { getMessaging, getToken } = await import("firebase/messaging");
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey });
    return token;
  } catch {
    return null;
  }
}