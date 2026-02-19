import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

/**
 * Sends a push notification to the recipient when a new message is created.
 * Triggered when a document is created in chats/{chatId}/messages/{messageId}
 */
export const onNewMessage = functions.firestore
  .document("chats/{chatId}/messages/{messageId}")
  .onCreate(async (snap, context) => {
    try {
      const { chatId } = context.params;
      const message = snap.data();
      const senderId = message.userId as string;
      const text = (message.text as string) || "";
      const senderName = (message.displayName as string) || (message.userEmail as string) || "Alguém";

      const chatSnap = await db.collection("chats").doc(chatId).get();
      if (!chatSnap.exists) {
        functions.logger.warn("Chat not found", { chatId });
        return;
      }

      const participants = chatSnap.data()?.participants as string[] | undefined;
      if (!participants?.length) {
        functions.logger.warn("No participants", { chatId });
        return;
      }

      const recipientId = participants.find((p: string) => p !== senderId);
      if (!recipientId) {
        functions.logger.warn("Recipient not found", { chatId, senderId });
        return;
      }

      const userSnap = await db.collection("users").doc(recipientId).get();
      const fcmToken = userSnap.data()?.fcmToken as string | undefined;
      if (!fcmToken) {
        functions.logger.info("Recipient has no fcmToken", { recipientId });
        return;
      }

      const body = text.length > 100 ? text.slice(0, 97) + "..." : text;
      await admin.messaging().send({
        token: fcmToken,
        data: {
          title: senderName,
          body,
          chatId,
          senderId,
          type: "message",
        },
      });
      functions.logger.info("Push sent", { recipientId, chatId });
    } catch (err) {
      functions.logger.error("onNewMessage failed", err);
      throw err;
    }
  });
