const pool = require('../database/db');


exports.getGearboxes = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM gearbox ORDER BY ID");
    res.json(result.rows);
  } catch (err) {
    console.error("Error getting gearboxes: ", err);
    res.status(500).json({ error: "database error" });
  }
}

exports.getGearboxById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^\d+$/.test(String(id))) {
      return res.status(400).json({ error: "Invalid gearbox id; must be an integer" });
    }
    const result = await pool.query("SELECT * FROM gearbox WHERE id = $1", [id]);
    res.json(result.rows);
  } catch (err) {
    console.error("Error getting gearbox: ", err);
    res.status(500).json({ error: "database error" });
  }
}

// material data for a gearbox and its components
exports.getAllGearboxDataById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^\d+$/.test(String(id))) {
      return res.status(400).json({ error: "Invalid gearbox id; must be an integer" });
    }
    const result = await pool.query(`SELECT
      g.id AS gearbox_id,
      g.name AS gearbox_name,
      json_agg(
        json_build_object(
          'component_name', gm.component_name,
          'materials', (
            SELECT json_agg(
              json_build_object(
                'mass', gm2.mass,
                'unit', gm2.unit,
                'material_id', gm2.material_id,
                'material_name', m.name,
                'material_category', m.material_category,
                'default_co2_per_kg', m.default_co2_per_kg,
                'default_cost_per_kg', m.default_cost_per_kg,
                'co2_fossil_kg', em.co2_fossil_kg,
                'country_code', em.country_code,
                'cost_per_kg', em.cost_per_kg,
                'env_currency', em.currency,
                'env_spi', em.spi
              )
            )
            FROM gearbox_materials gm2
            JOIN materials m ON gm2.material_id = m.id
            LEFT JOIN environment_material_data em ON gm2.environment_data_id = em.id
            WHERE gm2.component_name = gm.component_name
              AND gm2.gearbox_id = g.id
          )
        )
      ) AS components
    FROM gearbox g
    JOIN gearbox_materials gm ON g.id = gm.gearbox_id
    WHERE g.id = $1
    GROUP BY g.id, g.name;`, [id])
    res.json(result.rows);
  } catch (err) {
    console.error("Error getting all gearbox data by id : ", err);
    res.status(500).json({ error: "database error" });
  }
}

exports.deleteGearboxById = async (req, res) => {
  try {
    const { id } = req.params;

    const exists = await pool.query(`SELECT * FROM gearbox WHERE id = $1`, [id]);
    if (exists.rows.length === 0) {
      return res.status(404).json({ error: "Gearbox not found" });
    }

    await pool.query("DELETE FROM gearbox WHERE id = $1", [id]);

    res.json({ message: `gearbox: ${exists.rows[0].name} deleted succesfully` })
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ error: "Cannot delete material because it's used in a gearbox" })
    }
    console.error('Error deleting gearbox:', err);
    res.status(500).json({ error: 'Database error while deleting gearbox' });
  }
}

exports.createGearbox = async (req, res) => {
  try {
      const {
        name,
        description,
        rated_power_kw,
        efficiency_percent,
        lifetime_years,
        operating_hours_per_year,
        electricity_emission_factor_kg_co2_per_kwh,
      } = req.body;
      const result = await pool.query(
        `INSERT INTO gearbox (
          name,
          description,
          rated_power_kw,
          efficiency_percent,
          lifetime_years,
          operating_hours_per_year,
          electricity_emission_factor_kg_co2_per_kwh
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          name,
          description,
          rated_power_kw,
          efficiency_percent,
          lifetime_years,
          operating_hours_per_year,
          electricity_emission_factor_kg_co2_per_kwh
        ]
      );
      res.status(201).json({
        message: 'Gearbox created',
        gearbox: result.rows[0]
      });

    } catch (err) {
    console.error('Error creating gearbox:', err);
    }
  }


