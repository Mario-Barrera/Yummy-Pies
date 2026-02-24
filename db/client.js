// To create and export a single database connection (or connection pool) that the entire application can reuse

const { Pool } = require('pg');                      // connection pool is: A managed collection of reusable database connections
require('dotenv').config();

const pool = new Pool({                 // Creates a connection pool object

  // this block defines the configuration object
  host: process.env.DB_HOST,            // host → tells PostgreSQL where the database server is running
  port: Number(process.env.DB_PORT),    // port → which port PostgreSQL listens on (usually 5432)
  database: process.env.DB_NAME,        // database → which database to connect to
  user: process.env.DB_USER,            // user → database username
  password: process.env.DB_PASSWORD     // password → database password
});

// Listen for database connection errors and terminate the app if one occurs
pool.on('error', function (err) {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

console.log('Database pool initialized');      // Log that the database pool has been initialized

module.exports = pool;                  // Exports the pool object so other files can use it
