"use client";

import { useState, useEffect, FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/providers/AuthProvider";
import { Avatar } from "@/components/ui/Avatar";

const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp";

function ProfilePageContent() {
  const { user, updateDisplayName, updatePhotoURL } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    setName(user.displayName ?? "");
  }, [user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Digite seu nome.");
      return;
    }
    setError("");
    setLoading(true);
    setSuccess(false);
    try {
      await updateDisplayName(trimmed);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar nome.");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    e.target.value = "";
    setError("");
    setPhotoLoading(true);
    try {
      await updatePhotoURL(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar foto.");
    } finally {
      setPhotoLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-[100dvh] p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="max-w-md mx-auto">
        <Link href="/chat" className="inline-flex items-center gap-1 text-white/80 hover:text-white mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
          Voltar
        </Link>
        <h1 className="text-xl font-bold text-white mb-2">Meu perfil</h1>
        <p className="text-white/80 text-sm mb-6">Este nome e foto aparecem para os outros no chat.</p>

        {/* Foto de perfil - toque para alterar (estilo WhatsApp) */}
        <div className="flex flex-col items-center mb-8">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES}
            onChange={handlePhotoChange}
            className="hidden"
            aria-label="Alterar foto de perfil"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={photoLoading}
            className="relative rounded-full focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-[var(--bg-gradient-to)] touch-manipulation disabled:opacity-70"
          >
            <Avatar
              photoURL={user.photoURL ?? null}
              displayName={user.displayName ?? null}
              email={user.email ?? ""}
              size="xl"
            />
            {photoLoading && (
              <span className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center text-white text-sm">
                ...
              </span>
            )}
            <span className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-accent-500 flex items-center justify-center border-2 border-[var(--bg-gradient-to)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </span>
          </button>
          <span className="mt-2 text-sm text-white/70">Toque para alterar a foto</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-white mb-1">Seu nome</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className="w-full px-4 py-3 rounded-xl border border-white/30 bg-primary-900/50 text-white placeholder:text-white/50 text-base focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              placeholder="Como quer ser chamado(a)"
            />
          </div>
          <p className="text-xs text-white/70">E-mail da conta: {user.email}</p>
          {error && <div className="p-3 rounded-lg bg-red-500/20 text-red-100 text-sm">{error}</div>}
          {success && <div className="p-3 rounded-lg bg-green-500/20 text-green-100 text-sm">Nome atualizado!</div>}
          <button type="submit" disabled={loading} className="w-full py-3 px-4 rounded-xl bg-accent-500 hover:bg-accent-600 active:bg-accent-600 text-white font-medium disabled:opacity-50 touch-manipulation min-h-[48px]">
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}
