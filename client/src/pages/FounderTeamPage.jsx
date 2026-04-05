import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userApi } from '../utils/api';
import { Card, Btn, Input, Textarea, Modal, Empty, Spinner } from '../components/common/UI';

const BASE_URL = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace(':4000', ':3000')
  : 'http://localhost:3000';

export default function FounderTeamPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [invites,   setInvites]   = useState([]);
  const [anns,      setAnns]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('team'); // 'team' | 'invites' | 'announce'
  const [modal,     setModal]     = useState(null);
  const [annForm,   setAnnForm]   = useState({ title:'', body:'', pinned:false });
  const [saving,    setSaving]    = useState(false);
  const [copied,    setCopied]    = useState('');
  const [err,       setErr]       = useState('');

  useEffect(() => {
    Promise.all([
      userApi.myTeam(),
      userApi.myInvites(),
      userApi.announcements(),
    ]).then(([td, id, ad]) => {
      setEmployees(td.employees || []);
      setInvites(id.invites || []);
      setAnns(ad.announcements || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function generateInvite() {
    setSaving(true); setErr('');
    try {
      const d = await userApi.generateInvite(10);
      setInvites(prev => [d.invite, ...prev]);
      setTab('invites');
    } catch(e) { setErr(e.message); }
    finally { setSaving(false); }
  }

  async function revokeInvite(token) {
    try {
      await userApi.revokeInvite(token);
      setInvites(prev => prev.filter(i => i.token !== token));
    } catch(e) {}
  }

  async function removeEmployee(id) {
    if (!window.confirm('Remove this employee from your office?')) return;
    try {
      await userApi.removeEmployee(id);
      setEmployees(prev => prev.filter(e => e._id !== id));
    } catch(e) {}
  }

  async function postAnnouncement(e) {
    e.preventDefault(); setSaving(true); setErr('');
    try {
      const d = await userApi.postAnnouncement(annForm);
      setAnns(prev => [d.announcement, ...prev]);
      setAnnForm({ title:'', body:'', pinned:false });
      setModal(null);
    } catch(e) { setErr(e.message); }
    finally { setSaving(false); }
  }

  function copyInviteLink(token) {
    const url = `${BASE_URL}/join/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(token);
      setTimeout(() => setCopied(''), 2500);
    });
  }

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:80 }}><Spinner/></div>;

  const hasOffice = !!user?.officeId;

  return (
    <div style={P.page}>
      {/* Header */}
      <div style={P.header}>
        <div>
          <div style={P.title}>👥 Team Management</div>
          <div style={P.sub}>{employees.length} employee{employees.length !== 1 ? 's' : ''} · {invites.length} active invite{invites.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <Btn variant="secondary" onClick={() => setModal('announce')}>📢 Announce</Btn>
          {hasOffice && (
            <Btn variant="primary" onClick={generateInvite} disabled={saving}>
              {saving ? '⏳ Generating…' : '🔗 Generate Invite Link'}
            </Btn>
          )}
        </div>
      </div>

      {!hasOffice && (
        <div style={{ padding:'16px', background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:'var(--r-md)', marginBottom:20, fontSize:13, color:'var(--red)' }}>
          ⚠️ You need an approved virtual office before you can invite team members. Submit an idea and get it approved first.
        </div>
      )}

      {err && <div style={{ padding:12, background:'var(--red-dim)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:'var(--r-md)', color:'var(--red)', fontSize:13, marginBottom:16 }}>{err}</div>}

      {/* Tabs */}
      <div style={P.tabs}>
        {[
          { key:'team',     label:`👷 Team (${employees.length})` },
          { key:'invites',  label:`🔗 Invite Links (${invites.length})` },
          { key:'announce', label:`📢 Announcements (${anns.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ ...P.tab, ...(tab === t.key ? P.tabActive : {}) }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Team tab ── */}
      {tab === 'team' && (
        employees.length === 0 ? (
          <Empty icon="👷" title="No employees yet"
            sub="Generate an invite link and share it with your team members."
            action={hasOffice && <Btn variant="primary" onClick={generateInvite}>Generate Invite Link</Btn>}/>
        ) : (
          <div style={P.grid}>
            {employees.map(emp => (
              <Card key={emp._id} style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:44, height:44, borderRadius:'50%', background:`${emp.avatarColor||'#60a5fa'}18`, border:`1px solid ${emp.avatarColor||'#60a5fa'}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>
                    {emp.avatar || '👷'}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, color:'var(--text1)', fontSize:14 }}>{emp.name}</div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>{emp.email}</div>
                  </div>
                </div>

                {(emp.jobTitle || emp.department) && (
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {emp.jobTitle   && <span style={P.tag}>{emp.jobTitle}</span>}
                    {emp.department && <span style={{ ...P.tag, color:'var(--blue)' }}>{emp.department}</span>}
                  </div>
                )}

                {emp.skills?.length > 0 && (
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                    {emp.skills.slice(0,4).map(s => <span key={s} style={{ ...P.tag, fontSize:10 }}>{s}</span>)}
                  </div>
                )}

                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{ fontSize:11, color:'var(--text3)' }}>
                    Joined {emp.joinedOfficeAt ? new Date(emp.joinedOfficeAt).toLocaleDateString() : '—'}
                  </span>
                  <button onClick={() => removeEmployee(emp._id)}
                    style={{ marginLeft:'auto', padding:'4px 10px', border:'1px solid rgba(248,113,113,0.25)', borderRadius:'var(--r-sm)', background:'var(--red-dim)', color:'var(--red)', fontSize:11, cursor:'pointer', fontFamily:'var(--font-body)' }}>
                    Remove
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {/* ── Invites tab ── */}
      {tab === 'invites' && (
        <>
          <div style={{ marginBottom:16, fontSize:13, color:'var(--text2)', lineHeight:1.6, padding:'12px 14px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r-md)' }}>
            📋 Share these links with people you want to add to your startup. Each link expires in 7 days and can be used up to 10 times.
          </div>
          {invites.length === 0 ? (
            <Empty icon="🔗" title="No invite links yet"
              action={hasOffice && <Btn variant="primary" onClick={generateInvite}>Generate First Invite</Btn>}/>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {invites.map(inv => {
                const url     = `${BASE_URL}/join/${inv.token}`;
                const expired = new Date(inv.expiresAt) < new Date();
                const full    = inv.uses >= inv.maxUses;
                return (
                  <div key={inv.token} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:'16px 20px', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
                    <div style={{ flex:1, minWidth:200 }}>
                      <div style={{ fontFamily:'monospace', fontSize:12, color:'var(--accent)', background:'var(--accent-dim)', padding:'5px 10px', borderRadius:'var(--r-sm)', marginBottom:6, wordBreak:'break-all' }}>
                        {url}
                      </div>
                      <div style={{ display:'flex', gap:10, fontSize:11, color:'var(--text3)' }}>
                        <span>Used: {inv.uses}/{inv.maxUses}</span>
                        <span>Expires: {new Date(inv.expiresAt).toLocaleDateString()}</span>
                        <span style={{ color: expired||full ? 'var(--red)' : 'var(--green)' }}>
                          {expired ? '● Expired' : full ? '● Full' : '● Active'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <Btn variant="secondary" size="sm" onClick={() => copyInviteLink(inv.token)}>
                        {copied === inv.token ? '✅ Copied!' : '📋 Copy'}
                      </Btn>
                      <Btn variant="danger" size="sm" onClick={() => revokeInvite(inv.token)}>Revoke</Btn>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Announcements tab ── */}
      {tab === 'announce' && (
        <>
          <Btn variant="primary" onClick={() => setModal('announce')} style={{ marginBottom:16 }}>
            + New Announcement
          </Btn>
          {anns.length === 0 ? (
            <Empty icon="📢" title="No announcements yet" sub="Post updates to your entire team at once."/>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {anns.map(a => (
                <Card key={a._id}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    {a.pinned && <span>📌</span>}
                    <div style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:700, color:'var(--text1)' }}>{a.title}</div>
                    <span style={{ fontSize:11, color:'var(--text3)', marginLeft:'auto' }}>{new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.7 }}>{a.body}</div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Announcement modal */}
      {modal === 'announce' && (
        <Modal title="📢 Post Announcement" onClose={() => setModal(null)}>
          <form onSubmit={postAnnouncement} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Input label="Title *" value={annForm.title} onChange={e => setAnnForm(p=>({...p,title:e.target.value}))} placeholder="e.g. Sprint Planning this Friday"/>
            <Textarea label="Message *" value={annForm.body} onChange={e => setAnnForm(p=>({...p,body:e.target.value}))} placeholder="Write your announcement…" style={{ minHeight:100 }}/>
            <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--text2)', cursor:'pointer' }}>
              <input type="checkbox" checked={annForm.pinned} onChange={e => setAnnForm(p=>({...p,pinned:e.target.checked}))}/>
              📌 Pin this announcement
            </label>
            {err && <p style={{ color:'var(--red)', fontSize:12 }}>{err}</p>}
            <Btn type="submit" variant="primary" disabled={saving}>{saving ? 'Posting…' : '📢 Post to Team'}</Btn>
          </form>
        </Modal>
      )}
    </div>
  );
}

const P = {
  page: { padding:'28px 32px', maxWidth:1000, margin:'0 auto' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:14 },
  title: { fontFamily:'var(--font-display)', fontSize:24, fontWeight:800, color:'var(--text1)' },
  sub: { fontSize:13, color:'var(--text2)', marginTop:4 },
  tabs: { display:'flex', gap:4, background:'var(--bg1)', borderRadius:'var(--r-md)', padding:4, marginBottom:24 },
  tab: { flex:1, padding:'8px 12px', border:'none', borderRadius:'var(--r-sm)', cursor:'pointer', fontSize:13, fontWeight:600, background:'transparent', color:'var(--text2)', fontFamily:'var(--font-body)', transition:'var(--t)' },
  tabActive: { background:'var(--bg4)', color:'var(--text1)', boxShadow:'var(--sh-sm)' },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 },
  tag: { fontSize:11, fontWeight:600, padding:'3px 8px', borderRadius:'var(--r-sm)', background:'var(--bg4)', color:'var(--text2)' },
};
