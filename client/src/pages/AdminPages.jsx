import { useState, useEffect, useCallback } from 'react';
import { ideaApi, userApi } from '../utils/api';
import { Btn, Card, Input, Textarea, Select, Modal, StatusBadge, PlanBadge, ScoreRing, Empty, Spinner, StatCard } from '../components/common/UI';

// ── Admin Dashboard ───────────────────────────────────────────────────────────
export function AdminDashboard({ setPage }) {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [recent,  setRecent]  = useState([]);

  useEffect(() => {
    Promise.all([
      ideaApi.stats(),
      ideaApi.all('?status=submitted&limit=5'),
    ]).then(([s, r]) => {
      setStats(s);
      setRecent(r.ideas?.slice(0, 5) || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display:'flex',justifyContent:'center',padding:80 }}><Spinner/></div>;

  return (
    <div style={P.page}>
      <div style={P.pageHeader}>
        <div style={P.pageTitle}>📊 Admin Dashboard</div>
        <div style={P.pageSub}>Overview of the Metaversity incubator platform</div>
      </div>

      {/* Stat grid */}
      <div style={P.statsGrid}>
        <StatCard icon="💡" label="Total Ideas"      value={stats?.total||0}           color="var(--accent)"/>
        <StatCard icon="📤" label="Awaiting Review"  value={stats?.submitted||0}        color="var(--blue)"/>
        <StatCard icon="🔍" label="Under Review"     value={stats?.under_review||0}     color="var(--orange)"/>
        <StatCard icon="📋" label="Expert Reviewed"  value={stats?.expert_reviewed||0}  color="var(--teal)"/>
        <StatCard icon="✅" label="Approved"         value={stats?.approved||0}         color="var(--green)"/>
        <StatCard icon="❌" label="Rejected"         value={stats?.rejected||0}         color="var(--red)"/>
        <StatCard icon="🏢" label="Active Offices"   value={stats?.offices||0}          color="var(--gold)"/>
        <StatCard icon="🎓" label="Founders"         value={stats?.founders||0}         color="var(--accent)"/>
      </div>

      {/* Pipeline visualization */}
      <Card style={{ marginBottom:24 }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:700, color:'var(--text1)', marginBottom:16 }}>Pipeline Funnel</div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {[
            { label:'Submitted',       val: stats?.submitted||0,        color:'var(--blue)',   max: stats?.total||1 },
            { label:'Under Review',    val: stats?.under_review||0,     color:'var(--orange)', max: stats?.total||1 },
            { label:'Expert Reviewed', val: stats?.expert_reviewed||0,  color:'var(--teal)',   max: stats?.total||1 },
            { label:'Approved',        val: stats?.approved||0,         color:'var(--green)',  max: stats?.total||1 },
            { label:'Office Assigned', val: stats?.office_assigned||0,  color:'var(--gold)',   max: stats?.total||1 },
          ].map(({ label, val, color, max }) => (
            <div key={label}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:12, color:'var(--text2)', fontWeight:500 }}>{label}</span>
                <span style={{ fontSize:12, color, fontWeight:700 }}>{val}</span>
              </div>
              <div style={{ height:8, background:'var(--bg4)', borderRadius:4, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${max>0?(val/max*100):0}%`, background:color, borderRadius:4, transition:'width 0.5s ease' }}/>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent submissions */}
      {recent.length > 0 && (
        <>
          <div style={P.sectionHead}>🆕 Latest Submissions</div>
          <div style={P.grid}>
            {recent.map(idea => (
              <AdminIdeaCard key={idea._id} idea={idea} onClick={() => setPage(`admin-idea-${idea._id}`)}/>
            ))}
          </div>
          <Btn variant="secondary" onClick={() => setPage('ideas')} style={{ marginTop:16 }}>View All Ideas →</Btn>
        </>
      )}
    </div>
  );
}

// ── Admin Ideas Pipeline ──────────────────────────────────────────────────────
export function AdminIdeas({ setPage }) {
  const [ideas,   setIdeas]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');
  const [search,  setSearch]  = useState('');

  const STATUSES = ['all','submitted','under_review','expert_reviewed','approved','rejected','office_assigned'];

  const load = useCallback(() => {
    const params = [];
    if (filter !== 'all') params.push(`status=${filter}`);
    if (search)           params.push(`search=${encodeURIComponent(search)}`);
    const qs = params.length ? `?${params.join('&')}` : '';
    setLoading(true);
    ideaApi.all(qs).then(d => setIdeas(d.ideas||[])).catch(()=>{}).finally(()=>setLoading(false));
  }, [filter, search]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={P.page}>
      <div style={P.pageHeader}>
        <div style={P.pageTitle}>💡 Ideas Pipeline</div>
        <div style={P.pageSub}>{ideas.length} idea{ideas.length!==1?'s':''} total</div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:24, flexWrap:'wrap', alignItems:'center' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="🔍 Search by title…"
          style={{ padding:'9px 13px', background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:'var(--r-md)', color:'var(--text1)', fontSize:13, outline:'none', fontFamily:'var(--font-body)', width:220 }}/>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {STATUSES.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              style={{ padding:'6px 12px', border:`1px solid ${filter===s?'var(--accent)':'var(--border)'}`,
                borderRadius:'var(--r-full)', background:filter===s?'var(--accent-dim)':'transparent',
                color:filter===s?'var(--accent)':'var(--text2)', fontSize:11, fontWeight:600,
                cursor:'pointer', fontFamily:'var(--font-body)', transition:'var(--t)' }}>
              {s === 'all' ? 'All' : s.replace(/_/g,' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div style={{ display:'flex',justifyContent:'center',padding:40 }}><Spinner/></div> :
       ideas.length === 0 ? <Empty icon="💡" title="No ideas found" sub="Try changing your filters."/> : (
        <div style={P.grid}>
          {ideas.map(idea => <AdminIdeaCard key={idea._id} idea={idea} onClick={() => setPage(`admin-idea-${idea._id}`)}/>)}
        </div>
      )}
    </div>
  );
}

function AdminIdeaCard({ idea, onClick }) {
  return (
    <Card hover onClick={onClick} style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:700, color:'var(--text1)', flex:1 }}>{idea.title}</div>
        <StatusBadge status={idea.status}/>
      </div>
      <div style={{ fontSize:12, color:'var(--text2)' }}>{idea.tagline}</div>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        <span style={P.tag}>{idea.domain}</span>
        {idea.founder && <span style={{ ...P.tag, color:'var(--accent)' }}>👤 {idea.founder.name}</span>}
        {idea.assignedExpert && <span style={{ ...P.tag, color:'var(--teal)' }}>🧑‍💼 {idea.assignedExpert.name}</span>}
      </div>
      {idea.expertReview?.score && (
        <div style={{ fontSize:12, color:'var(--gold)', fontWeight:700 }}>⭐ {idea.expertReview.score}/10 · {idea.expertReview.recommendation}</div>
      )}
      <div style={{ fontSize:10, color:'var(--text3)' }}>{new Date(idea.createdAt).toLocaleDateString()}</div>
    </Card>
  );
}

// ── Admin Idea Detail ─────────────────────────────────────────────────────────
export function AdminIdeaDetail({ ideaId, onBack }) {
  const [idea,    setIdea]    = useState(null);
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null); // 'assign'|'decide'|'office'
  const [form,    setForm]    = useState({ expertId:'', decision:'approved', adminNote:'', plan:'starter', theme:'tech', monthlyFee:499 });
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState('');

  useEffect(() => {
    Promise.all([ideaApi.get(ideaId), userApi.experts()])
      .then(([d, e]) => { setIdea(d.idea); setExperts(e.experts||[]); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [ideaId]);

  function f(k,v) { setForm(p=>({...p,[k]:v})); }

  async function handleAssignExpert() {
    if (!form.expertId) return;
    setSaving(true);
    try {
      const d = await ideaApi.assignExpert(ideaId, form.expertId);
      setIdea(d.idea); setModal(null); setMsg('Expert assigned successfully.');
    } catch(e) { setMsg(e.message); }
    finally { setSaving(false); }
  }

  async function handleDecide() {
    setSaving(true);
    try {
      const d = await ideaApi.decide(ideaId, form.decision, form.adminNote);
      setIdea(d.idea); setModal(null); setMsg(`Idea ${form.decision}.`);
    } catch(e) { setMsg(e.message); }
    finally { setSaving(false); }
  }

  async function handleAssignOffice() {
    setSaving(true);
    try {
      const d = await ideaApi.assignOffice(ideaId, { plan:form.plan, theme:form.theme, monthlyFee:+form.monthlyFee });
      setIdea(d.idea); setModal(null); setMsg('Virtual office created and assigned!');
    } catch(e) { setMsg(e.message); }
    finally { setSaving(false); }
  }

  if (loading) return <div style={{ display:'flex',justifyContent:'center',padding:80 }}><Spinner/></div>;
  if (!idea)   return <div style={{ padding:40, textAlign:'center', color:'var(--text3)' }}>Idea not found.</div>;

  const canAssignExpert = ['submitted','under_review'].includes(idea.status);
  const canDecide       = ['expert_reviewed','under_review'].includes(idea.status);
  const canAssignOffice = idea.status === 'approved' && !idea.office;

  return (
    <div style={P.page}>
      <Btn variant="ghost" size="sm" onClick={onBack} style={{ marginBottom:20 }}>← Back to Ideas</Btn>

      {msg && <div style={{ padding:12, background:'var(--green-dim)', border:'1px solid rgba(52,211,153,0.2)', borderRadius:'var(--r-md)', color:'var(--green)', fontSize:13, marginBottom:16 }}>{msg}</div>}

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12, marginBottom:24 }}>
        <div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:800, color:'var(--text1)' }}>{idea.title}</div>
          <div style={{ fontSize:14, color:'var(--text2)', marginTop:4 }}>{idea.tagline}</div>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <StatusBadge status={idea.status} size="lg"/>
          {canAssignExpert && <Btn variant="secondary" size="sm" onClick={() => setModal('assign')}>🧑‍💼 Assign Expert</Btn>}
          {canDecide       && <Btn variant="gold"      size="sm" onClick={() => setModal('decide')}>⚖️ Make Decision</Btn>}
          {canAssignOffice && <Btn variant="success"   size="sm" onClick={() => setModal('office')}>🏢 Assign Office</Btn>}
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        {/* Left: idea info */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <Card>
            <SectionHead>📋 Idea Details</SectionHead>
            {[['Domain',idea.domain],['Stage',idea.stage],['Team',idea.teamSize],['Funding',idea.fundingNeeded||'—']].map(([k,v])=>
              <InfoRow key={k} label={k} value={v}/>)}
          </Card>

          <Card>
            <SectionHead>💡 Problem & Solution</SectionHead>
            <InfoBlock label="Problem"  value={idea.problem}/>
            <InfoBlock label="Solution" value={idea.solution}/>
            <InfoBlock label="Target Market" value={idea.targetMarket}/>
          </Card>

          {/* Founder info */}
          {idea.founder && (
            <Card>
              <SectionHead>👤 Founder</SectionHead>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                <div style={{ width:44, height:44, borderRadius:'50%', background:'var(--accent-dim)', border:'1px solid rgba(124,109,250,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>
                  {idea.founder.avatar||'🎓'}
                </div>
                <div>
                  <div style={{ fontWeight:700, color:'var(--text1)' }}>{idea.founder.name}</div>
                  <div style={{ fontSize:12, color:'var(--text3)' }}>{idea.founder.email}</div>
                  <div style={{ fontSize:12, color:'var(--text2)' }}>{idea.founder.university}</div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right: expert review + admin actions */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Expert review */}
          {idea.expertReview?.score ? (
            <Card>
              <SectionHead>🧑‍💼 Expert Review — {idea.assignedExpert?.name}</SectionHead>
              <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap', margin:'16px 0' }}>
                <ScoreRing score={idea.expertReview.innovation}      label="Innovation"  color="var(--accent)"/>
                <ScoreRing score={idea.expertReview.marketPotential} label="Market"      color="var(--blue)"/>
                <ScoreRing score={idea.expertReview.feasibility}     label="Feasibility" color="var(--teal)"/>
                <ScoreRing score={idea.expertReview.teamStrength}    label="Team"        color="var(--orange)"/>
              </div>
              <div style={{ textAlign:'center', fontFamily:'var(--font-display)', fontSize:28, fontWeight:900, color:'var(--gold)', marginBottom:12 }}>
                {idea.expertReview.score}/10
              </div>
              <div style={{ textAlign:'center', marginBottom:16 }}>
                <span style={{ padding:'5px 14px', borderRadius:'var(--r-full)', fontSize:12, fontWeight:700,
                  background: idea.expertReview.recommendation==='approve'?'var(--green-dim)':idea.expertReview.recommendation==='reject'?'var(--red-dim)':'var(--orange-dim)',
                  color:       idea.expertReview.recommendation==='approve'?'var(--green)':idea.expertReview.recommendation==='reject'?'var(--red)':'var(--orange)' }}>
                  Recommended: {idea.expertReview.recommendation}
                </span>
              </div>
              {idea.expertReview.feedback && (
                <div style={{ padding:12, background:'var(--bg3)', borderRadius:'var(--r-md)', fontSize:13, color:'var(--text2)', lineHeight:1.7 }}>
                  {idea.expertReview.feedback}
                </div>
              )}
            </Card>
          ) : (
            <Card>
              <SectionHead>🧑‍💼 Expert Review</SectionHead>
              {idea.assignedExpert ? (
                <div style={{ padding:16, textAlign:'center', color:'var(--text3)', fontSize:13 }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>⏳</div>
                  Assigned to <strong style={{ color:'var(--text2)' }}>{idea.assignedExpert.name}</strong>
                  <br/>Awaiting review…
                </div>
              ) : (
                <Empty icon="🧑‍💼" title="No expert assigned" sub="Assign a domain expert to review this idea."
                  action={<Btn variant="secondary" size="sm" onClick={() => setModal('assign')}>Assign Expert</Btn>}/>
              )}
            </Card>
          )}

          {/* Admin note / decision */}
          {(idea.adminNote || idea.decidedAt) && (
            <Card>
              <SectionHead>👑 Admin Decision</SectionHead>
              <div style={{ padding:12, background:idea.status==='rejected'?'var(--red-dim)':'var(--green-dim)', borderRadius:'var(--r-md)', fontSize:13, color:idea.status==='rejected'?'var(--red)':'var(--green)' }}>
                {idea.adminNote || 'Decision made.'}
              </div>
              {idea.decidedAt && <div style={{ fontSize:11, color:'var(--text3)', marginTop:8 }}>{new Date(idea.decidedAt).toLocaleString()}</div>}
            </Card>
          )}

          {/* Office info */}
          {idea.office && (
            <Card>
              <SectionHead>🏢 Virtual Office</SectionHead>
              <InfoRow label="Name"   value={idea.office.name}/>
              <InfoRow label="Plan"   value={<PlanBadge plan={idea.office.plan}/>}/>
              <InfoRow label="Fee"    value={`₹${idea.office.monthlyFee}/month`}/>
              <InfoRow label="Space"  value={idea.office.spaceId}/>
            </Card>
          )}
        </div>
      </div>

      {/* Modals */}
      {modal === 'assign' && (
        <Modal title="🧑‍💼 Assign Expert" onClose={() => setModal(null)}>
          <Select label="Choose Expert" value={form.expertId} onChange={e=>f('expertId',e.target.value)}
            options={[{value:'',label:'-- Select expert --'}, ...experts.map(e=>({value:e._id,label:`${e.name} · ${e.designation||''} · ${e.totalReviews} reviews`}))]}
            style={{ marginBottom:16 }}/>
          {form.expertId && (
            <div style={{ padding:12, background:'var(--bg3)', borderRadius:'var(--r-md)', fontSize:13, color:'var(--text2)', marginBottom:16 }}>
              {experts.find(e=>e._id===form.expertId)?.expertise?.join(', ')}
            </div>
          )}
          <Btn variant="primary" style={{ width:'100%' }} onClick={handleAssignExpert} disabled={saving||!form.expertId}>
            {saving?'Assigning…':'Assign Expert'}
          </Btn>
        </Modal>
      )}

      {modal === 'decide' && (
        <Modal title="⚖️ Make Decision" onClose={() => setModal(null)}>
          <div style={{ display:'flex', gap:10, marginBottom:16 }}>
            {[{v:'approved',label:'✅ Approve',color:'var(--green)'},{v:'rejected',label:'❌ Reject',color:'var(--red)'}].map(({v,label,color})=>(
              <button key={v} onClick={()=>f('decision',v)} style={{ flex:1,padding:12,border:`2px solid ${form.decision===v?color:'var(--border)'}`, borderRadius:'var(--r-md)',background:form.decision===v?`${color}15`:'var(--bg3)',color:form.decision===v?color:'var(--text2)',cursor:'pointer',fontFamily:'var(--font-body)',fontSize:14,fontWeight:700,transition:'var(--t)' }}>{label}</button>
            ))}
          </div>
          <Textarea label="Admin Note (shown to founder)" value={form.adminNote} onChange={e=>f('adminNote',e.target.value)}
            placeholder="Write your feedback for the founder…" style={{ marginBottom:16 }}/>
          <Btn variant={form.decision==='approved'?'success':'danger'} style={{ width:'100%' }} onClick={handleDecide} disabled={saving}>
            {saving?'Saving…':`Confirm ${form.decision==='approved'?'Approval':'Rejection'}`}
          </Btn>
        </Modal>
      )}

      {modal === 'office' && (
        <Modal title="🏢 Assign Virtual Office" onClose={() => setModal(null)}>
          <Select label="Plan" value={form.plan} onChange={e=>{f('plan',e.target.value);f('monthlyFee',e.target.value==='starter'?499:e.target.value==='growth'?999:1999);}}
            options={[{value:'starter',label:'Starter — ₹499/month'},{value:'growth',label:'Growth — ₹999/month'},{value:'scale',label:'Scale — ₹1,999/month'}]}
            style={{ marginBottom:14 }}/>
          <Select label="Theme" value={form.theme} onChange={e=>f('theme',e.target.value)}
            options={['tech','design','finance','health','edu','general'].map(t=>({value:t,label:t.charAt(0).toUpperCase()+t.slice(1)}))}
            style={{ marginBottom:14 }}/>
          <Input label="Monthly Fee (₹)" type="number" value={form.monthlyFee} onChange={e=>f('monthlyFee',e.target.value)} style={{ marginBottom:16 }}/>
          <Btn variant="success" style={{ width:'100%' }} onClick={handleAssignOffice} disabled={saving}>
            {saving?'Creating…':'🚀 Create & Assign Office'}
          </Btn>
        </Modal>
      )}
    </div>
  );
}

// ── Expert Management ─────────────────────────────────────────────────────────
export function AdminExperts() {
  const [experts, setExperts]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [form,    setForm]      = useState({ name:'', email:'', password:'Expert@123', expertise:'', designation:'', bio:'' });
  const [saving,  setSaving]    = useState(false);
  const [err,     setErr]       = useState('');

  useEffect(() => {
    userApi.experts().then(d=>setExperts(d.experts||[])).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  function f(k,v){setForm(p=>({...p,[k]:v}));setErr('');}

  async function handleAdd(e){
    e.preventDefault(); setSaving(true); setErr('');
    try {
      const d = await userApi.createExpert({ ...form, expertise: form.expertise.split(',').map(s=>s.trim()) });
      setExperts(p=>[d.expert,...p]); setShowAdd(false); setForm({ name:'',email:'',password:'Expert@123',expertise:'',designation:'',bio:'' });
    } catch(e){setErr(e.message);}
    finally{setSaving(false);}
  }

  return (
    <div style={P.page}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={P.pageTitle}>🧑‍💼 Expert Management</div>
          <div style={P.pageSub}>{experts.length} expert{experts.length!==1?'s':''} on the platform</div>
        </div>
        <Btn variant="primary" onClick={()=>setShowAdd(true)}>+ Add Expert</Btn>
      </div>

      {loading ? <div style={{display:'flex',justifyContent:'center',padding:40}}><Spinner/></div> :
       experts.length===0 ? <Empty icon="🧑‍💼" title="No experts yet" sub="Add your first domain expert."
         action={<Btn variant="primary" onClick={()=>setShowAdd(true)}>Add Expert</Btn>}/> : (
        <div style={P.grid}>
          {experts.map(ex=>(
            <Card key={ex._id} style={{display:'flex',flexDirection:'column',gap:10}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:44,height:44,borderRadius:'50%',background:'var(--orange-dim)',border:'1px solid rgba(251,146,60,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>
                  {ex.avatar||'🧑‍💼'}
                </div>
                <div>
                  <div style={{fontWeight:700,color:'var(--text1)',fontSize:14}}>{ex.name}</div>
                  <div style={{fontSize:11,color:'var(--text3)'}}>{ex.email}</div>
                </div>
              </div>
              {ex.designation && <div style={{fontSize:12,color:'var(--text2)'}}>{ex.designation}</div>}
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {(ex.expertise||[]).map(e=><span key={e} style={{...P.tag,color:'var(--orange)'}}>{e}</span>)}
              </div>
              <div style={{fontSize:12,color:'var(--text3)'}}>⭐ {ex.totalReviews} reviews done</div>
            </Card>
          ))}
        </div>
      )}

      {showAdd && (
        <Modal title="+ Add Expert" onClose={()=>setShowAdd(false)}>
          <form onSubmit={handleAdd} style={{display:'flex',flexDirection:'column',gap:14}}>
            <Input label="Full Name *" value={form.name} onChange={e=>f('name',e.target.value)} placeholder="Dr. Priya Sharma"/>
            <Input label="Email *" type="email" value={form.email} onChange={e=>f('email',e.target.value)} placeholder="expert@company.com"/>
            <Input label="Temp Password" type="password" value={form.password} onChange={e=>f('password',e.target.value)}/>
            <Input label="Designation" value={form.designation} onChange={e=>f('designation',e.target.value)} placeholder="Senior PM at Google"/>
            <Input label="Expertise domains (comma-separated)" value={form.expertise} onChange={e=>f('expertise',e.target.value)} placeholder="EdTech, SaaS, AI/ML"/>
            <Textarea label="Bio" value={form.bio} onChange={e=>f('bio',e.target.value)} placeholder="Brief background…" style={{minHeight:70}}/>
            {err && <p style={{color:'var(--red)',fontSize:12}}>{err}</p>}
            <Btn type="submit" variant="primary" disabled={saving}>{saving?'Adding…':'Add Expert'}</Btn>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ── Admin Offices ─────────────────────────────────────────────────────────────
export function AdminOffices() {
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userApi.offices().then(d=>setOffices(d.offices||[])).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  return (
    <div style={P.page}>
      <div style={P.pageHeader}>
        <div style={P.pageTitle}>🏢 Virtual Offices</div>
        <div style={P.pageSub}>{offices.length} active office{offices.length!==1?'s':''}</div>
      </div>

      {loading ? <div style={{display:'flex',justifyContent:'center',padding:40}}><Spinner/></div> :
       offices.length===0 ? <Empty icon="🏢" title="No offices yet" sub="Offices are created when approved ideas are assigned."/> : (
        <div style={P.grid}>
          {offices.map(o=>(
            <Card key={o._id} style={{display:'flex',flexDirection:'column',gap:10}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontFamily:'var(--font-display)',fontSize:15,fontWeight:700,color:'var(--text1)'}}>{o.name}</div>
                <PlanBadge plan={o.plan}/>
              </div>
              {o.idea && <div style={{fontSize:12,color:'var(--text2)'}}>💡 {o.idea.title}</div>}
              {o.founder && (
                <div style={{fontSize:12,color:'var(--text3)'}}>
                  👤 {o.founder.name} · {o.founder.email}
                </div>
              )}
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                <span style={P.tag}>₹{o.monthlyFee}/mo</span>
                <span style={P.tag}>{o.maxMembers} members max</span>
                <span style={{...P.tag,color:o.isActive?'var(--green)':'var(--red)'}}>
                  {o.isActive?'● Active':'● Inactive'}
                </span>
              </div>
              <div style={{fontSize:10,color:'var(--text3)',fontFamily:'monospace'}}>ID: {o.spaceId}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Admin Users ───────────────────────────────────────────────────────────────
export function AdminUsers() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [role,    setRole]    = useState('');

  useEffect(()=>{
    userApi.all(role).then(d=>setUsers(d.users||[])).catch(()=>{}).finally(()=>setLoading(false));
  },[role]);

  async function handleToggle(id){
    try {
      const d = await userApi.toggle(id);
      setUsers(prev=>prev.map(u=>u._id===id?{...u,isActive:d.user.isActive}:u));
    } catch(e){}
  }

  return (
    <div style={P.page}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:12}}>
        <div>
          <div style={P.pageTitle}>👥 User Management</div>
          <div style={P.pageSub}>{users.length} users</div>
        </div>
        <div style={{display:'flex',gap:8}}>
          {['','founder','expert','admin'].map(r=>(
            <button key={r} onClick={()=>setRole(r)}
              style={{padding:'6px 14px',border:`1px solid ${role===r?'var(--accent)':'var(--border)'}`,borderRadius:'var(--r-full)',background:role===r?'var(--accent-dim)':'transparent',color:role===r?'var(--accent)':'var(--text2)',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'var(--font-body)',transition:'var(--t)'}}>
              {r||'All'}
            </button>
          ))}
        </div>
      </div>

      {loading?<div style={{display:'flex',justifyContent:'center',padding:40}}><Spinner/></div>:(
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {users.map(u=>(
            <div key={u._id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--r-md)'}}>
              <span style={{fontSize:22}}>{u.avatar||'👤'}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,color:'var(--text1)',fontSize:13}}>{u.name}</div>
                <div style={{fontSize:11,color:'var(--text3)'}}>{u.email}</div>
              </div>
              <span style={{...P.tag,color:u.role==='admin'?'var(--gold)':u.role==='expert'?'var(--orange)':'var(--accent)'}}>{u.role}</span>
              <span style={{...P.tag,color:u.isActive?'var(--green)':'var(--red)'}}>{u.isActive?'Active':'Suspended'}</span>
              <button onClick={()=>handleToggle(u._id)} style={{padding:'5px 10px',border:'1px solid var(--border2)',borderRadius:'var(--r-sm)',background:'none',color:'var(--text2)',fontSize:11,cursor:'pointer',fontFamily:'var(--font-body)'}}>
                {u.isActive?'Suspend':'Restore'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function SectionHead({children}){
  return <div style={{fontFamily:'var(--font-display)',fontSize:13,fontWeight:700,color:'var(--text2)',letterSpacing:'0.04em',marginBottom:12}}>{children}</div>;
}
function InfoRow({label,value}){
  return(
    <div style={{display:'flex',gap:12,padding:'7px 0',borderBottom:'1px solid var(--border)',fontSize:13}}>
      <span style={{color:'var(--text3)',minWidth:90,flexShrink:0}}>{label}</span>
      <span style={{color:'var(--text1)',fontWeight:500}}>{value}</span>
    </div>
  );
}
function InfoBlock({label,value}){
  return(
    <div style={{marginBottom:12}}>
      <div style={{fontSize:10,fontWeight:700,color:'var(--text3)',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:5}}>{label}</div>
      <div style={{fontSize:13,color:'var(--text1)',lineHeight:1.7,background:'var(--bg3)',padding:10,borderRadius:'var(--r-sm)'}}>{value}</div>
    </div>
  );
}

const P = {
  page: { padding:'28px 32px', maxWidth:1200, margin:'0 auto' },
  pageHeader: { marginBottom:24 },
  pageTitle: { fontFamily:'var(--font-display)', fontSize:24, fontWeight:800, color:'var(--text1)' },
  pageSub:   { fontSize:14, color:'var(--text2)', marginTop:4 },
  statsGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:16, marginBottom:28 },
  sectionHead: { fontFamily:'var(--font-display)', fontSize:15, fontWeight:700, color:'var(--text1)', marginBottom:12 },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 },
  tag: { fontSize:11, fontWeight:600, padding:'3px 8px', borderRadius:'var(--r-sm)', background:'var(--bg4)', color:'var(--text2)' },
};
