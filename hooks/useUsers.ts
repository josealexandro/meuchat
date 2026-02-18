"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FIRESTORE_COLLECTIONS } from "@/lib/constants";
import type { AppUser } from "@/types/user";

export function useUsers(currentUserId: string | null) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUserId) {
      setUsers([]);
      setLoading(false);
      return;
    }

    const usersRef = collection(db, FIRESTORE_COLLECTIONS.USERS);
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const list: AppUser[] = snapshot.docs
        .filter((doc) => doc.id !== currentUserId)
        .map((doc) => ({
          id: doc.id,
          email: doc.data().email ?? "",
          displayName: doc.data().displayName ?? null,
          photoURL: doc.data().photoURL ?? null,
        }));
      setUsers(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  return { users, loading };
}
