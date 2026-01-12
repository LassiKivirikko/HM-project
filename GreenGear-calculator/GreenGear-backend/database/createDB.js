require('dotenv').config();
const { Client } = require('pg');

// This script connects to the default 'postgres' database and creates the target database
// named in PGDATABASE (or DB_NAME if ISDEV=1) if it does not already exist.

const isDev = process.env.ISDEV === '1';
const targetDb = isDev ? process.env.DB_NAME : process.env.PGDATABASE;
if (!targetDb) {
  console.error('[create-db] No target database name set (PGDATABASE or DB_NAME).');
  process.exit(1);
}

// Basic validation: allow letters, numbers, underscore, hyphen.
if (!/^[A-Za-z0-9_-]+$/.test(targetDb)) {
  console.error(`[create-db] Unsafe database name: ${targetDb}`);
  process.exit(1);
}

// Admin connection config to 'postgres' maintenance DB
// Values from an .env file
const adminConfig = {
  user: isDev ? process.env.DB_USER : process.env.PGUSER,
  host: isDev ? process.env.DB_HOST : process.env.PGHOST,
  password: isDev ? process.env.DB_PASSWORD : process.env.PGPASSWORD,
  port: parseInt(isDev ? process.env.DB_PORT : process.env.PGPORT, 10) || 5432,
  database: 'postgres', // connect to default maintenance DB
  ssl: (process.env.PGSSL === '0' || process.env.DB_SSL === '0') ? undefined : { rejectUnauthorized: false }
};

// Main function to create the database if it doesn't exist
async function run() {
  const client = new Client(adminConfig);
  try {
    await client.connect();
    console.log('[create-db] Connected to postgres maintenance DB');
    // Check if database exists
    const { rows } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [targetDb]);
    if (rows.length) {
      console.log(`[create-db] Database '${targetDb}' already exists. Nothing to do.`);
    } else {
      // Hyphenated names need quoting
      const quoted = targetDb.includes('-') ? `"${targetDb}"` : targetDb;
      await client.query(`CREATE DATABASE ${quoted}`);
      console.log(`[create-db] Database '${targetDb}' created successfully.`);
    }
  } catch (err) {
    console.error('[create-db] Error:', err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run();
