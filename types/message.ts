import type { Timestamp } from "firebase/firestore";

export interface Message {
  id: string;
  text: string;
  userId: string;
  userEmail: string;
  displayName?: string;
  createdAt: Timestamp;
}
