import { Btn } from '../components/common/UI';

export default function LandingPage({ onLogin, onRegister }) {
  return (
    <div style={S.page}>
      {/* Nav */}
      <nav style={S.nav}>
        <div style={S.navLogo}>
          <span style={{ fontSize:22 }}>🌐</span>
          <span style={S.navLogoText}>Metaversity</span>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <Btn variant="ghost" size="sm" onClick={onLogin}>Sign In</Btn>
          <Btn variant="primary" size="sm" onClick={onRegister}>Get Started →</Btn>
        </div>
      </nav>

      {/* Hero */}
      <section style={S.hero}>
        <div style={S.heroInner}>
          <div style={S.heroBadge}>🚀 Now accepting applications for Cohort 2025</div>
          <h1 style={S.heroTitle}>
            Your Startup Idea<br/>
            <span style={{ color:'var(--accent)' }}>Deserves a Real Office</span>
          </h1>
          <p style={S.heroSub}>
            Metaversity connects student founders with domain experts and provides
            affordable virtual offices in our startup metaverse — so great ideas
            don't die because of money.
          </p>
          <div style={{ display:'flex', gap:14, flexWrap:'wrap', justifyContent:'center' }}>
            <Btn variant="primary" size="lg" onClick={onRegister}>Submit Your Idea Free →</Btn>
            <Btn variant="ghost" size="lg" onClick={onLogin}>Sign in</Btn>
          </div>
          <div style={S.heroStats}>
            {[['₹499/mo', 'Starter office'],['48 hrs', 'Expert review time'],['3 roles', 'Founder, Expert, Admin']].map(([v,l]) => (
              <div key={l} style={S.heroStat}>
                <span style={S.heroStatV}>{v}</span>
                <span style={S.heroStatL}>{l}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Background decoration */}
        <div style={S.heroBg}/>
        <div style={S.heroGrid}/>
      </section>

      {/* How it works */}
      <section style={S.section}>
        <div style={S.sectionInner}>
          <h2 style={S.sectionTitle}>How It Works</h2>
          <div style={S.steps}>
            {[
              { n:'01', icon:'💡', title:'Submit Your Idea', body:'Fill out our structured idea form. Tell us your problem, solution, target market, and why you\'re the right team.' },
              { n:'02', icon:'🧑‍💼', title:'Expert Review',  body:'Our domain experts evaluate your idea on innovation, market potential, feasibility, and team strength within 48 hours.' },
              { n:'03', icon:'👑', title:'Admin Decision',   body:'Platform admins review expert feedback and make the final call. Approved ideas get a virtual office immediately.' },
              { n:'04', icon:'🏢', title:'Enter the Metaverse', body:'Walk around your virtual office, collaborate with your team, hold meetings, and build your startup — all in our spatial world.' },
            ].map(s => (
              <div key={s.n} style={S.step}>
                <div style={S.stepNum}>{s.n}</div>
                <div style={S.stepIcon}>{s.icon}</div>
                <h3 style={S.stepTitle}>{s.title}</h3>
                <p style={S.stepBody}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section style={{ ...S.section, background:'var(--bg1)' }}>
        <div style={S.sectionInner}>
          <h2 style={S.sectionTitle}>Affordable Plans</h2>
          <p style={{ textAlign:'center', color:'var(--text2)', marginBottom:40, fontSize:15 }}>
            Built for bootstrapped student founders. No VC required.
          </p>
          <div style={S.plans}>
            {[
              { name:'Starter', price:'₹499', period:'/month', color:'var(--teal)', members:5, rooms:3, support:'Community', highlight:false },
              { name:'Growth',  price:'₹999', period:'/month', color:'var(--accent)', members:10, rooms:8, support:'Priority email', highlight:true },
              { name:'Scale',   price:'₹1,999', period:'/month', color:'var(--gold)', members:20, rooms:15, support:'Dedicated mentor', highlight:false },
            ].map(p => (
              <div key={p.name} style={{ ...S.plan, ...(p.highlight ? S.planHighlight : {}) }}>
                {p.highlight && <div style={S.planBadge}>Most Popular</div>}
                <div style={{ color:p.color, fontSize:28, marginBottom:8 }}>
                  {p.name==='Starter'?'🌱':p.name==='Growth'?'🚀':'⚡'}
                </div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800, color:'var(--text1)', marginBottom:2 }}>{p.name}</div>
                <div style={{ display:'flex', alignItems:'baseline', gap:3, marginBottom:16 }}>
                  <span style={{ fontSize:32, fontWeight:900, color:p.color, fontFamily:'var(--font-display)' }}>{p.price}</span>
                  <span style={{ color:'var(--text3)', fontSize:13 }}>{p.period}</span>
                </div>
                {[`${p.members} team members`,`${p.rooms} virtual rooms`,`${p.support}`,'Spatial video calls','Real-time chat'].map(f => (
                  <div key={f} style={{ display:'flex', gap:8, marginBottom:8, fontSize:13, color:'var(--text2)' }}>
                    <span style={{ color:p.color }}>✓</span>{f}
                  </div>
                ))}
                <Btn variant={p.highlight?'primary':'secondary'} style={{ width:'100%', marginTop:16 }} onClick={onRegister}>
                  Get Started
                </Btn>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section style={S.section}>
        <div style={S.sectionInner}>
          <h2 style={S.sectionTitle}>Three Roles. One Ecosystem.</h2>
          <div style={S.roles}>
            {[
              { icon:'🎓', role:'Founder', color:'var(--accent)', desc:'Submit your startup idea, track expert feedback in real-time, and move into your virtual office once approved.' },
              { icon:'🧑‍💼', role:'Expert',  color:'var(--orange)', desc:'Review startup ideas in your domain. Score on innovation, market fit, feasibility, and team strength. Shape the next generation.' },
              { icon:'👑', role:'Admin',   color:'var(--gold)',   desc:'Manage the full pipeline. Assign experts, make approval decisions, provision offices, and keep the ecosystem running.' },
            ].map(r => (
              <div key={r.role} style={S.roleCard}>
                <div style={{ ...S.roleIcon, border:`1px solid ${r.color}33`, background:`${r.color}11` }}>
                  <span style={{ fontSize:28 }}>{r.icon}</span>
                </div>
                <h3 style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:700, color:r.color, marginBottom:8 }}>{r.role}</h3>
                <p style={{ fontSize:14, color:'var(--text2)', lineHeight:1.7 }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ ...S.section, textAlign:'center', padding:'80px 24px' }}>
        <h2 style={{ ...S.sectionTitle, marginBottom:16 }}>Ready to build?</h2>
        <p style={{ color:'var(--text2)', fontSize:16, marginBottom:32 }}>
          Join hundreds of student founders building their startups in the metaverse.
        </p>
        <Btn variant="primary" size="lg" onClick={onRegister} style={{ animation:'glow 3s ease-in-out infinite' }}>
          Apply for a Virtual Office →
        </Btn>
      </section>

      {/* Footer */}
      <footer style={S.footer}>
        <span style={{ fontSize:16 }}>🌐</span>
        <span style={S.footerText}>Metaversity © 2024 — Empowering student founders</span>
      </footer>
    </div>
  );
}

const S = {
  page: { background:'var(--bg0)', minHeight:'100vh', color:'var(--text1)' },
  nav: { position:'sticky', top:0, zIndex:100, background:'rgba(6,9,18,0.9)', backdropFilter:'blur(16px)',
    borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between',
    alignItems:'center', padding:'0 40px', height:64 },
  navLogo: { display:'flex', alignItems:'center', gap:10, fontFamily:'var(--font-display)', fontSize:18, fontWeight:800 },
  navLogoText: { color:'var(--text1)' },
  hero: { position:'relative', padding:'100px 24px 80px', textAlign:'center', overflow:'hidden', minHeight:'90vh',
    display:'flex', alignItems:'center', justifyContent:'center' },
  heroInner: { position:'relative', zIndex:2, maxWidth:700, margin:'0 auto' },
  heroBadge: { display:'inline-block', padding:'6px 16px', background:'var(--accent-dim)',
    border:'1px solid rgba(124,109,250,0.3)', borderRadius:'var(--r-full)',
    fontSize:13, fontWeight:600, color:'var(--accent)', marginBottom:28 },
  heroTitle: { fontFamily:'var(--font-display)', fontSize:'clamp(36px,6vw,64px)', fontWeight:900,
    lineHeight:1.1, marginBottom:24, color:'var(--text1)' },
  heroSub: { fontSize:'clamp(15px,2vw,18px)', color:'var(--text2)', lineHeight:1.8, marginBottom:36, maxWidth:520, margin:'0 auto 36px' },
  heroStats: { display:'flex', gap:32, justifyContent:'center', marginTop:48, flexWrap:'wrap' },
  heroStat: { display:'flex', flexDirection:'column', gap:4 },
  heroStatV: { fontFamily:'var(--font-display)', fontSize:26, fontWeight:800, color:'var(--text1)' },
  heroStatL: { fontSize:12, color:'var(--text3)', letterSpacing:'0.05em', textTransform:'uppercase' },
  heroBg: { position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% -10%,rgba(124,109,250,0.12) 0%,transparent 60%)', zIndex:1 },
  heroGrid: { position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(124,109,250,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(124,109,250,0.03) 1px,transparent 1px)', backgroundSize:'60px 60px', zIndex:1 },
  section: { padding:'72px 24px' },
  sectionInner: { maxWidth:1100, margin:'0 auto' },
  sectionTitle: { fontFamily:'var(--font-display)', fontSize:'clamp(26px,4vw,38px)', fontWeight:900,
    textAlign:'center', marginBottom:48, color:'var(--text1)' },
  steps: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:24 },
  step: { background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:24, position:'relative' },
  stepNum: { fontFamily:'var(--font-display)', fontSize:48, fontWeight:900, color:'var(--border2)',
    lineHeight:1, marginBottom:12, position:'absolute', top:16, right:20 },
  stepIcon: { fontSize:32, marginBottom:12 },
  stepTitle: { fontFamily:'var(--font-display)', fontSize:17, fontWeight:700, color:'var(--text1)', marginBottom:8 },
  stepBody: { fontSize:13, color:'var(--text2)', lineHeight:1.7 },
  plans: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:24, maxWidth:900, margin:'0 auto' },
  plan: { background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)',
    padding:'28px 24px', position:'relative', transition:'var(--t)' },
  planHighlight: { border:'1px solid rgba(124,109,250,0.4)', boxShadow:'var(--sh-accent)' },
  planBadge: { position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)',
    background:'var(--accent)', color:'#fff', fontSize:11, fontWeight:700,
    padding:'3px 14px', borderRadius:'var(--r-full)', whiteSpace:'nowrap' },
  roles: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:24 },
  roleCard: { background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)', padding:28 },
  roleIcon: { width:64, height:64, borderRadius:'var(--r-lg)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 },
  footer: { borderTop:'1px solid var(--border)', padding:'24px 40px', display:'flex', alignItems:'center', gap:10, justifyContent:'center' },
  footerText: { fontSize:13, color:'var(--text3)' },
};
