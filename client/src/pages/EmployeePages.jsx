import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userApi } from '../utils/api';
import { Card, Btn, Empty, Spinner, StatCard } from '../components/common/UI';

// ── Employee Home ─────────────────────────────────────────────────────────────
export function EmployeeHome({ setPage }) {
  const { user } = useAuth();
  const [office,    setOffice]    = useState(null);
  const [teammates, setTeammates] = useState([]);
  const [anns,      setAnns]      = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      userApi.myOffice(),
      userApi.announcements(),
    ]).then(([od, ad]) => {
      setOffice(od.office);
      setTeammates(od.teammates || []);
      setAnns(ad.announcements || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:80 }}><Spinner/></div>;

  return (
    <div style={P.page}>
      {/* Welcome banner */}
      <div style={P.welcome}>
        <div>
          <div style={P.greet}>
            Welcome, <span style={{ color:'var(--blue)' }}>{user?.name?.split(' ')[0]}</span> 👷
          </div>
          <div style={P.sub}>
            {user?.jobTitle && <span>{user.jobTitle}</span>}
            {user?.department && <span> · {user.department}</span>}
          </div>
        </div>
        {office && (
          <Btn variant="primary" onClick={() => setPage('office')}>
            🏢 Enter {office.name}
          </Btn>
        )}
      </div>

      {/* Stats */}
      <div style={P.statsRow}>
        <StatCard icon="👥" label="Team Members" value={teammates.length + 1} color="var(--blue)"/>
        <StatCard icon="📢" label="Announcements" value={anns.length} color="var(--accent)"/>
        <StatCard icon="🏢" label="Office" value={office ? office.plan : '—'} color="var(--gold)"/>
        <StatCard icon="📅" label="Joined" value={user?.joinedOfficeAt ? new Date(user.joinedOfficeAt).toLocaleDateString('en-IN',{month:'short',day:'numeric'}) : '—'} color="var(--green)"/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        {/* Office info */}
        <Card>
          <div style={P.sectionTitle}>🏢 Your Office</div>
          {office ? (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800, color:'var(--text1)' }}>{office.name}</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <span style={P.tag}>{office.plan} plan</span>
                <span style={P.tag}>₹{office.monthlyFee}/mo</span>
                <span style={{ ...P.tag, color:'var(--green)' }}>● Active</span>
              </div>
              {office.founder && (
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px', background:'var(--bg3)', borderRadius:'var(--r-md)' }}>
                  <span style={{ fontSize:22 }}>{office.founder.avatar || '🎓'}</span>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:'var(--text1)' }}>{office.founder.name}</div>
                    <div style={{ fontSize:10, color:'var(--text3)' }}>Founder · {office.founder.email}</div>
                  </div>
                  <span style={{ marginLeft:'auto', fontSize:16 }}>👑</span>
                </div>
              )}
              <Btn variant="primary" onClick={() => setPage('office')} style={{ marginTop:4 }}>
                🚀 Enter Virtual Office
              </Btn>
            </div>
          ) : (
            <Empty icon="🏢" title="No office assigned" sub="Ask your founder to share an invite link."/>
          )}
        </Card>

        {/* Team */}
        <Card>
          <div style={P.sectionTitle}>👥 Your Team</div>
          {teammates.length === 0 ? (
            <Empty icon="👥" title="No teammates yet" sub="You're the first one here — more people joining soon."/>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {teammates.slice(0, 6).map(t => (
                <div key={t._id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px', background:'var(--bg3)', borderRadius:'var(--r-md)' }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:`${t.avatarColor||'#7c6dfa'}22`, border:`1px solid ${t.avatarColor||'#7c6dfa'}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
                    {t.avatar || '😊'}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'var(--text1)' }}>{t.name}</div>
                    <div style={{ fontSize:10, color:'var(--text3)' }}>
                      {t.role === 'founder' ? '👑 Founder' : `👷 ${t.jobTitle || 'Employee'}`}
                    </div>
                  </div>
                  <span style={{ ...P.tag, color: t.role==='founder'?'var(--gold)':'var(--blue)' }}>
                    {t.role === 'founder' ? 'Founder' : t.department || 'Team'}
                  </span>
                </div>
              ))}
              {teammates.length > 6 && (
                <div style={{ fontSize:12, color:'var(--text3)', textAlign:'center', padding:'4px' }}>
                  +{teammates.length - 6} more members
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Announcements */}
      {anns.length > 0 && (
        <Card style={{ marginTop:20 }}>
          <div style={P.sectionTitle}>📢 Announcements</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {anns.map(a => (
              <div key={a._id} style={{ padding:'14px', background: a.pinned ? 'rgba(245,200,66,0.06)' : 'var(--bg3)', border:`1px solid ${a.pinned ? 'rgba(245,200,66,0.2)' : 'var(--border)'}`, borderRadius:'var(--r-md)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  {a.pinned && <span style={{ fontSize:12 }}>📌</span>}
                  <span style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:700, color:'var(--text1)' }}>{a.title}</span>
                  <span style={{ fontSize:10, color:'var(--text3)', marginLeft:'auto' }}>{new Date(a.createdAt).toLocaleDateString()}</span>
                </div>
                <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.6 }}>{a.body}</div>
                <div style={{ fontSize:10, color:'var(--text3)', marginTop:6 }}>
                  By {a.author?.name || 'Founder'}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

const P = {
  page: { padding:'28px 32px', maxWidth:1000, margin:'0 auto' },
  welcome: { background:'linear-gradient(135deg,var(--bg2),var(--bg3))', border:'1px solid var(--border)', borderRadius:'var(--r-xl)', padding:'28px', marginBottom:24, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 },
  greet: { fontFamily:'var(--font-display)', fontSize:24, fontWeight:800, color:'var(--text1)' },
  sub: { fontSize:13, color:'var(--text2)', marginTop:5 },
  statsRow: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:16, marginBottom:24 },
  sectionTitle: { fontFamily:'var(--font-display)', fontSize:14, fontWeight:700, color:'var(--text1)', marginBottom:14 },
  tag: { fontSize:11, fontWeight:600, padding:'3px 8px', borderRadius:'var(--r-sm)', background:'var(--bg4)', color:'var(--text2)' },
};
