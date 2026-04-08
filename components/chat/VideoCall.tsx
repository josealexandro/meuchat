"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { attachLocalTracks, createPeerConnection, stopMediaStream } from "@/lib/webrtc";
import { addIceCandidateDoc, listenCallDoc, listenCandidates, publishOffer, reserveCall, writeAnswer, writeEnded } from "@/lib/webrtc-signaling";

type CallUiState = "idle" | "incoming" | "calling" | "inCall" | "error";

type VideoCallProps = {
  chatId: string;
  currentUserId: string;
  otherUserId: string;
  otherUserLabel?: string;
};

export function VideoCall({ chatId, currentUserId, otherUserId, otherUserLabel }: VideoCallProps) {
  const [uiState, setUiState] = useState<CallUiState>("idle");
  const [panelOpen, setPanelOpen] = useState(false);
  const [incomingOffer, setIncomingOffer] = useState<RTCSessionDescriptionInit | null>(null);
  const [incomingCallId, setIncomingCallId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const uiStateRef = useRef<CallUiState>("idle");
  const callIdRef = useRef<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const unsubCallDocRef = useRef<(() => void) | null>(null);
  const unsubRemoteCandidatesRef = useRef<(() => void) | null>(null);
  const unsubAnswerWatcherRef = useRef<(() => void) | null>(null);

  const canStart = uiState === "idle" && !!otherUserId;
  const canAnswer = uiState === "incoming" && incomingOffer != null && incomingCallId != null;
  const canEnd = uiState === "calling" || uiState === "inCall" || uiState === "incoming";

  const label = useMemo(() => otherUserLabel || "Contato", [otherUserLabel]);

  useEffect(() => {
    uiStateRef.current = uiState;
  }, [uiState]);

  const cleanup = async () => {
    unsubRemoteCandidatesRef.current?.();
    unsubRemoteCandidatesRef.current = null;
    unsubAnswerWatcherRef.current?.();
    unsubAnswerWatcherRef.current = null;

    if (pcRef.current) {
      pcRef.current.ontrack = null;
      pcRef.current.onicecandidate = null;
      pcRef.current.close();
    }
    pcRef.current = null;

    stopMediaStream(localStreamRef.current);
    stopMediaStream(remoteStreamRef.current);
    localStreamRef.current = null;
    remoteStreamRef.current = null;

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    setIncomingOffer(null);
    setIncomingCallId(null);
    setError(null);
    setUiState("idle");
    setPanelOpen(false);
    callIdRef.current = null;
  };

  const endCall = async () => {
    try {
      await writeEnded(db, chatId);
    } catch {}
    await cleanup();
  };

  const startCall = async () => {
    setError(null);
    try {
      const callId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      try {
        await reserveCall(db, chatId, { from: currentUserId, to: otherUserId, callId });
      } catch (err: unknown) {
        const msg = String((err as { message?: string })?.message ?? "");
        if (msg.includes("busy")) {
          setError(`${label} está ocupado em outra chamada`);
          setUiState("idle");
          setPanelOpen(false);
          return;
        }
        throw err;
      }

      callIdRef.current = callId;
      setPanelOpen(true);
      setUiState("calling");

      const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = localStream;
      if (localVideoRef.current) localVideoRef.current.srcObject = localStream;

      const pc = createPeerConnection({
        onRemoteStream: (stream) => {
          remoteStreamRef.current = stream;
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
          setUiState("inCall");
        },
        onIceCandidate: (candidate) => {
          addIceCandidateDoc(db, chatId, "offerCandidates", callId, candidate).catch(() => {});
        },
      });
      pcRef.current = pc;
      attachLocalTracks(pc, localStream);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await publishOffer(db, chatId, { offer, callId });

      unsubRemoteCandidatesRef.current?.();
      unsubRemoteCandidatesRef.current = listenCandidates(db, chatId, "answerCandidates", callId, (candidate) => {
        pc.addIceCandidate(candidate).catch(() => {});
      });

      unsubAnswerWatcherRef.current?.();
      unsubAnswerWatcherRef.current = listenCallDoc(db, chatId, (data) => {
        if (!data) return;
        if (data.callId && data.callId !== callIdRef.current) return;
        if (data.status === "ended") {
          cleanup().catch(() => {});
          return;
        }
        if (!data.answer) return;
        if (pc.currentRemoteDescription) return;
        pc.setRemoteDescription(new RTCSessionDescription(data.answer)).catch(() => {});
      });
    } catch (err: unknown) {
      try {
        if (callIdRef.current) await writeEnded(db, chatId);
      } catch {}
      setError((err as { message?: string })?.message ?? "Falha ao iniciar chamada");
      setUiState("error");
    }
  };

  const answerCall = async () => {
    setError(null);
    setPanelOpen(true);
    setUiState("inCall");
    try {
      const offer = incomingOffer;
      if (!offer) throw new Error("Oferta não encontrada");
      const callId = incomingCallId;
      if (!callId) throw new Error("Chamada inválida");
      callIdRef.current = callId;

      const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = localStream;
      if (localVideoRef.current) localVideoRef.current.srcObject = localStream;

      const pc = createPeerConnection({
        onRemoteStream: (stream) => {
          remoteStreamRef.current = stream;
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
        },
        onIceCandidate: (candidate) => {
          addIceCandidateDoc(db, chatId, "answerCandidates", callId, candidate).catch(() => {});
        },
      });
      pcRef.current = pc;
      attachLocalTracks(pc, localStream);

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await writeAnswer(db, chatId, { answer });

      unsubRemoteCandidatesRef.current?.();
      unsubRemoteCandidatesRef.current = listenCandidates(db, chatId, "offerCandidates", callId, (candidate) => {
        pc.addIceCandidate(candidate).catch(() => {});
      });

      setIncomingOffer(null);
      setIncomingCallId(null);
    } catch (err: unknown) {
      try {
        if (callIdRef.current) await writeEnded(db, chatId);
      } catch {}
      setError((err as { message?: string })?.message ?? "Falha ao atender chamada");
      setUiState("error");
    }
  };

  useEffect(() => {
    if (!chatId || !currentUserId || !otherUserId) return;
    unsubCallDocRef.current?.();
    unsubCallDocRef.current = listenCallDoc(db, chatId, (data) => {
      if (!data) {
        setIncomingOffer(null);
        setIncomingCallId(null);
        if (uiStateRef.current !== "calling" && uiStateRef.current !== "inCall") setUiState("idle");
        return;
      }

      if (data.status === "ended") {
        cleanup().catch(() => {});
        return;
      }

      if (data.status === "ringing") {
        if (data.to === currentUserId) {
          setIncomingOffer(null);
          setIncomingCallId(data.callId ?? null);
          setPanelOpen(true);
          if (uiStateRef.current !== "inCall" && uiStateRef.current !== "calling") setUiState("incoming");
        } else if (data.from === currentUserId) {
          setPanelOpen(true);
          if (uiStateRef.current !== "inCall") setUiState("calling");
        }
        return;
      }

      if (data.status === "offered" && data.to === currentUserId) {
        setIncomingCallId(data.callId ?? null);
        if (data.offer) setIncomingOffer(data.offer);
        setPanelOpen(true);
        if (uiStateRef.current !== "inCall" && uiStateRef.current !== "calling") setUiState("incoming");
        return;
      }
    });

    return () => {
      unsubCallDocRef.current?.();
      unsubCallDocRef.current = null;
    };
  }, [chatId, currentUserId, otherUserId]);

  useEffect(() => {
    const onUnload = () => {
      if (callIdRef.current && (uiStateRef.current === "calling" || uiStateRef.current === "inCall" || uiStateRef.current === "incoming")) {
        writeEnded(db, chatId).catch(() => {});
      }
      cleanup().catch(() => {});
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, []);

  return (
    <div className="flex items-center gap-2">
      {uiState === "incoming" ? (
        <button
          onClick={answerCall}
          disabled={!canAnswer}
          className="px-3 py-2 rounded-lg text-sm font-medium text-white/90 bg-emerald-500/30 hover:bg-emerald-500/40 active:bg-emerald-500/50 touch-manipulation"
        >
          Atender
        </button>
      ) : (
        <button
          onClick={startCall}
          disabled={!canStart}
          className="px-3 py-2 rounded-lg text-sm font-medium text-white/80 hover:text-white active:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation"
        >
          Iniciar chamada
        </button>
      )}

      <button
        onClick={endCall}
        disabled={!canEnd}
        className="px-3 py-2 rounded-lg text-sm font-medium text-white/80 hover:text-white active:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation"
      >
        Encerrar
      </button>

      {panelOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="w-full max-w-3xl rounded-2xl border border-white/15 bg-primary-900/90 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/15">
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">Chamada com {label}</p>
                <p className="text-white/70 text-xs">
                  {uiState === "calling"
                    ? "Chamando..."
                    : uiState === "incoming"
                      ? incomingOffer
                        ? "Chamada recebida"
                        : "Chamando..."
                      : uiState === "inCall"
                        ? "Em chamada"
                        : "—"}
                </p>
              </div>
              <button
                onClick={endCall}
                className="px-3 py-2 rounded-lg text-sm font-medium text-white/90 bg-red-500/30 hover:bg-red-500/40 active:bg-red-500/50 touch-manipulation"
              >
                Encerrar
              </button>
            </div>

            {error && <div className="px-4 py-3 text-sm text-red-100 bg-red-500/20">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
              <div className="rounded-xl overflow-hidden border border-white/10 bg-black/30">
                <div className="px-3 py-2 border-b border-white/10 text-xs text-white/80">Seu vídeo</div>
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full aspect-video object-cover" />
              </div>

              <div className="rounded-xl overflow-hidden border border-white/10 bg-black/30">
                <div className="px-3 py-2 border-b border-white/10 text-xs text-white/80">Vídeo remoto</div>
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full aspect-video object-cover" />
              </div>
            </div>

            {uiState === "incoming" && (
              <div className="px-4 pb-4">
                <button
                  onClick={answerCall}
                  disabled={!canAnswer}
                  className="w-full px-4 py-3 rounded-xl text-sm font-semibold text-white bg-emerald-500/30 hover:bg-emerald-500/40 active:bg-emerald-500/50 disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation"
                >
                  Atender chamada
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
