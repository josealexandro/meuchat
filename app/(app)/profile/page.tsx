"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/providers/AuthProvider";

function ProfilePageContent() {
  const { user, updateDisplayName } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
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

  if (!user) return null;

  return (
    <div className="min-h-[100dvh] p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="max-w-md mx-auto">
        <Link href="/chat" className="inline-flex items-center gap-1 text-white/80 hover:text-white mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
          Voltar
        </Link>
        <h1 className="text-xl font-bold text-white mb-2">Meu perfil</h1>
        <p className="text-white/80 text-sm mb-6">Este nome aparece para os outros no chat.</p>
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
