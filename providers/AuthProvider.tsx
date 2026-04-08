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
import { deleteObject, getDownloadURL, ref, uploadBytes, type FirebaseStorage } from "firebase/storage";
import { auth, storage } from "@/lib/firebase";

function storageServerDetail(err: FirebaseError): string | null {
  const raw = (err as FirebaseError & { customData?: { serverResponse?: string } }).customData
    ?.serverResponse;
  if (!raw) return null;
  try {
    const j = JSON.parse(raw) as { error?: { message?: string } };
    return j.error?.message?.trim() || null;
  } catch {
    return raw.length > 400 ? `${raw.slice(0, 400)}…` : raw;
  }
}

function profilePhotoErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    if (err.code === "storage/unauthorized" || err.code === "storage/permission-denied") {
      return "Sem permissão para enviar a foto. Publique as regras do Storage (firebase deploy --only storage).";
    }
    if (err.code === "storage/canceled") {
      return "Envio cancelado.";
    }
    const detail = storageServerDetail(err);
    const mentions412 =
      /412|precondition failed|service account|gcp-sa-firebasestorage/i.test(
        `${err.message} ${detail ?? ""}`
      );
    if (err.code === "storage/unknown" || mentions412) {
      const checklist =
        "No Firebase: Storage ativado, bucket certo nas variáveis de ambiente e regras publicadas (firebase deploy --only storage). " +
        "Se na rede aparece HTTP 412: no Google Cloud Console → IAM, confira a conta " +
        "service-NÚMERO_DO_PROJETO@gcp-sa-firebasestorage.iam.gserviceaccount.com " +
        "com permissões de Storage/Firebase; confirme também faturação ativa no projeto.";
      const suffix = detail ? ` Servidor: ${detail}` : "";
      return `Não foi possível enviar a foto. ${checklist}${suffix}`;
    }
    return detail ? `${err.message} (${detail})` : err.message;
  }
  return err instanceof Error ? err.message : "Erro ao enviar a foto.";
}

/** Extrai o path do objeto a partir da URL pública do Firebase Storage (SDK antigo não tem refFromURL estável). */
function refFromDownloadURL(storage: FirebaseStorage, downloadUrl: string) {
  const u = new URL(downloadUrl);
  if (!u.hostname.includes("firebasestorage.googleapis.com")) return null;
  const afterO = u.pathname.match(/\/o\/(.+)/)?.[1];
  if (!afterO) return null;
  const path = decodeURIComponent(afterO);
  return ref(storage, path);
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
    // Nome único a cada envio evita HTTP 412 (sobrescrita / geração no GCS com upload resumável).
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const storageRef = ref(storage, `profile/${currentUser.uid}/avatar_${unique}.${ext}`);
    const previousPhotoURL = currentUser.photoURL;
    try {
      await uploadBytes(storageRef, file, { contentType });
      const photoURL = await getDownloadURL(storageRef);
      await updateProfile(currentUser, { photoURL });
      setUser(auth.currentUser);
      if (previousPhotoURL?.includes("firebasestorage.googleapis.com")) {
        const oldRef = refFromDownloadURL(storage, previousPhotoURL);
        if (oldRef) {
          try {
            await deleteObject(oldRef);
          } catch {
            /* já apagada ou inacessível */
          }
        }
      }
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
