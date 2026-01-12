const pool = require('../database/db');

// get all lifecycle data for a gearbox id
exports.getLifecycleDataByGearboxId = async (req, res) => {
  try {
    const { id } = req.params;
    const gearbox = await pool.query('SELECT * FROM gearbox WHERE id = $1', [id]);
    if (gearbox.rows.length === 0) {
      return res.status(404).json({ error: "Gearbox not found" });
    }

    const manufacturing = await pool.query(
      `SELECT * FROM manufacturing_data WHERE gearbox_id = $1`, [id]
    );

    const transportation = await pool.query(
      `SELECT * FROM transportation WHERE gearbox_id = $1`, [id]
    );

    const usePhase = await pool.query(
      `SELECT * FROM use_phase_data WHERE gearbox_id = $1`, [id]
    );

    const maintenance = await pool.query(
      `SELECT * FROM maintenance_data WHERE gearbox_id = $1`, [id]
    );

    const endOfLife = await pool.query(
      `SELECT * FROM end_of_life_data WHERE gearbox_id = $1`, [id]
    );



    const response = {
      gearbox: gearbox.rows[0],

      manufacturing: manufacturing.rows || null,

      transportation: transportation.rows,

      use_phase: usePhase.rows || null,

      maintenance: maintenance.rows || null,

      end_of_life: endOfLife.rows || null,

    };

    res.json(response);
  } catch (err) {
    console.error("Error getting lifecycle data by gearbox id: ", err);
    res.status(500).json({ error: "database error" });
  }
};

//can process both single object and array of objects
exports.createManufacturingDataByGearboxId = async (req, res) => {
  try {
    let data = req.body;

    if (!Array.isArray(data)) {
      data = [data];
    }

    const createdData = [];

    for (const i of data) {
      const result = await pool.query(`
        INSERT INTO manufacturing_data (
          gearbox_id,
          electricity_consumption_kwh_per_unit,
          fuel_consumption_mj_per_unit,
          fuel_type,
          manufacturing_waste_kg_per_unit,
          factory_location,
          description,
          factory_country_code
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
        `,
        [
          i.gearbox_id,
          i.electricity_consumption_kwh_per_unit,
          i.fuel_consumption_mj_per_unit,
          i.fuel_type,
          i.manufacturing_waste_kg_per_unit,
          i.factory_location,
          i.description,
          i.factory_country_code
        ]
      );
      createdData.push(result.rows[0]);
    }

  } catch (err) {
    console.error("Error creating manufacturing data by gearbox id: ", err);
    res.status(500).json({ error: "database error" });
  }
}

exports.createUsePhaseDataByGearboxId = async (req, res) => {
  try {
    const {
      gearbox_id,
      operating_hours_per_year,
      energy_source_type,
      lubricant_replacement_interval_hours,
      lubricant_quantity_per_replacement_liters
    } = req.body;

    const result = await pool.query(`
      INSERT INTO use_phase_data (
        gearbox_id,
        operating_hours_per_year,
        energy_source_type,
        lubricant_replacement_interval_hours,
        lubricant_quantity_per_replacement_liters
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`, [
      gearbox_id,
      operating_hours_per_year,
      energy_source_type,
      lubricant_replacement_interval_hours,
      lubricant_quantity_per_replacement_liters
    ]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: "Use phase data for this gearbox already exists" });
    }
    console.error("Error creating use phase data by gearbox id: ", err);
    res.status(500).json({ error: "database error" });
  }
};

exports.createMaintenanceDataByGearboxId = async (req, res) => {
  try {
    const {
      gearbox_id,
      maintenance_interval_hours,
      maintenance_interval_years,
      parts_replaced_per_interval_kg,
      parts_replaced_per_interval_item_count,
      emission_factor_spare_parts_kg_co2_per_kg,
      technician_travel_distance_km,
      service_transport_mode,
      lubricant_disposal_method
    } = req.body;

    const { rows } = await pool.query(`
      INSERT INTO maintenance_data (
        gearbox_id,
        maintenance_interval_hours,
        maintenance_interval_years,
        parts_replaced_per_interval_kg,
        parts_replaced_per_interval_item_count,
        emission_factor_spare_parts_kg_co2_per_kg,
        technician_travel_distance_km,
        service_transport_mode,
        lubricant_disposal_method
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`, [
      gearbox_id,
      maintenance_interval_hours,
      maintenance_interval_years,
      parts_replaced_per_interval_kg,
      parts_replaced_per_interval_item_count,
      emission_factor_spare_parts_kg_co2_per_kg,
      technician_travel_distance_km,
      service_transport_mode,
      lubricant_disposal_method
    ]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error creating maintenance data by gearbox id: ", err);
    res.status(500).json({ error: "database error" });
  }
}

exports.createTransportDataByGearboxId = async (req, res) => {
  try {
    const {
      gearbox_id,
      description,
      leg_description,
      distance_km,
      transport_mode,
      transport_mass_tonnes,
      emission_factor_kg_co2_pre_tonne_km
    } = req.body;

    const { rows } = await pool.query(`
      INSERT INTO transportation (
        gearbox_id,
        description,
        leg_description,
        distance_km,
        transport_mode,
        transport_mass_tonnes,
        emission_factor_kg_co2_per_tonne_km
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, [
      gearbox_id,
      description,
      leg_description,
      distance_km,
      transport_mode,
      transport_mass_tonnes,
      emission_factor_kg_co2_pre_tonne_km
    ]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error creating transport data by gearbox id: ", err);
    res.status(500).json({ error: "database error" });
  }
}

exports.createEndOfLifeDataByGearboxId = async (req, res) => {
  try {
    const {
      gearbox_id,
      recycling_rate_percent,
      disposal_method,
      recycling_credit_factor_kg_co2,
      transport_to_recycler_km
    } = req.body;
    const { rows } = await pool.query(`
      INSERT INTO end_of_life_data (
        gearbox_id,
        recycling_rate_percent,
        disposal_method,
        recycling_credit_factor_kg_co2,
        transport_to_recycler_km
      )
      VALUES ($1, $2, $3, $4, $5) RETURNING *`, [
      gearbox_id,
      recycling_rate_percent,
      disposal_method,
      recycling_credit_factor_kg_co2,
      transport_to_recycler_km
    ]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error creating end-of-life data by gearbox id: ", err);
    res.status(500).json({ error: "database error" });
  }
}