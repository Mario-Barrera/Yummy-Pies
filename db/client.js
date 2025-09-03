// Important tips for me to remember:
// client.js just connects to the database; it doesn’t define tables.
// Ensure environment variables from .env match your local PostgreSQL setup,
// and confirm they're correctly loaded and used in the code (e.g., DB_USER, DB_NAME, etc.)


const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,        
  port: process.env.DB_PORT,        
  database: process.env.DB_NAME,    
  user: process.env.DB_USER,        
  password: process.env.DB_PASSWORD
});

// Listen for pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

console.log('Connected to DB (pool created)');

module.exports = pool;
