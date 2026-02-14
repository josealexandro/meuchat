"use client";

import { useState } from "react";

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (email: string) => Promise<{ ok: boolean; error?: string }>;
}

export function AddContactModal({
  isOpen,
  onClose,
  onAdd,
}: AddContactModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await onAdd(email);
      if (result.ok) {
        setEmail("");
        onClose();
      } else {
        setError(result.error ?? "Erro ao adicionar");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-contact-title"
    >
      <div
        className="w-full max-w-sm rounded-xl bg-primary-900 border border-white/20 p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="add-contact-title" className="text-lg font-semibold text-white mb-3">
          Adicionar contato
        </h2>
        <p className="text-sm text-white/70 mb-4">
          Digite o e-mail do familiar que já usa o meuchat.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemplo.com"
            className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-accent-500"
            autoFocus
            disabled={loading}
            autoComplete="email"
          />
          {error && (
            <p className="text-sm text-amber-400 mb-3">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="flex-1 py-2.5 rounded-lg bg-accent-500 hover:bg-accent-600 text-white text-sm font-medium disabled:opacity-50 touch-manipulation"
            >
              {loading ? "Adicionando..." : "Adicionar"}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 rounded-lg text-white/70 hover:text-white text-sm touch-manipulation"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
