const pool = require('../database/db');

// Accepts a payload with gearbox, lifecycle, materials, social, and results
// and persists them in a single transaction. Returns created IDs and summary.
exports.createEvaluation = async (req, res) => {
	const client = await pool.connect();
	try {
		const {
			gearbox = {},
			lifecycle = {},
			materials = [],
			social = {},
			results = {},
		} = req.body || {};

		await client.query('BEGIN');

		// 1) Ensure gearbox exists or create a new one
		let gearboxId = gearbox.id;
		if (!gearboxId) {
			const {
				name = 'Gearbox evaluation',
				description = null,
				rated_power_kw = null,
				efficiency_percent = null,
				lifetime_years = null,
				operating_hours_per_year = null,
				electricity_emission_factor_kg_co2_per_kwh = null,
			} = gearbox || {};
			const { rows } = await client.query(
				`INSERT INTO gearbox (
					name, description, rated_power_kw, efficiency_percent, lifetime_years,
					operating_hours_per_year, electricity_emission_factor_kg_co2_per_kwh
				) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
				[
					name,
					description,
					rated_power_kw,
					efficiency_percent,
					lifetime_years,
					operating_hours_per_year,
					electricity_emission_factor_kg_co2_per_kwh,
				]
			);
			gearboxId = rows[0].id;
		} else {
			// Validate gearbox exists
			const existing = await client.query('SELECT id FROM gearbox WHERE id = $1', [gearboxId]);
			if (existing.rows.length === 0) {
				await client.query('ROLLBACK');
				return res.status(400).json({ error: 'Provided gearbox id does not exist' });
			}
		}

		// 2) Lifecycle data
		if (lifecycle.manufacturing) {
			const m = lifecycle.manufacturing;
			await client.query(
				`INSERT INTO manufacturing_data (
					gearbox_id,
					electricity_consumption_kwh_per_unit,
					fuel_consumption_mj_per_unit,
					fuel_type,
					manufacturing_waste_kg_per_unit,
					factory_location,
					description,
					factory_country_code
				) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
				[
					gearboxId,
					nullableNum(m.electricity_consumption_kwh_per_unit),
					nullableNum(m.fuel_consumption_mj_per_unit),
					m.fuel_type ?? null,
					nullableNum(m.manufacturing_waste_kg_per_unit),
					m.factory_location ?? null,
					m.description ?? null,
					m.factory_country_code ?? null,
				]
			);
		}

		if (Array.isArray(lifecycle.transportation)) {
			for (const t of lifecycle.transportation) {
				await client.query(
					`INSERT INTO transportation (
						gearbox_id,
						description,
						leg_description,
						distance_km,
						transport_mode,
						transport_mass_tonnes,
						emission_factor_kg_co2_per_tonne_km
					) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
					[
						gearboxId,
						t.description ?? null,
						t.leg_description ?? null,
						nullableNum(t.distance_km),
						t.transport_mode ?? null,
						nullableNum(t.transport_mass_tonnes),
						nullableNum(t.emission_factor_kg_co2_per_tonne_km),
					]
				);
			}
		}

		if (lifecycle.use_phase) {
			const u = lifecycle.use_phase;
			await client.query(
				`INSERT INTO use_phase_data (
					gearbox_id,
					operating_hours_per_year,
					energy_source_type,
					lubricant_replacement_interval_hours,
					lubricant_quantity_per_replacement_liters
				) VALUES ($1,$2,$3,$4,$5)
				ON CONFLICT (gearbox_id) DO UPDATE SET
					operating_hours_per_year = EXCLUDED.operating_hours_per_year,
					energy_source_type = EXCLUDED.energy_source_type,
					lubricant_replacement_interval_hours = EXCLUDED.lubricant_replacement_interval_hours,
					lubricant_quantity_per_replacement_liters = EXCLUDED.lubricant_quantity_per_replacement_liters`,
				[
					gearboxId,
					nullableNum(u.operating_hours_per_year),
					u.energy_source_type ?? null,
					nullableNum(u.lubricant_replacement_interval_hours),
					nullableNum(u.lubricant_quantity_per_replacement_liters),
				]
			);
		}

		if (lifecycle.maintenance) {
			const ma = lifecycle.maintenance;
			await client.query(
				`INSERT INTO maintenance_data (
					gearbox_id,
					maintenance_interval_hours,
					maintenance_interval_years,
					parts_replaced_per_interval_kg,
					parts_replaced_per_interval_item_count,
					emission_factor_spare_parts_kg_co2_per_kg,
					technician_travel_distance_km,
					service_transport_mode,
					lubricant_disposal_method
				) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
				[
					gearboxId,
					nullableNum(ma.maintenance_interval_hours),
					nullableNum(ma.maintenance_interval_years),
					nullableNum(ma.parts_replaced_per_interval_kg),
					nullableNum(ma.parts_replaced_per_interval_item_count),
					nullableNum(ma.emission_factor_spare_parts_kg_co2_per_kg),
					nullableNum(ma.technician_travel_distance_km),
					ma.service_transport_mode ?? null,
					ma.lubricant_disposal_method ?? null,
				]
			);
		}

		if (lifecycle.end_of_life) {
			const e = lifecycle.end_of_life;
			await client.query(
				`INSERT INTO end_of_life_data (
					gearbox_id,
					recycling_rate_percent,
					disposal_method,
					recycling_credit_factor_kg_co2,
					transport_to_recycler_km
				) VALUES ($1,$2,$3,$4,$5)`,
				[
					gearboxId,
					nullableNum(e.recycling_rate_percent),
					e.disposal_method ?? null,
					nullableNum(e.recycling_credit_factor_kg_co2),
					nullableNum(e.transport_to_recycler_km),
				]
			);
		}

		// 3) Materials: accept either material_id or material_name
		if (Array.isArray(materials) && materials.length) {
			for (const mat of materials) {
				let materialId = mat.material_id;
				if (!materialId && mat.material_name) {
					const found = await client.query('SELECT id FROM materials WHERE LOWER(name) = LOWER($1)', [mat.material_name]);
					if (found.rows.length) {
						materialId = found.rows[0].id;
					} else {
						const created = await client.query(
							`INSERT INTO materials (name, manually_added) VALUES ($1, true) RETURNING id`,
							[mat.material_name]
						);
						materialId = created.rows[0].id;
					}
				}

				if (!materialId) continue; // skip if we still don't have an id

				await client.query(
					`INSERT INTO gearbox_materials (
						gearbox_id,
						material_id,
						component_name,
						recycled_content_percent,
						scrap_rate_percent,
						environment_data_id,
						mass,
						unit
					) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
					[
						gearboxId,
						materialId,
						mat.component_name ?? null,
						nullableNum(mat.recycled_content_percent),
						nullableNum(mat.scrap_rate_percent),
						mat.environment_data_id ?? null,
						nullableNum(mat.mass),
						mat.unit ?? null,
					]
				);
			}
		}

		// 4) Social data
		let socialDataId = null;
		const average_spi = social?.average_spi ?? null;
		if (average_spi != null) {
			const { rows } = await client.query(
				`INSERT INTO social_data (spi) VALUES ($1) RETURNING id`,
				[nullableNum(average_spi)]
			);
			socialDataId = rows[0].id;
		}

		// 5) Evaluation results
		const {
			materials_co2_total_kg = null,
			material_cost = null,
			manufacturing_co2_kg = null,
			manufacturing_cost = null,
			transportation_co2_kg = null,
			transportation_cost = null,
			use_phase_energy_co2_kg = null,
			use_phase_energy_cost = null,
			use_phase_maintenance_co2_kg = null,
			use_phase_maintenance_cost = null,
			end_of_life_co2_kg = null,
			end_of_life_cost = null,
			total_co2_kg = null,
			total_energy_mj = null,
			total_cost = null,
			currency = null,
		} = results || {};

		const evalInsert = await client.query(
			`INSERT INTO evaluation_results (
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
			) VALUES (
				$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19
			) RETURNING id`,
			[
				gearboxId,
				nullableNum(materials_co2_total_kg),
				nullableNum(material_cost),
				nullableNum(manufacturing_co2_kg),
				nullableNum(manufacturing_cost),
				nullableNum(transportation_co2_kg),
				nullableNum(transportation_cost),
				nullableNum(use_phase_energy_co2_kg),
				nullableNum(use_phase_energy_cost),
				nullableNum(use_phase_maintenance_co2_kg),
				nullableNum(use_phase_maintenance_cost),
				nullableNum(end_of_life_co2_kg),
				nullableNum(end_of_life_cost),
				nullableNum(total_co2_kg),
				nullableNum(total_energy_mj),
				nullableNum(total_cost),
				currency ?? null,
				nullableNum(average_spi),
				socialDataId,
			]
		);

		// Store full input payload as JSONB for later viewing (adds column if missing)
		try {
			await client.query('ALTER TABLE evaluation_results ADD COLUMN IF NOT EXISTS payload_json JSONB');
			await client.query('UPDATE evaluation_results SET payload_json = $1 WHERE id = $2', [
				{ gearbox, lifecycle, materials, social, results },
				evalInsert.rows[0].id,
			]);
		} catch (jsonErr) {
			console.warn('Could not persist payload_json:', jsonErr.message);
		}

		await client.query('COMMIT');
		return res.status(201).json({
			message: 'Evaluation saved',
			gearbox_id: gearboxId,
			evaluation_id: evalInsert.rows[0].id,
			social_data_id: socialDataId,
		});
	} catch (err) {
		await client.query('ROLLBACK');
		console.error('Error saving evaluation:', err);
		return res.status(500).json({ error: 'database error' });
	} finally {
		client.release();
	}
};

function nullableNum(v) {
	if (v === '' || v === null || typeof v === 'undefined') return null;
	const n = Number(v);
	return Number.isFinite(n) ? n : null;
}

// List all evaluation results (basic fields)
exports.getEvaluations = async (req, res) => {
	try {
		const { rows } = await pool.query(`
			SELECT er.*, g.name AS gearbox_name
			FROM evaluation_results er
			LEFT JOIN gearbox g ON er.gearbox_id = g.id
			ORDER BY er.id DESC`);
		res.json(rows);
	} catch (err) {
		console.error('Error fetching evaluations:', err);
		res.status(500).json({ error: 'database error' });
	}
};

// Get a single evaluation with joins
exports.getEvaluationById = async (req, res) => {
	try {
		const { id } = req.params;
		const { rows } = await pool.query(`
			SELECT er.*, g.name AS gearbox_name
			FROM evaluation_results er
			LEFT JOIN gearbox g ON er.gearbox_id = g.id
			WHERE er.id = $1`, [id]);
		if (!rows.length) {
			return res.status(404).json({ error: 'Evaluation not found' });
		}
		const row = rows[0];
		// If payload_json exists, expand lifecycle/materials convenience keys for simpler frontend usage
		if (row.payload_json) {
			try {
				const p = typeof row.payload_json === 'string' ? JSON.parse(row.payload_json) : row.payload_json;
				row.lifecycle = p.lifecycle || null;
				row.materials_payload = p.materials || [];
				row.gearbox_payload = p.gearbox || null;
				row.social_payload = p.social || null;
				row.results_payload = p.results || null;
			} catch (e) {
				console.warn('Failed to parse payload_json for evaluation', id, e.message);
			}
		}
		res.json(row);
	} catch (err) {
		console.error('Error fetching evaluation by id:', err);
		res.status(500).json({ error: 'database error' });
	}
};

// Get all evaluations for a gearbox id
exports.getEvaluationsByGearboxId = async (req, res) => {
	try {
		const { gearbox_id } = req.params;
		const { rows } = await pool.query(`
			SELECT er.*, g.name AS gearbox_name
			FROM evaluation_results er
			JOIN gearbox g ON er.gearbox_id = g.id
			WHERE er.gearbox_id = $1
			ORDER BY er.id DESC`, [gearbox_id]);
		res.json(rows);
	} catch (err) {
		console.error('Error fetching evaluations by gearbox id:', err);
		res.status(500).json({ error: 'database error' });
	}
};

// Get a full structured payload for an evaluation by id by joining normalized tables
exports.getEvaluationFull = async (req, res) => {
	try {
		const { id } = req.params;
		const evalRows = await pool.query(`
			SELECT er.*,
						 g.name AS gearbox_name,
						 g.description AS g_description,
						 g.rated_power_kw AS g_rated_power_kw,
						 g.efficiency_percent AS g_efficiency_percent,
						 g.lifetime_years AS g_lifetime_years,
						 g.operating_hours_per_year AS g_operating_hours_per_year,
						 g.electricity_emission_factor_kg_co2_per_kwh AS g_emission_factor
			FROM evaluation_results er
			JOIN gearbox g ON er.gearbox_id = g.id
			WHERE er.id = $1
		`, [id]);
		if (!evalRows.rows.length) {
			return res.status(404).json({ error: 'Evaluation not found' });
		}
		const er = evalRows.rows[0];
		const gearboxId = er.gearbox_id;

		// Gearbox fields
		const gearbox = {
			id: gearboxId,
			name: er.gearbox_name || null,
			description: er.g_description || null,
			rated_power_kw: er.g_rated_power_kw || null,
			efficiency_percent: er.g_efficiency_percent || null,
			lifetime_years: er.g_lifetime_years || null,
			operating_hours_per_year: er.g_operating_hours_per_year || null,
			electricity_emission_factor_kg_co2_per_kwh: er.g_emission_factor || null,
		};

		// Lifecycle pieces
		const manufacturingQ = await pool.query(`SELECT * FROM manufacturing_data WHERE gearbox_id = $1 ORDER BY id DESC LIMIT 1`, [gearboxId]);
		const useQ = await pool.query(`SELECT * FROM use_phase_data WHERE gearbox_id = $1`, [gearboxId]);
		const maintenanceQ = await pool.query(`SELECT * FROM maintenance_data WHERE gearbox_id = $1 ORDER BY id DESC LIMIT 1`, [gearboxId]);
		const eolQ = await pool.query(`SELECT * FROM end_of_life_data WHERE gearbox_id = $1 ORDER BY id DESC LIMIT 1`, [gearboxId]);
		const transportQ = await pool.query(`SELECT * FROM transportation WHERE gearbox_id = $1 ORDER BY id ASC`, [gearboxId]);

		const lifecycle = {
			manufacturing: manufacturingQ.rows[0] ? {
				electricity_consumption_kwh_per_unit: manufacturingQ.rows[0].electricity_consumption_kwh_per_unit,
				fuel_consumption_mj_per_unit: manufacturingQ.rows[0].fuel_consumption_mj_per_unit,
				fuel_type: manufacturingQ.rows[0].fuel_type,
				manufacturing_waste_kg_per_unit: manufacturingQ.rows[0].manufacturing_waste_kg_per_unit,
				factory_location: manufacturingQ.rows[0].factory_location,
				description: manufacturingQ.rows[0].description,
				factory_country_code: manufacturingQ.rows[0].factory_country_code,
			} : null,
			transportation: transportQ.rows.map(r => ({
				description: r.description,
				leg_description: r.leg_description,
				distance_km: r.distance_km,
				transport_mode: r.transport_mode,
				transport_mass_tonnes: r.transport_mass_tonnes,
				emission_factor_kg_co2_per_tonne_km: r.emission_factor_kg_co2_per_tonne_km,
			})),
			use_phase: useQ.rows[0] ? {
				operating_hours_per_year: useQ.rows[0].operating_hours_per_year,
				energy_source_type: useQ.rows[0].energy_source_type,
				lubricant_replacement_interval_hours: useQ.rows[0].lubricant_replacement_interval_hours,
				lubricant_quantity_per_replacement_liters: useQ.rows[0].lubricant_quantity_per_replacement_liters,
			} : null,
			maintenance: maintenanceQ.rows[0] ? {
				maintenance_interval_hours: maintenanceQ.rows[0].maintenance_interval_hours,
				maintenance_interval_years: maintenanceQ.rows[0].maintenance_interval_years,
				parts_replaced_per_interval_kg: maintenanceQ.rows[0].parts_replaced_per_interval_kg,
				parts_replaced_per_interval_item_count: maintenanceQ.rows[0].parts_replaced_per_interval_item_count,
				emission_factor_spare_parts_kg_co2_per_kg: maintenanceQ.rows[0].emission_factor_spare_parts_kg_co2_per_kg,
				technician_travel_distance_km: maintenanceQ.rows[0].technician_travel_distance_km,
				service_transport_mode: maintenanceQ.rows[0].service_transport_mode,
				lubricant_disposal_method: maintenanceQ.rows[0].lubricant_disposal_method,
			} : null,
			end_of_life: eolQ.rows[0] ? {
				recycling_rate_percent: eolQ.rows[0].recycling_rate_percent,
				disposal_method: eolQ.rows[0].disposal_method,
				recycling_credit_factor_kg_co2: eolQ.rows[0].recycling_credit_factor_kg_co2,
				transport_to_recycler_km: eolQ.rows[0].transport_to_recycler_km,
			} : null,
		};

		// Materials
		const matsQ = await pool.query(`
			SELECT gm.*, m.name AS material_name
			FROM gearbox_materials gm
			LEFT JOIN materials m ON gm.material_id = m.id
			WHERE gm.gearbox_id = $1
			ORDER BY gm.id ASC
		`, [gearboxId]);
		const materials = matsQ.rows.map(r => ({
			material_id: r.material_id,
			material_name: r.material_name,
			component_name: r.component_name,
			recycled_content_percent: r.recycled_content_percent,
			scrap_rate_percent: r.scrap_rate_percent,
			environment_data_id: r.environment_data_id,
			mass: r.mass,
			unit: r.unit,
		}));

		// Social
		let social = {};
		if (er.social_data_id) {
			const sQ = await pool.query(`SELECT spi FROM social_data WHERE id = $1`, [er.social_data_id]);
			if (sQ.rows.length) social.average_spi = sQ.rows[0].spi;
		} else if (er.average_spi != null) {
			social.average_spi = er.average_spi;
		}

		// Results (from evaluation_results row)
		const results = {
			materials_co2_total_kg: er.materials_co2_total_kg,
			material_cost: er.material_cost,
			manufacturing_co2_kg: er.manufacturing_co2_kg,
			manufacturing_cost: er.manufacturing_cost,
			transportation_co2_kg: er.transportation_co2_kg,
			transportation_cost: er.transportation_cost,
			use_phase_energy_co2_kg: er.use_phase_energy_co2_kg,
			use_phase_energy_cost: er.use_phase_energy_cost,
			use_phase_maintenance_co2_kg: er.use_phase_maintenance_co2_kg,
			use_phase_maintenance_cost: er.use_phase_maintenance_cost,
			end_of_life_co2_kg: er.end_of_life_co2_kg,
			end_of_life_cost: er.end_of_life_cost,
			total_co2_kg: er.total_co2_kg,
			total_energy_mj: er.total_energy_mj,
			total_cost: er.total_cost,
			currency: er.currency,
			average_spi: er.average_spi,
		};

		return res.json({ gearbox, lifecycle, materials, social, results });
	} catch (err) {
		console.error('Error building full evaluation payload:', err);
		res.status(500).json({ error: 'database error' });
	}
};
// Delete an evaluation by id. If its gearbox becomes orphaned, remove related lifecycle and gearbox rows.
exports.deleteEvaluation = async (req, res) => {
	const client = await pool.connect();
	try {
		const { id } = req.params;
		await client.query('BEGIN');
		const evalRes = await client.query('SELECT id, gearbox_id, social_data_id FROM evaluation_results WHERE id = $1', [id]);
		if (!evalRes.rows.length) {
			await client.query('ROLLBACK');
			return res.status(404).json({ error: 'Evaluation not found' });
		}
		const { gearbox_id, social_data_id } = evalRes.rows[0];

		// Delete evaluation row
		await client.query('DELETE FROM evaluation_results WHERE id = $1', [id]);
		// Delete social data if present and not referenced elsewhere (simple approach: delete directly)
		if (social_data_id) {
			await client.query('DELETE FROM social_data WHERE id = $1', [social_data_id]);
		}

		// Check if gearbox still referenced by other evaluations
		const refCheck = await client.query('SELECT COUNT(*)::int AS cnt FROM evaluation_results WHERE gearbox_id = $1', [gearbox_id]);
		const stillUsed = refCheck.rows[0].cnt > 0;
		let gearboxDeleted = false;
		if (!stillUsed) {
			// Remove dependent lifecycle/material rows then gearbox
			const tables = [
				'transportation',
				'manufacturing_data',
				'use_phase_data',
				'maintenance_data',
				'end_of_life_data',
				'gearbox_materials'
			];
			for (const t of tables) {
				await client.query(`DELETE FROM ${t} WHERE gearbox_id = $1`, [gearbox_id]);
			}
			await client.query('DELETE FROM gearbox WHERE id = $1', [gearbox_id]);
			gearboxDeleted = true;
		}

		await client.query('COMMIT');
		return res.json({ message: 'Evaluation deleted', evaluation_id: id, gearbox_id, gearbox_deleted: gearboxDeleted });
	} catch (err) {
		await client.query('ROLLBACK');
		console.error('Error deleting evaluation:', err);
		return res.status(500).json({ error: 'database error' });
	} finally {
		client.release();
	}
};

// Patch/update an evaluation: update payload_json and optional top-level totals/costs
exports.updateEvaluation = async (req, res) => {
	const client = await pool.connect();
	try {
		const { id } = req.params;
		const { payload_json } = req.body || {};
		if (!id) return res.status(400).json({ error: 'Missing id' });
		const evalQ = await client.query('SELECT id FROM evaluation_results WHERE id = $1', [id]);
		if (!evalQ.rows.length) return res.status(404).json({ error: 'Evaluation not found' });

		await client.query('BEGIN');
		// Update payload_json if provided
		if (payload_json) {
			await client.query('ALTER TABLE evaluation_results ADD COLUMN IF NOT EXISTS payload_json JSONB');
			await client.query('UPDATE evaluation_results SET payload_json = $1 WHERE id = $2', [payload_json, id]);
			// If results are embedded in payload_json, also reflect key totals in columns
			const results = typeof payload_json === 'object' ? payload_json.results || {} : {};
			const columns = {
				total_co2_kg: results.total_co2_kg,
				total_cost: results.total_cost,
				materials_co2_total_kg: results.materials_co2_total_kg,
				manufacturing_co2_kg: results.manufacturing_co2_kg,
				transportation_co2_kg: results.transportation_co2_kg,
				use_phase_energy_co2_kg: results.use_phase_energy_co2_kg,
				use_phase_maintenance_co2_kg: results.use_phase_maintenance_co2_kg,
				end_of_life_co2_kg: results.end_of_life_co2_kg,
				material_cost: results.material_cost,
				manufacturing_cost: results.manufacturing_cost,
				use_phase_energy_cost: results.use_phase_energy_cost,
				currency: results.currency,
				average_spi: results.average_spi,
			};
			// Build dynamic SET clause for provided finite numbers/strings
			const sets = [];
			const values = [];
			let idx = 1;
			for (const [key, val] of Object.entries(columns)) {
				if (typeof val === 'number' && Number.isFinite(val)) {
					sets.push(`${key} = $${idx}`);
					values.push(val);
					idx++;
				} else if (typeof val === 'string' && val.length) {
					sets.push(`${key} = $${idx}`);
					values.push(val);
					idx++;
				}
			}
			if (sets.length) {
				values.push(id);
				await client.query(`UPDATE evaluation_results SET ${sets.join(', ')} WHERE id = $${idx}`, values);
			}
		}

		await client.query('COMMIT');
		return res.json({ message: 'Evaluation updated', id });
	} catch (err) {
		await client.query('ROLLBACK');
		console.error('Error updating evaluation:', err);
		return res.status(500).json({ error: 'database error' });
	} finally {
		client.release();
	}
};
