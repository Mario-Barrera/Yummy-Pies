const jwt = require('jsonwebtoken');

// Middleware to require any logged-in user
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token; // adjust 'token' to your actual cookie name
  }

  if (!token) {
    const err = new Error('No token provided');
    err.status = 401;
    return next(err);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
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
