const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    // 1. Get token from header
    // Frontend sends: Authorization: Bearer eyJhbGciOi...
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1]; // get part after "Bearer "

    if (!token) {
      return res.status(401).json({ error: 'No token found' });
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Attach user info to request
    // These become headers that get forwarded to downstream services
    req.headers['x-user-id']    = decoded.id;
    req.headers['x-user-role']  = decoded.role;
    req.headers['x-user-email'] = decoded.email;
    req.headers['x-user-name']  = decoded.name;

    next(); // pass to next middleware or proxy

  } catch (err) {
    // Token expired or tampered with
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};