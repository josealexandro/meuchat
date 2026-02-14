"use client";

import { useState, useEffect } from "react";
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FIRESTORE_COLLECTIONS } from "@/lib/constants";

export function useContacts(ownerId: string | null) {
  const [contactIds, setContactIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ownerId) {
      setContactIds(new Set());
      setLoading(false);
      return;
    }

    const contactsRef = collection(
      db,
      FIRESTORE_COLLECTIONS.USERS,
      ownerId,
      FIRESTORE_COLLECTIONS.CONTACTS
    );

    const unsubscribe = onSnapshot(contactsRef, (snapshot) => {
      const ids = new Set(snapshot.docs.map((d) => d.id));
      setContactIds(ids);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [ownerId]);

  const addContact = async (email: string): Promise<{ ok: boolean; error?: string }> => {
    if (!ownerId) return { ok: false, error: "Não autenticado" };

    const emailClean = email.trim().toLowerCase();
    if (!emailClean) return { ok: false, error: "Digite um e-mail" };

    try {
      const usersRef = collection(db, FIRESTORE_COLLECTIONS.USERS);
      let snapshot = await getDocs(query(usersRef, where("emailLower", "==", emailClean)));
      if (snapshot.empty) {
        snapshot = await getDocs(query(usersRef, where("email", "==", email.trim())));
      }
      if (snapshot.empty) {
        return { ok: false, error: "Nenhum usuário encontrado com este e-mail" };
      }

      const contactUser = snapshot.docs[0];
      const contactId = contactUser.id;

      if (contactId === ownerId) {
        return { ok: false, error: "Você não pode adicionar a si mesmo" };
      }

      const contactRef = doc(
        db,
        FIRESTORE_COLLECTIONS.USERS,
        ownerId,
        FIRESTORE_COLLECTIONS.CONTACTS,
        contactId
      );

      await setDoc(contactRef, {
        addedAt: serverTimestamp(),
        email: contactUser.data().email ?? emailClean,
      });

      return { ok: true };
    } catch (err) {
      console.error("addContact error:", err);
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Erro ao adicionar contato",
      };
    }
  };

  return { contactIds, loading, addContact };
}
