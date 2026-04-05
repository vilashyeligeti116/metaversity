import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";

const SERVER = process.env.REACT_APP_API_URL || "http://localhost:4000";
const ICE_CFG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};
const PROX_FULL = 80;
const PROX_CUTOFF = 200;
// Base64 characters — 512 * 1024 chars ≈ 384 KB of binary data per chunk (safe under Socket.io's 1MB default)
const CHUNK_CHARS = 524288;

// ── Module-level media singleton ──────────────────────────────────────────────
let _localStream = null;

async function getLocalStream() {
  if (_localStream) return _localStream;
  try {
    _localStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: "user",
      },
      audio: { echoCancellation: true, noiseSuppression: true },
    });
  } catch (_) {
    try {
      _localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
    } catch (e) {
      console.warn("[Media] No media access");
    }
  }
  return _localStream;
}

function stopLocalStream() {
  _localStream?.getTracks().forEach((t) => t.stop());
  _localStream = null;
}

function toggleAudio(stream) {
  const t = stream?.getAudioTracks()[0];
  if (t) t.enabled = !t.enabled;
  return !(t?.enabled ?? true);
}

function toggleVideo(stream) {
  const t = stream?.getVideoTracks()[0];
  if (t) t.enabled = !t.enabled;
  return !(t?.enabled ?? true);
}

// ── PeerManager ───────────────────────────────────────────────────────────────
class PeerManager {
  constructor({ onStream, onStreamRemoved }) {
    this.peers = new Map(); // peerId → { pc, gain, screenSender }
    this.onStream = onStream;
    this.onStreamRemoved = onStreamRemoved;
    this.audioCtx = null;
  }

  _ctx() {
    if (!this.audioCtx)
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return this.audioCtx;
  }

  // Create a brand-new RTCPeerConnection for peerId
  async _buildPc(peerId, localStream, socket) {
    const pc = new RTCPeerConnection(ICE_CFG);
    const ctx = this._ctx();
    const gain = ctx.createGain();
    gain.gain.value = 1;
    gain.connect(ctx.destination);

    // Add local tracks
    localStream?.getTracks().forEach((t) => pc.addTrack(t, localStream));

    // Store before attaching callbacks so ontrack can look it up
    this.peers.set(peerId, { pc, gain, screenSender: null });

    pc.ontrack = (evt) => {
      const stream = evt.streams[0];
      const entry = this.peers.get(peerId);
      if (!entry) return;
      const isScreen =
        evt.track.contentHint === "detail" ||
        evt.track.label?.toLowerCase().includes("screen");
      if (isScreen) {
        this.onStream(peerId, stream, "screen");
      } else {
        this.onStream(peerId, stream, "camera");
        try {
          ctx.createMediaStreamSource(stream).connect(gain);
        } catch (_) {}
      }
    };

    pc.onicecandidate = (evt) => {
      if (evt.candidate)
        socket.emit("ice-candidate", {
          targetId: peerId,
          candidate: evt.candidate,
        });
    };

    pc.onconnectionstatechange = () => {
      if (["disconnected", "failed", "closed"].includes(pc.connectionState))
        this.removePeer(peerId);
    };

    return pc;
  }

  // Initiator path: create PC and send first offer
  async createPeer(peerId, localStream, socket) {
    if (this.peers.has(peerId)) return; // already connected
    const pc = await this._buildPc(peerId, localStream, socket);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("offer", { targetId: peerId, offer });
  }

  // Receiver path: handle incoming offer, reply with answer
  async handleOffer(peerId, offer, localStream, socket) {
    // Close stale connection if any
    if (this.peers.has(peerId)) {
      this.peers.get(peerId).pc.close();
      this.peers.delete(peerId);
    }
    const pc = await this._buildPc(peerId, localStream, socket);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit("answer", { targetId: peerId, answer });
  }

  async handleAnswer(peerId, answer) {
    const entry = this.peers.get(peerId);
    if (!entry) return;
    if (entry.pc.signalingState === "have-local-offer")
      await entry.pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async handleIce(peerId, candidate) {
    const entry = this.peers.get(peerId);
    if (!entry) return;
    try {
      await entry.pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (_) {}
  }

  // Spatial audio volume (0-1) based on distance
  setVolume(peerId, distance) {
    const entry = this.peers.get(peerId);
    if (!entry?.gain) return 0;
    let vol = 0;
    if (distance <= PROX_FULL) {
      vol = 1;
    } else if (distance < PROX_CUTOFF) {
      vol = 1 - (distance - PROX_FULL) / (PROX_CUTOFF - PROX_FULL);
    }
    vol = Math.max(0, Math.min(1, vol));
    try {
      entry.gain.gain.setTargetAtTime(vol, this.audioCtx.currentTime, 0.1);
    } catch (_) {}
    return vol;
  }

  // Add screen track to every active peer (renegotiate)
  async addScreenTrack(track, socket) {
    for (const [peerId, entry] of this.peers) {
      try {
        const sender = entry.pc.addTrack(track);
        entry.screenSender = sender;
        const offer = await entry.pc.createOffer();
        await entry.pc.setLocalDescription(offer);
        socket.emit("offer", { targetId: peerId, offer });
      } catch (e) {
        console.warn("[Screen] addTrack failed for", peerId, e.message);
      }
    }
  }

  // Remove screen track from every active peer (renegotiate)
  async removeScreenTrack(socket) {
    for (const [peerId, entry] of this.peers) {
      if (!entry.screenSender) continue;
      try {
        entry.pc.removeTrack(entry.screenSender);
        entry.screenSender = null;
        const offer = await entry.pc.createOffer();
        await entry.pc.setLocalDescription(offer);
        socket.emit("offer", { targetId: peerId, offer });
      } catch (e) {
        console.warn("[Screen] removeTrack failed for", peerId, e.message);
      }
    }
  }

  removePeer(peerId) {
    const entry = this.peers.get(peerId);
    if (!entry) return;
    entry.pc.close();
    this.peers.delete(peerId);
    this.onStreamRemoved(peerId);
  }

  removeAll() {
    [...this.peers.keys()].forEach((id) => this.removePeer(id));
  }
}

// ── useOffice hook ────────────────────────────────────────────────────────────
export function useOffice(spaceId, currentUser) {
  const socketRef = useRef(null);
  const pmRef = useRef(null);
  const myIdRef = useRef(null);
  const screenStreamRef = useRef(null);

  const [users, setUsers] = useState({});
  const [myUser, setMyUser] = useState(null);
  // streams: { [peerId]: { camera?: MediaStream, screen?: MediaStream } }
  const [streams, setStreams] = useState({});
  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [proximity, setProximity] = useState({});
  const [messages, setMessages] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeCalls, setActiveCalls] = useState(new Set());
  const [incomingRequest, setIncomingRequest] = useState(null);
  const [outgoingRequest, setOutgoingRequest] = useState(null);
  const [declinedBy, setDeclinedBy] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!spaceId || !currentUser) return;

    const token = localStorage.getItem("mv_token");
    const socket = io(SERVER, {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    const pm = new PeerManager({
      onStream: (peerId, stream, kind) =>
        setStreams((prev) => ({
          ...prev,
          [peerId]: { ...(prev[peerId] || {}), [kind]: stream },
        })),
      onStreamRemoved: (peerId) => {
        setStreams((prev) => {
          const n = { ...prev };
          delete n[peerId];
          return n;
        });
        setProximity((prev) => {
          const n = { ...prev };
          delete n[peerId];
          return n;
        });
        setActiveCalls((prev) => {
          const s = new Set(prev);
          s.delete(peerId);
          return s;
        });
      },
    });
    pmRef.current = pm;

    // ── Socket events ───────────────────────────────────────────────────────
    socket.on("connect", () => {
      setConnected(true);
      myIdRef.current = socket.id;
    });
    socket.on("disconnect", () => setConnected(false));

    socket.on("office-joined", ({ users: list, you }) => {
      setMyUser(you);
      const map = {};
      list.forEach((u) => {
        map[u.socketId] = u;
      });
      setUsers(map);
    });

    socket.on("office-user-joined", ({ user }) =>
      setUsers((prev) => ({ ...prev, [user.socketId]: user })),
    );

    socket.on("user-moved", ({ socketId, x, y }) =>
      setUsers((prev) =>
        prev[socketId]
          ? { ...prev, [socketId]: { ...prev[socketId], x, y } }
          : prev,
      ),
    );

    socket.on("user-state", ({ socketId, ...updates }) =>
      setUsers((prev) =>
        prev[socketId]
          ? { ...prev, [socketId]: { ...prev[socketId], ...updates } }
          : prev,
      ),
    );

    socket.on("office-user-left", ({ socketId }) => {
      setUsers((prev) => {
        const n = { ...prev };
        delete n[socketId];
        return n;
      });
      pm.removePeer(socketId);
      setActiveCalls((prev) => {
        const s = new Set(prev);
        s.delete(socketId);
        return s;
      });
    });

    socket.on("chat-message", (msg) =>
      setMessages((prev) => [...prev.slice(-299), msg]),
    );

    socket.on("emoji-reaction", ({ socketId, emoji }) => {
      const r = { id: Date.now() + Math.random(), socketId, emoji };
      setReactions((prev) => [...prev, r]);
      setTimeout(
        () => setReactions((prev) => prev.filter((x) => x.id !== r.id)),
        2500,
      );
    });

    socket.on("screen-share-started", ({ socketId }) =>
      setUsers((prev) =>
        prev[socketId]
          ? {
              ...prev,
              [socketId]: { ...prev[socketId], isScreenSharing: true },
            }
          : prev,
      ),
    );

    socket.on("screen-share-stopped", ({ socketId }) => {
      setUsers((prev) =>
        prev[socketId]
          ? {
              ...prev,
              [socketId]: { ...prev[socketId], isScreenSharing: false },
            }
          : prev,
      );
      setStreams((prev) => {
        if (!prev[socketId]) return prev;
        const updated = { ...prev[socketId] };
        delete updated.screen;
        return { ...prev, [socketId]: updated };
      });
    });

    // Talk permission
    socket.on("talk-request", (req) => {
      setActiveCalls((calls) => {
        if (!calls.has(req.fromId)) setIncomingRequest(req);
        return calls;
      });
    });

    socket.on("talk-response", ({ fromId, fromName, accepted }) => {
      setOutgoingRequest(null);
      if (!accepted) {
        setDeclinedBy(fromName);
        setTimeout(() => setDeclinedBy(null), 3500);
      }
    });

    socket.on("start-call", async ({ peerId, isInitiator }) => {
      const ls = await getLocalStream();
      setLocalStream(ls);
      if (isInitiator) await pm.createPeer(peerId, ls, socket);
      setActiveCalls((prev) => new Set([...prev, peerId]));
    });

    socket.on("call-ended", ({ fromId }) => {
      pm.removePeer(fromId);
      setActiveCalls((prev) => {
        const s = new Set(prev);
        s.delete(fromId);
        return s;
      });
    });

    // WebRTC signaling
    socket.on("offer", async ({ fromId, offer }) => {
      const ls = await getLocalStream();
      setLocalStream(ls);
      await pm.handleOffer(fromId, offer, ls, socket);
    });
    socket.on("answer", ({ fromId, answer }) =>
      pm.handleAnswer(fromId, answer),
    );
    socket.on("ice-candidate", ({ fromId, candidate }) =>
      pm.handleIce(fromId, candidate),
    );

    // Join the office
    socket.emit("join-office", {
      spaceId,
      userInfo: {
        name: currentUser.name,
        avatar: currentUser.avatar,
        avatarColor: currentUser.avatarColor || "#7c6dfa",
        role: currentUser.role,
      },
    });

    return () => {
      pm.removeAll();
      stopLocalStream();
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      socket.disconnect();
    };
  }, [spaceId, currentUser]);

  // ── Move avatar ─────────────────────────────────────────────────────────────
  const moveAvatar = useCallback((x, y) => {
    socketRef.current?.emit("move", { x, y });
    setMyUser((prev) => (prev ? { ...prev, x, y } : prev));
  }, []);

  // ── Update proximity volumes ────────────────────────────────────────────────
  const updateProximity = useCallback(
    (myX, myY) => {
      const pm = pmRef.current;
      if (!pm) return;
      const np = {};
      Object.values(users).forEach((u) => {
        const dist = Math.hypot((u.x || 0) - myX, (u.y || 0) - myY);
        let vol = 0;
        if (activeCalls.has(u.socketId)) vol = pm.setVolume(u.socketId, dist);
        np[u.socketId] = { dist, vol };
      });
      setProximity(np);
    },
    [users, activeCalls],
  );

  // ── Talk permission ─────────────────────────────────────────────────────────
  const requestTalk = useCallback(
    (targetId) => {
      const target = users[targetId];
      if (!target) return;
      socketRef.current?.emit("talk-request", { targetId });
      setOutgoingRequest({ toId: targetId, toName: target.name });
    },
    [users],
  );

  const acceptTalk = useCallback((fromId) => {
    socketRef.current?.emit("talk-response", {
      targetId: fromId,
      accepted: true,
    });
    setIncomingRequest(null);
    setActiveCalls((prev) => new Set([...prev, fromId]));
  }, []);

  const declineTalk = useCallback((fromId) => {
    socketRef.current?.emit("talk-response", {
      targetId: fromId,
      accepted: false,
    });
    setIncomingRequest(null);
  }, []);

  const endCall = useCallback((peerId) => {
    socketRef.current?.emit("end-call", { targetId: peerId });
    pmRef.current?.removePeer(peerId);
    setActiveCalls((prev) => {
      const s = new Set(prev);
      s.delete(peerId);
      return s;
    });
  }, []);

  // ── Send text message ───────────────────────────────────────────────────────
  const sendMessage = useCallback((text) => {
    if (!text?.trim()) return;
    socketRef.current?.emit("chat", { text: text.trim() });
  }, []);

  // ── Send file (chunked base64 over Socket.io) ───────────────────────────────
  const sendFile = useCallback((file) => {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error("No file provided"));
      if (file.size > 25 * 1024 * 1024)
        return reject(new Error("File too large. Maximum size is 25 MB."));

      const reader = new FileReader();
      reader.onerror = () =>
        reject(new Error("Failed to read file. Please try again."));
      reader.onload = (e) => {
        const base64 = e.target.result; // "data:mime;base64,..."
        const fileId = `file-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const meta = { name: file.name, size: file.size, mimeType: file.type };
        const totalChunks = Math.ceil(base64.length / CHUNK_CHARS);

        for (let i = 0; i < totalChunks; i++) {
          socketRef.current?.emit("file-chunk", {
            fileId,
            meta,
            chunkIndex: i,
            totalChunks,
            data: base64.slice(i * CHUNK_CHARS, (i + 1) * CHUNK_CHARS),
          });
        }
        resolve();
      };
      reader.readAsDataURL(file);
    });
  }, []);

  // ── Screen share ────────────────────────────────────────────────────────────
  const startScreenShare = useCallback(async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: false,
      });
      const track = displayStream.getVideoTracks()[0];
      track.contentHint = "detail"; // lets remote peers identify it as screen

      screenStreamRef.current = displayStream;
      setScreenStream(displayStream);
      setIsScreenSharing(true);

      socketRef.current?.emit("screen-share-start");
      socketRef.current?.emit("state-update", { isScreenSharing: true });

      await pmRef.current?.addScreenTrack(track, socketRef.current);

      // Auto-stop when user clicks "Stop sharing" in browser chrome
      track.onended = () => stopScreenShare();

      return displayStream;
    } catch (err) {
      if (err.name !== "NotAllowedError")
        console.error("[ScreenShare]", err.message);
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopScreenShare = useCallback(async () => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    setScreenStream(null);
    setIsScreenSharing(false);
    socketRef.current?.emit("screen-share-stop");
    socketRef.current?.emit("state-update", { isScreenSharing: false });
    await pmRef.current?.removeScreenTrack(socketRef.current);
  }, []);

  // ── Media toggles ───────────────────────────────────────────────────────────
  const toggleAudioCb = useCallback(() => {
    const muted = toggleAudio(localStream);
    setIsMuted(muted);
    socketRef.current?.emit("state-update", { isMuted: muted });
  }, [localStream]);

  const toggleVideoCb = useCallback(() => {
    const off = toggleVideo(localStream);
    setIsVideoOff(off);
    socketRef.current?.emit("state-update", { isVideoOff: off });
  }, [localStream]);

  const sendReaction = useCallback((emoji) => {
    socketRef.current?.emit("emoji", { emoji });
  }, []);

  return {
    myId: myIdRef.current,
    connected,
    users,
    myUser,
    streams,
    localStream,
    screenStream,
    proximity,
    messages,
    reactions,
    isMuted,
    isVideoOff,
    isScreenSharing,
    activeCalls,
    incomingRequest,
    outgoingRequest,
    declinedBy,
    moveAvatar,
    updateProximity,
    requestTalk,
    acceptTalk,
    declineTalk,
    cancelOutgoing: () => setOutgoingRequest(null),
    endCall,
    sendMessage,
    sendFile,
    sendReaction,
    startScreenShare,
    stopScreenShare,
    toggleAudio: toggleAudioCb,
    toggleVideo: toggleVideoCb,
  };
}
