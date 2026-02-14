"use client";

import type { Chat } from "@/types/chat";
import type { AppUser } from "@/types/user";

interface ContactsListProps {
  chats: Chat[];
  users: AppUser[];
  contactIds: Set<string>;
  currentUserId: string;
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onSelectContact: (otherUserId: string) => Promise<void>;
  onOpenAddContact: () => void;
  loading?: boolean;
}

function getOtherParticipant(chat: Chat, currentUserId: string): string {
  return chat.participants.find((p) => p !== currentUserId) ?? "";
}

export function ContactsList({
  chats,
  users,
  contactIds,
  currentUserId,
  selectedChatId,
  onSelectChat,
  onSelectContact,
  onOpenAddContact,
  loading,
}: ContactsListProps) {
  const getUserName = (userId: string) => {
    const u = users.find((u) => u.id === userId);
    return u?.displayName || u?.email || "Contato";
  };

  const chatUserIds = new Set(
    chats.flatMap((c) => c.participants.filter((p) => p !== currentUserId))
  );
  const usersWithoutChat = users.filter(
    (u) => contactIds.has(u.id) && !chatUserIds.has(u.id)
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {loading ? (
        <div className="p-4 text-center text-white/70 text-sm">
          Carregando...
        </div>
      ) : (
        <>
          {chats.length > 0 && (
            <div className="p-2">
              <p className="px-3 py-1 text-xs font-medium text-white/60 uppercase tracking-wider">
                Conversas
              </p>
              {chats.map((chat) => {
                const otherUserId = getOtherParticipant(chat, currentUserId);
                const name = getUserName(otherUserId);
                return (
                  <button
                    key={chat.id}
                    onClick={() => onSelectChat(chat.id)}
                    className={`w-full text-left px-3 py-3 sm:py-2.5 rounded-lg text-sm transition-colors flex flex-col touch-manipulation ${
                      selectedChatId === chat.id
                        ? "bg-accent-500/30 text-white"
                        : "hover:bg-white/10 active:bg-white/15 text-white"
                    }`}
                  >
                    <span className="font-medium truncate">{name}</span>
                    {chat.lastMessage && (
                      <span className="text-xs text-white/70 truncate mt-0.5">
                        {chat.lastMessage}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div className="p-2 border-t border-white/20">
            <div className="flex items-center justify-between px-3 py-1">
              <p className="text-xs font-medium text-white/60 uppercase tracking-wider">
                Contatos
              </p>
              <button
                onClick={onOpenAddContact}
                className="text-xs font-medium text-accent-400 hover:text-accent-300 touch-manipulation"
              >
                + Adicionar
              </button>
            </div>
            {usersWithoutChat.length > 0 ? (
              usersWithoutChat.map((u) => (
                <button
                  key={u.id}
                  onClick={() => onSelectContact(u.id)}
                  className="w-full text-left px-3 py-3 sm:py-2.5 rounded-lg text-sm transition-colors hover:bg-white/10 active:bg-white/15 text-white touch-manipulation"
                >
                  <span className="font-medium truncate block">
                    {u.displayName || u.email || "Contato"}
                  </span>
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-xs text-white/50">
                Adicione pelo e-mail para conversar.
              </p>
            )}
          </div>

          {chats.length === 0 && contactIds.size === 0 && (
            <div className="p-4 text-center text-white/70 text-sm">
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
