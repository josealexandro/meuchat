"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@/types/message";

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 overscroll-contain">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-white/70 text-center px-4">
          <p className="text-lg">Nenhuma mensagem ainda</p>
          <p className="text-sm mt-1">Seja o primeiro a enviar uma mensagem!</p>
        </div>
      ) : (
        messages.map((message) => {
          const isOwnMessage = message.userId === currentUserId;
          return (
            <div
              key={message.id}
              className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[75%] rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 ${
                  isOwnMessage
                    ? "bg-accent-500 text-white rounded-br-md"
                    : "bg-primary-700/80 text-white rounded-bl-md"
                }`}
              >
                {!isOwnMessage && (
                  <p className="text-xs font-medium text-accent-400 mb-0.5">
                    {message.displayName || message.userEmail}
                  </p>
                )}
                <p className="text-[15px] break-words whitespace-pre-wrap leading-snug">
                  {message.text}
                </p>
                <p
                  className={`text-[10px] mt-0.5 ${
                    isOwnMessage ? "text-white/80" : "text-white/70"
                  }`}
                >
                  {message.createdAt?.toDate?.()
                    ? message.createdAt.toDate().toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </p>
              </div>
            </div>
          );
        })
      )}
      <div ref={bottomRef} />
    </div>
  );
}
