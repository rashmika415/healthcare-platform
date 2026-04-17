module.exports = (requiredRole) => {
  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized"
      });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({
        success: false,
        error: `Only ${requiredRole} allowed`
      });
    }

    next();
  };
};