const mongoose = require("mongoose");

// ── User ──────────────────────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["founder", "employee", "expert", "admin"],
      default: "founder",
    },
    avatar: { type: String, default: "🎓" },
    avatarColor: { type: String, default: "#4f8ef7" },
    bio: { type: String, default: "" },
    skills: [String],
    // Founder fields
    university: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    // Employee fields
    founderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    jobTitle: { type: String, default: "" },
    department: { type: String, default: "" },
    joinedOfficeAt: { type: Date, default: null },
    // Expert fields
    expertise: [String],
    designation: { type: String, default: "" },
    totalReviews: { type: Number, default: 0 },
    // Office reference (shared between founder + their employees)
    officeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Office",
      default: null,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// ── Invite Token ──────────────────────────────────────────────────────────────
// Founders generate these to invite employees into their office
const InviteSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    office: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Office",
      required: true,
    },
    founder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    email: { type: String, default: "" }, // optional: pre-fill email
    uses: { type: Number, default: 0 },
    maxUses: { type: Number, default: 10 },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// ── Idea ──────────────────────────────────────────────────────────────────────
const IdeaSchema = new mongoose.Schema(
  {
    founder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    tagline: { type: String, required: true },
    description: { type: String, required: true },
    problem: { type: String, required: true },
    solution: { type: String, required: true },
    targetMarket: { type: String, required: true },
    domain: { type: String, required: true },
    stage: {
      type: String,
      enum: ["idea", "prototype", "mvp"],
      default: "idea",
    },
    teamSize: { type: Number, default: 1 },
    fundingNeeded: { type: String, default: "" },
    pitchDeck: { type: String, default: "" },
    status: {
      type: String,
      enum: [
        "draft",
        "submitted",
        "under_review",
        "expert_reviewed",
        "approved",
        "rejected",
        "office_assigned",
      ],
      default: "draft",
    },
    assignedExpert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    expertReview: {
      score: { type: Number, min: 1, max: 10, default: null },
      innovation: { type: Number, min: 1, max: 10, default: null },
      marketPotential: { type: Number, min: 1, max: 10, default: null },
      feasibility: { type: Number, min: 1, max: 10, default: null },
      teamStrength: { type: Number, min: 1, max: 10, default: null },
      recommendation: {
        type: String,
        enum: ["approve", "reject", "needs_work", ""],
        default: "",
        required: false,
      },

      reviewedAt: { type: Date, default: null },
    },
    adminNote: { type: String, default: "" },
    decidedAt: { type: Date, default: null },
    office: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Office",
      default: null,
    },
    tags: [String],
  },
  { timestamps: true },
);

// ── Virtual Office ────────────────────────────────────────────────────────────
const OfficeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    spaceId: { type: String, required: true, unique: true },
    idea: { type: mongoose.Schema.Types.ObjectId, ref: "Idea" },
    founder: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    theme: {
      type: String,
      enum: ["tech", "design", "finance", "health", "edu", "general"],
      default: "tech",
    },
    plan: {
      type: String,
      enum: ["starter", "growth", "scale"],
      default: "starter",
    },
    monthlyFee: { type: Number, default: 0 },
    maxMembers: { type: Number, default: 10 },
    // All members: founder + employees
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isActive: { type: Boolean, default: true },
    activatedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// ── Announcement (founder → team broadcast) ────────────────────────────────────
const AnnouncementSchema = new mongoose.Schema(
  {
    office: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Office",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// ── Notification ──────────────────────────────────────────────────────────────
const NotifSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: "" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = {
  User: mongoose.model("User", UserSchema),
  Invite: mongoose.model("Invite", InviteSchema),
  Idea: mongoose.model("Idea", IdeaSchema),
  Office: mongoose.model("Office", OfficeSchema),
  Announcement: mongoose.model("Announcement", AnnouncementSchema),
  Notification: mongoose.model("Notification", NotifSchema),
};
