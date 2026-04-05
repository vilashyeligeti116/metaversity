import { useEffect, useRef, useState } from 'react';
import { ROOMS } from './OfficeCanvas';

/* ─────────────────────────────────────────────────────────────────────────────
   MINIMAP
───────────────────────────────────────────────────────────────────────────── */
const WW = 2800, WH = 2000, MW = 180, MH = 128;
const SX = MW / WW, SY = MH / WH;

export default function OfficeMinimap({ myUser, users, activeCalls }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, MW, MH);
    ctx.fillStyle = '#060912';
    ctx.fillRect(0, 0, MW, MH);

    // Faint grid
    ctx.strokeStyle = 'rgba(124,109,250,0.04)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < MW; x += 18) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, MH); ctx.stroke(); }
    for (let y = 0; y < MH; y += 18) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(MW, y); ctx.stroke(); }

    // Rooms
    ROOMS.forEach(z => {
      ctx.fillStyle   = z.color;
      ctx.strokeStyle = z.border;
      ctx.lineWidth   = 0.8;
      ctx.beginPath();
      ctx.roundRect(z.x * SX, z.y * SY, z.w * SX, z.h * SY, 2);
      ctx.fill();
      ctx.stroke();
    });

    // Other users
    Object.values(users).forEach(u => {
      if (!u.x && !u.y) return;
      const inCall = activeCalls instanceof Set && activeCalls.has(u.socketId);
      ctx.fillStyle   = inCall ? '#34d399' : (u.avatarColor || '#7c6dfa');
      ctx.shadowColor = inCall ? '#34d399' : 'transparent';
      ctx.shadowBlur  = inCall ? 4 : 0;
      ctx.beginPath();
      ctx.arc(u.x * SX, u.y * SY, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // My position
    if (myUser) {
      ctx.fillStyle   = '#f5c842';
      ctx.shadowColor = '#f5c842';
      ctx.shadowBlur  = 6;
      ctx.beginPath();
      ctx.arc(myUser.x * SX, myUser.y * SY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }, [myUser, users, activeCalls]);

  return (
    <div style={{
      position: 'fixed', bottom: 76, left: 14,
      background: 'rgba(10,14,28,0.9)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 10, overflow: 'hidden', zIndex: 50, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    }}>
      <div style={{ padding: '3px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>MAP</span>
        <span style={{ fontSize: 8, fontFamily: 'monospace', color: 'rgba(255,255,255,0.2)' }}>
          <span style={{ color: '#f5c842' }}>● </span>you&nbsp;
          <span style={{ color: '#34d399' }}>● </span>call
        </span>
      </div>
      <canvas ref={ref} width={MW} height={MH} style={{ display: 'block' }} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   VIDEO PANEL
───────────────────────────────────────────────────────────────────────────── */
export function OfficeVideoPanel({ localStream, screenStream, streams, users, proximity, activeCalls, isMuted, isVideoOff, myUser }) {
  const visiblePeers = Object.entries(streams).filter(([pid]) => {
    const inCall = activeCalls instanceof Set && activeCalls.has(pid);
    const prox   = proximity[pid];
    return inCall && prox && prox.dist < 200;
  });

  if (!localStream && !screenStream && visiblePeers.length === 0) return null;

  return (
    <div style={{ position: 'fixed', top: 62, right: 14, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 50, maxHeight: 'calc(100vh - 90px)', overflowY: 'auto', paddingRight: 2 }}>
      {localStream && (
        <VideoBubble stream={localStream} user={myUser} vol={1} isLocal isMuted={isMuted} isVideoOff={isVideoOff} label="You" />
      )}
      {screenStream && (
        <ScreenBubble stream={screenStream} label="Your screen" isLocal />
      )}
      {visiblePeers
        .sort(([a], [b]) => (proximity[a]?.dist || 0) - (proximity[b]?.dist || 0))
        .map(([pid, streamSet]) => (
          <div key={pid} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {streamSet.camera && (
              <VideoBubble
                stream={streamSet.camera}
                user={users[pid]}
                vol={proximity[pid]?.vol || 0}
                isMuted={users[pid]?.isMuted}
                isVideoOff={users[pid]?.isVideoOff}
                label={users[pid]?.name || pid.slice(0, 6)}
              />
            )}
            {streamSet.screen && (
              <ScreenBubble stream={streamSet.screen} label={`${users[pid]?.name || 'Peer'}'s screen`} />
            )}
          </div>
        ))
      }
    </div>
  );
}

function VideoBubble({ stream, user, vol, isLocal, isMuted, isVideoOff, label }) {
  const ref     = useRef(null);
  const talking = !isMuted && vol > 0.3;

  useEffect(() => {
    if (ref.current && stream) ref.current.srcObject = stream;
    return () => { if (ref.current) ref.current.srcObject = null; };
  }, [stream]);

  return (
    <div style={{
      width: 148, position: 'relative', background: 'rgba(10,14,28,0.9)', borderRadius: 12,
      overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', flexShrink: 0,
      boxShadow: talking
        ? `0 0 0 2px ${user?.avatarColor || '#34d399'}, 0 0 16px ${user?.avatarColor || '#34d399'}44`
        : isLocal ? '0 0 0 2px rgba(245,200,66,0.5)' : 'none',
      transition: 'box-shadow 0.3s',
    }}>
      <video
        ref={ref} autoPlay muted={isLocal} playsInline
        style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block', background: '#06090f', transform: isLocal ? 'scaleX(-1)' : 'none', opacity: isVideoOff ? 0 : 1 }}
      />
      {isVideoOff && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(6,9,18,0.9)', fontSize: 24 }}>
          {user?.avatar || '😊'}
        </div>
      )}
      <div style={{ padding: '5px 7px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: '#e2e8f4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>{label}</span>
        <div style={{ display: 'flex', gap: 2 }}>
          {isMuted   && <span style={{ fontSize: 9 }}>🔇</span>}
          {talking   && <span style={{ fontSize: 8, color: '#34d399' }}>●</span>}
        </div>
      </div>
      {!isLocal && (
        <div style={{ height: 2, background: 'rgba(255,255,255,0.05)' }}>
          <div style={{ height: '100%', width: `${(vol || 0) * 100}%`, background: user?.avatarColor || '#7c6dfa', borderRadius: 1, transition: 'width 0.15s' }} />
        </div>
      )}
    </div>
  );
}

function ScreenBubble({ stream, label, isLocal }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && stream) ref.current.srcObject = stream;
    return () => { if (ref.current) ref.current.srcObject = null; };
  }, [stream]);
  return (
    <div style={{
      width: 148, position: 'relative', background: '#0a0f1a', borderRadius: 10,
      overflow: 'hidden', border: '2px solid rgba(96,165,250,0.4)', flexShrink: 0,
      boxShadow: isLocal ? '0 0 12px rgba(96,165,250,0.25)' : 'none',
    }}>
      <video ref={ref} autoPlay muted playsInline style={{ width: '100%', aspectRatio: '16/9', objectFit: 'contain', display: 'block', background: '#06090f' }} />
      <div style={{ padding: '4px 7px', display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ fontSize: 9 }}>🖥️</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: '#60a5fa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CHAT SIDEBAR
───────────────────────────────────────────────────────────────────────────── */
const EMOJIS = ['👋', '😂', '🎉', '❤️', '👍', '🔥', '💡', '🚀', '😮', '👏', '🤝', '✅'];

function formatBytes(bytes) {
  if (bytes < 1024)            return `${bytes} B`;
  if (bytes < 1024 * 1024)     return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
const isImage = mime => mime?.startsWith('image/');
const isVideo = mime => mime?.startsWith('video/');
const isAudio = mime => mime?.startsWith('audio/');

export function OfficeChat({ messages, users, myId, onSend, onSendFile, onReact, isOpen, onClose }) {
  const [text,     setText]     = useState('');
  const [sending,  setSending]  = useState(false);
  const [fileErr,  setFileErr]  = useState('');
  const [dragOver, setDragOver] = useState(false);
  const bottomRef              = useRef(null);
  const fileInputRef           = useRef(null);

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  function handleSendText(e) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText('');
  }

  async function handleFile(file) {
    if (!file) return;
    setFileErr('');
    setSending(true);
    try {
      await onSendFile(file);
    } catch (err) {
      setFileErr(err.message);
    } finally {
      setSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function downloadFile(msg) {
    const a      = document.createElement('a');
    a.href       = msg.file.data;
    a.download   = msg.file.name;
    a.click();
  }

  if (!isOpen) return null;

  return (
    <div
      style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 300, background: 'rgba(10,14,28,0.97)', borderLeft: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', zIndex: 80, animation: 'slideInRight 0.22s ease', boxShadow: '-6px 0 28px rgba(0,0,0,0.4)' }}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div style={{ padding: '13px 14px 11px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <span style={{ fontFamily: 'Cabinet Grotesk,sans-serif', fontSize: 14, fontWeight: 700, color: '#e2e8f4' }}>💬 Team Chat</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 14 }}>✕</button>
      </div>

      {/* Drag-over overlay */}
      {dragOver && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(96,165,250,0.1)', border: '2px dashed rgba(96,165,250,0.45)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', borderRadius: 4 }}>
          <div style={{ textAlign: 'center', color: '#60a5fa' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Drop file to share</div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.22)', fontSize: 12, marginTop: 40, lineHeight: 1.9 }}>
            👋 No messages yet<br />
            <span style={{ fontSize: 10 }}>Type below or drop a file to share</span>
          </div>
        )}
        {messages.map(msg =>
          msg.type === 'file'
            ? <FileBubble key={msg.id} msg={msg} isMe={msg.socketId === myId} onDownload={downloadFile} users={users} />
            : <TextBubble key={msg.id} msg={msg} isMe={msg.socketId === myId} users={users} />
        )}
        <div ref={bottomRef} />
      </div>

      {/* Emoji quick-react row */}
      <div style={{ display: 'flex', gap: 4, padding: '7px 10px', borderTop: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap', flexShrink: 0 }}>
        {EMOJIS.map(e => (
          <button key={e} onClick={() => { onReact(e); onSend(e); }}
            style={{ width: 28, height: 28, border: 'none', borderRadius: 6, background: 'rgba(255,255,255,0.05)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {e}
          </button>
        ))}
      </div>

      {/* File error */}
      {fileErr && (
        <div style={{ padding: '6px 12px', background: 'rgba(248,113,113,0.12)', fontSize: 11, color: '#f87171', flexShrink: 0 }}>
          ⚠️ {fileErr}
        </div>
      )}

      {/* Input row */}
      <div style={{ padding: '8px 10px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <form onSubmit={handleSendText} style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendText(e); } }}
            placeholder="Message… (Enter to send)"
            rows={1}
            style={{ flex: 1, padding: '8px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, color: '#e2e8f4', fontSize: 12, outline: 'none', fontFamily: 'Satoshi,sans-serif', resize: 'none', lineHeight: 1.5, maxHeight: 80, overflow: 'auto' }}
          />
          {/* Attach file */}
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={sending} title="Attach file (max 25 MB)"
            style={{ width: 34, height: 34, border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: sending ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)', cursor: sending ? 'wait' : 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {sending ? '⏳' : '📎'}
          </button>
          {/* Send */}
          <button type="submit" disabled={!text.trim()}
            style={{ width: 34, height: 34, border: 'none', borderRadius: 8, background: text.trim() ? '#7c6dfa' : 'rgba(124,109,250,0.2)', color: '#fff', fontWeight: 700, fontSize: 16, cursor: text.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
            ↑
          </button>
        </form>
        <input
          ref={fileInputRef} type="file" style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.zip,.rar"
        />
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.18)', marginTop: 5, textAlign: 'center' }}>
          Max 25 MB · images, docs, PDFs, zip · drag &amp; drop supported
        </div>
      </div>
    </div>
  );
}

function TextBubble({ msg, isMe, users }) {
  const color = users[msg.socketId]?.avatarColor || '#7c6dfa';
  return (
    <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start', flexDirection: isMe ? 'row-reverse' : 'row' }}>
      {!isMe && (
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: `${color}22`, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>
          {users[msg.socketId]?.avatar || '😊'}
        </div>
      )}
      <div style={{ maxWidth: 200 }}>
        {!isMe && <div style={{ fontSize: 9, fontWeight: 700, color, marginBottom: 3 }}>{msg.name}</div>}
        <div style={{ padding: '7px 10px', background: isMe ? 'rgba(124,109,250,0.18)' : 'rgba(255,255,255,0.06)', border: `1px solid ${isMe ? 'rgba(124,109,250,0.22)' : 'rgba(255,255,255,0.07)'}`, borderRadius: isMe ? '12px 12px 3px 12px' : '12px 12px 12px 3px' }}>
          <div style={{ fontSize: 12, color: '#e2e8f4', lineHeight: 1.55, wordBreak: 'break-word' }}>{msg.text}</div>
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', marginTop: 3, textAlign: isMe ? 'right' : 'left' }}>
          {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

function FileBubble({ msg, isMe, onDownload, users }) {
  const { file }  = msg;
  const color     = users[msg.socketId]?.avatarColor || '#7c6dfa';
  const ext       = file.name.split('.').pop().toUpperCase();

  return (
    <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start', flexDirection: isMe ? 'row-reverse' : 'row' }}>
      {!isMe && (
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: `${color}22`, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>
          {users[msg.socketId]?.avatar || '😊'}
        </div>
      )}
      <div style={{ maxWidth: 220 }}>
        {!isMe && <div style={{ fontSize: 9, fontWeight: 700, color, marginBottom: 3 }}>{msg.name}</div>}
        <div style={{ background: isMe ? 'rgba(124,109,250,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${isMe ? 'rgba(124,109,250,0.2)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 10, overflow: 'hidden' }}>

          {isImage(file.mimeType) && (
            <img src={file.data} alt={file.name}
              style={{ width: '100%', maxWidth: 220, display: 'block', cursor: 'pointer', borderRadius: '10px 10px 0 0' }}
              onClick={() => onDownload(msg)} />
          )}

          {isVideo(file.mimeType) && (
            <video controls style={{ width: '100%', maxWidth: 220, display: 'block', borderRadius: '10px 10px 0 0' }}>
              <source src={file.data} type={file.mimeType} />
            </video>
          )}

          {isAudio(file.mimeType) && (
            <div style={{ padding: '8px 10px' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 5 }}>🎵 {file.name}</div>
              <audio controls style={{ width: '100%', height: 32 }}>
                <source src={file.data} type={file.mimeType} />
              </audio>
            </div>
          )}

          {!isImage(file.mimeType) && !isVideo(file.mimeType) && !isAudio(file.mimeType) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>
                {file.mimeType === 'application/pdf' ? '📄' : '📁'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{ext} · {formatBytes(file.size)}</div>
              </div>
            </div>
          )}

          <button onClick={() => onDownload(msg)}
            style={{ width: '100%', padding: '6px', background: 'rgba(96,165,250,0.08)', border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', color: '#60a5fa', fontSize: 10, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontFamily: 'Satoshi,sans-serif' }}>
            ⬇️ Download · {formatBytes(file.size)}
          </button>
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', marginTop: 3, textAlign: isMe ? 'right' : 'left' }}>
          {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
