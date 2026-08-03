const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db/client");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// POST /api/auth/register
// Public route: no JWT protection required (user does not have a token yet)
router.post("/register", async function (req, res, next) {
  try {
    const { name, email, password, address, phone } = req.body;

    if (!name || !email || !password || !address || !phone) {
      const err = new Error(
        "Name, email, password, address, and phone are required.",
      );
      err.status = 400;
      return next(err);
    }

    // check if email already exist
    const existing = await db.query(
      `SELECT user_id FROM users WHERE email = $1`,
      [email],
    );

    if (existing.rows.length > 0) {
      const err = new Error("Email is already registered");
      err.status = 409;
      return next(err);
    }

    const hashed = await bcrypt.hash(password, 12);
    // A salt is a random string added to a password before hashing
    // This line converts the user’s plain-text password into a secure bcrypt hash before storing it in the database

    // Add a new row to the users table
    // This code builds the SQL instruction and stores it as a string in insertSQL. By itself, it does not communicate with the database.
    const insertSQL = `
      INSERT INTO users (name, email, password, address, phone, role)         
      VALUES ($1, $2, $3, $4, $5, 'customer')
      RETURNING user_id, name, email, address, phone, role, created_at;    
    `;

    const { rows } = await db.query(insertSQL, [
      name,
      email,
      hashed,
      address,
      phone,
    ]);
    const user = rows[0];
    // These two lines execute the SQL command and retrieve the newly created user

    // This code creates a JSON Web Token (JWT) for the newly registered or logged-in user and stores it in the variable token.
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    return res.status(201).json({ user, token });
    // This line sends a successful response back to the frontend after the new user has been registered.
  } catch (err) {
    return next(err);
    // passes that error to Express’s error-handling middleware, such as your errorHandler.js
  }
});

// POST /api/auth/login
// Public route: no JWT protection required (user does not have a token yet)
router.post("/login", async function (req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const err = new Error("Email and password are required");
      err.status = 400;
      return next(err);
    }

    // password will be hashed
    const { rows } = await db.query(
      `SELECT user_id, name, email, password, role, address, phone FROM users WHERE email = $1`,
      [email],
    );

    const userRow = rows[0];
    if (!userRow) {
      const err = new Error("Invalid email or password");
      err.status = 401;
      return next(err);
    }

    // Compare the submitted password with the stored password hash
    const passwordMatches = await bcrypt.compare(password, userRow.password);

    if (!passwordMatches) {
      const err = new Error("Invalid email or password.");
      err.status = 401;
      return next(err);
    }

   // Create a safe user object without the password
    const { password: storedPassword, ...safeUser } = userRow;
    // takes the password property from userRow and places its value into a new variable named storedPassword
    // Since password was already taken out and placed into storedPassword, it is not included in safeUser

    // Make sure JWT_SECRET is configured
    // The JWT secret must be configured because your server uses it to sign and verify tokens.
    if (!process.env.JWT_SECRET) {
      const err = new Error("JWT_SECRET is not configured.");
      err.status = 500;
      return next(err);
    }

    // Create a token for the authenticated user
    const token = jwt.sign(
      {
        user_id: safeUser.user_id,
        role: safeUser.role,
        email: safeUser.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    return res.json({ user: safeUser, token });
  } catch (err) {
    return next(err);
  }
});

// GET /api/auth/me  — current user's profile (admin or customer)
// JWT protection required
router.get("/me", requireAuth, async function (req, res, next) {
  try {
    const userId = req.user.user_id;

    const { rows } = await db.query(
      "SELECT user_id, name, email, address, phone, role, created_at FROM users WHERE user_id = $1",
      [userId],
    );
    // Execute the SQL query and retrieve the currently logged-in user's information

    return res.json({ user: rows[0] });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
