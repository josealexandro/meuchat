"use client";

import { useState, useCallback, FormEvent, KeyboardEvent } from "react";

interface MessageInputProps {
  onSend: (text: string) => Promise<void>;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const trimmed = text.trim();
      if (!trimmed || isSending || disabled) return;

      setIsSending(true);
      try {
        await onSend(trimmed);
        setText("");
      } finally {
        setIsSending(false);
      }
    },
    [text, isSending, disabled, onSend]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 sm:p-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-white/20 bg-primary-900/80 backdrop-blur"
    >
      <div className="flex gap-2 items-end">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem..."
          rows={1}
          maxLength={2000}
          disabled={disabled}
          className="flex-1 resize-none rounded-xl border border-white/30 bg-primary-900/50 px-3 py-2.5 sm:px-4 sm:py-3 text-base sm:text-[15px] text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent disabled:opacity-50 min-h-[44px] max-h-32 touch-manipulation"
        />
        <button
          type="submit"
          disabled={disabled || !text.trim() || isSending}
          className="shrink-0 h-[44px] min-w-[44px] px-4 rounded-xl bg-accent-500 hover:bg-accent-600 active:bg-accent-600 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-primary-900 touch-manipulation"
        >
          Enviar
        </button>
      </div>
    </form>
  );
}
