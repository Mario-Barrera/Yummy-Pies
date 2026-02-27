const express = require('express');
const pool = require('../db/client');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const validatePassword = require('../utils/passwordValidator');
const router = express.Router();

// Get logged-in user's profile
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.user_id;

    const { rows } = await pool.query(
      `SELECT user_id AS id, name, email, address, phone, role
       FROM users
       WHERE user_id = $1`,
      [userId]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

/* 
add bycrpty to login users
async function loginUser(req, res, next) {
  try {
    const { email, password } = req.body;

    const result = await db.query(
      `SELECT user_id, name, email, password, role
       FROM users
       WHERE email = $1`,
      [email.toLowerCase()]
    );

    const user = result.rows[0];

    // Use generic message so you don't leak whether email exists
    if (!user) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      return next(err);
    }

    // ✅ bcrypt added here
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      return next(err);
    }

    // Never send password hash back
    delete user.password;

    return res.json({ user });
  } catch (err) {
    return next(err);
  }
}
*/

// Get user profile by ID (admin or owner only)
router.get('/:id', requireAuth, async (req, res, next) => {
  const userId = req.params.id;

  // Only allow if admin or the user themselves
  if (req.user.user_id !== parseInt(userId) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT user_id, name, email, address, phone, role, created_at
       FROM users
       WHERE user_id = $1`,
      [userId]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});


const bcrypt = require('bcrypt');

router.put('/me', requireAuth, async (req, res, next) => {
  const userId = req.user.user_id;
  const { name, email, address, phone, password } = req.body;

  // Build dynamic update query
  const updates = [];
  const values = [];
  let idx = 1;

  try {
    if (name) {
      if (typeof name !== 'string' || name.length < 4 || name.length > 100) {
        return res.status(400).json({ error: 'Name must be between 4 and 100 characters.' });
      }
      updates.push(`name = $${idx++}`);
      values.push(name);
    }

    if (email) {
      if (typeof email !== 'string' || email.length > 150) {
        return res.status(400).json({ error: 'Email must be up to 150 characters long' });
      }
      updates.push(`email = $${idx++}`);
      values.push(email.toLowerCase().trim());
    }

    if (address) {
      if (typeof address !== 'string' || address.length > 100) {
        return res.status(400).json({ error: 'Address must be up to 100 characters long' });
      }
      updates.push(`address = $${idx++}`);
      values.push(address);
    }

    if (phone) {
      if (typeof phone !== 'string' || phone.length > 20) {
        return res.status(400).json({ error: 'Phone must be up to 20 characters long' });
      }
      updates.push(`phone = $${idx++}`);
      values.push(phone);
    }

    if (typeof password === 'string' && password.trim() !== '') {
      const passwordError = validatePassword(password);
      if (passwordError) {
        return res.status(400).json({ error: passwordError });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push(`password = $${idx++}`);
      values.push(hashedPassword);
    }


    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(userId); // For WHERE clause

    const query = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE user_id = $${idx}
      RETURNING user_id, name, email, address, phone, role
    `;

    const { rows } = await pool.query(query, values);
    res.json({ user: rows[0] });

  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email already in use' });
    }
    next(err);
  }
});


module.exports = router;
