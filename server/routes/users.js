const router = require('express').Router();
const crypto = require('crypto');
const { User, Notification, Office, Invite, Announcement } = require('../models');
const { auth } = require('../middleware/auth');

// ── Notifications (all roles) ─────────────────────────────────────────────────
router.get('/notifications', auth(), async (req, res) => {
  try {
    const notifs = await Notification.find({ user: req.user._id })
      .sort('-createdAt').limit(30);
    res.json({ notifications: notifs });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/notifications/read-all', auth(), async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── My office info (founder + employee) ──────────────────────────────────────
router.get('/my-office', auth(['founder', 'employee']), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'officeId',
      populate: { path: 'founder', select: 'name email avatar avatarColor' },
    });
    if (!user.officeId) return res.status(404).json({ error: 'No office assigned' });
    const teammates = await User.find({
      officeId: user.officeId._id,
      isActive: true,
      _id: { $ne: user._id },
    }).select('-password');
    res.json({ office: user.officeId, teammates });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Announcements (founder posts, employee+founder reads) ─────────────────────
router.post('/announcements', auth(['founder']), async (req, res) => {
  try {
    const { title, body, pinned } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'title and body required' });
    if (!req.user.officeId) return res.status(400).json({ error: 'No active office' });

    const ann = await Announcement.create({
      office: req.user.officeId, author: req.user._id,
      title, body, pinned: !!pinned,
    });
    // Notify all employees in this office
    const employees = await User.find({
      officeId: req.user.officeId, role: 'employee', isActive: true,
    });
    await Promise.all(employees.map(e =>
      Notification.create({
        user: e._id, type: 'announcement',
        title: `📢 ${title}`,
        message: body.slice(0, 120),
        link: '/employee/office',
      })
    ));
    res.status(201).json({ announcement: ann });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/announcements', auth(['founder', 'employee']), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.officeId) return res.json({ announcements: [] });
    const anns = await Announcement.find({ office: user.officeId })
      .populate('author', 'name avatar')
      .sort({ pinned: -1, createdAt: -1 })
      .limit(20);
    res.json({ announcements: anns });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Invite system (founder only) ──────────────────────────────────────────────
router.post('/invite/generate', auth(['founder']), async (req, res) => {
  try {
    if (!req.user.officeId)
      return res.status(400).json({ error: 'You need an active office before inviting team members.' });
    const maxUses = Math.min(Number(req.body.maxUses) || 10, 50);
    const token   = crypto.randomBytes(16).toString('hex');
    const invite  = await Invite.create({
      token,
      office:    req.user.officeId,
      founder:   req.user._id,
      maxUses,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    res.status(201).json({ invite: { token: invite.token, expiresAt: invite.expiresAt, maxUses: invite.maxUses, uses: 0 } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/invite/my', auth(['founder']), async (req, res) => {
  try {
    const invites = await Invite.find({ founder: req.user._id, isActive: true }).sort('-createdAt');
    res.json({ invites });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/invite/:token', auth(['founder']), async (req, res) => {
  try {
    await Invite.findOneAndUpdate(
      { token: req.params.token, founder: req.user._id },
      { isActive: false }
    );
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Team management (founder) ─────────────────────────────────────────────────
router.get('/team', auth(['founder']), async (req, res) => {
  try {
    const employees = await User.find({ founderId: req.user._id, role: 'employee', isActive: true })
      .select('-password').sort('-createdAt');
    res.json({ employees });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/team/:id', auth(['founder']), async (req, res) => {
  try {
    const emp = await User.findOne({ _id: req.params.id, founderId: req.user._id });
    if (!emp) return res.status(404).json({ error: 'Employee not found in your team' });
    await User.findByIdAndUpdate(emp._id, { officeId: null, founderId: null, isActive: false });
    if (req.user.officeId)
      await Office.findByIdAndUpdate(req.user.officeId, { $pull: { members: emp._id } });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Experts list (admin) ──────────────────────────────────────────────────────
router.get('/experts', auth(['admin']), async (req, res) => {
  try {
    const experts = await User.find({ role: 'expert', isActive: true })
      .select('-password').sort('-totalReviews');
    res.json({ experts });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── All users (admin) ─────────────────────────────────────────────────────────
router.get('/', auth(['admin']), async (req, res) => {
  try {
    const { role } = req.query;
    const q = role ? { role } : {};
    const users = await User.find(q)
      .select('-password')
      .populate('officeId', 'name spaceId')
      .sort('-createdAt');
    res.json({ users });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Create expert (admin) ─────────────────────────────────────────────────────
router.post('/expert', auth(['admin']), async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { name, email, password, expertise, designation, bio } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'name and email required' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email already taken' });
    const hash   = await bcrypt.hash(password || 'Expert@123', 10);
    const expert = await User.create({
      name, email, password: hash,
      role: 'expert', avatar: '🧑‍💼', avatarColor: '#f9ae61',
      expertise: expertise || [], designation: designation || '', bio: bio || '',
    });
    res.status(201).json({ expert: { ...expert.toObject(), password: undefined } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Toggle user active (admin) ────────────────────────────────────────────────
router.put('/:id/toggle', auth(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ user: { ...user.toObject(), password: undefined } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Offices list (admin) ──────────────────────────────────────────────────────
router.get('/offices', auth(['admin']), async (req, res) => {
  try {
    const offices = await Office.find()
      .populate('founder', 'name email')
      .populate('idea', 'title')
      .populate('members', 'name role avatar')
      .sort('-createdAt');
    res.json({ offices });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
