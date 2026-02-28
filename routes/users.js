const express = require('express');                                   // loads the dotenv library, which then loads the environment variables from the .env file into the process.env  process.env is a global configuration object provided by Node
const bcrypt = require('bcrypt');                                     // imports the bcrypt library used for password hashing
const db = require('../db/client');                                   // creates and exports the database connection pool
const { requireAuth, requireAdmin } = require('../middleware/auth');                // Import JWT authentication middleware
const validatePassword = require('../utils/passwordValidator');       // Import password validation utility

const router = express.Router();

// PATCH /api/users/me — update profile information
// JWT protection required
router.patch('/me', requireAuth, async function (req, res, next) {
  try{ 
    const userId = req.user.user_id;                                  // req.user was set from JWT payload in middleware/auth.js
    const {
      name,
      address,
      phone
    } = req.body;

    const { rows } = await db.query(
      `UPDATE users
      SET name = $1, address = $2, phone = $3
      WHERE user_id = $4
      RETURNING user_id, name, email, address, phone, role, created_at`,
      [name, address, phone, userId]
    );

    return res.json({ user: rows[0] });

  } catch (err) {
    return next(err);
  }
});

// PATCH /api/users/me/password
// JWT protection required
router.patch('/me/password', requireAuth, async function (req, res, next) {
  try {
    const {
      currentPassword,
      newPassword
    } = req.body;

    if (!currentPassword || !newPassword) {
      const err = new Error("Current password and new password are required");
      err.status = 400;
      return next(err);
    }

    //Validate new password strength
    if (!validatePassword(newPassword)) {
      const err = new Error("New password does not meet requirements");
      err.status = 400;
      return next(err);
    }

    const userId = req.user.user_id;

    // Fetch current hashed password
    const { rows } = await db.query(
      `SELECT password FROM users WHERE user_id = $1`,
      [userId]
    );

    const userRow = rows[0];
    if (!userRow) {
      const err = new Error("User not found");
      err.status = 404;                                         // 404 Not found
      return next(err);
    }

    // Verify current password
    const ok = await bcrypt.compare(currentPassword, userRow.password);
    if (!ok) {
      const err = new Error("Current password is incorrect");
      err.status = 401;                                                         // 401 Unauthorized
      return next(err);
    }

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 12);

    // No variable assignment needed — we only need the update to execute
    await db.query(
      `UPDATE users SET password = $1 WHERE user_id = $2`,
      [hashed, userId]
    );

    return res.json({ ok: true });                                            // simple confirmation
    
  } catch (err) {
    return next(err);
  }
});

// GET /api/users — Admin only
// get all users
router.get('/', requireAuth, requireAdmin, async function (req, res, next) {                        //  '/' represents the root path of this router
  try {
    const { rows } = await db.query(
      `SELECT user_id, name, email, address, phone, role, created_at FROM users                     // FROM users: this SQL statement fetches all rows from the users table
      ORDER BY created_at DESC`                                                                     // 'DESC' SQL keyword meaning descending sort order
    );

    return res.json({ user: rows});

  } catch (err) {
    return next(err);
  }
});

module.exports = router;























const { requireAuth, requireAdmin } = require('../middleware/auth');

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
