const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { User, Office, Invite, Notification } = require('../models');
const { auth, SECRET } = require('../middleware/auth');

// ── Register ──────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const {
      name, email, password, role,
      avatar, avatarColor,
      university, bio, skills,
      expertise, designation,
      inviteToken,          // for employee self-registration
      jobTitle, department,
    } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password required' });
    if (['admin'].includes(role))
      return res.status(403).json({ error: 'Cannot self-register as admin' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    // ── Employee invite flow ──
    let officeRef = null, founderRef = null;
    if (role === 'employee' || inviteToken) {
      if (!inviteToken) return res.status(400).json({ error: 'Invite token required for employee registration' });
      const invite = await Invite.findOne({ token: inviteToken, isActive: true });
      if (!invite) return res.status(400).json({ error: 'Invalid or expired invite link' });
      if (invite.expiresAt < new Date()) return res.status(400).json({ error: 'Invite link has expired' });
      if (invite.uses >= invite.maxUses) return res.status(400).json({ error: 'Invite link has reached max uses' });

      officeRef  = invite.office;
      founderRef = invite.founder;
      invite.uses += 1;
      await invite.save();
    }

    const hash = await bcrypt.hash(password, 10);
    const resolvedRole = inviteToken ? 'employee' : (role || 'founder');
    const user = await User.create({
      name, email, password: hash,
      role: resolvedRole,
      avatar:       avatar       || (resolvedRole === 'employee' ? '👷' : resolvedRole === 'expert' ? '🧑‍💼' : '🎓'),
      avatarColor:  avatarColor  || '#4f8ef7',
      university:   university   || '',
      bio:          bio          || '',
      skills:       skills       || [],
      expertise:    expertise    || [],
      designation:  designation  || '',
      jobTitle:     jobTitle     || '',
      department:   department   || '',
      founderId:    founderRef,
      officeId:     officeRef,
      joinedOfficeAt: officeRef ? new Date() : null,
    });

    // Add employee to office members list
    if (officeRef) {
      await Office.findByIdAndUpdate(officeRef, { $addToSet: { members: user._id } });
      // Notify founder
      await Notification.create({
        user: founderRef, type: 'employee_joined',
        title: '👷 New Team Member!',
        message: `${name} joined your office as an employee.`,
        link: '/founder/team',
      });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: _safe(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Login ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).populate('officeId');
    if (!user) return res.status(404).json({ error: 'No account with that email' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Wrong password' });
    const token = jwt.sign({ id: user._id, role: user.role }, SECRET, { expiresIn: '7d' });
    res.json({ token, user: _safe(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Me ────────────────────────────────────────────────────────────────────────
router.get('/me', auth(), async (req, res) => {
  const user = await User.findById(req.user._id).populate('officeId').select('-password');
  res.json({ user: _safe(user) });
});

// ── Profile update ────────────────────────────────────────────────────────────
router.put('/profile', auth(), async (req, res) => {
  try {
    const allowed = ['name','avatar','avatarColor','bio','skills','university','linkedin','expertise','designation','jobTitle','department'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true })
      .select('-password').populate('officeId');
    res.json({ user: _safe(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Validate invite token (public — used on join page) ────────────────────────
router.get('/invite/:token', async (req, res) => {
  try {
    const invite = await Invite.findOne({ token: req.params.token, isActive: true })
      .populate('founder', 'name avatar')
      .populate('office',  'name plan');
    if (!invite || invite.expiresAt < new Date() || invite.uses >= invite.maxUses)
      return res.status(400).json({ error: 'Invalid or expired invite' });
    res.json({ invite: { token: invite.token, founderName: invite.founder?.name, officeName: invite.office?.name, plan: invite.office?.plan, expiresAt: invite.expiresAt } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function _safe(u) {
  const o = u?.toObject ? u.toObject() : { ...u };
  delete o.password;
  return o;
}

module.exports = router;
