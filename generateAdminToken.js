require('dotenv').config();
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { user_id: 15, role: 'admin' },  // Replace 15 with your actual admin user_id
  process.env.JWT_SECRET,           // Make sure JWT_SECRET is set in your .env file
  { expiresIn: '1h' }
);

console.log(token);
