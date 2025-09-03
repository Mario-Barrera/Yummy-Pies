// Testing admin-only routes without logging in through the UI.
// Quickly generating a valid admin token to use in API requests.
// Bootstrapping or debugging admin authentication during development.

require('dotenv').config();
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { user_id: 15, role: 'admin' },     // actual admin user_id
  process.env.JWT_SECRET,             // Make sure JWT_SECRET is set in your .env file
  { expiresIn: '1h' }
);

console.log(token);
