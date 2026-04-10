import type { Firestore } from "firebase/firestore";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

export type CallStatus = "ringing" | "offered" | "answered" | "ended";

export type CallDoc = {
  from: string;
  to: string;
  status: CallStatus;
  callId?: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  createdAt?: unknown;
  endedAt?: unknown;
};

export type IceCandidateDoc = {
  callId: string;
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
  usernameFragment?: string;
  createdAt: unknown;
};

export function getCallRefs(db: Firestore, chatId: string) {
  const callDocRef = doc(db, "chats", chatId, "calls", "active");
  const offerCandidatesRef = collection(db, "chats", chatId, "calls", "active", "offerCandidates");
  const answerCandidatesRef = collection(db, "chats", chatId, "calls", "active", "answerCandidates");

  return {
    callDocRef,
    offerCandidatesRef,
    answerCandidatesRef,
  };
}

function createdAtMillis(createdAt: unknown): number | null {
  if (createdAt instanceof Timestamp) return createdAt.toMillis();
  const maybe = createdAt as { toMillis?: () => number } | null | undefined;
  if (typeof maybe?.toMillis === "function") return maybe.toMillis();
  return null;
}

export async function reserveCall(
  db: Firestore,
  chatId: string,
  payload: { from: string; to: string; callId: string; ttlMs?: number }
) {
  const { callDocRef } = getCallRefs(db, chatId);
  const ttlMs = payload.ttlMs ?? 120_000;

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(callDocRef);
    if (snap.exists()) {
      const data = snap.data() as Partial<CallDoc>;
      const status = data.status;
      const wasEnded = status === "ended";
      const millis = createdAtMillis(data.createdAt);
      const expired = typeof millis === "number" && Date.now() - millis > ttlMs;

      if (!wasEnded && !expired) {
        throw new Error("busy");
      }
    }

    const callDoc: CallDoc = {
      from: payload.from,
      to: payload.to,
      status: "ringing",
      callId: payload.callId,
      offer: undefined,
      answer: undefined,
      createdAt: serverTimestamp(),
      endedAt: undefined,
    };
    tx.set(callDocRef, callDoc as never);
  });
}

export async function publishOffer(
  db: Firestore,
  chatId: string,
  payload: { offer: RTCSessionDescriptionInit; callId: string }
) {
  const { callDocRef } = getCallRefs(db, chatId);
  await updateDoc(callDocRef, {
    offer: payload.offer,
    status: "offered",
    callId: payload.callId,
  });
}

export async function writeOffer(db: Firestore, chatId: string, payload: { from: string; to: string; offer: RTCSessionDescriptionInit }) {
  const { callDocRef } = getCallRefs(db, chatId);
  const callDoc: CallDoc = {
    from: payload.from,
    to: payload.to,
    status: "offered",
    offer: payload.offer,
    answer: undefined,
    createdAt: serverTimestamp(),
    endedAt: undefined,
  };
  await setDoc(callDocRef, callDoc as never);
}

export async function writeAnswer(db: Firestore, chatId: string, payload: { answer: RTCSessionDescriptionInit }) {
  const { callDocRef } = getCallRefs(db, chatId);
  await updateDoc(callDocRef, {
    answer: payload.answer,
    status: "answered",
  });
}

export async function writeEnded(db: Firestore, chatId: string) {
  const { callDocRef } = getCallRefs(db, chatId);
  await updateDoc(callDocRef, {
    status: "ended",
    endedAt: serverTimestamp(),
  });
}

export function listenCallDoc(
  db: Firestore,
  chatId: string,
  onData: (data: CallDoc | null) => void,
  onError?: (err: unknown) => void
) {
  const { callDocRef } = getCallRefs(db, chatId);
  return onSnapshot(
    callDocRef,
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      onData(snap.data() as CallDoc);
    },
    (err) => {
      onError?.(err);
    }
  );
}

export function listenCandidates(
  db: Firestore,
  chatId: string,
  kind: "offerCandidates" | "answerCandidates",
  callId: string,
  onCandidate: (candidate: RTCIceCandidateInit) => void,
  onError?: (err: unknown) => void
) {
  const refs = getCallRefs(db, chatId);
  const candidatesRef = kind === "offerCandidates" ? refs.offerCandidatesRef : refs.answerCandidatesRef;
  const q = query(candidatesRef, where("callId", "==", callId));

  const seen = new Set<string>();
  return onSnapshot(
    q,
    (snap) => {
      for (const change of snap.docChanges()) {
        if (change.type !== "added") continue;
        const data = change.doc.data() as Partial<IceCandidateDoc>;
        const key = `${data.candidate ?? ""}|${data.sdpMid ?? ""}|${data.sdpMLineIndex ?? ""}`;
        if (seen.has(key)) continue;
        seen.add(key);
        if (typeof data.candidate !== "string") continue;
        onCandidate({
          candidate: data.candidate,
          sdpMid: data.sdpMid ?? null,
          sdpMLineIndex: data.sdpMLineIndex ?? null,
          usernameFragment: typeof data.usernameFragment === "string" ? data.usernameFragment : undefined,
        });
      }
    },
    (err) => {
      onError?.(err);
    }
  );
}

export async function addIceCandidateDoc(
  db: Firestore,
  chatId: string,
  kind: "offerCandidates" | "answerCandidates",
  callId: string,
  candidate: RTCIceCandidate
) {
  const refs = getCallRefs(db, chatId);
  const candidatesRef = kind === "offerCandidates" ? refs.offerCandidatesRef : refs.answerCandidatesRef;
  const json = candidate.toJSON();

  const docData: IceCandidateDoc = {
    callId,
    candidate: json.candidate ?? "",
    sdpMid: json.sdpMid ?? null,
    sdpMLineIndex: json.sdpMLineIndex ?? null,
    usernameFragment: typeof json.usernameFragment === "string" ? json.usernameFragment : undefined,
    createdAt: serverTimestamp(),
  };
  await addDoc(candidatesRef, docData as never);
}
