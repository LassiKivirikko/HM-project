const pool = require('../database/db');

exports.getElectricityCosts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM electricity_costs`)
    res.json(result.rows);
  } catch (err) {
    console.error("Error getting electricity costs: ", err);
    res.status(500).json({ error: "database error" });
  }
};

exports.createElectricityCost = async (req, res) => {
  try {
    const { country_code, average_electricity_cost_per_kwh, currency } = req.body;
    const result = await pool.query(
      `INSERT INTO electricity_costs (country_code, average_electricity_cost_per_kwh, currency)
       VALUES ($1, $2, $3) RETURNING *`,
      [country_code, average_electricity_cost_per_kwh, currency]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating electricity cost: ", err);
    res.status(500).json({ error: "database error" });
  }
}