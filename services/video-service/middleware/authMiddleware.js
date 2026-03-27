module.exports = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];
  const userEmail = req.headers['x-user-email'];
  const userName = req.headers['x-user-name'];

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized - missing user context' });
  }

  req.user = {
    id: userId,
    role: userRole,
    email: userEmail,
    name: userName
  };

  next();
};
