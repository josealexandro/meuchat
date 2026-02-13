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
    const { chatId } = context.params;
    const message = snap.data();
    const senderId = message.userId as string;
    const text = (message.text as string) || "";
    const senderName = (message.displayName as string) || (message.userEmail as string) || "Alguém";

    const chatSnap = await db.collection("chats").doc(chatId).get();
    if (!chatSnap.exists) return;

    const participants = chatSnap.data()?.participants as string[] | undefined;
    if (!participants) return;

    const recipientId = participants.find((p: string) => p !== senderId);
    if (!recipientId) return;

    const userSnap = await db.collection("users").doc(recipientId).get();
    const fcmToken = userSnap.data()?.fcmToken as string | undefined;
    if (!fcmToken) return;

    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: senderName,
        body: text.length > 100 ? text.slice(0, 97) + "..." : text,
      },
      data: {
        chatId,
        senderId,
        type: "message",
      },
    });
  });
