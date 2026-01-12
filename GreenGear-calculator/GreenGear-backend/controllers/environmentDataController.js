const pool = require('../database/db');

exports.getEnvironmentData = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*,
      m.name AS material_name
      FROM environment_material_data e
      JOIN materials m ON e.material_id = m.id
      ORDER BY material_name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error getting environment data: ", err);
    res.status(500).json({ error: "database error" });
  }
};


exports.getEnvironmentDataByMaterialId = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT e.*,
      m.name AS material_name
      FROM environment_material_data e
      JOIN materials m ON e.material_id = m.id
      WHERE e.material_id = $1
      ORDER BY id
    `, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error("Error getting environment data by material id: ", err);
    res.status(500).json({ error: "database error" });
  }
}

exports.createEnvironmentDataWithMaterialId = async (req, res) => {
  try {
    const {
      material_id,
      country_code,
      co2_per_kg,
      cost_per_kg,
      description,
    } = req.body;
    // Build insert dynamically (description may not exist in older DBs)
    const cols = ['material_id','country_code','co2_per_kg','cost_per_kg'];
    const vals = [material_id, country_code, co2_per_kg, cost_per_kg];
    if (description !== undefined && description !== null) {
      cols.push('description');
      vals.push(description);
    }
    const placeholders = cols.map((_, i) => `$${i+1}`).join(', ');
    const { rows } = await pool.query(
      `INSERT INTO environment_material_data (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      vals
    );
    const data = rows[0];
    const result = await pool.query(`
        SELECT e.*,
        m.name AS material_name
        FROM environment_material_data e
        JOIN materials m ON e.material_id = m.id
        WHERE e.id = $1
      `, [data.id]);
    res.status(201).json({ environment_data: result.rows[0] });
  } catch (err) {
    console.error("Error creating environment data: ", err);
    res.status(500).json({ error: "database error" });
  }
}

exports.updateEnvironmentData = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      material_id,
      country_code,
      co2_per_kg,
      cost_per_kg,
      description,
    } = req.body;

    const { rows } = await pool.query(`
      UPDATE environment_material_data SET
        material_id = COALESCE($1, material_id),
        country_code = COALESCE($2, country_code),
        co2_per_kg = COALESCE($3, co2_per_kg),
        cost_per_kg = COALESCE($4, cost_per_kg)
        -- description column may not exist in older schemas; handle separately
      WHERE id = $5
      RETURNING *`,
      [
        material_id ?? null,
        country_code ?? null,
        co2_per_kg ?? null,
        cost_per_kg ?? null,
        id
      ]);
    // If description was provided, attempt a second update guarded by try/catch
    if (description !== undefined && description !== null) {
      try {
        await pool.query(`UPDATE environment_material_data SET description = $1 WHERE id = $2`, [description, id]);
      } catch (e) {
        // If column doesn't exist, ignore to stay compatible with older DBs
        if (e.code !== '42703') throw e;
      }
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("Error updating environment data: ", err);
    res.status(500).json({ error: "database error" });
  }
}

exports.deleteEnvironmentDataById = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM environment_material_data WHERE id = $1", [id]);
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting environment data: ", err);
    res.status(500).json({ error: "database error" });
  }
}