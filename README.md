# meuchat

A production-ready private family chat built with Next.js 16, Firebase Auth, and Firestore.

## Tech Stack

- **Next.js 16** (App Router)
- **Firebase Auth** (email/password + Google sign-in)
- **Firestore** (realtime database with `onSnapshot`)
- **TailwindCSS**

## Features

- Login and sign up pages
- Realtime chat with Firestore `onSnapshot`
- Protected routes (chat only for authenticated users)
- Auto scroll to latest message
- Mobile-first responsive design
- UI text in Portuguese (pt-BR)

## Requirements

- Node.js 20.9 or later

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure Firebase**

   - Create a project at [Firebase Console](https://console.firebase.google.com/)
   - Enable **Authentication** (Email/Password and Google provider)
   - Create a **Firestore Database**
   - Copy `.env.example` to `.env.local` and fill in your Firebase config:

   ```bash
   cp .env.example .env.local
   ```

3. **Deploy Firestore rules and indexes**

   ```bash
   firebase deploy --only firestore
   ```

4. **Run the app**

   ```bash
   npm run dev
   ```

## Project Structure

```
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── login/
│   │   ├── page.tsx
│   │   └── signup/page.tsx
│   └── chat/
│       └── page.tsx
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.tsx
│   └── chat/
│       ├── ChatLayout.tsx
│       ├── MessageList.tsx
│       └── MessageInput.tsx
├── hooks/
│   └── useMessages.ts
├── lib/
│   ├── firebase.ts
│   └── constants.ts
├── providers/
│   └── AuthProvider.tsx
├── types/
│   └── message.ts
└── ...
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID |
