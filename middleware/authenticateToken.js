const jwt = require('jsonwebtoken');
const pool = require('../db/client');

const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
      const err = new Error('No token provided');
      err.status = 401;
      throw err;
    }

    const { rows } = await pool.query(`SELECT 1 FROM tokenblacklist WHERE token = $1`, [token]);
    if (rows.length > 0) {
      const err = new Error('Token has been invalidated');
      err.status = 401;
      throw err;
    }

    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (err) {
    if (!err.status) err.status = 401;
    next(err);
  }
};

module.exports = authenticateToken;
