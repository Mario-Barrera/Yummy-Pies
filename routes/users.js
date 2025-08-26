const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/client');
const authenticateToken = require('../middleware/authenticateToken');
const router = express.Router();

require('dotenv').config();

// Password validation function example
function validatePassword(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecialChar = /[\W_]/.test(password); // non-word character or underscore

  if (password.length < minLength) {
    return `Password must be at least ${minLength} characters long.`;
  }
  if (!hasUpperCase) {
    return 'Password must contain at least one uppercase letter.';
  }
  if (!hasLowerCase) {
    return 'Password must contain at least one lowercase letter.';
  }
  if (!hasDigit) {
    return 'Password must contain at least one digit.';
  }
  if (!hasSpecialChar) {
    return 'Password must contain at least one special character.';
  }

  return null; // valid password
}

// Register a new user
router.post('/register', async (req, res, next) => {
  let { name, email, password, address, phone } = req.body;
  email = email.toLowerCase().trim(); // normalize email and remove surrounding whitespace

  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO Users (name, email, password, address, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING user_id, name, email, role`,
      [name, email, hashedPassword, address, phone]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      res.status(400).json({ error: 'Email already registered' });
    } else {
      next(err);
    }
  }
});

// Login users
router.post('/login', async (req, res, next) => {
  let { email, password } = req.body;
  email = email.toLowerCase().trim(); // normalize email and remove surrounding whitespace

  try {
    const { rows } = await pool.query(
      `SELECT * FROM Users WHERE email = $1`,
      [email]
    );

    if (rows.length === 0)
      return res.status(400).json({ error: 'Invalid email or password' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match)
      return res.status(400).json({ error: 'Invalid email or password' });

    // Create JWT
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token, user: { user_id: user.user_id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
});

// Get user profile by ID (protected route)
router.get('/:id', authenticateToken, async (req, res, next) => {
  const userId = req.params.id;

  // Restrict users from fetching other users’ profiles
  if (req.user.user_id !== parseInt(userId) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT user_id, name, email, address, phone, role, created_at
       FROM Users
       WHERE user_id = $1`,
      [userId]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// Logout with blacklist
router.post('/logout', async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    await pool.query(`INSERT INTO tokenblacklist (token) VALUES ($1) ON CONFLICT DO NOTHING`, [token]);
    res.json({ message: 'Logged out successfully (token invalidated)' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
