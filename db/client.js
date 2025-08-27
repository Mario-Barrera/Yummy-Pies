// Important tips for me to remember:
// client.js just connects to the database; it doesn’t define tables.

const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST,     // e.g., 'localhost'
  port: process.env.DB_PORT,     // e.g., 5432
  database: process.env.DB_NAME, // 'yummy_pies'
  user: process.env.DB_USER,     // e.g., 'postgres'
  password: process.env.DB_PASSWORD
});

client.connect()
  .then(() => console.log('Connected to DB'))
  .catch(err => console.error('Connection error', err.stack));

module.exports = client;