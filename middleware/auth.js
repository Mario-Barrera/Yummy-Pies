const jwt = require("jsonwebtoken");
const db = require("../db/client");

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  let token;

  // Extract the JWT from the Authorization header.
  // "?" is the optional chaining operator
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  // Reject requests without a token.
  if (!token) {
    const err = new Error("Unauthorized: No token provided");
    err.status = 401;
    return next(err);
  }

  // Confirm that the JWT secret is configured.
  if (!process.env.JWT_SECRET) {
    const err = new Error("Server misconfigured: JWT_SECRET is missing");
    err.status = 500;
    return next(err);
  }

  let decoded;

  // Verify the JWT.
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    err.status = 401;
    err.message = "Invalid or expired token";
    return next(err);
  }

  try {
    // Confirm that the user still exists and is active.
    const { rows } = await db.query(
      `
        SELECT user_id, role
        FROM users
        WHERE user_id = $1
          AND is_active = true
        LIMIT 1;
      `,
      [decoded.user_id],
    );

    const user = rows[0];

    // Reject the request if the user account is inactive or missing.
    if (!user) {
      const err = new Error(
        "Unauthorized: User account is inactive or missing",
      );
      err.status = 401;
      return next(err);
    }

    // Attach the user's current database information to the request.
    req.user = user;

    return next();
  } catch (err) {
    // Forward database errors to the global error handler.
    return next(err);
  }
}

// Restrict access to admin users only.
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    const err = new Error("Admin access required");
    err.status = 403;
    return next(err);
  }

  return next();
}

module.exports = { requireAuth, requireAdmin };