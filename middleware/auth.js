const jwt = require('jsonwebtoken');

// Middleware to require any logged-in user
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    const err = new Error('No token provided');
    err.status = 401;
    return next(err); // pass error to centralized error handler
  }

  const token = authHeader.split(' ')[1]; // "Bearer <token>"
  if (!token) {
    const err = new Error('No token provided');
    err.status = 401;
    return next(err);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach user info to request
    next();
  } catch (err) {
    err.status = 401;
    err.message = 'Invalid token';
    next(err);
  }
}

// Middleware to require admin access
function requireAdmin(req, res, next) {
  requireAuth(req, res, (err) => { // first make sure the user is authenticated
    if (err) return next(err);

    if (req.user.role !== 'admin') {
      const error = new Error('Admin access required');
      error.status = 403;
      return next(error);
    }
    next();
  });
}

module.exports = { requireAuth, requireAdmin };
