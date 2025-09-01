
const express = require('express');
const router = express.Router();
const client = require('../db/client'); // your database client
const crypto = require('crypto');       // to generate secure tokens
const sendEmail = require('../utils/sendEmail'); // your email helper

// POST /reset-password
router.post('/', async (req, res) => {
  const { email } = req.body;

  try {
    // 1. Check if the email exists
    const userResult = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }

    // 2. Generate a secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    // 3. Store token in DB
    await client.query(
      'UPDATE users SET reset_token=$1, reset_expires=$2 WHERE email=$3',
      [token, expires, email]
    );

    // 4. Send email
    const resetLink = `https://yourdomain.com/forgot-password/${token}`;
    await sendEmail(
      email,
      'Reset Your Password',
      `Click here to reset: ${resetLink}`,
      `<p>Click <a href="${resetLink}">here</a> to reset your password</p>`
    );

    // Respond with JSON instead of plain text
    res.json({ message: 'Reset link sent if email exists' });

  } catch (err) {
    console.error('Reset Password Error:', err);   // logs full error
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;