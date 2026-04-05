// ── Button ────────────────────────────────────────────────────────────────────
export function Btn({ children, variant='primary', size='md', onClick, disabled, type='button', style={} }) {
  const base = { display:'inline-flex', alignItems:'center', justifyContent:'center', gap:7,
    border:'none', borderRadius:'var(--r-md)', cursor:'pointer', fontFamily:'var(--font-body)',
    fontWeight:600, transition:'var(--t)', outline:'none', whiteSpace:'nowrap',
  };
  const sizes = {
    sm: { padding:'6px 14px', fontSize:12 },
    md: { padding:'10px 20px', fontSize:14 },
    lg: { padding:'13px 28px', fontSize:15 },
  };
  const variants = {
    primary: { background:'var(--accent)', color:'#fff', boxShadow:'0 4px 20px rgba(124,109,250,0.3)' },
    secondary:{ background:'var(--bg4)', color:'var(--text1)', border:'1px solid var(--border2)' },
    ghost:   { background:'transparent', color:'var(--text2)', border:'1px solid var(--border)' },
    danger:  { background:'var(--red-dim)', color:'var(--red)', border:'1px solid rgba(248,113,113,0.25)' },
    success: { background:'var(--green-dim)', color:'var(--green)', border:'1px solid rgba(52,211,153,0.25)' },
    gold:    { background:'var(--gold-dim)', color:'var(--gold)', border:'1px solid rgba(245,200,66,0.25)' },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style={}, onClick, hover=false, glow=false }) {
  return (
    <div onClick={onClick} style={{
      background:'var(--bg2)', border:'1px solid var(--border)',
      borderRadius:'var(--r-lg)', padding:24,
      transition:'var(--t)',
      ...(hover && { cursor:'pointer' }),
      ...(glow  && { boxShadow:'var(--sh-accent)' }),
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── StatusBadge ───────────────────────────────────────────────────────────────
const STATUS_CFG = {
  draft:           { label:'Draft',           color:'var(--text3)',  bg:'var(--bg4)' },
  submitted:       { label:'Submitted',       color:'var(--blue)',   bg:'var(--blue-dim)' },
  under_review:    { label:'Under Review',    color:'var(--orange)', bg:'var(--orange-dim)' },
  expert_reviewed: { label:'Expert Reviewed', color:'var(--teal)',   bg:'var(--teal-dim)' },
  approved:        { label:'Approved',        color:'var(--green)',  bg:'var(--green-dim)' },
  rejected:        { label:'Rejected',        color:'var(--red)',    bg:'var(--red-dim)' },
  office_assigned: { label:'Office Live 🚀',  color:'var(--gold)',   bg:'var(--gold-dim)' },
};
const PLAN_CFG = {
  starter: { label:'Starter', color:'var(--teal)',   bg:'var(--teal-dim)' },
  growth:  { label:'Growth',  color:'var(--accent)', bg:'var(--accent-dim)' },
  scale:   { label:'Scale',   color:'var(--gold)',   bg:'var(--gold-dim)' },
};

export function StatusBadge({ status, size='sm' }) {
  const cfg = STATUS_CFG[status] || { label: status, color:'var(--text2)', bg:'var(--bg4)' };
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      padding: size==='sm' ? '3px 9px' : '5px 13px',
      borderRadius:'var(--r-full)',
      fontSize: size==='sm' ? 11 : 13,
      fontWeight:700, letterSpacing:'0.03em',
      background:cfg.bg, color:cfg.color,
    }}>
      {cfg.label}
    </span>
  );
}

export function PlanBadge({ plan }) {
  const cfg = PLAN_CFG[plan] || { label:plan, color:'var(--text2)', bg:'var(--bg4)' };
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      padding:'3px 9px', borderRadius:'var(--r-full)',
      fontSize:11, fontWeight:700, background:cfg.bg, color:cfg.color,
    }}>
      {cfg.label}
    </span>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({ label, helper, error, style={}, ...props }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5, ...style }}>
      {label && <label style={L.label}>{label}</label>}
      <input style={{ ...L.input, ...(error ? { borderColor:'rgba(248,113,113,0.4)' } : {}) }} {...props}/>
      {error  && <span style={{ fontSize:11, color:'var(--red)' }}>{error}</span>}
      {helper && <span style={{ fontSize:11, color:'var(--text3)' }}>{helper}</span>}
    </div>
  );
}

export function Textarea({ label, helper, error, style={}, ...props }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5, ...style }}>
      {label && <label style={L.label}>{label}</label>}
      <textarea style={{ ...L.input, resize:'vertical', minHeight:90, ...(error?{borderColor:'rgba(248,113,113,0.4)'}:{}) }} {...props}/>
      {error  && <span style={{ fontSize:11, color:'var(--red)' }}>{error}</span>}
      {helper && <span style={{ fontSize:11, color:'var(--text3)' }}>{helper}</span>}
    </div>
  );
}

export function Select({ label, options, style={}, ...props }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5, ...style }}>
      {label && <label style={L.label}>{label}</label>}
      <select style={{ ...L.input, cursor:'pointer' }} {...props}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

const L = {
  label: { fontSize:12, fontWeight:600, letterSpacing:'0.05em', color:'var(--text2)', textTransform:'uppercase' },
  input: {
    padding:'10px 13px', background:'var(--bg1)', border:'1px solid var(--border2)',
    borderRadius:'var(--r-md)', color:'var(--text1)', fontSize:14, outline:'none',
    fontFamily:'var(--font-body)', transition:'border-color var(--t)', width:'100%',
  },
};

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size=20, color='var(--accent)' }) {
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', border:`2px solid rgba(255,255,255,0.1)`,
      borderTopColor:color, animation:'spin 0.8s linear infinite', flexShrink:0 }}/>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ title, children, onClose, width=500 }) {
  return (
    <div style={M.overlay} onClick={e => e.target===e.currentTarget && onClose?.()}>
      <div style={{ ...M.box, maxWidth:width }} className="scale-in">
        <div style={M.header}>
          <span style={M.title}>{title}</span>
          {onClose && <button onClick={onClose} style={M.close}>✕</button>}
        </div>
        <div style={M.body}>{children}</div>
      </div>
    </div>
  );
}

const M = {
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex',
    alignItems:'center', justifyContent:'center', zIndex:900, backdropFilter:'blur(6px)',
    padding:20, animation:'fadeIn 0.2s ease' },
  box: { width:'100%', background:'var(--bg2)', border:'1px solid var(--border2)',
    borderRadius:'var(--r-xl)', overflow:'hidden', boxShadow:'var(--sh-lg)' },
  header: { padding:'20px 24px 16px', borderBottom:'1px solid var(--border)',
    display:'flex', alignItems:'center', justifyContent:'space-between' },
  title: { fontFamily:'var(--font-display)', fontSize:17, fontWeight:700, color:'var(--text1)' },
  close: { background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:16, padding:'2px 6px' },
  body: { padding:'20px 24px 24px' },
};

// ── ScoreRing (for expert review scores) ─────────────────────────────────────
export function ScoreRing({ score, max=10, label, color='var(--accent)' }) {
  const pct = (score / max) * 100;
  const r = 28, circ = 2 * Math.PI * r;
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
      <svg width={72} height={72} viewBox="0 0 72 72">
        <circle cx={36} cy={36} r={r} fill="none" stroke="var(--bg4)" strokeWidth={5}/>
        <circle cx={36} cy={36} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)}
          strokeLinecap="round" transform="rotate(-90 36 36)"/>
        <text x={36} y={40} textAnchor="middle" fontSize={18} fontWeight={700}
          fill="var(--text1)" fontFamily="var(--font-display)">{score}</text>
      </svg>
      <span style={{ fontSize:10, color:'var(--text3)', fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase' }}>{label}</span>
    </div>
  );
}

// ── Pipeline Step ─────────────────────────────────────────────────────────────
const STEPS = [
  { key:'submitted',       icon:'📤', label:'Submitted' },
  { key:'under_review',    icon:'🔍', label:'Under Review' },
  { key:'expert_reviewed', icon:'✅', label:'Expert Reviewed' },
  { key:'approved',        icon:'🎉', label:'Approved' },
  { key:'office_assigned', icon:'🏢', label:'Office Assigned' },
];

export function PipelineTracker({ status }) {
  const order = ['draft','submitted','under_review','expert_reviewed','approved','office_assigned'];
  const cur   = order.indexOf(status);
  return (
    <div style={{ display:'flex', alignItems:'center', gap:0 }}>
      {STEPS.map((s, i) => {
        const si = order.indexOf(s.key);
        const done   = cur >= si;
        const active = status === s.key;
        return (
          <div key={s.key} style={{ display:'flex', alignItems:'center', flex: i < STEPS.length-1 ? 1 : 0 }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
              <div style={{
                width:34, height:34, borderRadius:'50%', border:`2px solid`,
                borderColor: done ? (active?'var(--accent)':'var(--green)') : 'var(--border2)',
                background: done ? (active?'var(--accent-dim)':'var(--green-dim)') : 'var(--bg3)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:15, transition:'var(--t)',
                boxShadow: active ? 'var(--sh-accent)' : 'none',
              }}>
                {status==='rejected' && s.key==='approved' ? '❌' : s.icon}
              </div>
              <span style={{ fontSize:9, color:done?'var(--text2)':'var(--text4)', fontWeight:600,
                letterSpacing:'0.04em', textTransform:'uppercase', textAlign:'center', maxWidth:60 }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length-1 && (
              <div style={{ flex:1, height:2, margin:'0 4px', marginBottom:18,
                background: cur>si ? 'var(--green)' : 'var(--border)', borderRadius:1, transition:'var(--t)' }}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
export function StatCard({ icon, label, value, color='var(--accent)', sub }) {
  return (
    <div style={{ background:'var(--bg2)', border:'1px solid var(--border)',
      borderRadius:'var(--r-lg)', padding:'18px 20px', display:'flex', flexDirection:'column', gap:8 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:22 }}>{icon}</span>
        <span style={{ fontSize:28, fontWeight:800, color, fontFamily:'var(--font-display)' }}>{value}</span>
      </div>
      <div>
        <div style={{ fontSize:13, fontWeight:600, color:'var(--text1)' }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function Empty({ icon='📭', title, sub, action }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, padding:'48px 24px', textAlign:'center' }}>
      <span style={{ fontSize:40 }}>{icon}</span>
      <div style={{ fontFamily:'var(--font-display)', fontSize:17, fontWeight:700, color:'var(--text1)' }}>{title}</div>
      {sub && <div style={{ fontSize:13, color:'var(--text3)', maxWidth:280, lineHeight:1.6 }}>{sub}</div>}
      {action}
    </div>
  );
}

// ── Notification Bell ─────────────────────────────────────────────────────────
export function NotifBell({ count, onClick }) {
  return (
    <button onClick={onClick} style={{ position:'relative', background:'var(--bg4)', border:'1px solid var(--border2)',
      borderRadius:'var(--r-md)', padding:'8px 10px', cursor:'pointer', fontSize:16 }}>
      🔔
      {count > 0 && (
        <span style={{ position:'absolute', top:-5, right:-5, minWidth:18, height:18, borderRadius:9,
          background:'var(--red)', color:'#fff', fontSize:9, fontWeight:700,
          display:'flex', alignItems:'center', justifyContent:'center', padding:'0 4px' }}>
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
}
