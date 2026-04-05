const router = require('express').Router();
const { Idea, User, Notification, Office } = require('../models');
const { auth } = require('../middleware/auth');
const { v4: uuid } = require('uuid');

async function notify(userId, type, title, message, link = '') {
  try {
    await Notification.create({ user: userId, type, title, message, link });
  } catch (_) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// STATIC ROUTES MUST COME BEFORE /:id  (Express matches top-to-bottom)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/ideas/my  — founder's own ideas
router.get('/my', auth(['founder']), async (req, res) => {
  try {
    const ideas = await Idea.find({ founder: req.user._id })
      .populate('assignedExpert', 'name avatar designation')
      .populate('office', 'name spaceId plan monthlyFee')
      .sort('-createdAt');
    res.json({ ideas });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/ideas/expert/queue  — ideas assigned to this expert
router.get('/expert/queue', auth(['expert']), async (req, res) => {
  try {
    const ideas = await Idea.find({
      assignedExpert: req.user._id,
      status: { $in: ['under_review', 'expert_reviewed'] },
    })
      .populate('founder', 'name email avatar university')
      .sort('-createdAt');
    res.json({ ideas });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/ideas/admin/stats  — dashboard counters (admin)
router.get('/admin/stats', auth(['admin']), async (req, res) => {
  try {
    const [total, submitted, under_review, expert_reviewed, approved, rejected, office_assigned] =
      await Promise.all([
        Idea.countDocuments(),
        Idea.countDocuments({ status: 'submitted' }),
        Idea.countDocuments({ status: 'under_review' }),
        Idea.countDocuments({ status: 'expert_reviewed' }),
        Idea.countDocuments({ status: 'approved' }),
        Idea.countDocuments({ status: 'rejected' }),
        Idea.countDocuments({ status: 'office_assigned' }),
      ]);
    const [experts, founders, offices] = await Promise.all([
      User.countDocuments({ role: 'expert' }),
      User.countDocuments({ role: 'founder' }),
      Office.countDocuments({ isActive: true }),
    ]);
    res.json({ total, submitted, under_review, expert_reviewed, approved, rejected, office_assigned, experts, founders, offices });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// PARAMETERISED ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/ideas/:id  — single idea (role-gated)
router.get('/:id', auth(), async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id)
      .populate('founder', 'name email avatar university bio')
      .populate('assignedExpert', 'name avatar designation expertise')
      .populate('office');
    if (!idea) return res.status(404).json({ error: 'Not found' });
    // Founders may only view their own ideas
    if (req.user.role === 'founder' && !idea.founder._id.equals(req.user._id))
      return res.status(403).json({ error: 'Forbidden' });
    res.json({ idea });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/ideas/:id/review  — expert submits review
router.put('/:id/review', auth(['expert']), async (req, res) => {
  try {
    const { score, innovation, marketPotential, feasibility, teamStrength, feedback, recommendation } = req.body;
    const idea = await Idea.findOne({ _id: req.params.id, assignedExpert: req.user._id });
    if (!idea) return res.status(404).json({ error: 'Not found or not assigned to you' });

    idea.expertReview = { score, innovation, marketPotential, feasibility, teamStrength, feedback, recommendation, reviewedAt: new Date() };
    idea.status = 'expert_reviewed';
    await idea.save();
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalReviews: 1 } });

    const admins = await User.find({ role: 'admin' });
    await Promise.all(admins.map(a =>
      notify(a._id, 'expert_reviewed', 'Expert Review Ready',
        `${req.user.name} reviewed "${idea.title}" — recommended: ${recommendation}`,
        `/admin/ideas/${idea._id}`)
    ));
    res.json({ idea });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/ideas/:id/assign-expert  — admin assigns expert
router.put('/:id/assign-expert', auth(['admin']), async (req, res) => {
  try {
    const { expertId } = req.body;
    if (!expertId) return res.status(400).json({ error: 'expertId required' });
    const idea = await Idea.findByIdAndUpdate(
      req.params.id,
      { assignedExpert: expertId, status: 'under_review' },
      { new: true }
    ).populate('assignedExpert', 'name avatar');
    if (!idea) return res.status(404).json({ error: 'Idea not found' });
    await notify(expertId, 'expert_assigned', 'New Idea to Review',
      `You have been assigned to review "${idea.title}"`, `/expert/review/${idea._id}`);
    await notify(idea.founder, 'under_review', 'Your Idea is Under Review',
      `An expert is now reviewing "${idea.title}"`, `/founder/ideas/${idea._id}`);
    res.json({ idea });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/ideas/:id/decide  — admin approves or rejects
router.put('/:id/decide', auth(['admin']), async (req, res) => {
  try {
    const { decision, adminNote } = req.body;
    if (!['approved', 'rejected'].includes(decision))
      return res.status(400).json({ error: 'decision must be approved or rejected' });
    const idea = await Idea.findByIdAndUpdate(
      req.params.id,
      { status: decision, adminNote: adminNote || '', decidedAt: new Date() },
      { new: true }
    ).populate('founder');
    if (!idea) return res.status(404).json({ error: 'Idea not found' });
    const isApproved = decision === 'approved';
    await notify(
      idea.founder._id, decision,
      isApproved ? '🎉 Idea Approved!' : 'Idea Not Selected',
      isApproved
        ? `Congratulations! "${idea.title}" has been approved. An office will be assigned shortly.`
        : `"${idea.title}" was not selected. ${adminNote || 'Keep building!'}`,
      `/founder/ideas/${idea._id}`
    );
    res.json({ idea });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/ideas/:id/assign-office  — admin creates and assigns virtual office
router.put('/:id/assign-office', auth(['admin']), async (req, res) => {
  try {
    const { plan = 'starter', theme = 'tech', monthlyFee = 499 } = req.body;
    const idea = await Idea.findById(req.params.id).populate('founder');
    if (!idea) return res.status(404).json({ error: 'Idea not found' });
    if (idea.office) return res.status(400).json({ error: 'Office already assigned' });

    const maxMembersMap = { starter: 10, growth: 20, scale: 40 };
    const office = await Office.create({
      name:        `${idea.title} HQ`,
      spaceId:     uuid().slice(0, 8),
      idea:        idea._id,
      founder:     idea.founder._id,
      theme,
      plan,
      monthlyFee:  Number(monthlyFee),
      maxMembers:  maxMembersMap[plan] || 10,
      members:     [idea.founder._id],
      isActive:    true,
      activatedAt: new Date(),
      expiresAt:   new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    idea.status = 'office_assigned';
    idea.office = office._id;
    await idea.save();
    await User.findByIdAndUpdate(idea.founder._id, { officeId: office._id });
    await notify(idea.founder._id, 'office_assigned', '🏢 Virtual Office Ready!',
      `Your office "${office.name}" is live! Join the metaverse now.`, `/office/${office.spaceId}`);
    res.json({ idea, office });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// COLLECTION ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/ideas  — founder submits new idea
router.post('/', auth(['founder']), async (req, res) => {
  try {
    const { title, tagline, description, problem, solution, targetMarket, domain, stage, teamSize, fundingNeeded, pitchDeck, tags } = req.body;
    if (!title || !tagline || !description || !problem || !solution || !targetMarket || !domain)
      return res.status(400).json({ error: 'All required fields must be filled' });

    const idea = await Idea.create({
      founder: req.user._id,
      title, tagline, description, problem, solution,
      targetMarket, domain,
      stage:         stage        || 'idea',
      teamSize:      teamSize     || 1,
      fundingNeeded: fundingNeeded|| '',
      pitchDeck:     pitchDeck   || '',
      tags:          tags         || [],
      status:        'submitted',
    });
    const admins = await User.find({ role: 'admin' });
    await Promise.all(admins.map(a =>
      notify(a._id, 'idea_submitted', 'New Idea Submitted',
        `${req.user.name} submitted "${title}"`, `/admin/ideas/${idea._id}`)
    ));
    res.status(201).json({ idea });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/ideas  — all ideas with filters (admin)
router.get('/', auth(['admin']), async (req, res) => {
  try {
    const { status, domain, search } = req.query;
    const q = {};
    if (status && status !== 'all') q.status = status;
    if (domain) q.domain = domain;
    if (search) q.title = { $regex: search, $options: 'i' };
    const ideas = await Idea.find(q)
      .populate('founder', 'name email avatar university')
      .populate('assignedExpert', 'name avatar designation')
      .populate('office', 'name plan')
      .sort('-createdAt');
    res.json({ ideas });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
