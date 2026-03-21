"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { FirebaseError } from "firebase/app";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, storage } from "@/lib/firebase";

function profilePhotoErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    if (err.code === "storage/unauthorized" || err.code === "storage/permission-denied") {
      return "Sem permissão para enviar a foto. Publique as regras do Storage (firebase deploy --only storage).";
    }
    if (err.code === "storage/canceled") {
      return "Envio cancelado.";
    }
    if (err.code === "storage/unknown") {
      return (
        "Não foi possível usar o armazenamento. No Firebase Console, ative Storage (Build → Storage), " +
        "confira se NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET no .env.local coincide com o bucket do projeto " +
        "(Configurações do projeto → Geral) e rode: firebase deploy --only storage"
      );
    }
    return err.message;
  }
  return err instanceof Error ? err.message : "Erro ao enviar a foto.";
}

function imageExtension(file: File): string {
  const fromName = file.name?.includes(".")
    ? file.name.split(".").pop()!.toLowerCase()
    : "";
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<void>;
  updatePhotoURL: (file: File) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName?.trim()) {
      await updateProfile(newUser, { displayName: displayName.trim() });
    }
  };

  const updateDisplayName = async (displayName: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Não autenticado");
    await updateProfile(currentUser, { displayName: displayName.trim() });
    setUser(auth.currentUser);
  };

  const updatePhotoURL = async (file: File) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Não autenticado");
    const ext = imageExtension(file);
    const contentType = file.type || (ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg");
    const storageRef = ref(storage, `profile/${currentUser.uid}/avatar.${ext}`);
    try {
      await uploadBytes(storageRef, file, { contentType });
      const photoURL = await getDownloadURL(storageRef);
      await updateProfile(currentUser, { photoURL });
      setUser(auth.currentUser);
    } catch (err) {
      throw new Error(profilePhotoErrorMessage(err));
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    updateDisplayName,
    updatePhotoURL,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
