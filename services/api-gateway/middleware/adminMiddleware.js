const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Must be admin role
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access only' });
    }

    req.headers['x-user-id']   = decoded.id;
    req.headers['x-user-role'] = decoded.role;
    next();
  } catch {
    res.status(403).json({ error: 'Invalid token' });
  }
};