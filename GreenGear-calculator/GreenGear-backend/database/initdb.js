require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./db');

const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

//used for updating schema

(async () => {
  try {
    await pool.query(schema);
    console.log('Database schema applied successfully!');
  } catch (err) {
    console.error('Error applying schema:', err);
  } finally {
    pool.end();
  }
})();