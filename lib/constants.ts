export const FIRESTORE_COLLECTIONS = {
  USERS: "users",
  CHATS: "chats",
  MESSAGES: "messages",
  CONTACTS: "contacts", // subcollection: users/{userId}/contacts/{contactId}
} as const;
