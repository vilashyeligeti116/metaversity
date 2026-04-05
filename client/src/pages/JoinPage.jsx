import { useState, useEffect } from 'react';
import { authApi } from '../utils/api';
import { Btn, Input, Spinner } from '../components/common/UI';

const AVATARS = ['👷','🧑‍💻','👩‍💻','🎨','📊','🧪','🚀','💡','⚙️','🌱','📱','🔬'];
const COLORS  = ['#60a5fa','#7c6dfa','#34d399','#f87171','#fb923c','#2dd4bf','#ec4899','#f5c842'];
const DEPTS   = ['Engineering','Design','Product','Marketing','Sales','Finance','Operations','HR','Other'];

export default function JoinPage({ token, onSuccess }) {
  const [inviteInfo, setInviteInfo] = useState(null);
  const [inviteErr,  setInviteErr]  = useState('');
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [err,        setErr]        = useState('');
  const [form, setForm] = useState({
    name:'', email:'', password:'',
    jobTitle:'', department:'Engineering',
    avatar:'👷', avatarColor:'#60a5fa', bio:'', skills:'',
  });

  useEffect(() => {
    if (!token) { setInviteErr('No invite token found.'); setLoading(false); return; }
    authApi.validateInvite(token)
      .then(d => setInviteInfo(d.invite))
      .catch(e => setInviteErr(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  function f(k,v) { setForm(p=>({...p,[k]:v})); setErr(''); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password)
      { setErr('Name, email and password are required.'); return; }
    setSaving(true); setErr('');
    try {
      await authApi.register({
        ...form,
        role: 'employee',
        inviteToken: token,
        skills: form.skills.split(',').map(s=>s.trim()).filter(Boolean),
      });
      onSuccess();
    } catch(e) { setErr(e.message); }
    finally { setSaving(false); }
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg0)' }}>
      <Spinner size={32}/>
    </div>
  );

  if (inviteErr) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg0)', padding:24 }}>
      <div style={{ textAlign:'center', maxWidth:360 }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🔗</div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800, color:'var(--red)', marginBottom:10 }}>Invalid Invite</div>
        <div style={{ fontSize:14, color:'var(--text2)', lineHeight:1.6 }}>{inviteErr}</div>
        <div style={{ fontSize:13, color:'var(--text3)', marginTop:10 }}>Ask your founder for a new invite link.</div>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <div style={S.bg}/><div style={S.grid}/>
      <div style={S.box} className="scale-in">
        {/* Logo */}
        <div style={S.logo}>
          <span style={{ fontSize:26 }}>🌐</span>
          <div>
            <div style={S.logoName}>Metaversity</div>
            <div style={S.logoSub}>Startup Incubator Metaverse</div>
          </div>
        </div>

        {/* Invite info banner */}
        <div style={S.banner}>
          <span style={{ fontSize:20 }}>🎉</span>
          <div>
            <div style={S.bannerTitle}>You've been invited!</div>
            <div style={S.bannerSub}>
              <strong style={{ color:'var(--accent)' }}>{inviteInfo?.founderName}</strong>
              {' '}invited you to join{' '}
              <strong style={{ color:'var(--gold)' }}>{inviteInfo?.officeName || 'their startup office'}</strong>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Name + email */}
          <Input label="Full Name *" value={form.name} onChange={e=>f('name',e.target.value)} placeholder="Your name"/>
          <Input label="Work Email *" type="email" value={form.email} onChange={e=>f('email',e.target.value)} placeholder="you@company.com"/>
          <Input label="Password *" type="password" value={form.password} onChange={e=>f('password',e.target.value)} placeholder="Min 6 characters"/>

          {/* Job info */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Input label="Job Title" value={form.jobTitle} onChange={e=>f('jobTitle',e.target.value)} placeholder="e.g. Frontend Dev"/>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={S.label}>Department</label>
              <select value={form.department} onChange={e=>f('department',e.target.value)} style={S.select}>
                {DEPTS.map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Avatar */}
          <div>
            <label style={S.label}>Avatar</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
              {AVATARS.map(a=>(
                <button key={a} type="button" onClick={()=>f('avatar',a)}
                  style={{ width:36,height:36,borderRadius:'var(--r-sm)',border:`2px solid ${form.avatar===a?'var(--accent)':'var(--border)'}`,background:form.avatar===a?'var(--accent-dim)':'var(--bg3)',fontSize:18,cursor:'pointer' }}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label style={S.label}>Avatar Color</label>
            <div style={{ display:'flex', gap:8, marginTop:6 }}>
              {COLORS.map(c=>(
                <button key={c} type="button" onClick={()=>f('avatarColor',c)}
                  style={{ width:26,height:26,borderRadius:'50%',border:'none',background:c,cursor:'pointer',boxShadow:form.avatarColor===c?`0 0 0 3px ${c}55,0 0 12px ${c}44`:'none',transform:form.avatarColor===c?'scale(1.2)':'scale(1)',transition:'var(--t)' }}/>
              ))}
            </div>
          </div>

          <Input label="Skills (comma-separated, optional)" value={form.skills} onChange={e=>f('skills',e.target.value)} placeholder="React, Python, UI Design…"/>

          {err && <p style={{ color:'var(--red)', fontSize:12 }}>{err}</p>}

          <Btn type="submit" variant="primary" style={{ marginTop:4 }} disabled={saving}>
            {saving ? <><Spinner size={16}/> Joining…</> : '🚀 Join the Office'}
          </Btn>
        </form>
      </div>
    </div>
  );
}

const S = {
  page: { position:'fixed',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg0)',overflow:'auto',padding:20 },
  bg:   { position:'absolute',inset:0,background:'radial-gradient(ellipse at 60% 30%,rgba(96,165,250,0.07) 0%,transparent 60%)',pointerEvents:'none' },
  grid: { position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(96,165,250,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(96,165,250,0.02) 1px,transparent 1px)',backgroundSize:'56px 56px',pointerEvents:'none' },
  box:  { position:'relative',width:'100%',maxWidth:460,background:'var(--bg2)',border:'1px solid var(--border2)',borderRadius:'var(--r-xl)',padding:'28px 28px 24px',boxShadow:'var(--sh-lg)',maxHeight:'92vh',overflowY:'auto' },
  logo: { display:'flex',alignItems:'center',gap:12,marginBottom:20 },
  logoName: { fontFamily:'var(--font-display)',fontSize:18,fontWeight:900,color:'var(--text1)',lineHeight:1 },
  logoSub:  { fontSize:10,color:'var(--text3)',letterSpacing:'0.04em' },
  banner: { display:'flex',alignItems:'center',gap:12,padding:'14px',background:'rgba(96,165,250,0.08)',border:'1px solid rgba(96,165,250,0.2)',borderRadius:'var(--r-md)',marginBottom:20 },
  bannerTitle: { fontFamily:'var(--font-display)',fontSize:14,fontWeight:700,color:'var(--text1)' },
  bannerSub:   { fontSize:12,color:'var(--text2)',marginTop:2,lineHeight:1.5 },
  label: { display:'block',fontSize:11,fontWeight:700,letterSpacing:'0.05em',textTransform:'uppercase',color:'var(--text2)' },
  select: { padding:'10px 13px',background:'var(--bg1)',border:'1px solid var(--border2)',borderRadius:'var(--r-md)',color:'var(--text1)',fontSize:14,outline:'none',fontFamily:'var(--font-body)',width:'100%' },
};
