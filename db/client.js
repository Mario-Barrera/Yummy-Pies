const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});


// Test connection once at startup
pool.connect()
  .then(client => {
    console.log('Connected to DB');
    client.release(); // release the client back to the pool
  })
  .catch(err => console.error('DB connection error:', err));

module.exports = pool;