const pool = require('../database/db');


exports.getMaterials = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM materials ORDER BY ID");
    res.json(result.rows);
  } catch (err) {
    console.error("Error getting materials: ", err);
    res.status(500).json({ error: "database error" });
  }
};

exports.getMaterialsById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM materials WHERE id = $1 ORDER BY ID", [id]);
    res.json(result.rows);
  } catch (err) {
    console.error("Error getting materials: ", err);
    res.status(500).json({ error: "database error" });
  }
};

exports.createMaterial = async (req, res) => {
  try {
    const {
      name,
      default_unit,
      material_category,
      default_co2_per_kg,
      default_co2_fossil_kg,
      default_co2_biogenic_kg,
      default_energy_mj_per_kg,
      default_cost_per_kg,
      default_currency,
      default_spi,
      manually_added,
    } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Material name required" });
    }

    const { rows } = await pool.query(`
      INSERT INTO materials (
      name,
      default_unit,
      material_category,
      default_co2_per_kg,
      default_co2_fossil_kg,
      default_co2_biogenic_kg,
      default_energy_mj_per_kg,
      default_cost_per_kg,
      default_currency,
      default_spi,
      manually_added
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *` , [
      name,
      default_unit || null,
      material_category || null,
      default_co2_per_kg || null,
      default_co2_fossil_kg || null,
      default_co2_biogenic_kg || null,
      default_energy_mj_per_kg || null,
      default_cost_per_kg || null,
      default_currency || null,
      default_spi || null,
      manually_added ?? false
    ]
    );
    res.status(201).json({
      message: 'Material created',
      material: rows[0]
    });
  } catch (err) {
    console.error('Error creating material:', err);
    res.status(500).json({ error: 'Database error while creating material' });
  }
}

exports.deleteMaterialById = async (req, res) => {
  try {
    const { id } = req.params;

    const exists = await pool.query(`SELECT * FROM materials WHERE id = $1`, [id]);
    if (exists.rows.length === 0) {
      return res.status(404).json({ error: "Material not found" });
    }

    await pool.query("DELETE FROM materials WHERE id = $1", [id]);

    res.json({ message: `material: ${exists.rows[0].name} deleted succesfully` })
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ error: "Cannot delete material because it's used in a gearbox" })
    }
    console.error('Error deleting material:', err);
    res.status(500).json({ error: 'Database error while deleting material' });
  }

}

exports.getMaterialsByGearboxId = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT  m.id AS material_id,
      m.material_category,
      m.name AS material,
      gm.unit,
      SUM(gm.mass) AS total_mass
      FROM gearbox_materials gm
      JOIN materials m ON gm.material_id = m.id
      WHERE gm.gearbox_id = $1
      GROUP BY m.id, m.name, gm.unit, m.material_category
      ORDER BY total_mass DESC
      `, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error("Error getting materials by gearbox id: ", err);
    res.status(500).json({ error: "database error" });
  }
}

// can process both single object and array of objects
exports.createGearboxMaterialByGearboxId = async (req, res) => {
  try {
    let materials = req.body;
    if (!Array.isArray(materials)) {
      materials = [materials];
    }
    const createdMaterials = [];

    for (const material of materials) {
      const result = await pool.query(`
        INSERT INTO gearbox_materials (
        gearbox_id,
        material_id,
        component_name,
        recycled_content_percent,
        scrap_rate_percent,
        environment_data_id,
        mass,
        unit
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;`,
        [
          material.gearbox_id,
          material.material_id,
          material.component_name,
          material.recycled_content_percent,
          material.scrap_rate_percent,
          material.environment_data_id || null,
          material.mass,
          material.unit
        ]
      );
      createdMaterials.push(result.rows[0]);
    }
    res.status(201).json({
      message: 'Gearbox materials created',
      materials: createdMaterials
    });
  } catch (err) {
    console.error('Error creating gearbox material:', err);
    res.status(500).json({ error: 'Database error while creating gearbox material' });
  }
}


exports.updateMaterialById = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      default_unit,
      material_category,
      default_co2_per_kg,
      default_co2_fossil_kg,
      default_co2_biogenic_kg,
      default_energy_mj_per_kg,
      default_cost_per_kg,
      default_currency,
      default_spi,
    } = req.body;

    const result = await pool.query(`
      UPDATE materials
      SET
        name = $1,
        default_unit = $2,
        material_category = $3,
        default_co2_per_kg = $4,
        default_co2_fossil_kg = $5,
        default_co2_biogenic_kg = $6,
        default_energy_mj_per_kg = $7,
        default_cost_per_kg = $8,
        default_currency = $9,
        default_spi = $10
      WHERE id = $11
      RETURNING *;
    `, [
      name,
      default_unit || null,
      material_category || null,
      default_co2_per_kg || null,
      default_co2_fossil_kg || null,
      default_co2_biogenic_kg || null,
      default_energy_mj_per_kg || null,
      default_cost_per_kg || null,
      default_currency || null,
      default_spi || null,
      id
    ]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating material:", err);
    res.status(500).json({ error: "Database error while updating material" });
  }
};