import type { Timestamp } from "firebase/firestore";

export interface Chat {
  id: string;
  participants: string[];
  createdAt: Timestamp;
  lastMessage?: string;
  lastMessageAt?: Timestamp;
  /** Número de mensagens não lidas por usuário: { [userId]: count } */
  unread?: Record<string, number>;
}
