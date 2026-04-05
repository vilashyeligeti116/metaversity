import { useState } from 'react';
import { useAuth }   from '../../contexts/AuthContext';
import { useOffice } from '../../hooks/useOffice';
import OfficeCanvas, { ROOMS } from './OfficeCanvas';
import { IncomingTalkRequest, OutgoingTalkRequest, TalkDeclinedNotice } from './TalkPermission';
import OfficeMinimap, { OfficeVideoPanel, OfficeChat } from './OfficeSubComponents';

export default function OfficePage({ spaceId, officeName, onLeave }) {
  const { user } = useAuth();
  const o        = useOffice(spaceId, user);

  const [chatOpen,  setChatOpen]  = useState(false);
  const [screenErr, setScreenErr] = useState('');
  const [seenCount, setSeenCount] = useState(0);

  const userCount  = Object.keys(o.users).length + 1;
  const unread     = chatOpen ? 0 : Math.max(0, o.messages.length - seenCount);
  const myRoom     = o.myUser
    ? ROOMS.find(r => o.myUser.x >= r.x && o.myUser.x <= r.x + r.w && o.myUser.y >= r.y && o.myUser.y <= r.y + r.h)
    : null;
  const screenSharers = Object.values(o.users).filter(u => u.isScreenSharing);

  function openChat()  { setChatOpen(true);  setSeenCount(o.messages.length); }
  function closeChat() { setChatOpen(false);  setSeenCount(o.messages.length); }

  async function handleScreenShare() {
    setScreenErr('');
    if (o.isScreenSharing) {
      await o.stopScreenShare();
    } else {
      const stream = await o.startScreenShare();
      if (!stream) setScreenErr('Screen share cancelled or not allowed.');
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#060912', overflow: 'hidden', fontFamily: 'Satoshi,sans-serif' }}>

      {/* World canvas */}
      <OfficeCanvas
        myUser={o.myUser}
        users={o.users}
        proximity={o.proximity}
        reactions={o.reactions}
        activeCalls={o.activeCalls}
        onMove={o.moveAvatar}
        onUpdateProximity={o.updateProximity}
        onRequestTalk={o.requestTalk}
      />

      {/* ── Top bar ── */}
      <div style={S.topBar}>
        <div style={S.topLeft}>
          <div style={S.officeIcon}>🏢</div>
          <div>
            <div style={S.officeName}>{officeName || 'Virtual Office'}</div>
            <div style={S.spaceId}>#{spaceId}</div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', overflow: 'hidden' }}>
          {myRoom && (
            <div style={S.roomChip}>
              <div style={S.roomDot} />
              <span style={{ fontSize: 12, color: '#e2e8f4', fontWeight: 600 }}>{myRoom.label}</span>
            </div>
          )}
          {o.isScreenSharing && (
            <div style={S.myScreenBadge}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#60a5fa', animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#60a5fa' }}>You are sharing screen</span>
            </div>
          )}
          {screenSharers.length > 0 && !o.isScreenSharing && (
            <div style={S.screenBadge}>
              <span style={{ fontSize: 11 }}>🖥️</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#60a5fa' }}>
                {screenSharers.map(u => u.name).join(', ')} sharing
              </span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <div style={S.onlineBadge}>
            <div style={S.onlineDot} />
            {userCount} online
          </div>
          <button onClick={onLeave} style={S.leaveBtn}>Leave</button>
        </div>
      </div>

      {/* Video + screen bubbles */}
      <OfficeVideoPanel
        localStream={o.localStream}
        screenStream={o.screenStream}
        streams={o.streams}
        users={o.users}
        proximity={o.proximity}
        activeCalls={o.activeCalls}
        isMuted={o.isMuted}
        isVideoOff={o.isVideoOff}
        myUser={o.myUser}
      />

      {/* Minimap */}
      <OfficeMinimap myUser={o.myUser} users={o.users} activeCalls={o.activeCalls} />

      {/* Chat sidebar */}
      <OfficeChat
        messages={o.messages}
        users={o.users}
        myId={o.myId}
        onSend={o.sendMessage}
        onSendFile={o.sendFile}
        onReact={o.sendReaction}
        isOpen={chatOpen}
        onClose={closeChat}
      />

      {/* ── Bottom control bar ── */}
      <div style={S.bottomBar}>
        {/* Active call chips */}
        <div style={{ display: 'flex', gap: 8, flex: 1, overflow: 'hidden' }}>
          {[...o.activeCalls].map(pid => (
            <div key={pid} style={S.callChip}>
              <div style={S.callDot} />
              <span style={S.callName}>{o.users[pid]?.avatar} {o.users[pid]?.name || pid.slice(0, 6)}</span>
              <button onClick={() => o.endCall(pid)} style={S.endCallBtn} title="End call">✕</button>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 6 }}>
          <CtrlBtn
            icon={o.isMuted ? '🔇' : '🎤'}
            label={o.isMuted ? 'Unmute' : 'Mute'}
            active={o.isMuted}
            onClick={o.toggleAudio}
          />
          <CtrlBtn
            icon={o.isVideoOff ? '📵' : '📹'}
            label={o.isVideoOff ? 'Cam Off' : 'Camera'}
            active={o.isVideoOff}
            onClick={o.toggleVideo}
          />
          <CtrlBtn
            icon="🖥️"
            label={o.isScreenSharing ? 'Stop Share' : 'Share Screen'}
            active={o.isScreenSharing}
            activeColor="rgba(96,165,250,0.15)"
            activeBorder="rgba(96,165,250,0.4)"
            activeTextColor="#60a5fa"
            onClick={handleScreenShare}
          />
          <CtrlBtn
            icon="💬"
            label={unread > 0 ? `Chat (${unread})` : 'Chat'}
            highlight={chatOpen}
            badge={unread}
            onClick={openChat}
          />
          <CtrlBtn
            icon="😊"
            label="React"
            onClick={() => o.sendReaction(['🎉', '👍', '🔥', '😂', '❤️', '💡'][Math.floor(Math.random() * 6)])}
          />
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', fontFamily: 'monospace' }}>
            WASD / arrows · click to move · 📎 drop files in chat
          </span>
        </div>
      </div>

      {/* Permission modals */}
      <IncomingTalkRequest request={o.incomingRequest} onAccept={o.acceptTalk} onDecline={o.declineTalk} />
      <OutgoingTalkRequest request={o.outgoingRequest} onCancel={o.cancelOutgoing} />
      {o.declinedBy && <TalkDeclinedNotice name={o.declinedBy} onDismiss={() => {}} />}

      {/* Screen share error */}
      {screenErr && (
        <div style={S.toast} onClick={() => setScreenErr('')}>⚠️ {screenErr}</div>
      )}

      {/* Disconnected */}
      {!o.connected && (
        <div style={S.disc}>⚠️ Reconnecting to office…</div>
      )}

      <style>{`
        @keyframes pulse      { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes spin       { to{transform:rotate(360deg)} }
        @keyframes fadeIn     { from{opacity:0} to{opacity:1} }
        @keyframes scaleIn    { from{opacity:0;transform:scale(.93)} to{opacity:1;transform:scale(1)} }
        @keyframes slideInUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
        @keyframes slideInRight { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:none} }
        @keyframes ripple     { 0%{transform:scale(.8);opacity:.8} 100%{transform:scale(2.4);opacity:0} }
        audio::-webkit-media-controls-panel { background: rgba(10,14,28,0.8); }
      `}</style>
    </div>
  );
}

function CtrlBtn({ icon, label, active, highlight, badge, onClick,
  activeColor    = 'rgba(248,113,113,0.12)',
  activeBorder   = 'rgba(248,113,113,0.3)',
  activeTextColor = '#f87171',
}) {
  return (
    <button onClick={onClick} style={{
      position: 'relative',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      padding: '7px 14px',
      border: `1px solid ${active ? activeBorder : highlight ? 'rgba(124,109,250,0.3)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 10,
      background: active ? activeColor : highlight ? 'rgba(124,109,250,0.12)' : 'rgba(255,255,255,0.04)',
      cursor: 'pointer', fontFamily: 'Satoshi,sans-serif', transition: 'all 0.18s ease', minWidth: 56,
    }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: 600, color: active ? activeTextColor : highlight ? '#7c6dfa' : 'rgba(255,255,255,0.55)' }}>
        {label}
      </span>
      {badge > 0 && (
        <span style={{ position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, borderRadius: 8, background: '#f87171', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}

const S = {
  topBar:       { position: 'fixed', top: 0, left: 0, right: 0, height: 54, background: 'rgba(6,9,18,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 14, zIndex: 60 },
  topLeft:      { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 },
  officeIcon:   { width: 34, height: 34, borderRadius: 8, background: 'rgba(124,109,250,0.15)', border: '1px solid rgba(124,109,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 },
  officeName:   { fontFamily: 'Cabinet Grotesk,sans-serif', fontSize: 14, fontWeight: 800, color: '#e2e8f4', lineHeight: 1 },
  spaceId:      { fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' },
  roomChip:     { display: 'flex', alignItems: 'center', gap: 7, padding: '4px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20 },
  roomDot:      { width: 7, height: 7, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399', animation: 'pulse 1.5s ease-in-out infinite' },
  screenBadge:  { display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 20 },
  myScreenBadge:{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 12px', background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.4)', borderRadius: 20 },
  onlineBadge:  { display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 20, fontSize: 11, fontWeight: 600, color: '#34d399' },
  onlineDot:    { width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399' },
  leaveBtn:     { padding: '6px 14px', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 8, color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Satoshi,sans-serif' },
  bottomBar:    { position: 'fixed', bottom: 0, left: 0, right: 0, height: 70, background: 'rgba(6,9,18,0.92)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, zIndex: 60 },
  callChip:     { display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 20, flexShrink: 0 },
  callDot:      { width: 7, height: 7, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399', animation: 'pulse 1.5s ease-in-out infinite' },
  callName:     { fontSize: 12, fontWeight: 600, color: '#34d399', whiteSpace: 'nowrap' },
  endCallBtn:   { background: 'none', border: 'none', color: 'rgba(52,211,153,0.6)', cursor: 'pointer', fontSize: 12, padding: '0 2px', lineHeight: 1 },
  disc:         { position: 'fixed', top: 62, left: '50%', transform: 'translateX(-50%)', background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 20, padding: '6px 16px', color: '#f87171', fontSize: 12, fontWeight: 600, zIndex: 200 },
  toast:        { position: 'fixed', bottom: 82, left: '50%', transform: 'translateX(-50%)', background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 20, padding: '8px 18px', color: '#f87171', fontSize: 12, fontWeight: 600, zIndex: 200, cursor: 'pointer', animation: 'slideInUp 0.25s ease' },
};
