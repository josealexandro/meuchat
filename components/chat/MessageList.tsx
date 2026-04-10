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
          const createdAtDate = message.createdAt?.toDate?.() ?? null;
          const deliveredAtDate = message.deliveredAt?.toDate?.() ?? null;
          const status: "pending" | "sent" | "delivered" = !createdAtDate
            ? "pending"
            : deliveredAtDate
              ? "delivered"
              : "sent";

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
                <div
                  className={`flex items-center gap-1 mt-0.5 text-[10px] ${
                    isOwnMessage ? "text-white/80 justify-end" : "text-white/70 justify-start"
                  }`}
                >
                  <span>
                    {createdAtDate
                      ? createdAtDate.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </span>
                  {isOwnMessage && (
                    <span className="inline-flex items-center">
                      {status === "pending" ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 6v6l4 2" />
                        </svg>
                      ) : status === "sent" ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M18 6 7 17l-5-5" />
                          <path d="m22 10-7.5 7.5L13 16" />
                        </svg>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
      <div ref={bottomRef} />
    </div>
  );
}
