"use client";

import { useEffect } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FIRESTORE_COLLECTIONS } from "@/lib/constants";
import { getFCMToken } from "@/lib/firebase-messaging";
import { useAuth } from "@/providers/AuthProvider";

/**
 * Syncs FCM token to Firestore when user is logged in and permission is granted.
 * Handles token refresh (e.g. after reinstall). Permission is requested via NotificationPrompt.
 */
export function NotificationSetup() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    let cancelled = false;
    getFCMToken().then(async (token) => {
      if (cancelled || !token) return;
      try {
        const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, user.uid);
        await setDoc(userRef, { fcmToken: token, fcmTokenUpdatedAt: new Date() }, { merge: true });
      } catch {
        // Silent
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return null;
}