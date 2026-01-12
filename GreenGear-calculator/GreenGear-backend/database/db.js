const dotenv = require('dotenv');
const { Pool } = require('pg');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Helper to parse int ports safely
function int(v, fallback) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

// Decide which env prefix to use: local dev (ISDEV=1) or production (RDS/Secrets)
const isDev = process.env.ISDEV === '1';

// Consolidate config so logs are clearer in production
const cfg = isDev ? {
  user: process.env.DB_USER,
  host: process.env.DB_HOST || '127.0.0.1',
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: int(process.env.DB_PORT, 5432),
  ssl: process.env.DB_SSL === '1' ? { rejectUnauthorized: false } : undefined,
} : {
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: int(process.env.PGPORT, 5432),
  ssl: process.env.PGSSL === '0' ? undefined : { rejectUnauthorized: false },
};

const pool = new Pool(cfg);

// Basic connectivity probe (optional call elsewhere)
async function testDbConnection() {
  try {
    const { rows } = await pool.query('SELECT 1 AS ok');
    console.log('[db] connection ok:', rows[0]);
  } catch (err) {
    console.error('[db] connection failed:', err.code, err.message);
  }
}

// Log unexpected client errors (e.g., network interruptions)
pool.on('error', (err) => {
  console.error('[db] pool error:', err.code, err.message);
});

if (process.env.LOG_DB_CONFIG === '1') {
  const safeCfg = { ...cfg };
  if (safeCfg.password) safeCfg.password = '***';
  console.log('[db] config', { isDev, cfg: safeCfg });
}

module.exports = pool;
module.exports.testDbConnection = testDbConnection;
