# Push Notifications - meuchat

Para que as notificações funcionem quando o app está em segundo plano ou fechado:

## 1. Chave VAPID

1. Acesse [Firebase Console](https://console.firebase.google.com/) → seu projeto
2. Configurações do projeto (ícone de engrenagem) → **Cloud Messaging**
3. Em **Web configuration** → **Web Push certificates**
4. Clique em **Generate key pair** (ou use uma existente)
5. Copie a chave pública e adicione no `.env.local`:

```
NEXT_PUBLIC_FIREBASE_VAPID_KEY=sua_chave_publica_aqui
```

6. Adicione também na Vercel (Settings → Environment Variables) para o deploy

## 2. FCM Registration API

No [Google Cloud Console](https://console.cloud.google.com/), ative a **FCM Registration API** para o projeto:
- APIs e Serviços → Biblioteca → pesquise "FCM Registration API" → Ativar

## 3. Deploy da Cloud Function

A função envia a notificação quando uma nova mensagem é criada.

```bash
# Na raiz do projeto
cd functions
npm install
npm run build
cd ..

# Faça login no Firebase (se ainda não fez)
npx firebase login

# Configure o projeto
npx firebase use seu_project_id

# Deploy
npx firebase deploy --only functions
```

## 4. Regras do Firestore

Garanta que o campo `fcmToken` possa ser escrito pelo usuário autenticado. As regras devem permitir:

```
match /users/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == userId;
}
```

## Fluxo

1. Usuário entra no chat e vê o banner "Receba notificações de novas mensagens"
2. Clica em **Ativar** → o navegador pede permissão
3. Se aceitar, o token FCM é salvo em `users/{uid}.fcmToken`
4. Quando alguém envia mensagem, a Cloud Function dispara e envia push ao destinatário
5. O serviço worker `firebase-messaging-sw.js` recebe e exibe a notificação (mesmo com app fechado)
