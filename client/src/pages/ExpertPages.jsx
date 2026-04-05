import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ideaApi } from '../utils/api';
import { Btn, Card, Textarea, StatusBadge, ScoreRing, Empty, Spinner, StatCard } from '../components/common/UI';

// ── Expert Home ───────────────────────────────────────────────────────────────
export function ExpertHome({ setPage }) {
  const { user } = useAuth();
  const [queue,   setQueue]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ideaApi.expertQueue().then(d => setQueue(d.ideas || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const pending  = queue.filter(i => i.status === 'under_review');
  const reviewed = queue.filter(i => i.status === 'expert_reviewed');

  return (
    <div style={P.page}>
      <div style={P.welcome}>
        <div>
          <div style={P.welcomeGreet}>Hello, <span style={{ color: 'var(--orange)' }}>{user?.name?.split(' ')[0]}</span> 🧑‍💼</div>
          <div style={P.welcomeSub}>
            {user?.designation && <span>{user.designation} · </span>}
            {user?.expertise?.join(', ')}
          </div>
        </div>
        <Btn variant="gold" onClick={() => setPage('queue')}>📬 Open Review Queue</Btn>
      </div>

      <div style={P.statsRow}>
        <StatCard icon="📬" label="Pending Reviews"  value={pending.length}        color="var(--orange)"/>
        <StatCard icon="✅" label="Reviews Done"     value={reviewed.length}       color="var(--green)"/>
        <StatCard icon="⭐" label="Total Reviews"    value={user?.totalReviews||0} color="var(--accent)"/>
        <StatCard icon="🏆" label="Recommendations"  value={reviewed.filter(i=>i.expertReview?.recommendation==='approve').length} color="var(--gold)"/>
      </div>

      {/* Pending queue preview */}
      {pending.length > 0 && (
        <>
          <div style={P.sectionHead}>⏳ Pending Review</div>
          <div style={P.grid}>
            {pending.slice(0,3).map(idea => (
              <QueueCard key={idea._id} idea={idea} onReview={() => setPage(`review-${idea._id}`)}/>
            ))}
          </div>
        </>
      )}

      {/* Reviewed */}
      {reviewed.length > 0 && (
        <>
          <div style={{ ...P.sectionHead, marginTop: 28 }}>✅ Reviewed</div>
          <div style={P.grid}>
            {reviewed.map(idea => <QueueCard key={idea._id} idea={idea} done/>)}
          </div>
        </>
      )}

      {loading && <div style={{ display:'flex',justifyContent:'center',padding:40 }}><Spinner/></div>}
      {!loading && queue.length === 0 && (
        <Empty icon="📭" title="No ideas assigned yet" sub="When the admin assigns ideas to you, they'll appear here."/>
      )}
    </div>
  );
}

// ── Queue Card ────────────────────────────────────────────────────────────────
function QueueCard({ idea, onReview, done }) {
  return (
    <Card style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:700, color:'var(--text1)' }}>{idea.title}</div>
        <StatusBadge status={idea.status}/>
      </div>
      <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.5 }}>{idea.tagline}</div>

      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        <span style={P.tag}>{idea.domain}</span>
        <span style={P.tag}>{idea.stage}</span>
        {idea.founder && <span style={{ ...P.tag, color:'var(--accent)' }}>by {idea.founder.name}</span>}
      </div>

      {/* Score preview if reviewed */}
      {done && idea.expertReview?.score && (
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, color: idea.expertReview.recommendation==='approve'?'var(--green)':'var(--red)' }}>
            {idea.expertReview.score}/10
          </div>
          <span style={{ fontSize:12, color:'var(--text2)' }}>overall · {idea.expertReview.recommendation}</span>
        </div>
      )}

      {!done && <Btn variant="gold" size="sm" onClick={onReview}>📝 Write Review</Btn>}
    </Card>
  );
}

// ── Full Review Queue ─────────────────────────────────────────────────────────
export function ExpertQueue({ setPage }) {
  const [queue,   setQueue]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ideaApi.expertQueue().then(d => setQueue(d.ideas||[])).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  if (loading) return <div style={{ display:'flex',justifyContent:'center',padding:80 }}><Spinner/></div>;

  return (
    <div style={P.page}>
      <div style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:800, color:'var(--text1)', marginBottom:6 }}>
        📬 Review Queue
      </div>
      <div style={{ fontSize:14, color:'var(--text2)', marginBottom:28 }}>
        {queue.length} idea{queue.length!==1?'s':''} assigned to you
      </div>

      {queue.length === 0 ? (
        <Empty icon="📭" title="Queue empty" sub="Check back later — the admin will assign ideas as they come in."/>
      ) : (
        <div style={P.grid}>
          {queue.map(idea => (
            <QueueCard
              key={idea._id} idea={idea}
              done={idea.status==='expert_reviewed'}
              onReview={() => setPage(`review-${idea._id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Review Form ───────────────────────────────────────────────────────────────
export function ReviewForm({ ideaId, onDone }) {
  const [idea,    setIdea]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState('');
  const [review, setReview]   = useState({
    innovation: 5, marketPotential: 5, feasibility: 5, teamStrength: 5,
    feedback: '', recommendation: 'approve',
  });

  useEffect(() => {
    ideaApi.get(ideaId)
      .then(d => { setIdea(d.idea); if (d.idea.expertReview?.score) setReview(r => ({ ...r, ...d.idea.expertReview })); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ideaId]);

  function r(k, v) { setReview(p => ({ ...p, [k]: v })); }

  const overall = Math.round((review.innovation + review.marketPotential + review.feasibility + review.teamStrength) / 4);

  async function handleSubmit() {
    if (!review.feedback.trim()) { setErr('Please write your feedback.'); return; }
    setSaving(true); setErr('');
    try {
      await ideaApi.submitReview(ideaId, { ...review, score: overall });
      onDone();
    } catch(e) { setErr(e.message); }
    finally { setSaving(false); }
  }

  if (loading) return <div style={{ display:'flex',justifyContent:'center',padding:80 }}><Spinner/></div>;
  if (!idea)   return <div style={{ padding:40, textAlign:'center', color:'var(--text3)' }}>Idea not found.</div>;

  const alreadyReviewed = idea.status === 'expert_reviewed';

  return (
    <div style={P.page}>
      {/* Idea overview */}
      <Card style={{ marginBottom:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800, color:'var(--text1)' }}>{idea.title}</div>
            <div style={{ fontSize:14, color:'var(--text2)', marginTop:4 }}>{idea.tagline}</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <span style={P.tag}>{idea.domain}</span>
            <span style={P.tag}>{idea.stage}</span>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:20 }}>
          {[
            ['Problem',      idea.problem],
            ['Solution',     idea.solution],
            ['Target Market',idea.targetMarket],
            ['Team Size',    idea.teamSize],
          ].map(([k,v]) => (
            <div key={k} style={{ padding:12, background:'var(--bg3)', borderRadius:'var(--r-md)' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--text3)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:6 }}>{k}</div>
              <div style={{ fontSize:13, color:'var(--text1)', lineHeight:1.6 }}>{v}</div>
            </div>
          ))}
        </div>
        {idea.founder && (
          <div style={{ marginTop:16, display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:22 }}>{idea.founder.avatar || '🎓'}</span>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--text1)' }}>{idea.founder.name}</div>
              <div style={{ fontSize:11, color:'var(--text3)' }}>{idea.founder.university}</div>
            </div>
          </div>
        )}
      </Card>

      {/* Scoring section */}
      <Card style={{ marginBottom:24 }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:700, color:'var(--text1)', marginBottom:20 }}>
          📊 Score the Idea
        </div>

        {/* Score rings */}
        <div style={{ display:'flex', gap:24, justifyContent:'center', flexWrap:'wrap', marginBottom:24 }}>
          <ScoreRing score={review.innovation}      label="Innovation"    color="var(--accent)"/>
          <ScoreRing score={review.marketPotential} label="Market Pot."   color="var(--blue)"/>
          <ScoreRing score={review.feasibility}     label="Feasibility"   color="var(--teal)"/>
          <ScoreRing score={review.teamStrength}    label="Team"          color="var(--orange)"/>
          <ScoreRing score={overall}                label="Overall"       color="var(--gold)"/>
        </div>

        {/* Sliders */}
        {[
          { key:'innovation',      label:'Innovation & Originality',  color:'var(--accent)' },
          { key:'marketPotential', label:'Market Potential & Size',   color:'var(--blue)'   },
          { key:'feasibility',     label:'Technical Feasibility',     color:'var(--teal)'   },
          { key:'teamStrength',    label:'Team Strength & Execution', color:'var(--orange)' },
        ].map(({ key, label, color }) => (
          <div key={key} style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:12, fontWeight:600, color:'var(--text2)' }}>{label}</span>
              <span style={{ fontSize:14, fontWeight:800, color, fontFamily:'var(--font-display)' }}>{review[key]}/10</span>
            </div>
            <input type="range" min={1} max={10} value={review[key]}
              onChange={e => r(key, +e.target.value)} disabled={alreadyReviewed}
              style={{ width:'100%', accentColor: color }}/>
          </div>
        ))}
      </Card>

      {/* Feedback + recommendation */}
      <Card>
        <Textarea label="Detailed Feedback *" value={review.feedback}
          onChange={e => r('feedback', e.target.value)}
          placeholder="Share your detailed thoughts on the idea — strengths, weaknesses, suggestions for improvement…"
          disabled={alreadyReviewed}
          style={{ marginBottom:20, minHeight:120 }}/>

        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', letterSpacing:'0.05em', textTransform:'uppercase', display:'block', marginBottom:8 }}>
            Your Recommendation *
          </label>
          <div style={{ display:'flex', gap:10 }}>
            {[
              { v:'approve',    icon:'✅', label:'Approve',    color:'var(--green)'  },
              { v:'needs_work', icon:'🔧', label:'Needs Work', color:'var(--orange)' },
              { v:'reject',     icon:'❌', label:'Reject',     color:'var(--red)'    },
            ].map(({ v, icon, label, color }) => (
              <button key={v} type="button"
                disabled={alreadyReviewed}
                onClick={() => r('recommendation', v)}
                style={{
                  flex:1, padding:'10px', border:`2px solid ${review.recommendation===v?color:'var(--border)'}`,
                  borderRadius:'var(--r-md)', background:review.recommendation===v?`${color}15`:'var(--bg3)',
                  color:review.recommendation===v?color:'var(--text2)',
                  cursor:alreadyReviewed?'default':'pointer', fontFamily:'var(--font-body)',
                  fontSize:13, fontWeight:600, transition:'var(--t)',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                }}>
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        {err && <p style={{ color:'var(--red)', fontSize:12, marginBottom:12 }}>{err}</p>}

        {alreadyReviewed ? (
          <div style={{ padding:12, background:'var(--green-dim)', border:'1px solid rgba(52,211,153,0.2)', borderRadius:'var(--r-md)', fontSize:13, color:'var(--green)', textAlign:'center' }}>
            ✅ Review submitted — waiting for admin decision
          </div>
        ) : (
          <Btn variant="primary" style={{ width:'100%' }} onClick={handleSubmit} disabled={saving}>
            {saving ? <><span style={{ animation:'spin 0.8s linear infinite', display:'inline-block' }}>⏳</span> Submitting…</> : '📤 Submit Review to Admin'}
          </Btn>
        )}
      </Card>
    </div>
  );
}

const P = {
  page: { padding:'28px 32px', maxWidth:960, margin:'0 auto' },
  welcome: { background:'linear-gradient(135deg,var(--bg2),var(--bg3))', border:'1px solid var(--border)', borderRadius:'var(--r-xl)', padding:'28px', marginBottom:24, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 },
  welcomeGreet: { fontFamily:'var(--font-display)', fontSize:24, fontWeight:800, color:'var(--text1)' },
  welcomeSub: { fontSize:13, color:'var(--text2)', marginTop:6 },
  statsRow: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:16, marginBottom:28 },
  sectionHead: { fontFamily:'var(--font-display)', fontSize:15, fontWeight:700, color:'var(--text1)', marginBottom:14 },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 },
  tag: { fontSize:11, fontWeight:600, padding:'3px 8px', borderRadius:'var(--r-sm)', background:'var(--bg4)', color:'var(--text2)' },
};
