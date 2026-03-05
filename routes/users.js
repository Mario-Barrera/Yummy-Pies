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

    return res.json({ users: rows});

  } catch (err) {
    return next(err);
  }
});

// GET /api/users/:id - Admin only
router.get('/:id', requireAuth, requireAdmin, async function (req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      const error = new Error("Invalid user id");
      error.status = 400;
      throw error;
    }

    const { rows } = await db.query(
      `SELECT
        user_id,
        name,
        email,
        address,
        phone,
        role,
        creatred_at
      FROM users
      WHERE user_id = $1`,
      [id]
    );

    if (!rows[0]) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    return res.json({ user: rows[0]});

  } catch (err) {
    return next(err);
  }
});

// PATCH /api/users/:id/role
router.patch('/:id/role', requireAuth, requireAdmin, async function (req, res, next) {
  try {
    const id = Number(req.params.id);
    const { row } = req.body;

    if (!['user', 'admin'].includes(role)) {                          // checks if the role is NOT user and NOT admin
      const error = new Error("Invalid role");
      error.status = 400;
      throw error;
    }

    const { rows } =  await db.query(
      `UPDATE users
      SET role = $1
      WHERE user_id = $2
      RETURNING user_id, name, email, role`,
      [role, id]
    );

    if (!rows[0]) {
      const error = new Error("User not foud");
      error.status = 404                                            // 404 Not found
      throw error;
    }

    return res.json({ user: rows[0] });

  } catch (err) {
    return next(err);
  }
});

// DELETE /api/users/:id - Admin only
router.delete('/:id', requireAuth, requireAdmin, async function (req, res, next) {
  try {
    const id = Number(req.params.id);

    const { rows } = await db.query(
      `UPDATE users
      SET is_active = false
      WHERE user_id = $1
      RETURNING user_id`,
      [id]
    );

    if (!rows[0]) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }

    return res.json({ deactivated: true });

  } catch (err) {
    return next(err);
  }
});

module.exports = router;