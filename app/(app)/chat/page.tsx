"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ChatLayout } from "@/components/chat/ChatLayout";
import { ContactsList } from "@/components/chat/ContactsList";
import { AddContactModal } from "@/components/chat/AddContactModal";
import { NewConversationModal } from "@/components/chat/NewConversationModal";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { NotificationPrompt } from "@/components/notifications/NotificationPrompt";
import { useAuth } from "@/providers/AuthProvider";
import { Avatar } from "@/components/ui/Avatar";
import { useChats } from "@/hooks/useChats";
import { useUsers } from "@/hooks/useUsers";
import { useContacts } from "@/hooks/useContacts";
import { useMessages } from "@/hooks/useMessages";

function ChatPageContent() {
  const searchParams = useSearchParams();
  const { user, signOut } = useAuth();
  const { users, loading: usersLoading } = useUsers(user?.uid ?? null);
  const {
    chats,
    loading: chatsLoading,
    getOrCreateChat,
    updateChatLastMessage,
    incrementUnreadForParticipant,
    markChatAsRead,
    deleteChat,
  } = useChats(user ?? null);
  const { contactIds, loading: contactsLoading, addContact, lookupByEmail } = useContacts(user?.uid ?? null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedOtherUserId, setSelectedOtherUserId] = useState<string | null>(null);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [newConversationOpen, setNewConversationOpen] = useState(false);

  const { messages, loading: messagesLoading, error, sendMessage } = useMessages(user ?? null, selectedChatId);

  useEffect(() => {
    const chatFromUrl = searchParams.get("chat");
    if (chatFromUrl) {
      setSelectedChatId(chatFromUrl);
      const chat = chats.find((c) => c.id === chatFromUrl);
      if (chat) setSelectedOtherUserId(chat.participants.find((p) => p !== user?.uid) ?? null);
    }
  }, [searchParams, chats, user?.uid]);

  // Marcar conversa como lida ao abrir
  useEffect(() => {
    if (selectedChatId && user) markChatAsRead(selectedChatId);
  }, [selectedChatId, user?.uid, markChatAsRead]);

  const selectedChat = chats.find((c) => c.id === selectedChatId);
  const otherParticipantId = selectedChat?.participants.find((p) => p !== user?.uid) ?? selectedOtherUserId;
  const otherUser = users.find((u) => u.id === otherParticipantId);
  const displayName = otherUser?.displayName || otherUser?.email || "Contato";

  const handleSelectContact = async (otherUserId: string) => {
    try {
      const chatId = await getOrCreateChat(otherUserId);
      setSelectedChatId(chatId);
      setSelectedOtherUserId(otherUserId);
    } catch (err) {
      console.error("Erro ao iniciar conversa:", err);
    }
  };

  const handleStartChatByEmail = async (email: string): Promise<{ ok: boolean; error?: string }> => {
    const found = await lookupByEmail(email);
    if (!found) return { ok: false, error: "Usuário não encontrado" };
    if (found.id === user?.uid) return { ok: false, error: "Você não pode enviar mensagem para si mesmo" };
    await handleSelectContact(found.id);
    return { ok: true };
  };

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    const chat = chats.find((c) => c.id === chatId);
    setSelectedOtherUserId(chat?.participants.find((p) => p !== user?.uid) ?? null);
  };

  const handleBack = () => {
    setSelectedChatId(null);
    setSelectedOtherUserId(null);
  };

  const handleDeleteChat = async (chatId: string) => {
    await deleteChat(chatId);
    if (selectedChatId === chatId) {
      handleBack();
    }
  };

  const handleSendMessage = async (text: string) => {
    await sendMessage(text);
    if (selectedChatId) {
      await updateChatLastMessage(selectedChatId, text);
      if (otherParticipantId) await incrementUnreadForParticipant(selectedChatId, otherParticipantId);
    }
  };

  const showListOnMobile = !selectedChatId;

  return (
    <div className="flex h-[100dvh]">
      {/* Sidebar - hidden on mobile when chat is open */}
      <aside
        className={`
          shrink-0 flex-col border-r border-white/20 bg-primary-900/80 backdrop-blur
          md:flex md:w-72
          ${showListOnMobile ? "flex w-full" : "hidden"}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="p-3 pt-[env(safe-area-inset-top)] pb-3 border-b border-white/20 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="/icons/logo.png" alt="" className="w-8 h-8 rounded-lg object-contain" />
                <h1 className="text-lg font-semibold text-white">meuchat</h1>
              </div>
              <button
                onClick={() => signOut()}
                className="px-3 py-2 rounded-lg text-sm font-medium text-white/80 hover:text-white active:bg-white/10 touch-manipulation"
              >
                Sair
              </button>
            </div>
            <Link href="/profile" className="flex items-center gap-2 mt-2 text-sm text-white/80 hover:text-accent-400">
              <Avatar
                photoURL={user?.photoURL ?? null}
                displayName={user?.displayName ?? null}
                email={user?.email ?? ""}
                size="sm"
              />
              <span className="truncate flex-1">{user?.displayName || user?.email || "Perfil"}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
            </Link>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <NotificationPrompt />
            <div className="flex-1 min-h-0 overflow-hidden">
            <ContactsList
              chats={chats}
              users={users}
              contactIds={contactIds}
              currentUserId={user?.uid ?? ""}
              selectedChatId={selectedChatId}
              onSelectChat={handleSelectChat}
              onSelectContact={handleSelectContact}
              onDeleteChat={handleDeleteChat}
              onOpenAddContact={() => setAddContactOpen(true)}
              onOpenNewConversation={() => setNewConversationOpen(true)}
              loading={chatsLoading || usersLoading || contactsLoading}
            />
            <AddContactModal
              isOpen={addContactOpen}
              onClose={() => setAddContactOpen(false)}
              onAdd={addContact}
            />
            <NewConversationModal
              isOpen={newConversationOpen}
              onClose={() => setNewConversationOpen(false)}
              onStart={handleStartChatByEmail}
            />
            </div>
          </div>
        </div>
      </aside>

      {/* Chat area - hidden on mobile when list is shown */}
      <main
        className={`
          flex-1 flex flex-col min-w-0 min-h-0
          ${showListOnMobile ? "hidden md:flex" : "flex"}
        `}
      >
        {selectedChatId ? (
          <>
            <ChatLayout
              header={
                <div className="flex items-center gap-2 px-3 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 border-b border-white/20 bg-primary-900/80 backdrop-blur shrink-0">
                  <button
                    onClick={handleBack}
                    className="md:hidden p-2 -ml-1 rounded-lg text-white/80 active:bg-white/10 touch-manipulation"
                    aria-label="Voltar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </button>
                  {otherUser && (
                    <Avatar
                      photoURL={otherUser.photoURL ?? null}
                      displayName={otherUser.displayName ?? null}
                      email={otherUser.email ?? ""}
                      size="sm"
                    />
                  )}
                  <h2 className="flex-1 text-lg font-semibold text-white truncate min-w-0">
                    {displayName}
                  </h2>
                </div>
              }
              input={<MessageInput onSend={handleSendMessage} disabled={messagesLoading || !!error} />}
            >
              {error && (
                <div className="p-3 mx-3 mt-3 rounded-lg bg-red-500/20 text-red-100 text-sm">
                  {error}
                </div>
              )}
              <MessageList messages={messages} currentUserId={user?.uid ?? ""} />
            </ChatLayout>
          </>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-white/70">
            <div className="text-center p-8">
              <p className="text-lg mb-2">Selecione uma conversa</p>
              <p className="text-sm">Use &quot;Nova conversa&quot; para enviar mensagem por e-mail ou escolha na lista.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatPageContent />
    </ProtectedRoute>
  );
}
