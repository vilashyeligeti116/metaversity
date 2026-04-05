const jwt = require("jsonwebtoken");
const SECRET = "metaversity-secret-2024";

const spaces = new Map(); // spaceId → Map<socketId, user>

module.exports = function attachSocket(io) {
  // ── Auth middleware ────────────────────────────────────────────────────────
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token"));
      const decoded = jwt.verify(token, SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    // ── JOIN OFFICE ──────────────────────────────────────────────────────────
    socket.on("join-office", ({ spaceId, userInfo }) => {
      socket.join(spaceId);
      if (!spaces.has(spaceId)) spaces.set(spaceId, new Map());
      const space = spaces.get(spaceId);
      const user = {
        socketId: socket.id,
        spaceId,
        ...userInfo,
        x: 400 + Math.random() * 200,
        y: 300 + Math.random() * 200,
        isScreenSharing: false,
      };
      space.set(socket.id, user);
      socket.emit("office-joined", {
        users: [...space.values()].filter((u) => u.socketId !== socket.id),
        you: user,
      });
      socket.to(spaceId).emit("office-user-joined", { user });
    });

    // ── AVATAR MOVEMENT ──────────────────────────────────────────────────────
    socket.on("move", ({ x, y }) => {
      _forSpace(socket, (space, spaceId) => {
        const u = space.get(socket.id);
        u.x = x;
        u.y = y;
        socket.to(spaceId).emit("user-moved", { socketId: socket.id, x, y });
      });
    });

    // ── STATE (mute / video / screenshare flag) ──────────────────────────────
    socket.on("state-update", (updates) => {
      _forSpace(socket, (space, spaceId) => {
        Object.assign(space.get(socket.id), updates);
        socket
          .to(spaceId)
          .emit("user-state", { socketId: socket.id, ...updates });
      });
    });

    // ── CHAT TEXT MESSAGE ────────────────────────────────────────────────────
    socket.on("chat", ({ text }) => {
      _forSpace(socket, (space, spaceId) => {
        const u = space.get(socket.id);
        io.to(spaceId).emit("chat-message", {
          id: Date.now() + Math.random(),
          socketId: socket.id,
          name: u.name,
          avatar: u.avatar,
          color: u.avatarColor,
          type: "text",
          text,
          ts: Date.now(),
        });
      });
    });

    // ── FILE MESSAGE (base64 payload) ────────────────────────────────────────
    // Files are chunked client-side into ≤512 KB slices and reassembled here
    // so we never hit socket message size limits.

    const fileBuffers = new Map(); // fileId → { meta, chunks:[], received }

    socket.on(
      "file-chunk",
      ({ fileId, meta, chunkIndex, totalChunks, data }) => {
        if (!fileBuffers.has(fileId)) {
          fileBuffers.set(fileId, {
            meta,
            chunks: new Array(totalChunks),
            received: 0,
          });
        }
        const buf = fileBuffers.get(fileId);
        buf.chunks[chunkIndex] = data;
        buf.received++;

        // All chunks received — reassemble and broadcast
        if (buf.received === totalChunks) {
          const fullData = buf.chunks.join("");
          fileBuffers.delete(fileId);

          _forSpace(socket, (space, spaceId) => {
            const u = space.get(socket.id);
            io.to(spaceId).emit("chat-message", {
              id: fileId,
              socketId: socket.id,
              name: u.name,
              avatar: u.avatar,
              color: u.avatarColor,
              type: "file",
              file: {
                name: meta.name,
                size: meta.size,
                mimeType: meta.mimeType,
                data: fullData, // full base64 string
              },
              ts: Date.now(),
            });
          });
        }
      },
    );

    // ── SCREEN SHARE SIGNALING ────────────────────────────────────────────────
    // When a user starts screen share, we notify all peers to expect a new
    // video track. The actual track goes P2P via WebRTC renegotiation.
    socket.on("screen-share-start", () => {
      _forSpace(socket, (space, spaceId) => {
        const u = space.get(socket.id);
        u.isScreenSharing = true;
        socket
          .to(spaceId)
          .emit("screen-share-started", { socketId: socket.id, name: u.name });
        socket
          .to(spaceId)
          .emit("user-state", { socketId: socket.id, isScreenSharing: true });
      });
    });

    socket.on("screen-share-stop", () => {
      _forSpace(socket, (space, spaceId) => {
        const u = space.get(socket.id);
        u.isScreenSharing = false;
        socket
          .to(spaceId)
          .emit("screen-share-stopped", { socketId: socket.id });
        socket
          .to(spaceId)
          .emit("user-state", { socketId: socket.id, isScreenSharing: false });
      });
    });

    // ── EMOJI REACTION ────────────────────────────────────────────────────────
    socket.on("emoji", ({ emoji }) => {
      _forSpace(socket, (space, spaceId) => {
        io.to(spaceId).emit("emoji-reaction", { socketId: socket.id, emoji });
      });
    });

    // ── TALK PERMISSION ───────────────────────────────────────────────────────
    socket.on("talk-request", ({ targetId }) => {
      _forSpace(socket, (space) => {
        const u = space.get(socket.id);
        io.to(targetId).emit("talk-request", {
          fromId: socket.id,
          fromName: u.name,
          fromColor: u.avatarColor,
          fromAvatar: u.avatar,
        });
      });
    });

    socket.on("talk-response", ({ targetId, accepted }) => {
      _forSpace(socket, (space) => {
        const u = space.get(socket.id);
        io.to(targetId).emit("talk-response", {
          fromId: socket.id,
          fromName: u.name,
          accepted,
        });
        if (accepted) {
          io.to(targetId).emit("start-call", {
            peerId: socket.id,
            isInitiator: true,
          });
          socket.emit("start-call", { peerId: targetId, isInitiator: false });
        }
      });
    });

    socket.on("end-call", ({ targetId }) => {
      io.to(targetId).emit("call-ended", { fromId: socket.id });
    });

    // ── WEBRTC SIGNALING ──────────────────────────────────────────────────────
    socket.on("offer", ({ targetId, offer }) =>
      io.to(targetId).emit("offer", { fromId: socket.id, offer }),
    );
    socket.on("answer", ({ targetId, answer }) =>
      io.to(targetId).emit("answer", { fromId: socket.id, answer }),
    );
    socket.on("ice-candidate", ({ targetId, candidate }) =>
      io.to(targetId).emit("ice-candidate", { fromId: socket.id, candidate }),
    );

    // ── DISCONNECT ─────────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      spaces.forEach((space, spaceId) => {
        if (space.has(socket.id)) {
          space.delete(socket.id);
          io.to(spaceId).emit("office-user-left", { socketId: socket.id });
          io.to(spaceId).emit("screen-share-stopped", { socketId: socket.id });
        }
      });
    });
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  function _forSpace(socket, cb) {
    spaces.forEach((space, spaceId) => {
      if (space.has(socket.id)) cb(space, spaceId);
    });
  }
};
