import { useEffect, useState } from 'react';

export function IncomingTalkRequest({ request, onAccept, onDecline }) {
  const [cd, setCd] = useState(20);
  useEffect(() => {
    if (!request) return;
    setCd(20);
    const iv = setInterval(() => setCd(c => { if(c<=1){onDecline(request.fromId);clearInterval(iv);return 0;} return c-1; }), 1000);
    return () => clearInterval(iv);
  }, [request, onDecline]);
  if (!request) return null;
  return (
    <div style={S.overlay}>
      <div style={S.modal} className="scale-in">
        <div style={S.pulseWrap}>
          <div style={{ ...S.ring, animationDelay:'0s' }}/><div style={{ ...S.ring, animationDelay:'0.4s' }}/>
          <div style={S.avaCircle}><span style={{ fontSize:28 }}>{request.fromAvatar||'😊'}</span></div>
        </div>
        <h3 style={S.title}>Talk request</h3>
        <p style={S.body}><strong style={{ color:request.fromColor||'#7c6dfa' }}>{request.fromName}</strong> wants to start a voice/video call.</p>
        <div style={S.timer}><div style={{ ...S.timerFill, width:`${(cd/20)*100}%` }}/></div>
        <p style={S.timerLbl}>Auto-declining in {cd}s</p>
        <div style={S.btnRow}>
          <button onClick={() => onDecline(request.fromId)} style={S.btnD}>✕ Decline</button>
          <button onClick={() => onAccept(request.fromId)} style={S.btnA}>✓ Accept</button>
        </div>
      </div>
    </div>
  );
}

export function OutgoingTalkRequest({ request, onCancel }) {
  if (!request) return null;
  return (
    <div style={S.toastWrap}>
      <div style={S.toast}>
        <div style={S.spinner}/>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'#e2e8f4' }}>Asking {request.toName} to talk…</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>Waiting for response</div>
        </div>
        <button onClick={onCancel} style={S.toastX}>✕</button>
      </div>
    </div>
  );
}

export function TalkDeclinedNotice({ name, onDismiss }) {
  useEffect(() => { const t=setTimeout(onDismiss,3500); return()=>clearTimeout(t); },[onDismiss]);
  return (
    <div style={S.toastWrap}>
      <div style={{ ...S.toast, borderColor:'rgba(248,113,113,0.3)' }}>
        <span style={{ fontSize:20 }}>🚫</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'#f87171' }}>{name} declined your request</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>Try again later</div>
        </div>
        <button onClick={onDismiss} style={S.toastX}>✕</button>
      </div>
    </div>
  );
}

const S = {
  overlay: { position:'fixed',inset:0,background:'rgba(0,0,0,0.72)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:500,backdropFilter:'blur(5px)',animation:'fadeIn 0.2s ease' },
  modal: { width:320,background:'#101526',border:'1px solid rgba(255,255,255,0.1)',borderRadius:20,padding:'28px 24px 22px',boxShadow:'0 8px 48px rgba(0,0,0,0.6)',textAlign:'center' },
  pulseWrap: { position:'relative',width:72,height:72,margin:'0 auto 18px',display:'flex',alignItems:'center',justifyContent:'center' },
  ring: { position:'absolute',inset:0,borderRadius:'50%',border:'2px solid rgba(124,109,250,0.35)',animation:'ripple 2s ease-out infinite' },
  avaCircle: { width:56,height:56,borderRadius:'50%',background:'rgba(124,109,250,0.12)',border:'2px solid rgba(124,109,250,0.3)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1,position:'relative' },
  title: { fontFamily:'Cabinet Grotesk,sans-serif',fontSize:17,fontWeight:700,color:'#e2e8f4',marginBottom:8 },
  body: { fontSize:13,color:'rgba(255,255,255,0.55)',lineHeight:1.6,marginBottom:14 },
  timer: { height:3,background:'rgba(255,255,255,0.08)',borderRadius:2,overflow:'hidden',marginBottom:5 },
  timerFill: { height:'100%',background:'#7c6dfa',borderRadius:2,transition:'width 1s linear' },
  timerLbl: { fontSize:10,color:'rgba(255,255,255,0.3)',marginBottom:18 },
  btnRow: { display:'flex',gap:10 },
  btnD: { flex:1,padding:'10px',background:'rgba(248,113,113,0.1)',border:'1px solid rgba(248,113,113,0.25)',borderRadius:10,color:'#f87171',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'Satoshi,sans-serif',transition:'all 0.18s' },
  btnA: { flex:1,padding:'10px',background:'rgba(52,211,153,0.1)',border:'1px solid rgba(52,211,153,0.25)',borderRadius:10,color:'#34d399',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'Satoshi,sans-serif',transition:'all 0.18s' },
  toastWrap: { position:'fixed',bottom:80,left:'50%',transform:'translateX(-50%)',zIndex:400 },
  toast: { display:'flex',alignItems:'center',gap:12,padding:'11px 16px',background:'rgba(10,14,28,0.95)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:40,boxShadow:'0 4px 24px rgba(0,0,0,0.45)',backdropFilter:'blur(12px)',minWidth:260,animation:'slideInUp 0.25s ease' },
  spinner: { width:17,height:17,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.1)',borderTopColor:'#7c6dfa',animation:'spin 0.8s linear infinite',flexShrink:0 },
  toastX: { background:'none',border:'none',color:'rgba(255,255,255,0.35)',cursor:'pointer',fontSize:14,padding:'2px 4px',borderRadius:4 },
};
