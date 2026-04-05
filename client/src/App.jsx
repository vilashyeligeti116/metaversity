import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import JoinPage from "./pages/JoinPage";
import Navbar from "./components/common/Navbar";
import OfficePage from "./components/office/OfficePage";

import { FounderHome, SubmitIdea } from "./pages/FounderPages";
import FounderTeamPage from "./pages/FounderTeamPage";
import { EmployeeHome } from "./pages/EmployeePages";
import { ExpertHome, ExpertQueue, ReviewForm } from "./pages/ExpertPages";
import {
  AdminDashboard,
  AdminIdeas,
  AdminIdeaDetail,
  AdminExperts,
  AdminOffices,
  AdminUsers,
} from "./pages/AdminPages";

import "./styles/global.css";

// ── Detect invite token in URL path ──────────────────────────────────────────
function getInviteToken() {
  const path = window.location.pathname;
  const match = path.match(/^\/join\/([a-f0-9]{32})$/);
  return match ? match[1] : null;
}

function AppInner() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState("home");
  const inviteToken = getInviteToken();

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#060912",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "3px solid rgba(124,109,250,0.2)",
            borderTopColor: "#7c6dfa",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );

  // ── Invite join flow ────────────────────────────────────────────────────────
  if (inviteToken && !user) {
    return (
      <JoinPage
        token={inviteToken}
        onSuccess={() => {
          window.history.replaceState({}, "", "/");
          window.location.reload();
        }}
      />
    );
  }

  // ── Not logged in ───────────────────────────────────────────────────────────
  if (!user) {
    if (page === "login")
      return <AuthPage mode="login" onSuccess={() => setPage("home")} />;
    if (page === "register")
      return <AuthPage mode="register" onSuccess={() => setPage("home")} />;
    return (
      <LandingPage
        onLogin={() => setPage("login")}
        onRegister={() => setPage("register")}
      />
    );
  }

  // ── Virtual office (full-screen) ────────────────────────────────────────────
  if (page.startsWith("office-")) {
    const spaceId = page.slice(7);
    return (
      <OfficePage
        spaceId={spaceId}
        officeName="My Office"
        onLeave={() => setPage("home")}
      />
    );
  }
  if (page === "office") {
    const officeObj =
      typeof user.officeId === "object" && user.officeId !== null
        ? user.officeId
        : null;
    const spaceId = officeObj?.spaceId ?? null;
    const officeName = officeObj?.name ?? "My Office";
    if (!spaceId) {
      setTimeout(() => setPage("home"), 0);
      return null;
    }
    return (
      <OfficePage
        spaceId={spaceId}
        officeName={officeName}
        onLeave={() => setPage("home")}
      />
    );
  }

  // ── Dynamic pages ───────────────────────────────────────────────────────────
  if (page.startsWith("review-")) {
    const id = page.replace("review-", "");
    return withNav(
      <ReviewForm ideaId={id} onDone={() => setPage("queue")} />,
      page,
      setPage,
    );
  }
  if (page.startsWith("admin-idea-")) {
    const id = page.replace("admin-idea-", "");
    return withNav(
      <AdminIdeaDetail ideaId={id} onBack={() => setPage("ideas")} />,
      page,
      setPage,
    );
  }

  return withNav(renderPage(page, setPage, user), page, setPage);
}

function renderPage(page, setPage, user) {
  const role = user?.role;

  if (page === "home" || !page) {
    if (role === "admin") return <AdminDashboard setPage={setPage} />;
    if (role === "expert") return <ExpertHome setPage={setPage} />;
    if (role === "employee") return <EmployeeHome setPage={setPage} />;
    return <FounderHome setPage={setPage} />;
  }

  // Founder
  if (role === "founder") {
    if (page === "submit")
      return <SubmitIdea onSubmitted={() => setPage("ideas")} />;
    if (page === "ideas") return <FounderHome setPage={setPage} />;
    if (page === "team") return <FounderTeamPage />;
    if (page === "profile") return <ProfilePage />;
  }

  // Employee
  if (role === "employee") {
    if (page === "profile") return <ProfilePage />;
    return <EmployeeHome setPage={setPage} />;
  }

  // Expert
  if (role === "expert") {
    if (page === "queue") return <ExpertQueue setPage={setPage} />;
    if (page === "profile") return <ProfilePage />;
  }

  // Admin
  if (role === "admin") {
    if (page === "dashboard") return <AdminDashboard setPage={setPage} />;
    if (page === "ideas") return <AdminIdeas setPage={setPage} />;
    if (page === "experts") return <AdminExperts />;
    if (page === "offices") return <AdminOffices />;
    if (page === "users") return <AdminUsers />;
    if (page === "profile") return <ProfilePage />;
  }

  return (
    <div style={{ padding: 40, textAlign: "center", color: "var(--text3)" }}>
      Page not found.
    </div>
  );
}

function withNav(content, page, setPage) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg0)" }}>
      <Navbar page={page} setPage={setPage} />
      <main>{content}</main>
    </div>
  );
}

function ProfilePage() {
  const { user } = useAuth();
  return (
    <div style={{ padding: "32px", maxWidth: 600, margin: "0 auto" }}>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 22,
          fontWeight: 800,
          color: "var(--text1)",
          marginBottom: 20,
        }}
      >
        ⚙️ Profile
      </div>
      <div
        style={{
          background: "var(--bg2)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-xl)",
          padding: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--accent-dim)",
              border: "1px solid rgba(124,109,250,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
            }}
          >
            {user?.avatar}
          </div>
          <div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 18,
                fontWeight: 700,
                color: "var(--text1)",
              }}
            >
              {user?.name}
            </div>
            <div style={{ fontSize: 13, color: "var(--text3)" }}>
              {user?.email}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text2)",
                marginTop: 3,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: 600,
              }}
            >
              {user?.role}
            </div>
          </div>
        </div>
        {user?.jobTitle && (
          <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 8 }}>
            💼 {user.jobTitle} {user.department ? `· ${user.department}` : ""}
          </div>
        )}
        {user?.university && (
          <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 8 }}>
            🎓 {user.university}
          </div>
        )}
        {user?.designation && (
          <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 8 }}>
            🏢 {user.designation}
          </div>
        )}
        {user?.bio && (
          <div
            style={{
              fontSize: 13,
              color: "var(--text2)",
              lineHeight: 1.7,
              marginBottom: 10,
            }}
          >
            {user.bio}
          </div>
        )}
        {user?.skills?.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {user.skills.map((s) => (
              <span
                key={s}
                style={{
                  fontSize: 11,
                  padding: "3px 9px",
                  borderRadius: 20,
                  background: "var(--accent-dim)",
                  color: "var(--accent)",
                  fontWeight: 600,
                }}
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
