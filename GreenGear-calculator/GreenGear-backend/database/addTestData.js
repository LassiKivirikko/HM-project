const pool = require("./db");

//removes all data and adds test data
async function addTestData() {
  try {
    console.log("inserting test data")

    await pool.query(`
      TRUNCATE TABLE
        evaluation_results,
        gearbox_materials,
        environment_material_data,
        materials,
        gearbox,
        social_data,
        transportation,
        use_phase_data,
        end_of_life_data,
        manufacturing_data,
        maintenance_data,
        users_data
      RESTART IDENTITY CASCADE;
    `);


    await pool.query(`
    INSERT INTO materials (name, default_unit, default_co2_per_kg, material_category, manually_added)
    VALUES
    ('Steel', 'kg', 1.9, 'Metal', false),
    ('Aluminium', 'kg', 8.2, 'Metal', false),
    ('Cast Iron', 'kg', 2.1, 'Metal', false),
    ('Copper', 'kg', 4.0, 'Metal', false),
    ('Plastic (Nylon)', 'kg', 6.5, 'Polymer', false);
  `);

    await pool.query(`
    INSERT INTO gearbox (name, description, rated_power_kw, efficiency_percent, lifetime_years, operating_hours_per_year, electricity_emission_factor_kg_co2_per_kwh)
    VALUES
    ('Standard 5-Speed Manual', 'Conventional 5-speed gearbox for small passenger cars.', 50.0, 95.5, 15, 4000, 0.233),
    ('Compact EV Reduction Gear', 'Lightweight single-speed gearbox for electric vehicles.', 100.0, 97.0, 20, 4500, 0.220);
  `);

    await pool.query(`
    INSERT INTO manufacturing_data (gearbox_id, electricity_consumption_kwh_per_unit, fuel_consumption_mj_per_unit, fuel_type, manufacturing_waste_kg_per_unit, factory_location, description, factory_country_code)
    VALUES
    (1, 120.5, 500.0, 'Diesel', 15.0, 'Berlin', 'Main factory in Berlin', 'DEU'),
    (2, 200.0, 600.0, 'Natural Gas', 20.0, 'Milan', 'Main factory in Milan', 'ITA');
  `);

    await pool.query(`
    INSERT INTO transportation (gearbox_id, description, leg_description, distance_km, transport_mass_tonnes, emission_factor_kg_co2_per_tonne_km)
    VALUES
    (1, 'From factory to assembly', 'Truck transport', 300.0, 1.2, 0.1),
    (2, 'From factory to port', 'Ship transport', 1200.0, 2.5, 0.015);
  `);

    await pool.query(`
    INSERT INTO use_phase_data (
      gearbox_id,
      operating_hours_per_year,
      energy_source_type,
      lubricant_replacement_interval_hours,
      lubricant_quantity_per_replacement_liters
    )
    VALUES
      (1, 5000.0, 'Electric', 5000.0, 2.5),
      (2, 6000.0, 'Electric', 4000.0, 3.0);
  `);

    await pool.query(`
    INSERT INTO environment_material_data (material_id, country_code, co2_per_kg, cost_per_kg, description)
    VALUES
    (1, 'DEU', 1.9, 1.5, 'Recycled Steel from Germany'),
    (2, 'ITA', 8.2, 3.0, 'Primary Aluminum from Italy'),
    (3, 'FIN', 2.1, 1.8, 'Wood Pulp from Finland'),
    (4, 'SWE', 4.0, 5.0, 'Bioplastics from Sweden'),
    (5, 'NOR', 6.5, 4.5, 'Concrete from Norway');
`);

    await pool.query(`
  INSERT INTO gearbox_materials (gearbox_id, material_id, component_name, recycled_content_percent, scrap_rate_percent, environment_data_id, mass, unit)
  VALUES
  (1, 1, 'Casing', 10.0, 5.0, 1, 500, 'kg'),
  (1, 5, 'Seals and Covers', 0.0, 2.0, 5, 15, 'kg'),
  (2, 2, 'Housing', 15.0, 3.0, 2, 300, 'kg'),
  (2, 4, 'Conductive Elements', 5.0, 4.0, 4, 50, 'kg');
`);

    await pool.query(`
  INSERT INTO maintenance_data (gearbox_id, maintenance_interval_hours, maintenance_interval_years, parts_replaced_per_interval_kg, emission_factor_spare_parts_kg_co2_per_kg, technician_travel_distance_km, service_transport_mode)
  VALUES
  (1, 4000.0, 2.0, 15.0, 2.5, 50.0, 'Van'),
  (2, 5000.0, 1.5, 20.0, 3.0, 80.0, 'Car');
`);

    await pool.query(`
  INSERT INTO end_of_life_data (gearbox_id, recycling_rate_percent, disposal_method, recycling_credit_factor_kg_co2, transport_to_recycler_km)
  VALUES
  (1, 85.0, 'Recycling', 120.0, 100.0),
  (2, 90.0, 'Recycling', 150.0, 150.0);
`);

    await pool.query(`
  INSERT INTO social_data (spi)
  VALUES
  (68.5),
  (72.0);
`);

    await pool.query(`
  INSERT INTO evaluation_results (
    gearbox_id,
    materials_co2_total_kg,
    material_cost,
    manufacturing_co2_kg,
    manufacturing_cost,
    transportation_co2_kg,
    transportation_cost,
    use_phase_energy_co2_kg,
    use_phase_energy_cost,
    use_phase_maintenance_co2_kg,
    use_phase_maintenance_cost,
    end_of_life_co2_kg,
    end_of_life_cost,
    total_co2_kg,
    total_energy_mj,
    total_cost,
    currency,
    average_spi,
    social_data_id
  )
  VALUES
  (1, 1200.5, 750.0, 500.0, 1000.0, 30.0, 150.0, 17500.0, 20000.0, 200.0, 500.0, 10.5, 100.0, 19541.0, 1800000.0, 22500.0, 'EUR', 68.5, 1),
  (2, 1800.0, 1200.0, 700.0, 1500.0, 45.0, 300.0, 26400.0, 25000.0, 250.0, 600.0, 12.0, 150.0, 29457.0, 2500000.0, 29100.0, 'EUR', 72.0, 2);
`);

    //
    // --- NEW LARGE GEARBOX (ID = 3) ---
    //

    console.log("Adding large industrial gearbox...");

    // Add 3 new materials
    await pool.query(`
      INSERT INTO materials (name, default_unit, default_co2_per_kg, material_category, manually_added, default_cost_per_kg, default_currency)
      VALUES
      ('Rubber', 'kg', 2.9, 'Polymer', false, 2.2, 'EUR'),
      ('Carbon Fiber', 'kg', 29.0, 'Composite', false, 25.0, 'EUR'),
      ('Lithium Grease', 'kg', 3.2, 'Lubricant', false, 8.0, 'EUR');
    `);

    // Add new gearbox
    await pool.query(`
      INSERT INTO gearbox (
        name,
        description,
        rated_power_kw,
        efficiency_percent,
        lifetime_years,
        operating_hours_per_year,
        electricity_emission_factor_kg_co2_per_kwh
      )
      VALUES (
        'Heavy-Duty Industrial Gearbox',
        'High-torque gearbox for industrial machinery and wind turbine applications.',
        350.0,
        96.2,
        25,
        6000,
        0.210
      );
    `);

    // Add environmental data for the new materials (IDs 6, 7, 8)
    await pool.query(`
    INSERT INTO environment_material_data (material_id, country_code, co2_per_kg, cost_per_kg, description)
    VALUES
    (6, 'DEU', 2.9, 2.2, 'Lightweight Alloy from Germany'),
    (7, 'USA', 29.0, 25.0, 'Specialized Polymer from USA'),
    (8, 'NOR', 3.2, 8.0, 'Sustainable Material from Norway');
`);
    await pool.query(`
    INSERT INTO environment_material_data (material_id, country_code, co2_per_kg, cost_per_kg, description)
    VALUES
    (6, 'DEU', 2.9, 2.2, 'Lightweight Alloy from Germany'),
    (7, 'USA', 29.0, 25.0, 'Specialized Polymer from USA'),
    (8, 'NOR', 3.2, 8.0, 'Sustainable Material from Norway');
`);

    // Add gearbox materials for gearbox ID = 3
    await pool.query(`
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
      VALUES
      (3, 1, 'Outer Casing', 15.0, 3.0, 1, 1200, 'kg'),
      (3, 3, 'Bearing Assembly', 5.0, 2.0, 3, 450, 'kg'),
      (3, 1, 'Main Shaft', 10.0, 1.0, 1, 300, 'kg'),
      (3, 2, 'Cooling Fins / Heat Sink', 8.0, 5.0, 2, 150, 'kg'),
      (3, 4, 'Electrical Windings', 5.0, 2.0, 4, 80, 'kg'),
      (3, 1, 'Internal Gearing', 12.0, 4.0, 1, 600, 'kg'),
      (3, 6, 'Seals & Dampers', 0.0, 1.0, 6, 30, 'kg'),
      (3, 7, 'Reinforced Structural Plates', 0.0, 10.0, 7, 50, 'kg'),
      (3, 8, 'Lithium Grease Lubrication', 0.0, 0.0, 8, 25, 'kg');
    `);

    // password = password123
    await pool.query(`
      INSERT INTO users_data (username, password_hash)
      VALUES
      ('admin', '$2a$12$HiDodC.9l231aiyk6o68be/ryX6Gv0lZnhNMZrqNHjJsgm90MsNFy');
    `);

    console.log("Large gearbox added successfully!");
    console.log("test data added");
  } catch (err) {
    console.error("adding failed: ", err);
  } finally {
    await pool.end();
  }
}

addTestData();