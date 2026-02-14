/**
 * Migration: add existing chat participants as contacts.
 * Run once after deploying the contacts feature.
 *
 * Usage: node scripts/migrate-contacts.js
 * Requires: GOOGLE_APPLICATION_CREDENTIALS or firebase login (gcloud auth)
 *
 * Install firebase-admin if needed: npm install firebase-admin
 */
const admin = require("firebase-admin");

const USERS = "users";
const CHATS = "chats";
const CONTACTS = "contacts";

async function migrate() {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  const db = admin.firestore();

  const usersSnap = await db.collection(USERS).get();
  let migrated = 0;
  let errors = 0;

  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    const chatsSnap = await db
      .collection(CHATS)
      .where("participants", "array-contains", userId)
      .get();

    const contactIds = new Set();
    for (const chatDoc of chatsSnap.docs) {
      const participants = chatDoc.data().participants || [];
      for (const pid of participants) {
        if (pid !== userId) contactIds.add(pid);
      }
    }

    for (const contactId of contactIds) {
      try {
        const contactRef = db.collection(USERS).doc(userId).collection(CONTACTS).doc(contactId);
        await contactRef.set(
          { addedAt: admin.firestore.FieldValue.serverTimestamp() },
          { merge: true }
        );
        migrated++;
      } catch (err) {
        console.error(`Failed to add contact ${contactId} for user ${userId}:`, err.message);
        errors++;
      }
    }
  }

  console.log(`Done. Migrated ${migrated} contacts. Errors: ${errors}.`);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
