const { Pool } = require('pg');
require('dotenv').config(); // Load variables from .env

// Create a new pool instance using environment variables
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Event listener for successful connections (helpful for debugging)
pool.on('connect', () => {
  console.log('✅ Successfully connected to the PostgreSQL database.');
});

// Event listener for unexpected errors on idle clients
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Export a robust query function for our controllers to use
module.exports = {
  query: (text, params) => pool.query(text, params),
};