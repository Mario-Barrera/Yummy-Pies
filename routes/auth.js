const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/client');                 // Use 'pool' consistently
const { requireAuth } = require('../middleware/auth');
const validatePassword = require('../utils/passwordValidator');  // Import validator

const router = express.Router();

// POST /login
router.post('/login', async (req, res, next) => {
  let { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  email = email.toLowerCase().trim();

  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Save user info in session
    req.session.user = {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /register
router.post('/register', async (req, res, next) => {
  let { name, email, password, address, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  email = email.toLowerCase().trim();

  // Password validation
  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }

  // Field length validations
  if (typeof name !== 'string' || name.length < 4 || name.length > 100) {
    return res.status(400).json({ error: 'Name must be between 4 and 100 characters.' });
  }

  if (typeof email !== 'string' || email.length === 0 || email.length > 150) {
    return res.status(400).json({ error: 'Email must be 1-150 characters long.' });
  }

  if (address && (typeof address !== 'string' || address.length > 100)) {
    return res.status(400).json({ error: 'Address can be up to 100 characters long.' });
  }

  if (phone && (typeof phone !== 'string' || phone.length > 20)) {
    return res.status(400).json({ error: 'Phone can be up to 20 characters long.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password, address, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING user_id, name, email, role`,
      [name, email, hashedPassword, address, phone]
    );

    res.status(201).json({ user: rows[0] });
  } catch (err) {
    if (err.code === '23505') { // unique violation (email)
      return res.status(400).json({ error: 'Email already registered' });
    }
    next(err);
  }
});

// POST /logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Session destruction error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }

    res.clearCookie('connect.sid'); // Optional, but clears the session cookie
    res.json({ message: 'Logged out successfully' });
  });
});


// POST /logout (invalidate token)
router.post('/logout', requireAuth, async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    await pool.query(
      `INSERT INTO token_blacklist (token) VALUES ($1) ON CONFLICT DO NOTHING`,
      [token]
    );
    res.json({ message: 'Logged out successfully (token invalidated)' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
