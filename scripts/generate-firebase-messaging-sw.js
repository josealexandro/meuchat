/**
 * Generates public/firebase-messaging-sw.js with Firebase config.
 * Run before build so the service worker has the correct config.
 */
const fs = require("fs");
const path = require("path");

const env = process.env;
const hasConfig = env.NEXT_PUBLIC_FIREBASE_API_KEY && env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const config = hasConfig
  ? {
      apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }
  : null;

if (!config) {
  console.log("Skipping firebase-messaging-sw.js (missing Firebase config)");
  process.exit(0);
}

const content = `// Generated - do not edit. Config from env at build time.
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp(${JSON.stringify(config)});
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "meuchat";
  const options = {
    body: payload.notification?.body || payload.data?.text || "Nova mensagem",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
  };
  self.registration.showNotification(title, options);
});
`;

const outPath = path.join(__dirname, "..", "public", "firebase-messaging-sw.js");
fs.writeFileSync(outPath, content);
console.log("Generated firebase-messaging-sw.js");