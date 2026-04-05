const jwt = require('jsonwebtoken');
const { User } = require('../models');

const SECRET = process.env.JWT_SECRET || 'metaversity-secret-2024';

function auth(roles = []) {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'No token provided' });

      const decoded = jwt.verify(token, SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user || !user.isActive) return res.status(401).json({ error: 'Unauthorized' });

      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({ error: 'Forbidden: insufficient role' });
      }

      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}

module.exports = { auth, SECRET };
