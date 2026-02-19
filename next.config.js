// @ts-check
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  cacheOnFrontEndNav: true,
  cacheStartUrl: true,
  reloadOnOnline: true,
  workboxOptions: {
    // Não cachear o SW do FCM para que atualizações do push sempre usem a versão nova
    exclude: [/firebase-messaging-sw\.js$/],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts-webfonts",
          expiration: { maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 },
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Next.js 16 usa Turbopack por padrão; o plugin PWA usa webpack.
  // Config vazia evita o erro e o dev segue com Turbopack.
  turbopack: {},
};

module.exports = withPWA(nextConfig);
