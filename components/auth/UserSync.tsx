"use client";

import { useEffect } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FIRESTORE_COLLECTIONS } from "@/lib/constants";
import { useAuth } from "@/providers/AuthProvider";

/**
 * Syncs the current user to the users collection on login.
 * This ensures all app users appear in the contacts list.
 */
export function UserSync() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, user.uid);
    setDoc(
      userRef,
      {
        email: user.email ?? "",
        emailLower: (user.email ?? "").toLowerCase(),
        displayName: user.displayName ?? null,
        photoURL: user.photoURL ?? null,
        updatedAt: new Date(),
      },
      { merge: true }
    );
  }, [user]);

  return null;
}
