"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  updateDoc,
  getDocs,
  writeBatch,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FIRESTORE_COLLECTIONS } from "@/lib/constants";
import { getChatId } from "@/lib/chat-utils";
import type { Chat } from "@/types/chat";
import type { User } from "firebase/auth";

export function useChats(user: User | null) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setChats([]);
      setLoading(false);
      return;
    }

    const chatsRef = collection(db, FIRESTORE_COLLECTIONS.CHATS);
    const q = query(
      chatsRef,
      where("participants", "array-contains", user.uid),
      orderBy("lastMessageAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const chatList: Chat[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Chat[];
        setChats(chatList);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsubscribe();
  }, [user]);

  const getOrCreateChat = async (otherUserId: string): Promise<string> => {
    if (!user) throw new Error("Not authenticated");

    const chatId = getChatId(user.uid, otherUserId);
    const chatRef = doc(db, FIRESTORE_COLLECTIONS.CHATS, chatId);

    const existingSnap = await getDoc(chatRef);
    if (existingSnap.exists()) return chatId;

    const participants = [user.uid, otherUserId].sort();
    await setDoc(chatRef, {
      participants,
      createdAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
      unread: { [user.uid]: 0, [otherUserId]: 0 },
    });

    return chatId;
  };

  const updateChatLastMessage = async (
    chatId: string,
    lastMessage: string
  ) => {
    const chatRef = doc(db, FIRESTORE_COLLECTIONS.CHATS, chatId);
    await updateDoc(chatRef, {
      lastMessage,
      lastMessageAt: serverTimestamp(),
    });
  };

  /** Incrementa contador de não lidas para o outro participante (quem envia chama isso). */
  const incrementUnreadForParticipant = async (
    chatId: string,
    otherUserId: string
  ) => {
    if (!user) return;
    const chatRef = doc(db, FIRESTORE_COLLECTIONS.CHATS, chatId);
    await updateDoc(chatRef, {
      [`unread.${otherUserId}`]: increment(1),
    });
  };

  /** Marca a conversa como lida para o usuário atual (ao abrir o chat). */
  const markChatAsRead = async (chatId: string) => {
    if (!user) return;
    const chatRef = doc(db, FIRESTORE_COLLECTIONS.CHATS, chatId);
    await updateDoc(chatRef, {
      [`unread.${user.uid}`]: 0,
    });
  };

  /** Apaga a conversa e todas as mensagens. O contato continua na lista (não remove de contacts). */
  const deleteChat = async (chatId: string) => {
    if (!user) throw new Error("Not authenticated");
    const messagesRef = collection(
      db,
      FIRESTORE_COLLECTIONS.CHATS,
      chatId,
      FIRESTORE_COLLECTIONS.MESSAGES
    );
    const snapshot = await getDocs(messagesRef);
    const BATCH_SIZE = 500;
    for (let i = 0; i < snapshot.docs.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const chunk = snapshot.docs.slice(i, i + BATCH_SIZE);
      chunk.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    const chatRef = doc(db, FIRESTORE_COLLECTIONS.CHATS, chatId);
    const finalBatch = writeBatch(db);
    finalBatch.delete(chatRef);
    await finalBatch.commit();
  };

  return {
    chats,
    loading,
    getOrCreateChat,
    updateChatLastMessage,
    incrementUnreadForParticipant,
    markChatAsRead,
    deleteChat,
  };
}
