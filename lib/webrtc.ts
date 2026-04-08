export type WebRTCCallbacks = {
  onRemoteStream: (stream: MediaStream) => void;
  onIceCandidate: (candidate: RTCIceCandidate) => void;
};

export function createPeerConnection(callbacks: WebRTCCallbacks): RTCPeerConnection {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  pc.ontrack = (event) => {
    const [stream] = event.streams;
    if (stream) callbacks.onRemoteStream(stream);
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) callbacks.onIceCandidate(event.candidate);
  };

  return pc;
}

export function attachLocalTracks(pc: RTCPeerConnection, stream: MediaStream) {
  for (const track of stream.getTracks()) {
    pc.addTrack(track, stream);
  }
}

export function stopMediaStream(stream: MediaStream | null) {
  if (!stream) return;
  for (const track of stream.getTracks()) {
    track.stop();
  }
}
