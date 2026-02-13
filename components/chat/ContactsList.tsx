"use client";

import type { Chat } from "@/types/chat";
import type { AppUser } from "@/types/user";

interface ContactsListProps {
  chats: Chat[];
  users: AppUser[];
  currentUserId: string;
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onSelectContact: (otherUserId: string) => Promise<void>;
  loading?: boolean;
}

function getOtherParticipant(chat: Chat, currentUserId: string): string {
  return chat.participants.find((p) => p !== currentUserId) ?? "";
}

export function ContactsList({
  chats,
  users,
  currentUserId,
  selectedChatId,
  onSelectChat,
  onSelectContact,
  loading,
}: ContactsListProps) {
  const getUserName = (userId: string) => {
    const u = users.find((u) => u.id === userId);
    return u?.displayName || u?.email || "Contato";
  };

  const chatUserIds = new Set(
    chats.flatMap((c) => c.participants.filter((p) => p !== currentUserId))
  );
  const usersWithoutChat = users.filter((u) => !chatUserIds.has(u.id));

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {loading ? (
        <div className="p-4 text-center text-slate-500 text-sm">
          Carregando...
        </div>
      ) : (
        <>
          {chats.length > 0 && (
            <div className="p-2">
              <p className="px-3 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Conversas
              </p>
              {chats.map((chat) => {
                const otherUserId = getOtherParticipant(chat, currentUserId);
                const name = getUserName(otherUserId);
                return (
                  <button
                    key={chat.id}
                    onClick={() => onSelectChat(chat.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex flex-col ${
                      selectedChatId === chat.id
                        ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                        : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <span className="font-medium truncate">{name}</span>
                    {chat.lastMessage && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {chat.lastMessage}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {usersWithoutChat.length > 0 && (
            <div className="p-2 border-t border-slate-200 dark:border-slate-700">
              <p className="px-3 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Contatos
              </p>
              {usersWithoutChat.map((u) => (
                <button
                  key={u.id}
                  onClick={() => onSelectContact(u.id)}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
                >
                  <span className="font-medium truncate block">
                    {u.displayName || u.email || "Contato"}
                  </span>
                </button>
              ))}
            </div>
          )}

          {chats.length === 0 && usersWithoutChat.length === 0 && (
            <div className="p-4 text-center text-slate-500 text-sm">
              Nenhum contato ainda.
              <br />
              Peça para alguém da família entrar no app!
            </div>
          )}
        </>
      )}
    </div>
  );
}
