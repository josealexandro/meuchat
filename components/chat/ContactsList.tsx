"use client";

import type { Chat } from "@/types/chat";
import type { AppUser } from "@/types/user";
import { Avatar } from "@/components/ui/Avatar";

interface ContactsListProps {
  chats: Chat[];
  users: AppUser[];
  contactIds: Set<string>;
  currentUserId: string;
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onSelectContact: (otherUserId: string) => Promise<void>;
  onOpenAddContact: () => void;
  onOpenNewConversation: () => void;
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
  onOpenNewConversation,
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
          <div className="p-2">
            <div className="flex items-center justify-between px-3 py-1">
              <p className="text-xs font-medium text-white/60 uppercase tracking-wider">
                Conversas
              </p>
              <button
                onClick={onOpenNewConversation}
                className="text-xs font-medium text-accent-400 hover:text-accent-300 touch-manipulation"
              >
                + Nova conversa
              </button>
            </div>
          {chats.length > 0 && chats.map((chat) => {
                const otherUserId = getOtherParticipant(chat, currentUserId);
                const otherUser = users.find((u) => u.id === otherUserId);
                const name = getUserName(otherUserId);
                return (
                  <button
                    key={chat.id}
                    onClick={() => onSelectChat(chat.id)}
                    className={`w-full text-left px-3 py-3 sm:py-2.5 rounded-lg text-sm transition-colors flex items-center gap-3 touch-manipulation ${
                      selectedChatId === chat.id
                        ? "bg-accent-500/30 text-white"
                        : "hover:bg-white/10 active:bg-white/15 text-white"
                    }`}
                  >
                    <Avatar
                      photoURL={otherUser?.photoURL ?? null}
                      displayName={otherUser?.displayName ?? null}
                      email={otherUser?.email ?? ""}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1 flex flex-col">
                      <span className="font-medium truncate">{name}</span>
                      {chat.lastMessage && (
                        <span className="text-xs text-white/70 truncate mt-0.5">
                          {chat.lastMessage}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
          </div>

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
                  className="w-full text-left px-3 py-3 sm:py-2.5 rounded-lg text-sm transition-colors hover:bg-white/10 active:bg-white/15 text-white touch-manipulation flex items-center gap-3"
                >
                  <Avatar
                    photoURL={u.photoURL ?? null}
                    displayName={u.displayName ?? null}
                    email={u.email ?? ""}
                    size="sm"
                  />
                  <span className="font-medium truncate">
                    {u.displayName || u.email || "Contato"}
                  </span>
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-xs text-white/50">
                Adicione pelo e-mail para acesso rápido, ou use Nova conversa.
              </p>
            )}
          </div>

          {chats.length === 0 && contactIds.size === 0 && (
            <div className="p-4 text-center text-white/70 text-sm">
              Clique em &quot;Nova conversa&quot; e digite o e-mail de quem quer chamar.
            </div>
          )}
        </>
      )}
    </div>
  );
}
