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
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center px-4">
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
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 ${
                  isOwnMessage
                    ? "bg-primary-500 text-white rounded-br-md"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-bl-md"
                }`}
              >
                {!isOwnMessage && (
                  <p className="text-xs font-medium text-primary-600 dark:text-primary-400 mb-0.5">
                    {message.displayName || message.userEmail}
                  </p>
                )}
                <p className="text-[15px] break-words whitespace-pre-wrap">
                  {message.text}
                </p>
                <p
                  className={`text-[10px] mt-0.5 ${
                    isOwnMessage ? "text-primary-100" : "text-slate-500 dark:text-slate-400"
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
