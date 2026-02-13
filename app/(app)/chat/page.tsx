"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ChatLayout } from "@/components/chat/ChatLayout";
import { ContactsList } from "@/components/chat/ContactsList";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { useAuth } from "@/providers/AuthProvider";
import { useChats } from "@/hooks/useChats";
import { useUsers } from "@/hooks/useUsers";
import { useMessages } from "@/hooks/useMessages";

function ChatPageContent() {
  const { user, signOut } = useAuth();
  const { users, loading: usersLoading } = useUsers(user?.uid ?? null);
  const { chats, loading: chatsLoading, getOrCreateChat, updateChatLastMessage } = useChats(user ?? null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedOtherUserId, setSelectedOtherUserId] = useState<string | null>(null);

  const { messages, loading: messagesLoading, error, sendMessage } = useMessages(user ?? null, selectedChatId);

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

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    const chat = chats.find((c) => c.id === chatId);
    setSelectedOtherUserId(chat?.participants.find((p) => p !== user?.uid) ?? null);
  };

  const handleSendMessage = async (text: string) => {
    await sendMessage(text);
    if (selectedChatId) await updateChatLastMessage(selectedChatId, text);
  };

  return (
    <div className="flex h-screen max-h-[100dvh] bg-slate-50 dark:bg-slate-900">
      <aside className="w-64 sm:w-72 shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Chat da Família</h1>
          <button onClick={() => signOut()} className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">Sair</button>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <ContactsList chats={chats} users={users} currentUserId={user?.uid ?? ""} selectedChatId={selectedChatId} onSelectChat={handleSelectChat} onSelectContact={handleSelectContact} loading={chatsLoading || usersLoading} />
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        {selectedChatId ? (
          <ChatLayout header={<div className="px-4 py-3"><h2 className="text-lg font-semibold text-slate-900 dark:text-white truncate">{displayName}</h2></div>} input={<MessageInput onSend={handleSendMessage} disabled={messagesLoading || !!error} />}>
            {error && <div className="p-3 mx-4 mt-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">{error}</div>}
            <MessageList messages={messages} currentUserId={user?.uid ?? ""} />
          </ChatLayout>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400">
            <div className="text-center p-8">
              <p className="text-lg mb-2">Selecione um contato</p>
              <p className="text-sm">Escolha uma conversa ou clique em um contato para iniciar.</p>
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
