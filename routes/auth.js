const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const client = require('../db/client');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  const { name, email, password, address, phone } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const { rows } = await client.query(
      `INSERT INTO users (name, email, password, address, phone) 
       VALUES ($1, $2, $3, $4, $5) RETURNING user_id, name, email, role`,
      [name, email, hashedPassword, address, phone]
    );
    res.status(201).json({ user: rows[0] });
  } catch (err) {
    // Handle duplicate email
    if (err.code === '23505') { // Postgres unique violation
      return res.status(400).json({ error: 'Email already registered' });
    }

    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const { rows } = await client.query('SELECT * FROM users WHERE email=$1', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid email or password' });

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
