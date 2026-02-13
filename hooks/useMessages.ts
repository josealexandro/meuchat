"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
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
