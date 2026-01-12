const pool = require('../database/db');

exports.getSocialData = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM social_data ORDER BY id`);
    res.json(result.rows);
  } catch (err) {
    console.error("Error getting social data: ", err);
    res.status(500).json({ error: "database error" });
  }
}

