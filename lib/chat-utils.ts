/**
 * Generates a deterministic chat ID for a 1:1 conversation between two users.
 * Same pair always produces the same ID regardless of order.
 */
export function getChatId(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join("_");
}
