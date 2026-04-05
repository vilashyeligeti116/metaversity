# 🌐 Metaversity — Startup Incubator Metaverse

A full-stack platform where student founders submit startup ideas, domain experts review them, and admins approve and provision virtual offices — all inside a spatial metaverse.

---

## ✨ Platform Overview

```
Founder submits idea
    ↓
Admin assigns domain Expert
    ↓
Expert scores idea (Innovation, Market, Feasibility, Team)
    ↓
Expert sends recommendation (Approve / Needs Work / Reject)
    ↓
Admin makes final decision
    ↓
If Approved → Admin assigns Virtual Office (Starter / Growth / Scale)
    ↓
Founder enters metaverse, collaborates with team, builds startup
```

---

## 👥 Three Roles

| Role | What they do |
|---|---|
| 🎓 **Founder** | Submit ideas, track review pipeline, enter virtual office |
| 🧑‍💼 **Expert** | Review assigned ideas with structured scoring + feedback |
| 👑 **Admin** | Manage pipeline, assign experts, approve/reject, assign offices |

**Default admin credentials (auto-seeded):**
```
Email:    admin@metaversity.io
Password: Admin@123
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v16+
- MongoDB (local or Atlas)
- Chrome/Edge (best WebRTC support)

### 1 — Install

```bash
cd metaversity
npm install
npm run install:all
```

### 2 — Configure MongoDB

Edit `server/index.js` or set environment variable:
```bash
# Local MongoDB (default)
MONGO_URI=mongodb://localhost:27017/metaversity

# Or MongoDB Atlas
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/metaversity
```

### 3 — Start

```bash
npm run dev
# Server → http://localhost:4000
# Client → http://localhost:3000
```

---

## 🗺️ Platform Pages

### Founder
- **Landing page** — marketing page with pricing plans
- **Auth** — register as founder (2-step form)
- **Home** — pipeline tracker, idea cards, stats
- **Submit Idea** — 4-step wizard (Basic → Problem → Market → Review)
- **Virtual Office** — spatial canvas with proximity video calls

### Expert
- **Home** — pending queue, stats, total reviews
- **Review Queue** — all assigned ideas
- **Review Form** — score (1-10) on 4 dimensions + feedback + recommendation

### Admin
- **Dashboard** — pipeline funnel chart, stats grid, recent submissions
- **Ideas Pipeline** — filterable table of all ideas
- **Idea Detail** — assign expert, approve/reject, assign office (with plan selection)
- **Expert Management** — add/view experts with expertise tags
- **Offices** — all active virtual offices with plan/fee info
- **Users** — all users with suspend/restore

---

## 🏢 Virtual Office World

13 rooms on a 2800×2000px canvas:

| Room | Type |
|---|---|
| 🏢 Reception | Public |
| 👔 CEO Office | 🔒 Private |
| 📊 Board Room | 🔒 Private |
| 👥 HR | 🔒 Private |
| 💰 Finance | 🔒 Private |
| 💻 Engineering | Public |
| 🎨 Design Studio | Public |
| 📦 Product Room | Public |
| 📋 Meeting Room ×2 | Public |
| 🌐 Open Workspace | Public |
| ☕ Kitchen & Break | Public |
| 🛋️ Lounge | Public |

**Movement:** WASD / arrow keys, click to teleport, drag avatar

**Talk permission flow:**
1. Walk within 160px → auto-sends talk request
2. Target user sees popup: Accept / Decline (20s auto-decline)
3. If accepted → WebRTC P2P call starts
4. Volume fades with distance (full at 80px, silent at 200px)

---

## 💰 Office Plans

| Plan | Price | Members |
|---|---|---|
| Starter | ₹499/month | 5 |
| Growth | ₹999/month | 10 |
| Scale | ₹1,999/month | 20 |

---

## 📂 Project Structure

```
metaversity/
├── server/
│   ├── index.js              ← Express + Socket.io entry, seeds admin
│   ├── socket.js             ← Real-time office events
│   ├── models/index.js       ← User, Idea, Office, Notification schemas
│   ├── middleware/auth.js    ← JWT middleware
│   └── routes/
│       ├── auth.js           ← Register, login, profile
│       ├── ideas.js          ← Full idea pipeline (all roles)
│       └── users.js          ← Expert management, notifications
│
└── client/src/
    ├── App.jsx               ← Role-based router
    ├── contexts/AuthContext  ← Global auth state
    ├── utils/api.js          ← Typed fetch wrapper
    ├── styles/global.css     ← CSS variables + keyframes
    ├── pages/
    │   ├── LandingPage.jsx   ← Marketing homepage
    │   ├── AuthPage.jsx      ← Login / register
    │   ├── FounderPages.jsx  ← Home, SubmitIdea
    │   ├── ExpertPages.jsx   ← Home, Queue, ReviewForm
    │   └── AdminPages.jsx    ← Dashboard, Ideas, Experts, Offices, Users
    └── components/
        ├── common/           ← UI, Navbar
        └── office/           ← Canvas, OfficePage, TalkPermission, Minimap, Video, Chat
```

---

## 🔧 Configuration

### Add TURN server (for production WebRTC)
In `client/src/hooks/useOffice.js`:
```js
const ICE = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'turn:your-turn.example.com:3478', username: 'u', credential: 'p' },
  ],
};
```

### JWT Secret
```bash
JWT_SECRET=your-super-secret-key node server/index.js
```

---

## 🛠️ Troubleshooting

| Problem | Fix |
|---|---|
| "Cannot reach server" | Run `npm run server`, check port 4000 |
| MongoDB error | Start MongoDB or set `MONGO_URI` to Atlas URL |
| Camera denied | Click lock icon → allow camera + mic → refresh |
| Video call not starting | Both users must accept the talk request popup |
| Works locally, not online | Add a TURN server (see above) |

---

## 📄 License

MIT — build freely, help students build their startups.
