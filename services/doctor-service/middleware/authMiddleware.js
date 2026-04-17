// middleware/authMiddleware.js

// This middleware does NOT verify JWT
// The API Gateway already did that
// It just reads the user info that the gateway forwarded as headers

module.exports = (req, res, next) => {
  try {
    const userId    = req.headers['x-user-id'];
    const userRole  = req.headers['x-user-role'];
    const userEmail = req.headers['x-user-email'];
    const userName  = req.headers['x-user-name'];
    const isVerified = req.headers['x-user-verified']; // Optional header

    // 🚨 If request didn't come through gateway
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized — missing user context'
      });
    }

    // ✅ Attach clean user object
    req.user = {
      id: userId,
      role: userRole || 'unknown',
      email: userEmail || null,
      name: userName || 'Unknown User',
      isVerified: isVerified === 'true' // convert string → boolean
    };

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal server error in auth middleware'
    });
  }
};