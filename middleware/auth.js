// loads the jsonwebtoken library into your Node.js file.
const jwt = require('jsonwebtoken');

// Middleware to require any logged-in user
function requireAuth(req, res, next) {

  // Check whether there is a session, and whether that session contains a user
  if (req.session?.user) {
    req.user = req.session.user;
    return next();
  }

  // Get the authorization information that the client sent with this request
  const authHeader = req.headers.authorization;
  let token;

  // If the request contains a Bearer token in the Authorization header, extract it
  // Otherwise, if there’s a token stored in cookies, use that instead
  if (authHeader?.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  // If no token was found, stop the request and return a 401 Unauthorized error
  // 'return next(err) means - Stop normal processing and jump to the error-handling middleware
  if (!token) {
    const err = new Error('Unauthorized: No token provided');
    err.status = 401;
    return next(err);
  }

  // If the server does not have a JWT secret configured, throw a 500 server error
  // new Error - creates a new error object and stores it in a variable named err
  if (!process.env.JWT_SECRET) {
    const err = new Error('Server misconfigured: JWT_SECRET is missing');
    err.status = 500;
    return next(err);
  }

  // Try to verify the token. If it’s valid, attach the user information to the request and continue
  // If it’s invalid or expired, stop and return a 401 Unauthorized error
  // '.verify()' is a method provided by the jsonwebtoken library
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    err.status = 401;
    err.message = 'Invalid or expired token';
    return next(err);
  }
}

// Middleware to require admin access
function requireAdmin(req, res, next) {

  // first make sure the user is authenticated
  requireAuth(req, res, function (err) { 
    if (err) return next(err);

    if (!req.user || req.user.role !== 'admin') {
      const error = new Error('Admin access required');
      error.status = 403;
      return next(error);
    }
    next();   // will continue to the routes
  });
}

module.exports = { requireAuth, requireAdmin };
