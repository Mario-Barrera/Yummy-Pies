// loads the jsonwebtoken library into your Node.js file.
const jwt = require('jsonwebtoken');                              // Go find the jsonwebtoken package inside node_modules and make it available to this file.

// Middleware to require any logged-in user
function requireAuth(req, res, next) {

  const authHeader = req.headers.authorization;           // Get the authorization information that the client sent with this request
  let token;

  if (authHeader?.startsWith('Bearer ')) {                         // If the request contains a Bearer token in the Authorization header, extract it
    token = authHeader.split(' ')[1];                             // Otherwise, if there’s a token stored in cookies, use that instead
  } 

  if (!token) {                                                     // 'return next(err) means - Stop normal processing and jump to the error-handling middleware
    const err = new Error('Unauthorized: No token provided');
    err.status = 401;
    return next(err);
  }

  if (!process.env.JWT_SECRET) {                                                          // If the server does not have a JWT secret configured, throw a 500 server error
    const err = new Error('Server misconfigured: JWT_SECRET is missing');                 // new Error - creates a new error object and stores it in a variable named err
    err.status = 500;
    return next(err);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);                    // '.verify()' is a method provided by the jsonwebtoken library
    req.user = decoded;                                                           // Try to verify the token. If it’s valid, attach the user information to the request and continue
    return next();                                                                // If it’s invalid or expired, stop and return a 401 Unauthorized error

  } catch (err) {
    err.status = 401;
    err.message = 'Invalid or expired token';
    return next(err);
  }
}

// Middleware to require admin access
function requireAdmin(req, res, next) {

  if (!req.user || req.user.role !== 'admin') {
    const error = new Error('Admin access required');
    error.status = 403;
    return next(error);
  }
  next();   // will continue to the routes or more middleware. It all depends on the middleware chain
};

module.exports = { requireAuth, requireAdmin };
