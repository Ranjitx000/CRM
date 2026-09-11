const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ statusCode: 401, message: 'Authentication required', error: 'Unauthorized', details: [] });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ statusCode: 401, message: 'Invalid or expired token', error: 'Unauthorized', details: [] });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ statusCode: 403, message: 'Forbidden: Insufficient permissions', error: 'Forbidden', details: [] });
    }
    next();
  };
};

module.exports = {
  authMiddleware,
  requireRole
};
