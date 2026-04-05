import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userApi }  from '../../utils/api';
import { NotifBell } from './UI';

export default function Navbar({ page, setPage }) {
  const { user, logout } = useAuth();
  const [notifs,    setNotifs]    = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [showMenu,  setShowMenu]  = useState(false);

  useEffect(() => {
    if (!user) return;
    userApi.notifications().then(d => setNotifs(d.notifications || [])).catch(()=>{});
    const iv = setInterval(() => {
      userApi.notifications().then(d => setNotifs(d.notifications||[])).catch(()=>{});
    }, 15000);
    return () => clearInterval(iv);
  }, [user]);

  const unread = notifs.filter(n => !n.read).length;

  const linksByRole = {
    founder:  [
      { key:'home',    icon:'🏠', label:'Home' },
      { key:'submit',  icon:'💡', label:'Submit Idea' },
      { key:'ideas',   icon:'📋', label:'My Ideas' },
      { key:'team',    icon:'👥', label:'My Team' },
      { key:'office',  icon:'🏢', label:'My Office', show: !!user?.officeId },
    ],
    employee: [
      { key:'home',    icon:'🏠', label:'Home' },
      { key:'office',  icon:'🏢', label:'My Office', show: !!user?.officeId },
    ],
    expert: [
      { key:'home',    icon:'🏠', label:'Home' },
      { key:'queue',   icon:'📬', label:'Review Queue' },
    ],
    admin: [
      { key:'home',      icon:'🏠',  label:'Home' },
      { key:'dashboard', icon:'📊',  label:'Dashboard' },
      { key:'ideas',     icon:'💡',  label:'Ideas' },
      { key:'experts',   icon:'🧑‍💼', label:'Experts' },
      { key:'offices',   icon:'🏢',  label:'Offices' },
      { key:'users',     icon:'👥',  label:'Users' },
    ],
  };

  const myLinks = (linksByRole[user?.role] || []).filter(l => l.show !== false);

  const roleBadge = {
    admin:    { label:'👑 Admin',    bg:'var(--gold-dim)',    color:'var(--gold)'   },
    expert:   { label:'🧑‍💼 Expert',  bg:'var(--orange-dim)', color:'var(--orange)' },
    founder:  { label:'🎓 Founder',  bg:'var(--accent-dim)', color:'var(--accent)' },
    employee: { label:'👷 Employee', bg:'var(--blue-dim)',    color:'var(--blue)'   },
  }[user?.role] || { label:user?.role, bg:'var(--bg4)', color:'var(--text2)' };

  function handleReadAll() {
    userApi.readAll().then(() => setNotifs(prev => prev.map(n => ({ ...n, read:true }))));
    setShowNotif(false);
  }

  return (
    <nav style={S.nav}>
      <div style={S.logo} onClick={() => setPage('home')}>
        <div style={S.logoMark}><span style={{ fontSize:18 }}>🌐</span></div>
        <div>
          <div style={S.logoName}>Metaversity</div>
          <div style={S.logoSub}>Startup Incubator</div>
        </div>
      </div>

      <div style={S.links}>
        {myLinks.map(l => (
          <button key={l.key} onClick={() => setPage(l.key)}
            style={{ ...S.link, ...(page===l.key ? S.linkActive : {}) }}>
            <span style={{ fontSize:14 }}>{l.icon}</span>
            <span>{l.label}</span>
          </button>
        ))}
      </div>

      <div style={S.right}>
        <div style={{ padding:'4px 10px', borderRadius:'var(--r-full)', fontSize:11, fontWeight:700, background:roleBadge.bg, color:roleBadge.color, border:`1px solid ${roleBadge.color}33` }}>
          {roleBadge.label}
        </div>

        {/* Notification bell */}
        <div style={{ position:'relative' }}>
          <NotifBell count={unread} onClick={() => { setShowNotif(s=>!s); setShowMenu(false); }}/>
          {showNotif && (
            <div style={S.dropdown}>
              <div style={S.dropHeader}>
                <span style={{ fontWeight:700, fontSize:13 }}>Notifications</span>
                {unread > 0 && <button onClick={handleReadAll} style={S.markRead}>Mark all read</button>}
              </div>
              <div style={{ maxHeight:300, overflowY:'auto' }}>
                {notifs.length === 0 && <div style={{ padding:'24px', textAlign:'center', color:'var(--text3)', fontSize:13 }}>All clear 🎉</div>}
                {notifs.slice(0,10).map(n => (
                  <div key={n._id} style={{ ...S.notifItem, background: n.read?'transparent':'rgba(124,109,250,0.06)' }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--text1)' }}>{n.title}</div>
                    <div style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>{n.message}</div>
                    <div style={{ fontSize:10, color:'var(--text3)', marginTop:3 }}>{new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Avatar menu */}
        <div style={{ position:'relative' }}>
          <button onClick={() => { setShowMenu(s=>!s); setShowNotif(false); }} style={S.avatarBtn}>
            <span style={{ fontSize:20 }}>{user?.avatar || '👤'}</span>
            <span style={{ fontSize:12, fontWeight:600, maxWidth:80, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {user?.name?.split(' ')[0]}
            </span>
            <span style={{ fontSize:10, color:'var(--text3)' }}>▾</span>
          </button>
          {showMenu && (
            <div style={S.menu}>
              <div style={S.menuHead}>
                <div style={{ fontSize:13, fontWeight:700 }}>{user?.name}</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{user?.email}</div>
              </div>
              <button onClick={() => { setPage('profile'); setShowMenu(false); }} style={S.menuItem}>⚙️ Profile</button>
              <button onClick={() => { logout(); setShowMenu(false); }} style={{ ...S.menuItem, color:'var(--red)' }}>🚪 Sign out</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

const S = {
  nav:      { position:'sticky',top:0,zIndex:200,background:'rgba(6,9,18,0.92)',backdropFilter:'blur(16px)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',padding:'0 28px',height:60,gap:20 },
  logo:     { display:'flex',alignItems:'center',gap:10,cursor:'pointer',flexShrink:0 },
  logoMark: { width:34,height:34,borderRadius:'var(--r-md)',background:'var(--accent-dim)',border:'1px solid rgba(124,109,250,0.3)',display:'flex',alignItems:'center',justifyContent:'center' },
  logoName: { fontFamily:'var(--font-display)',fontSize:14,fontWeight:800,color:'var(--text1)',lineHeight:1 },
  logoSub:  { fontSize:10,color:'var(--text3)',letterSpacing:'0.04em' },
  links:    { flex:1,display:'flex',alignItems:'center',gap:2,paddingLeft:16 },
  link:     { display:'flex',alignItems:'center',gap:6,padding:'7px 12px',background:'none',border:'none',color:'var(--text2)',fontSize:13,fontWeight:500,cursor:'pointer',borderRadius:'var(--r-md)',transition:'var(--t)',fontFamily:'var(--font-body)' },
  linkActive:{ background:'var(--accent-dim)',color:'var(--accent)' },
  right:    { display:'flex',alignItems:'center',gap:10,flexShrink:0 },
  dropdown: { position:'absolute',top:44,right:0,width:300,background:'var(--bg2)',border:'1px solid var(--border2)',borderRadius:'var(--r-lg)',boxShadow:'var(--sh-lg)',zIndex:300 },
  dropHeader:{ padding:'12px 14px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center' },
  markRead: { background:'none',border:'none',color:'var(--accent)',fontSize:11,cursor:'pointer',fontFamily:'var(--font-body)' },
  notifItem:{ padding:'11px 14px',borderBottom:'1px solid var(--border)',transition:'var(--t)' },
  avatarBtn:{ display:'flex',alignItems:'center',gap:7,padding:'6px 12px',background:'var(--bg4)',border:'1px solid var(--border2)',borderRadius:'var(--r-md)',cursor:'pointer',color:'var(--text1)',fontFamily:'var(--font-body)',transition:'var(--t)' },
  menu:     { position:'absolute',top:44,right:0,width:200,background:'var(--bg2)',border:'1px solid var(--border2)',borderRadius:'var(--r-lg)',boxShadow:'var(--sh-lg)',zIndex:300,overflow:'hidden' },
  menuHead: { padding:'12px 14px',borderBottom:'1px solid var(--border)' },
  menuItem: { width:'100%',padding:'10px 14px',background:'none',border:'none',color:'var(--text1)',fontSize:13,textAlign:'left',cursor:'pointer',fontFamily:'var(--font-body)',transition:'var(--t)' },
};
