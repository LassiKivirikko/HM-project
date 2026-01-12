const pool = require('./db')


async function test() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Connected to PostgreSQL!');
    console.log('Server time:', res.rows[0].now);
  } catch (err) {
    console.error('Connection error:', err);
  } finally {
    await pool.end();
  }
}

test();