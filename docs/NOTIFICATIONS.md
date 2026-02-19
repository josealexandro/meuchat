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

## Debug – não funcionou?

### 1. No chat, abra "Status das notificações"
- **Permissão**: deve ser `granted`
- **Token salvo**: deve ser `Sim`
- **Service worker**: deve ser `OK`

### 2. Se token não salvo
- Abra o console do navegador (F12 → Console)
- Procure por `[meuchat] getFCMToken failed:`
- Erros comuns:
  - **404 em firebase-messaging-sw.js**: confira se a URL do app tem `/firebase-messaging-sw.js` (ex: `https://seu-app.vercel.app/firebase-messaging-sw.js`)
  - **VAPID inválido**: confirme a chave no Firebase Console e na Vercel
  - **Messaging not supported**: dispositivo/navegador não suporta

### 3. Se token salvo mas não chega notificação
- Firebase Console → Functions → Logs
- Procure por `onNewMessage`
- `Recipient has no fcmToken` = destinatário não ativou notificações
- `Push sent` = mensagem enviada; se não chegou, pode ser bloqueio do navegador/OS

### 4. Conferir Firestore
- Firebase Console → Firestore
- `users/{uid}` do destinatário deve ter o campo `fcmToken` (string longa)

### 5. Notificações não chegam no celular (2 dispositivos)
- **Vercel**: confirme que no build estão definidas as variáveis `NEXT_PUBLIC_FIREBASE_*` (incl. `NEXT_PUBLIC_FIREBASE_VAPID_KEY`). Sem isso, o `firebase-messaging-sw.js` não é gerado e o push quebra.
- **Cache do SW**: em cada celular, abra o app → Configurações do site (ou Chrome → Site settings) → Limpar dados do site / “Clear & reset”. Depois abra o app de novo, aceite notificações de novo e teste. Assim o navegador baixa o service worker novo.
- **Logs da Function**: Firebase Console → Functions → Logs. Para cada mensagem enviada, deve aparecer “Push sent”. Se aparecer “Recipient has no fcmToken”, o destinatário não tem token salvo (não ativou ou deu erro ao ativar).
- **Permissões no celular**: Verifique se notificações do Chrome (ou Safari) estão permitidas para o site e se não há “Não perturbe” ou economia de bateria bloqueando.
- **iOS**: Web Push só funciona em Safari 16.4+ e em PWAs “Add to Home Screen”; não funciona em abas normais do Safari em versões antigas.
