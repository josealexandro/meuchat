"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FIRESTORE_COLLECTIONS } from "@/lib/constants";
import type { Message } from "@/types/message";
import type { User } from "firebase/auth";

export function useMessages(user: User | null, chatId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !chatId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const messagesRef = collection(
      db,
      FIRESTORE_COLLECTIONS.CHATS,
      chatId,
      FIRESTORE_COLLECTIONS.MESSAGES
    );
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const pendingDelivery = snapshot.docs
          .filter((d) => {
            const data = d.data() as Partial<Message> & { userId?: string; deliveredAt?: unknown };
            return !!data.userId && data.userId !== user.uid && !data.deliveredAt;
          })
          .slice(0, 50);

        if (pendingDelivery.length > 0) {
          const batch = writeBatch(db);
          const deliveredAt = serverTimestamp();
          for (const d of pendingDelivery) {
            batch.update(d.ref, {
              deliveredAt,
              [`deliveredTo.${user.uid}`]: deliveredAt,
            });
          }
          batch.commit().catch(() => {});
        }

        const msgs: Message[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Message[];
        setMessages(msgs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, chatId]);

  const sendMessage = async (text: string) => {
    if (!user || !chatId) return;

    const messagesRef = collection(
      db,
      FIRESTORE_COLLECTIONS.CHATS,
      chatId,
      FIRESTORE_COLLECTIONS.MESSAGES
    );
    await addDoc(messagesRef, {
      text,
      userId: user.uid,
      userEmail: user.email ?? "",
      displayName: user.displayName ?? null,
      createdAt: serverTimestamp(),
    });
  };

  return { messages, loading, error, sendMessage };
}
