import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { ideaApi, userApi } from "../utils/api";
import {
  Btn,
  Card,
  Input,
  Textarea,
  Select,
  StatusBadge,
  PipelineTracker,
  ScoreRing,
  Empty,
  Spinner,
  StatCard,
} from "../components/common/UI";

const DOMAINS = [
  "EdTech",
  "FinTech",
  "HealthTech",
  "AgriTech",
  "CleanTech",
  "SaaS",
  "E-commerce",
  "AI/ML",
  "IoT",
  "DeepTech",
  "Other",
];
const STAGES = [
  { value: "idea", label: "Concept / Idea" },
  { value: "prototype", label: "Working Prototype" },
  { value: "mvp", label: "MVP / Early Users" },
];

// ── Founder Home ──────────────────────────────────────────────────────────────
export function FounderHome({ setPage }) {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ideaApi
      .myIdeas()
      .then((d) => setIdeas(d.ideas || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active = ideas.find((i) => i.status === "office_assigned");
  const latest = ideas[0];

  return (
    <div style={P.page}>
      {/* Welcome banner */}
      <div style={P.welcome}>
        <div>
          <div style={P.welcomeGreet}>
            Welcome back,{" "}
            <span style={{ color: "var(--accent)" }}>
              {user?.name?.split(" ")[0]}
            </span>{" "}
            👋
          </div>
          <div style={P.welcomeSub}>
            Track your startup journey from idea to virtual office.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {active ? (
            <Btn
              variant="gold"
              onClick={() => setPage(`office-${active.office.spaceId}`)}
            >
              🏢 Enter Office
            </Btn>
          ) : (
            <Btn variant="primary" onClick={() => setPage("submit")}>
              💡 Submit New Idea
            </Btn>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div style={P.statsRow}>
        <StatCard
          icon="💡"
          label="Ideas Submitted"
          value={ideas.length}
          color="var(--accent)"
        />
        <StatCard
          icon="✅"
          label="Approved"
          value={
            ideas.filter((i) =>
              ["approved", "office_assigned"].includes(i.status),
            ).length
          }
          color="var(--green)"
        />
        <StatCard
          icon="🔍"
          label="Under Review"
          value={
            ideas.filter((i) =>
              ["under_review", "expert_reviewed"].includes(i.status),
            ).length
          }
          color="var(--orange)"
        />
        <StatCard
          icon="🏢"
          label="Office Active"
          value={active ? "Yes" : "No"}
          color="var(--gold)"
        />
      </div>

      {/* Latest idea pipeline */}
      {latest && (
        <Card style={{ marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 20,
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div>
              <div style={P.cardTitle}>{latest.title}</div>
              <div
                style={{ fontSize: 13, color: "var(--text2)", marginTop: 4 }}
              >
                {latest.tagline}
              </div>
            </div>
            <StatusBadge status={latest.status} />
          </div>
          <PipelineTracker status={latest.status} />
          {latest.expertReview?.feedback && (
            <div
              style={{
                marginTop: 20,
                padding: 14,
                background: "var(--bg3)",
                borderRadius: "var(--r-md)",
                borderLeft: "3px solid var(--teal)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--teal)",
                  marginBottom: 6,
                  letterSpacing: "0.05em",
                }}
              >
                EXPERT FEEDBACK
              </div>
              <div
                style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}
              >
                {latest.expertReview.feedback}
              </div>
            </div>
          )}
          {latest.adminNote && (
            <div
              style={{
                marginTop: 12,
                padding: 14,
                background: "var(--bg3)",
                borderRadius: "var(--r-md)",
                borderLeft: `3px solid ${latest.status === "rejected" ? "var(--red)" : "var(--green)"}`,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color:
                    latest.status === "rejected"
                      ? "var(--red)"
                      : "var(--green)",
                  marginBottom: 6,
                  letterSpacing: "0.05em",
                }}
              >
                ADMIN NOTE
              </div>
              <div
                style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}
              >
                {latest.adminNote}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* All ideas list */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <Spinner />
        </div>
      ) : ideas.length === 0 ? (
        <Empty
          icon="💡"
          title="No ideas yet"
          sub="Submit your first startup idea and start your journey."
          action={
            <Btn variant="primary" onClick={() => setPage("submit")}>
              Submit Your First Idea →
            </Btn>
          }
        />
      ) : (
        <div style={P.ideaList}>
          {ideas.map((idea) => (
            <IdeaCard
              key={idea._id}
              idea={idea}
              onClick={() => setPage(`idea-${idea._id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function IdeaCard({ idea, onClick }) {
  return (
    <Card
      hover
      onClick={onClick}
      style={{ display: "flex", flexDirection: "column", gap: 10 }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 15,
            fontWeight: 700,
            color: "var(--text1)",
          }}
        >
          {idea.title}
        </div>
        <StatusBadge status={idea.status} />
      </div>
      <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.5 }}>
        {idea.tagline}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <span style={P.tag}>{idea.domain}</span>
        <span style={P.tag}>{idea.stage}</span>
        {idea.assignedExpert && (
          <span style={{ ...P.tag, color: "var(--teal)" }}>
            Expert: {idea.assignedExpert.name}
          </span>
        )}
      </div>
      <div style={{ fontSize: 11, color: "var(--text3)" }}>
        {new Date(idea.createdAt).toLocaleDateString()}
      </div>
    </Card>
  );
}

// ── Submit Idea ───────────────────────────────────────────────────────────────
export function SubmitIdea({ onSubmitted }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({
    title: "",
    tagline: "",
    description: "",
    problem: "",
    solution: "",
    targetMarket: "",
    domain: "EdTech",
    stage: "idea",
    teamSize: 1,
    fundingNeeded: "",
    pitchDeck: "",
    tags: "",
  });

  function f(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
    setErr("");
  }

  async function handleSubmit() {
    setLoading(true);
    setErr("");
    try {
      await ideaApi.submit({
        ...form,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      onSubmitted();
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  const steps = [
    { label: "Basic Info", icon: "📋" },
    { label: "Problem & Solution", icon: "💡" },
    { label: "Market & Stage", icon: "📊" },
    { label: "Review & Submit", icon: "🚀" },
  ];

  return (
    <div style={P.page}>
      <div style={P.formHeader}>
        <div style={P.formTitle}>Submit Your Startup Idea</div>
        <div style={P.formSub}>
          Complete all sections. Our experts will review within 48 hours.
        </div>
      </div>

      {/* Step indicator */}
      <div
        style={{
          display: "flex",
          gap: 0,
          marginBottom: 32,
          maxWidth: 640,
          margin: "0 auto 32px",
        }}
      >
        {steps.map((s, i) => (
          <div
            key={i}
            style={{ flex: 1, display: "flex", alignItems: "center" }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 5,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  border: `2px solid ${step > i ? "var(--green)" : step === i + 1 ? "var(--accent)" : "var(--border2)"}`,
                  background:
                    step > i
                      ? "var(--green-dim)"
                      : step === i + 1
                        ? "var(--accent-dim)"
                        : "var(--bg3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                  transition: "var(--t)",
                }}
              >
                {step > i ? "✓" : s.icon}
              </div>
              <span
                style={{
                  fontSize: 9,
                  color: step === i + 1 ? "var(--text1)" : "var(--text3)",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  textAlign: "center",
                }}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  margin: "0 4px",
                  marginBottom: 20,
                  background: step > i + 1 ? "var(--green)" : "var(--border)",
                  borderRadius: 1,
                }}
              />
            )}
          </div>
        ))}
      </div>

      <Card style={{ maxWidth: 640, margin: "0 auto" }}>
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Input
              label="Startup Name *"
              value={form.title}
              onChange={(e) => f("title", e.target.value)}
              placeholder="e.g. EduConnect"
            />
            <Input
              label="One-line tagline *"
              value={form.tagline}
              onChange={(e) => f("tagline", e.target.value)}
              placeholder="e.g. Connecting rural students with city tutors"
            />
            <Textarea
              label="Full Description *"
              value={form.description}
              onChange={(e) => f("description", e.target.value)}
              placeholder="Describe your startup in 2-3 paragraphs…"
              style={{ minHeight: 100 }}
            />
          </div>
        )}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Textarea
              label="Problem Statement *"
              value={form.problem}
              onChange={(e) => f("problem", e.target.value)}
              placeholder="What specific problem are you solving? Who faces it?"
            />
            <Textarea
              label="Your Solution *"
              value={form.solution}
              onChange={(e) => f("solution", e.target.value)}
              placeholder="How does your startup solve this problem? What makes it unique?"
            />
          </div>
        )}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Textarea
              label="Target Market *"
              value={form.targetMarket}
              onChange={(e) => f("targetMarket", e.target.value)}
              placeholder="Who are your customers? What's the market size?"
            />
            <Select
              label="Domain *"
              value={form.domain}
              onChange={(e) => f("domain", e.target.value)}
              options={DOMAINS.map((d) => ({ value: d, label: d }))}
            />
            <Select
              label="Current Stage *"
              value={form.stage}
              onChange={(e) => f("stage", e.target.value)}
              options={STAGES}
            />
            <Input
              label="Team Size"
              type="number"
              min={1}
              max={50}
              value={form.teamSize}
              onChange={(e) => f("teamSize", +e.target.value)}
            />
            <Input
              label="Funding needed (optional)"
              value={form.fundingNeeded}
              onChange={(e) => f("fundingNeeded", e.target.value)}
              placeholder="e.g. ₹5L for 6 months runway"
            />
            <Input
              label="Tags (comma-separated)"
              value={form.tags}
              onChange={(e) => f("tags", e.target.value)}
              placeholder="mobile, b2b, subscription…"
            />
          </div>
        )}
        {step === 4 && (
          <div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 16,
                fontWeight: 700,
                marginBottom: 16,
              }}
            >
              Review Your Submission
            </div>
            {[
              ["Startup", form.title],
              ["Tagline", form.tagline],
              ["Domain", form.domain],
              ["Stage", form.stage],
              ["Team", form.teamSize],
            ].map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "8px 0",
                  borderBottom: "1px solid var(--border)",
                  fontSize: 13,
                }}
              >
                <span style={{ color: "var(--text3)", minWidth: 80 }}>{k}</span>
                <span style={{ color: "var(--text1)", fontWeight: 500 }}>
                  {v}
                </span>
              </div>
            ))}
            <div
              style={{
                marginTop: 16,
                padding: 14,
                background: "var(--accent-dim)",
                border: "1px solid rgba(124,109,250,0.2)",
                borderRadius: "var(--r-md)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--accent)",
                  marginBottom: 6,
                }}
              >
                📋 WHAT HAPPENS NEXT
              </div>
              <div
                style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.7 }}
              >
                Your idea will be reviewed by an assigned domain expert within
                48 hours. You'll receive real-time notifications at each stage.
              </div>
            </div>
          </div>
        )}

        {err && (
          <p style={{ color: "var(--red)", fontSize: 12, marginTop: 12 }}>
            {err}
          </p>
        )}

        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 20,
            justifyContent: "flex-end",
          }}
        >
          {step > 1 && (
            <Btn variant="secondary" onClick={() => setStep((s) => s - 1)}>
              ← Back
            </Btn>
          )}
          {step < 4 ? (
            <Btn
              variant="primary"
              onClick={() => {
                if (!form.title && step === 1) {
                  setErr("Startup name required");
                  return;
                }
                setStep((s) => s + 1);
              }}
            >
              Continue →
            </Btn>
          ) : (
            <Btn variant="primary" onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Spinner size={16} /> Submitting…
                </>
              ) : (
                "🚀 Submit Idea"
              )}
            </Btn>
          )}
        </div>
      </Card>
    </div>
  );
}

const P = {
  page: { padding: "28px 32px", maxWidth: 900, margin: "0 auto" },
  welcome: {
    background: "linear-gradient(135deg,var(--bg2),var(--bg3))",
    border: "1px solid var(--border)",
    borderRadius: "var(--r-xl)",
    padding: "28px 28px",
    marginBottom: 24,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
  },
  welcomeGreet: {
    fontFamily: "var(--font-display)",
    fontSize: 24,
    fontWeight: 800,
    color: "var(--text1)",
  },
  welcomeSub: { fontSize: 14, color: "var(--text2)", marginTop: 4 },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
    gap: 16,
    marginBottom: 24,
  },
  cardTitle: {
    fontFamily: "var(--font-display)",
    fontSize: 17,
    fontWeight: 700,
    color: "var(--text1)",
  },
  ideaList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
    gap: 16,
  },
  tag: {
    fontSize: 11,
    fontWeight: 600,
    padding: "3px 8px",
    borderRadius: "var(--r-sm)",
    background: "var(--bg4)",
    color: "var(--text2)",
  },
  formHeader: { textAlign: "center", marginBottom: 28 },
  formTitle: {
    fontFamily: "var(--font-display)",
    fontSize: 26,
    fontWeight: 800,
    color: "var(--text1)",
  },
  formSub: { fontSize: 14, color: "var(--text2)", marginTop: 6 },
};
