"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FIRESTORE_COLLECTIONS } from "@/lib/constants";
import type { AppUser } from "@/types/user";

export function useUsers(currentUserId: string | null) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUserId) {
      setUsers([]);
      setLoading(false);
      setError(null);
      return;
    }

    const usersRef = collection(db, FIRESTORE_COLLECTIONS.USERS);
    let cancelled = false;
    setLoading(true);
    setError(null);

    getDocs(usersRef)
      .then((snapshot) => {
        if (cancelled) return;
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
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setUsers([]);
        setLoading(false);
        const msg = err instanceof Error ? err.message : "Erro ao carregar usuários";
        setError(msg);
        console.error("[useUsers] getDocs failed:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  return { users, loading, error };
}
