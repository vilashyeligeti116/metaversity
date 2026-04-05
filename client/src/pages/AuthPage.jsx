import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Btn, Input, Textarea, Spinner } from '../components/common/UI';

const AVATARS = ['🎓','💻','🚀','🦊','🧑‍💻','👩‍💻','🎨','🏗️','📊','🧪','🌱','⚡'];
const COLORS  = ['#7c6dfa','#f5c842','#34d399','#f87171','#60a5fa','#fb923c','#2dd4bf','#ec4899'];
const DOMAINS = ['EdTech','FinTech','HealthTech','AgriTech','CleanTech','SaaS','E-commerce','AI/ML','IoT','Other'];

export default function AuthPage({ mode = 'login', onSuccess }) {
  const { login, register } = useAuth();
  const [tab,    setTab]    = useState(mode);
  const [step,   setStep]   = useState(1); // for register: 1=basic, 2=details
  const [loading,setLoading]= useState(false);
  const [err,    setErr]    = useState('');

  const [form, setForm] = useState({
    name:'', email:'', password:'',
    role:'founder',
    avatar:'🎓', avatarColor:'#7c6dfa',
    university:'', bio:'', skills:'',
    expertise:'', designation:'',
  });

  function f(k, v) { setForm(p => ({ ...p, [k]:v })); setErr(''); }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      if (tab === 'login') {
        await login(form.email, form.password);
        onSuccess();
      } else {
        if (step === 1 && tab === 'register') { setStep(2); setLoading(false); return; }
        await register({
          ...form,
          skills: form.skills ? form.skills.split(',').map(s=>s.trim()) : [],
          expertise: form.expertise ? form.expertise.split(',').map(s=>s.trim()) : [],
        });
        onSuccess();
      }
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div style={S.page}>
      <div style={S.bg}/><div style={S.grid}/>
      <div style={S.box} className="scale-in">
        {/* Logo */}
        <div style={S.logo}>
          <span style={{ fontSize:28 }}>🌐</span>
          <div>
            <div style={S.logoName}>Metaversity</div>
            <div style={S.logoSub}>Startup Incubator Metaverse</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={S.tabs}>
          {['login','register'].map(t => (
            <button key={t} onClick={() => { setTab(t); setStep(1); setErr(''); }}
              style={{ ...S.tab, ...(tab===t ? S.tabActive : {}) }}>
              {t==='login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {tab === 'login' ? (
            <>
              <Input label="Email" type="email" value={form.email} onChange={e=>f('email',e.target.value)} placeholder="you@example.com" style={{ marginBottom:14 }}/>
              <Input label="Password" type="password" value={form.password} onChange={e=>f('password',e.target.value)} placeholder="••••••••" style={{ marginBottom:20 }}/>
            </>
          ) : step === 1 ? (
            <>
              {/* Role selection */}
              <div style={{ marginBottom:16 }}>
                <label style={S.label}>I am a…</label>
                <div style={{ display:'flex', gap:8, marginTop:6 }}>
                  {[{r:'founder',icon:'🎓',lbl:'Founder'},{r:'expert',icon:'🧑‍💼',lbl:'Expert'}].map(({r,icon,lbl}) => (
                    <button key={r} type="button" onClick={() => { f('role',r); f('avatar',r==='expert'?'🧑‍💼':'🎓'); }}
                      style={{ ...S.roleBtn, ...(form.role===r?S.roleBtnActive:{}) }}>
                      <span style={{ fontSize:22 }}>{icon}</span>
                      <span style={{ fontSize:13, fontWeight:600 }}>{lbl}</span>
                    </button>
                  ))}
                </div>
              </div>
              <Input label="Full Name"    value={form.name}     onChange={e=>f('name',e.target.value)}     placeholder="Your name"        style={{ marginBottom:12 }}/>
              <Input label="Email"        type="email" value={form.email}    onChange={e=>f('email',e.target.value)}    placeholder="you@example.com"  style={{ marginBottom:12 }}/>
              <Input label="Password"     type="password" value={form.password} onChange={e=>f('password',e.target.value)} placeholder="Min 6 characters" style={{ marginBottom:12 }}/>
              {/* Avatar */}
              <label style={S.label}>Avatar</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, margin:'6px 0 12px' }}>
                {AVATARS.map(a => (
                  <button key={a} type="button" onClick={()=>f('avatar',a)}
                    style={{ width:36,height:36,borderRadius:'var(--r-sm)',border:`2px solid ${form.avatar===a?'var(--accent)':'var(--border)'}`,
                      background:form.avatar===a?'var(--accent-dim)':'var(--bg3)',fontSize:18,cursor:'pointer' }}>
                    {a}
                  </button>
                ))}
              </div>
              <label style={S.label}>Colour</label>
              <div style={{ display:'flex', gap:8, margin:'6px 0 20px' }}>
                {COLORS.map(c => (
                  <button key={c} type="button" onClick={()=>f('avatarColor',c)}
                    style={{ width:26,height:26,borderRadius:'50%',border:'none',background:c,cursor:'pointer',
                      boxShadow:form.avatarColor===c?`0 0 0 3px ${c}55,0 0 12px ${c}44`:'none',
                      transform:form.avatarColor===c?'scale(1.2)':'scale(1)', transition:'var(--t)' }}/>
                ))}
              </div>
            </>
          ) : (
            // Step 2: extra details
            <>
              {form.role === 'founder' ? (
                <>
                  <Input label="University / College" value={form.university} onChange={e=>f('university',e.target.value)} placeholder="IIT Delhi, BITS Pilani, etc." style={{ marginBottom:12 }}/>
                  <Input label="Skills (comma-separated)" value={form.skills} onChange={e=>f('skills',e.target.value)} placeholder="React, ML, Finance, Design…" style={{ marginBottom:12 }}/>
                </>
              ) : (
                <>
                  <Input label="Designation" value={form.designation} onChange={e=>f('designation',e.target.value)} placeholder="Senior Product Manager at…" style={{ marginBottom:12 }}/>
                  <Input label="Expertise domains (comma-separated)" value={form.expertise} onChange={e=>f('expertise',e.target.value)} placeholder="EdTech, FinTech, SaaS…" style={{ marginBottom:12 }}/>
                </>
              )}
              <Textarea label="Short Bio" value={form.bio} onChange={e=>f('bio',e.target.value)} placeholder="Tell us about yourself…" style={{ marginBottom:12 }}/>
            </>
          )}

          {err && <p style={{ color:'var(--red)', fontSize:12, marginBottom:12 }}>{err}</p>}

          <Btn type="submit" variant="primary" style={{ width:'100%', marginTop:4 }} disabled={loading}>
            {loading ? <><Spinner size={16}/> Please wait…</> :
              tab==='login' ? 'Sign In' :
              step===1 ? 'Continue →' : 'Create Account'}
          </Btn>
          {tab==='register' && step===2 && (
            <Btn type="button" variant="ghost" style={{ width:'100%', marginTop:8 }} onClick={() => setStep(1)}>
              ← Back
            </Btn>
          )}
        </form>
      </div>
    </div>
  );
}

const S = {
  page: { position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
    background:'var(--bg0)', overflow:'hidden', padding:20 },
  bg: { position:'absolute', inset:0, background:'radial-gradient(ellipse at 30% 40%,rgba(124,109,250,0.08) 0%,transparent 60%)', pointerEvents:'none' },
  grid: { position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(124,109,250,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(124,109,250,0.025) 1px,transparent 1px)', backgroundSize:'56px 56px', pointerEvents:'none' },
  box: { position:'relative', width:'100%', maxWidth:440, background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:'var(--r-xl)', padding:'32px 28px 28px', boxShadow:'var(--sh-lg)', maxHeight:'90vh', overflowY:'auto' },
  logo: { display:'flex', alignItems:'center', gap:12, marginBottom:24 },
  logoName: { fontFamily:'var(--font-display)', fontSize:20, fontWeight:900, color:'var(--text1)', lineHeight:1 },
  logoSub: { fontSize:10, color:'var(--text3)', letterSpacing:'0.04em' },
  tabs: { display:'flex', gap:4, background:'var(--bg1)', borderRadius:'var(--r-md)', padding:4, marginBottom:22 },
  tab: { flex:1, padding:'8px', border:'none', borderRadius:'var(--r-sm)', cursor:'pointer',
    fontSize:13, fontWeight:600, background:'transparent', color:'var(--text2)', fontFamily:'var(--font-body)', transition:'var(--t)' },
  tabActive: { background:'var(--bg4)', color:'var(--text1)', boxShadow:'var(--sh-sm)' },
  label: { display:'block', fontSize:11, fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', color:'var(--text2)', marginBottom:5 },
  roleBtn: { flex:1, padding:'12px 8px', display:'flex', flexDirection:'column', alignItems:'center', gap:5,
    background:'var(--bg3)', border:'2px solid var(--border)', borderRadius:'var(--r-md)', cursor:'pointer', transition:'var(--t)', fontFamily:'var(--font-body)', color:'var(--text1)' },
  roleBtnActive: { borderColor:'var(--accent)', background:'var(--accent-dim)' },
};
