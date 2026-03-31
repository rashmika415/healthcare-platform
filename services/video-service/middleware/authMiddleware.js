const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  let userId = req.headers['x-user-id'];
  let userRole = req.headers['x-user-role'];
  let userEmail = req.headers['x-user-email'];
  let userName = req.headers['x-user-name'];

  // Fallback for direct testing using JWT if API Gateway headers are not present
  if (!userId && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id || decoded._id; 
      userRole = decoded.role;
      userEmail = decoded.email;
      userName = decoded.name;
    } catch (err) {
      console.error('JWT verification error in video-service:', err.message);
    }
  }

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized - missing user context or invalid token' });
  }

  req.user = {
    id: userId,
    role: userRole,
    email: userEmail,
    name: userName
  };

  next();
};
