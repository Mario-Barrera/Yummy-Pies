const express = require('express');                                       // loads the dotenv library, which then loads the environment variables from the .env file into the process.env  process.env is a global configuration object provided by Node
const bcrypt = require('bcrypt');                                         // imports the bcrypt library used for password hashing
const jwt = require('jsonwebtoken');                                      // loads the jsonwebtoken library into your Node.js file
const db = require('../db/client');                                       // creates and exports the database connection pool
const { requireAuth, requireAdmin } = require('../middleware/auth');                    // Import JWT authentication middleware

const router = express.Router();                                          // Create a new Express Router to group and handle authentication routes

function sanitizeUser(userRow) {                                          // sanitize means: Clean data so it is safe to use or expose
  if (!userRow) return null;
  const { password, ...safe } = userRow;                                  // '...safe' is rest operator, and collects all remaining properties except password
  return safe;
}

// POST /api/auth/register
// Public route: no JWT protection required (user does not have a token yet)
router.post('/register', async function (req, res, next) {
  try {
    const {
      name,
      email,
      password,
      address,
      phone
    } = req.body;

    if (!name || !email || !password || !address || !phone) {
      const err = new Error("Name, email, password, address, and phone are required.");
      err.status = 400;
      return next(err);
    }

    // check if email already exist
    const existing = await db.query(                                        // Import the PostgreSQL connection pool from db/client.js
      `SELECT user_id FROM users WHERE email = $1`, 
      [email]
    );

      if (existing.rows.length > 0) {                                     // We use '.rows' because that is the property name defined by the pg library for query results
        const err = new Error("Email is already registered");
        err.status = 409;
        return next(err);
      };

    const hashed = await bcrypt.hash(password, 12);                       // 12 (Salt rounds), bcrypt.hash() is a function provided by the bcrypt library.
    // A salt is a random string added to a password before hashing

    // Add a new row to the users table
    const insertSQL = `
      INSERT INTO users (name, email, password, address, phone, role)         
      VALUES ($1, $2, $3, $4, $5, 'customer')
      RETURNING user_id, name, email, address, phone, role, created_at;    
    `;

    const { rows } = await db.query(insertSQL, [name, email, hashed, address, phone]);        // '{ rows }'  means: From the returned object, grab the property named rows.”
    const user = rows[0];

    const token = jwt.sign(                                                         // 'jwt.sign()' is a method that creates a digitally signed token containing data
      { user_id: user.user_id, role: user.role, email: user.email },                // payload argument
      process.env.JWT_SECRET,                                                       // secret argument
      { expiresIn: '1h'}                                                            // options argument
    );                                                                              // jwt.sing() always returns a string: HEADER.PAYLOAD.SIGNATURE

    return res.status(201).json({ user, token });                                   // Sets HTTP status to 201 Created, use a 201 when a new resource was successfully created
  
  } catch (err) {
    return next(err);
  }
});

// POST /api/auth/login
// Public route: no JWT protection required (user does not have a token yet)
router.post('/login', async function (req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const err = new Error("Email and password are required");
      err.status = 400;                                               // 400 Bad request
      return next(err);
    }

    // password will be hashed
    const { rows } = await db.query(
      `SELECT user_id, name, email, password, role, address, phone FROM users WHERE email = $1`,
      [email]
    );

    const userRow = rows[0];                                      // userRow is the direct database record (includes hashed password)
    if (!userRow) {
      const err = new Error("Invalid email or password");
      err.status = 401;                                           // 401 Unauthorized
      return next(err);
    }

    const ok = await bcrypt.compare(password, userRow.password);        // comparing the plain-text password the user just typed against the stored hashed password
    if (!ok) {                                                          // const ok will be: true or false
      const err = new Error("Invalid email or password");
      err.status = 401;
      return next(err);
    }

    const safeUser = sanitizeUser(userRow);                       // Remove sensitive fields (password) before sending to client

    const token = jwt.sign(
      { user_id: safeUser.user_id, role: safeUser.role, email: safeUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.json({ user: safeUser, token });           // 200 status code will be the default

  } catch (err) {
    return next(err);
  }
});

// jwt is stored in localStorage, frontend js will handle logout by removing the token

// GET /api/auth/me  — current user's profile (admin or customer)
// JWT protection required
router.get('/me', requireAuth, async function (req, res, next) {        // 'requireAuth' protect this route with the JWT middlewar
  try {
    const userId = req.user.user_id;                                    // req.user was set from JWT payload in middleware/auth.js

    const { rows } = await db.query(
      'SELECT user_id, name, email, address, phone, role, created_at FROM users WHERE user_id = $1',
      [userId]
    );

    return res.json({ user: rows[0] });                                 // 200 status code by default

  } catch (err) {
    return next(err);
  }
});

module.exports = router;
