export type WebRTCCallbacks = {
  onRemoteStream: (stream: MediaStream) => void;
  onIceCandidate: (candidate: RTCIceCandidate) => void;
};

export function createPeerConnection(callbacks: WebRTCCallbacks): RTCPeerConnection {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  const remoteStream = new MediaStream();

  pc.ontrack = (event) => {
    if (event.streams && event.streams.length > 0) {
      callbacks.onRemoteStream(event.streams[0] as MediaStream);
      return;
    }
    remoteStream.addTrack(event.track);
    callbacks.onRemoteStream(remoteStream);
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
