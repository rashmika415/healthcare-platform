// This middleware does NOT verify JWT
// The API Gateway already did that
// It just reads the user info that the gateway forwarded as headers

module.exports = (req, res, next) => {
  const userId    = req.headers['x-user-id'];
  const userRole  = req.headers['x-user-role'];
  const userEmail = req.headers['x-user-email'];
  const userName  = req.headers['x-user-name'];

  // If no userId — request didn't come through gateway
  if (!userId) {
    return res.status(401).json({
      error: 'Unauthorized — missing user context'
    });
  }

  // Attach to req.user so controllers can use it
  req.user = {
    id:    userId,
    role:  userRole,
    email: userEmail,
    name:  userName
  };

  next();
};