import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Calculator.css';
import Kuva1 from './assets/Kuva1.png';
import Infobox from './Infobox';
import { CircleQuestionMark, UserCog, Database, User } from 'lucide-react';
import Papa from "papaparse";
import { Autocomplete, TextField } from "@mui/material";

/**
 * CalculatorColumn component for managing emission, cost, and social impact inputs.
 */
function CalculatorColumn({
  title = "Emission Calculator",
  columnId = "A",

  // Emission/General data props
  materialRows,
  addMaterialRow,
  removeMaterialRow,
  updateMaterialRow,
  emissionData,
  updateEmissionField,
  part_name,
  setPart_name,
  totalEmissions,
  materialsList,

  // Cost props
  materialOverheadPercent,
  setMaterialOverheadPercent,
  manufacturingOverheadPercent,
  setManufacturingOverheadPercent,
  adminPercent,
  setAdminPercent,
  salesPercent,
  setSalesPercent,
  manufacturingCost,
  setManufacturingCost,
  energyCost,
  setEnergyCost,
  usageCost,
  setUsageCost,

  // Social impact props
  socialRows,
  addSocialRow,
  removeSocialRow,
  updateSocialRow,
  totalCostOfGood,
  socialImpactScore,
  saveResult


}) {
  const isCost = title.toLowerCase().includes("cost");
  const isSocial = title.toLowerCase().includes("social");
  const isEmission = !isCost && !isSocial;

  // Local state for emission inputs
  // not used currently, kept for reference
  const [Transportation_distance, setTransportation_distance] = useState("");
  const [Efficiency_ptc, setEfficiency_ptc] = useState("");
  const [lifespan, setLifespan] = useState("");
  const [Model, setModel] = useState("");
  const [Rated_power, setRated_power] = useState("");
  const [Functional_unit, setFunctional_unit] = useState("");
  const [Operating_hours_per_year, setOperating_hours_per_year] = useState("");
  const [Electricity_grid_emission_factor, setElectricity_grid_emission_factor] = useState("");
  const [Recycle_ptc, setRecycle_ptc] = useState("");
  const [Scrap_rate_ptc, setScrap_rate_ptc] = useState("");
  const [Electricity_consumption_manufacturing, setElectricity_consumption_manufacturing] = useState("");
  const [Fuel_energy_consumption, setFuel_energy_consumption] = useState("");
  const [Manufacturing_waste, setManufacturing_waste] = useState("");
  const [Factory_location, setFactory_location] = useState("");
  const [Production_rate_ptc, setProduction_rate_ptc] = useState("");
  const [Transportation_desc, setTransportation_desc] = useState("");
  const [Transportation_type, setTransportation_type] = useState("");
  const [Transport_mass, setTransport_mass] = useState("");
  const [Average_load_factor, setAverage_load_factor] = useState("");
  const [Use_operating_hours, setUse_operating_hours] = useState("");
  const [Lubricant_replacement_interval, setLubricant_replacement_interval] = useState("");
  const [Lubricant_quantity_per_replacement, setLubricant_quantity_per_replacement] = useState("");
  const [Energy_source_type, setEnergy_source_type] = useState("");
  const [Maintanence_interval, setMaintanence_interval] = useState("");
  const [Technician_travel_distance, setTechnician_travel_distance] = useState("");
  const [Technician_transport_mode, setTechnician_transport_mode] = useState("");
  const [Lubricant_disposal_method, setLubricant_disposal_method] = useState("");
  const [Recycle_rate_ptc, setRecycle_rate_ptc] = useState("");
  const [Disposal_method, setDisposal_method] = useState("");
  const [Recycling_credit_factor, setRecycling_credit_factor] = useState("");
  const [Distance_to_disposal_site, setDistance_to_disposal_site] = useState("");
  const [Disposalsite_travel_mode, setDisposalsite_travel_mode] = useState("");
  const navigate = useNavigate();
  const goToSavedResults = (e) => {
    e.preventDefault();
    navigate('/saved-results');
  }


  return (
    <div className="CalculatorColumn" aria-label={`Calculator Column ${columnId}`}>


      {/* Emission/General Data (only for Emission column) */}
      {isEmission && (
        <div className="Emission-Wrapper">
          <h1 className="column-title">{title}</h1>
          {/* General Data */}
          <div className="General-data">
            <h2>General Data</h2>
            <table className="emission-table">
              <tbody>
                {materialRows?.map((row, idx) => (
                  <tr key={idx} className="mat-row">
                    <td>
                      <label>
                        <input
                          type="text"
                          name={`part_name_${columnId}_${idx}`}
                          placeholder="Part Name"
                          value={row.part_name || ""}
                          onChange={(e) =>
                            updateMaterialRow(idx, "part_name", e.target.value)
                          }
                        />
                      </label>
                    </td>
                    <td>
                      <Autocomplete
                        options={materialsList}
                        getOptionLabel={(option) => {
                          if (typeof option === "string") return option;
                          if (!option || typeof option !== "object") return "";
                          // Prefer material_name; fallback to material_id if name missing
                          const name = option.material_name ?? (option.material_id != null ? `Material ${option.material_id}` : "");
                          return String(name);
                        }}
                        freeSolo
                        disableClearable
                        value={row.type || ""}
                        onChange={(e, value) => {
                          console.log("Selected material object:", value);
                          updateMaterialRow(idx, "selectedMaterial", value || null);
                          updateMaterialRow(idx, "type", value?.material_name ?? (value?.material_id != null ? `Material ${value.material_id}` : ""));
                          updateMaterialRow(idx, "emission", value?.co2_per_kg || 0);
                          updateMaterialRow(idx, "cost", value?.cost_per_kg || 0);
                        }}
                        onInputChange={(e, value) => {
                          // keep type updated while typing
                          updateMaterialRow(idx, "type", value);
                          updateMaterialRow(idx, "emission", 0);
                          updateMaterialRow(idx, "cost", 0);
                        }}
                        renderOption={(props, option) => {
                          const label = (option && typeof option === 'object')
                            ? (option.material_name ?? (option.material_id != null ? `Material ${option.material_id}` : ''))
                            : String(option ?? '');
                          return (
                            <li
                              {...props}
                              key={option?.id ?? label}
                              title={(option && option.description) ? option.description : ''}
                            >
                              {label}
                            </li>
                          );
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Material Type"
                            variant="outlined"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                background: '#fff',
                                borderRadius: '6px',
                                padding: '0',
                                '& input': {
                                  padding: '8px 10px',
                                  fontSize: '0.95rem',
                                  boxSizing: 'border-box',
                                  height: '36px',

                                },
                                '& fieldset': {
                                  border: '1px solid #d9dee6',
                                },
                                '&:hover fieldset': {
                                  borderColor: '#d9dee6',
                                },
                                '&.Mui-focused fieldset': {
                                  border: '1px solid #d9dee6',
                                  boxShadow: 'none',
                                },
                              },
                              '& .MuiAutocomplete-option:hover': {
                                backgroundColor: '#40a161ff',
                              },
                            }}
                          />
                        )}
                      />
                    </td>
                    <td>
                      <label>
                        <input
                          type="text"
                          name={`material_weight_${columnId}_${idx}`}
                          placeholder="Material Weight (kg)"
                          value={row.weight}
                          onChange={(e) => {
                            updateMaterialRow(idx, "weight", e.target.value)

                            if (row.selectedMaterial) {
                              updateMaterialRow(idx, "cost", row.selectedMaterial.cost_per_kg * e.target.value);
                            }

                          }}
                        />
                      </label>
                    </td>
                    <td className="row-controls">
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => removeMaterialRow(idx)}
                      >
                        −
                      </button>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3}>
                    <button type="button" className="add-btn" onClick={addMaterialRow}>
                      + Add material
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Emission Calculator */}
          <div className="Emission-Calculator">
            <h2>Emission Calculation</h2>
            <table className="emission-table">
              <tbody>
                <h3>1. Product & General Info</h3>
                <tr>
                  <td>
                    <label>
                      <input
                        type="text"
                        name={`model_${columnId}`}
                        placeholder="Model / GearboxID"
                        value={Model}
                        onChange={(e) => { setModel(e.target.value); updateEmissionField('Model', e.target.value); }}
                      />
                    </label>
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>
                      <input
                        type="text"
                        name={`Functional_unit_${columnId}`}
                        placeholder="Functional Unit"
                        value={(emissionData?.Functional_unit) || ""}
                        onChange={(e) => updateEmissionField('Functional_unit', e.target.value)}
                      />
                    </label>
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>
                      <input
                        type="text"
                        name={`rated_power_${columnId}`}
                        placeholder="Rated Power (kW)"
                        value={(emissionData?.Rated_power) || ""}
                        onChange={(e) => updateEmissionField('Rated_power', e.target.value)}
                      />
                    </label>
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>
                      <input
                        type="text"
                        name={`efficiency_ptc_${columnId}`}
                        placeholder="Efficiency%"
                        value={(emissionData?.Efficiency_ptc) || ""}
                        onChange={(e) => updateEmissionField('Efficiency_ptc', e.target.value)}
                      />
                    </label>
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>
                      <input
                        type="text"
                        name={`operating_hours_per_year_${columnId}`}
                        placeholder="Operating Hours per Year (h/year)"
                        value={(emissionData?.Operating_hours_per_year) || ""}
                        onChange={(e) => updateEmissionField('Operating_hours_per_year', e.target.value)}
                      />
                    </label>
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>
                      <input
                        type="text"
                        name={`lifespan_${columnId}`}
                        placeholder="Lifespan (years)"
                        value={(emissionData?.lifespan) || ""}
                        onChange={(e) => updateEmissionField('lifespan', e.target.value)}
                      />
                    </label>
                  </td>
                </tr>

                <h3>2. Material & Component Data</h3>
                {materialRows?.map((row, idx) => (
                  <tr key={idx}>
                    <td>
                      <label>
                        <input
                          type="text"
                          name={`material_emission_${columnId}_${idx}`}
                          placeholder={row.type ? `${row.type} emission` : 'Material Emission'}
                          value={row.emission || ''}
                          onChange={(e) => updateMaterialRow(idx, 'emission', e.target.value)}
                        />
                      </label>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td>
                    <label>
                      <input
                        type="number"
                        name={`recycle_ptc_${columnId}`}
                        placeholder="Recycle %"
                        value={(emissionData?.Recycle_ptc) || ""}
                        onChange={(e) => updateEmissionField('Recycle_ptc', e.target.value)}
                      />
                    </label>
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>
                      <input
                        type="number"
                        name={`scrap_rate_ptc_${columnId}`}
                        placeholder="Scrap Rate %"
                        value={(emissionData?.Scrap_rate_ptc) || ""}
                        onChange={(e) => updateEmissionField('Scrap_rate_ptc', e.target.value)}
                      />
                    </label>
                  </td>
                </tr>

                <h3>3. Manufacturing Phase</h3>
                <tr>
                  <td>
                    <label>
                      <input
                        type="text"
                        name={`electricity_consumption_manufacturing_${columnId}`}
                        placeholder="Electricity Consumption"
                        value={(emissionData?.Electricity_consumption_manufacturing) || ""}
                        onChange={(e) => updateEmissionField('Electricity_consumption_manufacturing', e.target.value)}
                      />
                    </label>
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>
                      <input
                        type="text"
                        name={`fuel_energy_consumption_${columnId}`}
                        placeholder="Fuel Energy Consumption"
                        value={(emissionData?.Fuel_energy_consumption) || ""}
                        onChange={(e) => updateEmissionField('Fuel_energy_consumption', e.target.value)}
                      />
                    </label>
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>
                      <input
                        type="text"
                        name={`manufacturing_waste_${columnId}`}
                        placeholder="Manufacturing Waste"
                        value={(emissionData?.Manufacturing_waste) || ""}
                        onChange={(e) => updateEmissionField('Manufacturing_waste', e.target.value)}
                      />
                    </label>
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>
                      <input
                        type="text"
                        name={`electricity_grid_emission_factor_${columnId}`}
                        placeholder="Electricity Grid Emission Factor (kg CO2e/kWh)"
                        value={(emissionData?.Electricity_grid_emission_factor) || ""}
                        onChange={(e) => updateEmissionField('Electricity_grid_emission_factor', e.target.value)}
                      />
                    </label>
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>
                      <input
                        type="text"
                        name={`factory_location_${columnId}`}
                        placeholder="Factory Location"
                        value={(emissionData?.Factory_location) || ""}
                        onChange={(e) => updateEmissionField('Factory_location', e.target.value)}
                      />
                    </label>
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>
                      <input
                        type="text"
                        name={`production_rate_ptc_${columnId}`}
                        placeholder="Production Rate %"
                        value={(emissionData?.Production_rate_ptc) || ""}
                        onChange={(e) => updateEmissionField('Production_rate_ptc', e.target.value)}
                      />
                    </label>
                  </td>
                </tr>

                <h3>4. Transportation Phase</h3>
                <tr>
                  <td>
                    <label>
                      <input
                        type="text"
                        name={`transportation_desc_${columnId}`}
                        placeholder="Transportation Description"
                        value={(emissionData?.Transportation_desc) || ""}
                        onChange={(e) => updateEmissionField('Transportation_desc', e.target.value)}
                      />
                    </label>
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>
                      <input
                        type="text"
                        name={`transportation_distance_${columnId}`}
                        placeholder="Transportation Distance"
                        value={(emissionData?.Transportation_distance) || ""}
                        onChange={(e) => updateEmissionField('Transportation_distance', e.target.value)}
                      />
                    </label>
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>
                      <select
                        className="dropdown-menu"
                        name={`transportation_type_${columnId}`}
                        value={(emissionData?.Transportation_type) || ""}
                        onChange={(e) => updateEmissionField('Transportation_type', e.target.value)}
                      >
                        <option value="">Select Transportation Type</option>
                        <option value="truck">Truck</option>
                        <option value="ship">Ship</option>
                        <option value="train">Train</option>
                        <option value="airplane">Airplane</option>
                      </select>
                    </label>
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>
                      <input
                        type="text"
                        name={`transport_mass_${columnId}`}
                        placeholder="Transport Mass (kg)"
                        value={(emissionData?.Transport_mass) || ""}
                        onChange={(e) => updateEmissionField('Transport_mass', e.target.value)}
                      />
                    </label>
                  </td>
                </tr>

                <h3>5. Use Phase</h3>
                <tr>
                  <td>
                    <label>
                      <input
                        type="text"
                        name={`average_load_factor_${columnId}`}
                        placeholder="Average Load Factor (%)"
                        value={(emissionData?.Average_load_factor) || ""}
                        onChange={(e) => updateEmissionField('Average_load_factor', e.target.value)}
                      />
                    </label>
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>
                      <input
                        type="text"
                        name={`use_operating_hours_${columnId}`}
                        placeholder="Use Operating Hours (h)"
                        value={(emissionData?.Use_operating_hours) || ""}
                        onChange={(e) => updateEmissionField('Use_operating_hours', e.target.value)}
                      />
                    </label>
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>
                      <select
                        className="dropdown-menu"
                        name={`energy_source_type_${columnId}`}
                        value={(emissionData?.Energy_source_type) || ""}
                        onChange={(e) => updateEmissionField('Energy_source_type', e.target.value)}
                      >
                        <option value="">Select Energy Source Type</option>
                        <option value="Grid-electricity (default)">Grid-electricity</option>
                        <option value="Renewable-mix">Grid (Renewable Mix)</option>
                        <option value="diesel">Diesel</option>
                        <option value="nuclear">Nuclear</option>
                        <option value="natural_gas">Natural Gas</option>
                        <option value="gasoline">Gasoline</option>
                      </select>
                    </label>
                  </td>
                </tr>

                <h3>6. Maintanence & Replacement</h3>
                <tr>
                  <td>
                    <label>
                      <input
                        type="text"
                        name={`maintanence_interval_${columnId}`}
                        placeholder="Maintanence Interval (years)"
                        value={(emissionData?.Maintanence_interval) || ""}
                        onChange={(e) => updateEmissionField('Maintanence_interval', e.target.value)}
                      />
                    </label>
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>Replaced Parts per Interval:</label>
                    <div className="checkbox-group">
                      {materialRows.map((row, idx) => (
                        <label key={idx}>
                          <input
                            type="checkbox"
                            name={`replaced_part_${columnId}_${idx}`}
                            checked={Array.isArray(emissionData?.Replaced_part_indices) && emissionData.Replaced_part_indices.includes(idx)}
                            onChange={e => {
                              const prev = Array.isArray(emissionData?.Replaced_part_indices) ? emissionData.Replaced_part_indices : [];
                              let next;
                              if (e.target.checked) {
                                next = [...prev, idx];
                              } else {
                                next = prev.filter(i => i !== idx);
                              }
                              updateEmissionField('Replaced_part_indices', next);
                            }}
                          />
                          {row.part_name || `Part ${idx + 1}`}
                        </label>
                      ))}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>
                      <select
                        className="dropdown-menu"
                        name={`technician_transport_mode_${columnId}`}
                        value={(emissionData?.Technician_transport_mode) || ""}
                        onChange={(e) => updateEmissionField('Technician_transport_mode', e.target.value)}
                      >
                        <option value="">Select Transport Mode</option>
                        <option value="car">Car</option>
                        <option value="van">Van</option>
                        <option value="plane">Plane</option>
                        <option value="walk">Walk</option>
                      </select>
                    </label>
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>
                      <input
                        type="text"
                        name={`technician_travel_distance_${columnId}`}
                        placeholder="Technician Travel Distance (km)"
                        value={(emissionData?.Technician_travel_distance) || ""}
                        onChange={(e) => updateEmissionField('Technician_travel_distance', e.target.value)}
                      />
                    </label>
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>
                      <input
                        type="text"
                        name={`lubricant_replacement_interval_${columnId}`}
                        placeholder="Lubricant Replacement Interval (h)"
                        value={(emissionData?.Lubricant_replacement_interval) || ""}
                        onChange={(e) => updateEmissionField('Lubricant_replacement_interval', e.target.value)}
                      />
                    </label>
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>
                      <input
                        type="text"
                        name={`lubricant_quantity_per_replacement_${columnId}`}
                        placeholder="Lubricant Quantity per Replacement (kg)"
                        value={(emissionData?.Lubricant_quantity_per_replacement) || ""}
                        onChange={(e) => updateEmissionField('Lubricant_quantity_per_replacement', e.target.value)}
                      />
                    </label>
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>
                      <select
                        className="dropdown-menu"
                        name={`lubricant_disposal_method_${columnId}`}
                        value={(emissionData?.Lubricant_disposal_method) || ""}
                        onChange={(e) => updateEmissionField('Lubricant_disposal_method', e.target.value)}
                      >
                        <option value="">Select Lubricant Disposal Method</option>
                        <option value="landfill">Landfill</option>
                        <option value="incineration">Incineration</option>
                        <option value="recycling">Recycling</option>
                      </select>
                    </label>
                  </td>
                </tr>

                <h3>7. End-of-life</h3>
                <tr>
                  <td>
                    <label>
                      <input
                        type="text"
                        name={`recycle_rate_ptc_${columnId}`}
                        placeholder="Recycle Rate PTC (%)"
                        value={(emissionData?.Recycle_rate_ptc) || ""}
                        onChange={(e) => updateEmissionField('Recycle_rate_ptc', e.target.value)}
                      />
                    </label>
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>
                      <select
                        className="dropdown-menu"
                        name={`disposal_method_${columnId}`}
                        value={(emissionData?.Disposal_method) || ""}
                        onChange={(e) => updateEmissionField('Disposal_method', e.target.value)}
                      >
                        <option value="">Select Disposal Method</option>
                        <option value="landfill">Landfill</option>
                        <option value="incineration">Incineration</option>
                        <option value="recycling">Recycling</option>
                      </select>
                    </label>
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>
                      <input
                        type="text"
                        name={`recycling_credit_factor_${columnId}`}
                        placeholder="Recycling Credit Factor (kg CO2e/kg)"
                        value={(emissionData?.Recycling_credit_factor) || ""}
                        onChange={(e) => updateEmissionField('Recycling_credit_factor', e.target.value)}
                      />
                    </label>
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>
                      <input
                        type="text"
                        name={`distance_to_disposal_site_${columnId}`}
                        placeholder="Distance to Disposal Site (km)"
                        value={(emissionData?.Distance_to_disposal_site) || ""}
                        onChange={(e) => updateEmissionField('Distance_to_disposal_site', e.target.value)}
                      />
                    </label>
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>
                      <select
                        className="dropdown-menu"
                        name={`disposalsite_travel_mode_${columnId}`}
                        value={(emissionData?.Disposalsite_travel_mode) || ""}
                        onChange={(e) => updateEmissionField('Disposalsite_travel_mode', e.target.value)}
                      >
                        <option value="">Select Travel Mode</option>
                        <option value="truck">Truck</option>
                        <option value="train">Train</option>
                        <option value="ship">Ship</option>
                        <option value="plane">Plane</option>
                      </select>
                    </label>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Cost Calculation (only for Cost column) */}
      {isCost && (
        <div className="Cost-Calculator">
          <h1 className="column-title">{title}</h1>
          <table className="emission-table">
            <tbody>
              {/* Material cost inputs */}
              {materialRows?.map((row, idx) => (
                <tr key={idx}>
                  <td>
                    <input
                      type="number"
                      name={`material_cost_${columnId}_${idx}`}
                      placeholder={row.type ? `${row.type} Cost (€)` : 'Material Cost (€)'}
                      value={row.cost || ''}
                      onChange={(e) => updateMaterialRow(idx, 'cost', e.target.value)}
                    />
                  </td>
                </tr>
              ))}

              {/* Material overhead percent */}
              <tr>
                <td>
                  <input
                    type="number"
                    name="material_overhead_percent"
                    placeholder="Material Overhead (%)"
                    value={materialOverheadPercent}
                    onChange={(e) => setMaterialOverheadPercent(e.target.value)}
                  />
                </td>
              </tr>

              {/* Manufacturing cost */}
              <tr>
                <td>
                  <input
                    type="number"
                    name="manufacturing_cost"
                    placeholder="Manufacturing Cost (€)"
                    value={manufacturingCost}
                    onChange={(e) => setManufacturingCost(e.target.value)}
                  />
                </td>
              </tr>

              {/* Manufacturing overhead percent */}
              <tr>
                <td>
                  <input
                    type="number"
                    name="manufacturing_overhead_percent"
                    placeholder="Manufacturing Overhead (%)"
                    value={manufacturingOverheadPercent}
                    onChange={(e) => setManufacturingOverheadPercent(e.target.value)}
                  />
                </td>
              </tr>

              {/* Admin percent */}
              <tr>
                <td>
                  <input
                    type="number"
                    name="admin_percent"
                    placeholder="Administrative Cost (%)"
                    value={adminPercent}
                    onChange={(e) => setAdminPercent(e.target.value)}
                  />
                </td>
              </tr>

              {/* Sales percent */}
              <tr>
                <td>
                  <input
                    type="number"
                    name="sales_percent"
                    placeholder="Sales Cost (%)"
                    value={salesPercent}
                    onChange={(e) => setSalesPercent(e.target.value)}
                  />
                </td>
              </tr>

              <tr>
                <td>
                  <label>
                    <input
                      type="text"
                      name={`energy_cost_${columnId}`}
                      placeholder="Energy Cost (€)"
                      value={energyCost}
                      onChange={(e) => setEnergyCost(e.target.value)}
                    />
                  </label>
                </td>
              </tr>
              <tr>
                <td>
                  <label>
                    <input
                      type="text"
                      name={`usage_cost_${columnId}`}
                      placeholder="Usage Cost (€)"
                      value={usageCost}
                      onChange={(e) => setUsageCost(e.target.value)}
                    />
                  </label>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Social Impact (only for Social column) */}
      {isSocial && (
        <div className="Social-Wrapper">

          {/* Title inside box */}
          <h1 className="column-title">{title}</h1>

          {/* Assembly Location Section */}
          <div className="Social-Impact-Calculator">
            <h2>Assembly Location</h2>
            <table className="emission-table">
              <tbody>
                {socialRows?.map((row, idx) => (
                  <tr key={idx}>
                    <td>
                      <label>
                        <input
                          type="text"
                          name={`country_${columnId}`}
                          placeholder="Country"
                          value={socialRows[idx].country || ''}
                          onChange={(e) => updateSocialRow(idx, 'country', e.target.value)}
                        />
                      </label>
                    </td>
                    <td className="row-controls">
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => removeSocialRow(idx)}
                      >-</button>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={2}>
                    <button type="button" className="add-btn" onClick={addSocialRow}>
                      + Add country
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="result-box">
            <table>
              <tbody>
                <tr>
                  <td>
                    <h2>Gearbox results:</h2>
                    <h3>Gearbox emissions: {totalEmissions.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} kg/CO2e</h3>
                    <h3>
                      Total cost of good: {totalCostOfGood.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })} €
                    </h3>
                    <h3>Social Impact Score: {typeof socialImpactScore === 'number' ? socialImpactScore.toFixed(2) : '—'}</h3>
                    <button onClick={() => saveResult({
                      part_name,
                      totalEmissions,
                      totalCostOfGood,
                      socialImpactScore,
                    })}>
                      Save results
                    </button>
                  </td>
                </tr>
              </tbody>
              <button onClick={goToSavedResults}>Previous results</button> {/* Navigate to saved results page */}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Calculator() {
  // Shared state for cost/emission
  const [emissionData, setEmissionData] = useState({});
  const [part_name, setPart_name] = useState("");
  const [materialRows, setMaterialRows] = useState([{ type: "", weight: "", emission: "", cost: "", part_name: "", selectedMaterial: null }]);
  const [materialOverheadPercent, setMaterialOverheadPercent] = useState("");
  const [manufacturingCost, setManufacturingCost] = useState("");
  const [manufacturingOverheadPercent, setManufacturingOverheadPercent] = useState("");
  const [adminPercent, setAdminPercent] = useState("");
  const [salesPercent, setSalesPercent] = useState("");
  const [energyCost, setEnergyCost] = useState("");
  const [usageCost, setUsageCost] = useState("");
  const [materialsList, setMaterialsList] = useState([]);

  // Fetch materials and environment data on mount
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_URL || '';
        const BASE_URL = `${API_BASE}/api/v1`;
        // Fetch base materials to build id->name map
        const matsResp = await fetch(`${BASE_URL}/materials`);
        const matsJson = matsResp.ok ? await matsResp.json().catch(() => []) : [];
        const idToName = new Map();
        // Support either array of {id,name} or [{ id, name }] shape
        // use ternary to handle both possible field namings, if any missing skip
        if (Array.isArray(matsJson)) {
          matsJson.forEach((m) => {
            const id = m?.id ?? m?.material_id;
            const name = m?.name ?? m?.material_name;
            if (id && name) idToName.set(id, name);
          });
        }

        // Fetch environment data datasets
        const response = await fetch(`${BASE_URL}/environment_data`);
        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          throw new Error(`HTTP ${response.status} ${errText || ''}`.trim());
        }
        const contentType = response.headers.get('content-type') || '';
        const data = contentType.includes('application/json') ? await response.json() : [];

        // Augment each dataset with material_name from materials list
        const enriched = Array.isArray(data)
          ? data.map(d => ({
              ...d,
              material_name: d?.material_name || idToName.get(d?.material_id) || '',
            }))
          : [];
        setMaterialsList(enriched);

      } catch (error) {
        console.error('Error fetching materials:', error);
      }
    }
    fetchMaterials();
  }, []);

  // Fix: Add updateEmissionField function
  const updateEmissionField = (field, value) => {
    setEmissionData(prev => ({ ...prev, [field]: value }));
  };

  // Load CSV data on mount
  const [csvData, setCsvData] = useState([]);
  const [spiByCountry, setSpiByCountry] = useState(new Map());


  // useEffect to load CSV data once on component mount
  // using PapaParse to parse the CSV file
  // Makes a map of country name (lowercase) to SPI score for easy lookup
  useEffect(() => {
    Papa.parse('/Social-Progress-Index-2022.csv', {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data || [];
        setCsvData(rows);
        // Build a lookup map: country -> score
        const map = new Map();
        rows.forEach((r) => {
          const country = String(r.Country ?? '').trim();
          // CSV header: "Social Progress Score"
          let scoreRaw = r['Social Progress Score'];
          // normalize decimal comma to dot if present
          const score =
            typeof scoreRaw === 'string'
              ? parseFloat(scoreRaw.replace(',', '.'))
              : Number(scoreRaw);
          if (country && Number.isFinite(score)) {
            map.set(country.toLowerCase(), score);
          }
        });
        setSpiByCountry(map);
      },
    });
  }, []);

  const navigate = useNavigate();

  const saveResult = async (result) => {
    // Persist locally as a fallback
    const savedResults = JSON.parse(localStorage.getItem('savedResults') || '[]');
    const localEntry = {
      timestamp: new Date().toISOString(),
      part_name,
      materials: materialRows,
      emissionData,
      costs: {
        materialCostSum,
        materialOverheadPercent,
        manufacturingCost,
        manufacturingOverheadPercent,
        adminPercent,
        salesPercent,
        energyCost,
        usageCost,
        totalCostOfGood,
      },
      socialRows,
      // Store both original summary and detailed phase breakdown so SavedResults can render per-phase totals for local items
      results: {
        // Original incoming summary fields
        ...(result || {}),
        // Standardized breakdown matching backend column names
        materials_co2_total_kg: adjustedMaterialEmissions,
        manufacturing_co2_kg: manufacturingEmissions,
        transportation_co2_kg: transportEmissions,
        use_phase_energy_co2_kg: replacementEmissions,
        use_phase_maintenance_co2_kg: totalMaintanenceEmissions,
        end_of_life_co2_kg: endOfLifeEmissions,
        total_co2_kg: totalEmissions,
        material_cost: materialCostSum,
        manufacturing_cost: (parseFloat(manufacturingCost) || 0) + (manufacturingOverhead || 0),
        transportation_cost: undefined,
        use_phase_energy_cost: parseFloat(energyCost) || 0,
        use_phase_maintenance_cost: undefined,
        end_of_life_cost: undefined,
        total_cost: totalCostOfGood,
        currency: 'EUR',
      },
    };
    localStorage.setItem('savedResults', JSON.stringify([localEntry, ...savedResults]));

    // Compose backend payload
    const num = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    };

    // Average SPI from selected countries if available
    let average_spi;
    try {
      const scores = (socialRows || [])
        .map(r => spiByCountry.get(String(r.country || '').trim().toLowerCase()))
        .filter(v => Number.isFinite(v));
      if (scores.length) {
        average_spi = scores.reduce((a, b) => a + b, 0) / scores.length;
      }
    } catch { }

    // Build payload aligned with backend schema
    const payload = {
      gearbox: {
        name: emissionData?.Model || part_name || 'Gearbox evaluation',
        description: null,
        rated_power_kw: num(emissionData?.Rated_power),
        efficiency_percent: num(emissionData?.Efficiency_ptc),
        lifetime_years: num(emissionData?.lifespan),
        operating_hours_per_year: num(emissionData?.Operating_hours_per_year),
        electricity_emission_factor_kg_co2_per_kwh: num(emissionData?.Electricity_grid_emission_factor),
      },
      materials: (materialRows || []).map((row) => ({
        material_name: row.type || undefined,
        component_name: row.part_name || part_name || undefined,
        recycled_content_percent: num(emissionData?.Recycle_ptc),
        scrap_rate_percent: num(emissionData?.Scrap_rate_ptc),
        environment_data_id: undefined,
        mass: num(row.weight),
        unit: 'kg',
      })),
      lifecycle: {
        manufacturing: {
          electricity_consumption_kwh_per_unit: num(emissionData?.Electricity_consumption_manufacturing),
          fuel_consumption_mj_per_unit: num(emissionData?.Fuel_energy_consumption),
          fuel_type: undefined,
          manufacturing_waste_kg_per_unit: num(emissionData?.Manufacturing_waste),
          factory_location: emissionData?.Factory_location || undefined,
          description: 'Imported from Calculator',
          factory_country_code: undefined,
        },
        transportation: [{
          description: emissionData?.Transportation_desc || undefined,
          leg_description: undefined,
          distance_km: num(emissionData?.Transportation_distance),
          transport_mode: emissionData?.Transportation_type || undefined,
          transport_mass_tonnes: typeof emissionData?.Transport_mass !== 'undefined' ? num(emissionData.Transport_mass) / 1000 : undefined,
          emission_factor_kg_co2_per_tonne_km: undefined,
        }],
        use_phase: {
          operating_hours_per_year: num(emissionData?.Operating_hours_per_year),
          energy_source_type: emissionData?.Energy_source_type || undefined,
          lubricant_replacement_interval_hours: num(emissionData?.Lubricant_replacement_interval),
          lubricant_quantity_per_replacement_liters: num(emissionData?.Lubricant_quantity_per_replacement),
        },
        maintenance: {
          maintenance_interval_hours: undefined,
          maintenance_interval_years: num(emissionData?.Maintanence_interval),
          parts_replaced_per_interval_kg: undefined,
          parts_replaced_per_interval_item_count: undefined,
          emission_factor_spare_parts_kg_co2_per_kg: undefined,
          technician_travel_distance_km: num(emissionData?.Technician_travel_distance),
          service_transport_mode: emissionData?.Technician_transport_mode || undefined,
          lubricant_disposal_method: emissionData?.Lubricant_disposal_method || undefined,
        },
        end_of_life: {
          recycling_rate_percent: num(emissionData?.Recycle_rate_ptc),
          disposal_method: emissionData?.Disposal_method || undefined,
          recycling_credit_factor_kg_co2: num(emissionData?.Recycling_credit_factor),
          transport_to_recycler_km: num(emissionData?.Distance_to_disposal_site),
        },
      },
      social: { average_spi },
      // Map computed results to backend column names
      results: {
        materials_co2_total_kg: num(adjustedMaterialEmissions),
        manufacturing_co2_kg: num(manufacturingEmissions),
        transportation_co2_kg: num(transportEmissions),
        use_phase_energy_co2_kg: num(replacementEmissions),
        use_phase_maintenance_co2_kg: num(totalMaintanenceEmissions),
        end_of_life_co2_kg: num(endOfLifeEmissions),
        total_co2_kg: num(totalEmissions),
        // Basic cost breakdowns from available inputs
        material_cost: num(totalMaterialCost),
        manufacturing_cost: num((parseFloat(manufacturingCost) || 0) + (manufacturingOverhead || 0)),
        transportation_cost: undefined,
        use_phase_energy_cost: num(totalEnergyCost),
        use_phase_maintenance_cost: undefined,
        end_of_life_cost: undefined,
        total_cost: num(totalCostOfGood),
        currency: 'EUR',
      },
    };

    try {
      const resp = await fetch('/api/v1/evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const msg = await resp.text();
        console.error('Save failed:', msg);
        alert('Saving to database failed. Data saved locally.');
        return;
      }
      const data = await resp.json();
      console.log('Saved evaluation:', data);
      alert('Calculation saved successfully.');
      navigate('/saved-results');
    } catch (e) {
      console.error('Save error:', e);
      alert('Network error while saving. Data saved locally.');
    }
  }


  // Social impact rows
  const [socialRows, setSocialRows] = useState([{ country: "" }]);

  const [showInfobox, setShowInfobox] = useState(false);

  // Material row handlers
  const addMaterialRow = () => {
    setMaterialRows(prev => [...prev, { type: "", weight: "", emission: "", cost: "", part_name: "" }]);
  };
  const removeMaterialRow = (index) => {
    setMaterialRows(prev => prev.filter((_, i) => i !== index));
  };
  const updateMaterialRow = (index, field, value) => {
    setMaterialRows(prev => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  // Social impact row handlers
  const addSocialRow = () => {
    setSocialRows(prev => [...prev, { country: "" }]);
  };
  const removeSocialRow = (index) => {
    setSocialRows(prev => prev.filter((_, i) => i !== index));
  };
  const updateSocialRow = (index, field, value) => {
    setSocialRows(prev =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  // Cost calculations logic (NaN-proofed)
  const materialCostSum = materialRows.reduce((sum, row) => sum + (parseFloat(row.cost) || 0), 0);
  const materialOverhead = materialCostSum * (parseFloat(materialOverheadPercent) || 0) / 100;
  const totalMaterialCost = materialCostSum + materialOverhead;
  const manufacturingOverhead = (parseFloat(manufacturingCost) || 0) * (parseFloat(manufacturingOverheadPercent) || 0) / 100;
  const totalProductionCost = totalMaterialCost + (parseFloat(manufacturingCost) || 0) + manufacturingOverhead;
  const adminCost = totalProductionCost * (parseFloat(adminPercent) || 0) / 100;
  const salesCost = totalProductionCost * (parseFloat(salesPercent) || 0) / 100;
  const totalEnergyCost = parseFloat(energyCost) || 0;
  const totalUsageCost = parseFloat(usageCost) || 0;
  const totalCostOfGood = totalProductionCost + adminCost + salesCost + totalEnergyCost + totalUsageCost;



  // Emission calculations (NaN-proofed)
  const recycleRate = Number.isFinite(parseFloat(emissionData?.Recycle_ptc)) ? parseFloat(emissionData?.Recycle_ptc) : 0;
  const scrapRate = Number.isFinite(parseFloat(emissionData?.Scrap_rate_ptc)) ? parseFloat(emissionData?.Scrap_rate_ptc) : 0;

  // Adjusted material emissions
  const adjustedMaterialEmissions = materialRows.reduce((sum, row) => {
    const weight = Number.isFinite(parseFloat(row.weight)) ? parseFloat(row.weight) : 0;
    const emission = Number.isFinite(parseFloat(row.emission)) ? parseFloat(row.emission) : 0;
    const processedWeight = weight * (1 + scrapRate / 100);
    const nonRecycledFraction = 1 - recycleRate / 100;
    return sum + (processedWeight * emission * nonRecycledFraction);
  }, 0);

  // Manufacturing emissions
  const electricityManufacturing = Number.isFinite(parseFloat(emissionData?.Electricity_consumption_manufacturing)) ? parseFloat(emissionData?.Electricity_consumption_manufacturing) : 0;
  const fuelManufacturing = Number.isFinite(parseFloat(emissionData?.Fuel_energy_consumption)) ? parseFloat(emissionData?.Fuel_energy_consumption) : 0;
  const manufacturingWaste = Number.isFinite(parseFloat(emissionData?.Manufacturing_waste)) ? parseFloat(emissionData?.Manufacturing_waste) : 0;
  const gridEmissionFactor = Number.isFinite(parseFloat(emissionData?.Electricity_grid_emission_factor)) ? parseFloat(emissionData?.Electricity_grid_emission_factor) : 0.4;
  const fuelEmissionFactor = 0.27;
  const manufacturingEmissions =
    (electricityManufacturing * gridEmissionFactor) +
    (fuelManufacturing * fuelEmissionFactor) +
    (manufacturingWaste * 1);

  // Transport type emission factors
  const transportTypeFactors = {
    truck: 0.1,
    ship: 0.01,
    train: 0.03,
    airplane: 0.5
  };
  const transportType = typeof emissionData?.Transportation_type === 'string' ? emissionData.Transportation_type : "";
  const transportFactor = Number.isFinite(transportTypeFactors[transportType]) ? transportTypeFactors[transportType] : 0;
  const transportMass = Number.isFinite(parseFloat(emissionData?.Transport_mass)) ? parseFloat(emissionData?.Transport_mass) : 0;
  const transportDistance = Number.isFinite(parseFloat(emissionData?.Transportation_distance)) ? parseFloat(emissionData?.Transportation_distance) : 0;
  const transportEmissions = transportMass * transportDistance * transportFactor;

  // Use phase emissions
  const ratedPower = Number.isFinite(parseFloat(emissionData?.Rated_power)) ? parseFloat(emissionData?.Rated_power) : 0;
  const efficiency = Number.isFinite(parseFloat(emissionData?.Efficiency_ptc)) ? parseFloat(emissionData?.Efficiency_ptc) : 0;
  const averageLoadFactor = Number.isFinite(parseFloat(emissionData?.Average_load_factor)) ? parseFloat(emissionData?.Average_load_factor) : 0;
  const operatingHoursPerYear = Number.isFinite(parseFloat(emissionData?.Operating_hours_per_year)) ? parseFloat(emissionData?.Operating_hours_per_year) : 0;
  const input_power = ratedPower * efficiency / 100;
  const input_power_avg = input_power * (averageLoadFactor / 100);
  const power_loss = input_power_avg * (1 - (efficiency / 100));
  const annual_energy_loss = power_loss * operatingHoursPerYear;
  const energysourceTypeFactors = {
    gridelectricity: 0.4,
    renewablemix: 0.1,
    diesel: 0.27,
    nuclear: 0.012,
    natural_gas: 0.2,
    gasoline: 0.24
  };
  const energy_source_type = typeof emissionData?.Energy_source_type === 'string' ? emissionData.Energy_source_type.toLowerCase() : "";
  const gridElecFactor = Number.isFinite(parseFloat(emissionData?.gridelectricity_emission_factor)) ? parseFloat(emissionData?.gridelectricity_emission_factor) : energysourceTypeFactors[energy_source_type] || 0;
  const annual_use_emissions = annual_energy_loss * gridElecFactor;
  const lifespan_years = Number.isFinite(parseFloat(emissionData?.lifespan)) ? parseFloat(emissionData?.lifespan) : 1;
  const replacementEmissions = annual_use_emissions * lifespan_years;

  // Maintenance emissions
  const replaced_part_indices = Array.isArray(emissionData?.Replaced_part_indices) ? emissionData.Replaced_part_indices : [];
  const emission_factor_replaced_parts = replaced_part_indices.reduce((sum, idx) => {
    const row = materialRows[idx] || { emission: 0, weight: 0 };
    const emission = Number.isFinite(parseFloat(row.emission)) ? parseFloat(row.emission) : 0;
    const weight = Number.isFinite(parseFloat(row.weight)) ? parseFloat(row.weight) : 0;
    return sum + (emission * weight);
  }, 0);
  const traveltypeFactors = {
    car: 0.2,
    van: 0.3,
    plane: 0.2,
    walk: 0.0
  };
  const maintanence_interval_years = Number.isFinite(parseFloat(emissionData?.Maintanence_interval)) ? parseFloat(emissionData?.Maintanence_interval) : lifespan_years;
  const num_maintenances = Math.floor(lifespan_years / (maintanence_interval_years || 1));
  const maintanenceEmissions = emission_factor_replaced_parts * num_maintenances;

  // Technician travel emissions
  const technicianTravelDistance = Number.isFinite(parseFloat(emissionData?.Technician_travel_distance)) ? parseFloat(emissionData?.Technician_travel_distance) : 0;
  const technicianTransportMode = typeof emissionData?.Technician_transport_mode === 'string' ? emissionData.Technician_transport_mode : "";
  const technicianTravelFactor = Number.isFinite(traveltypeFactors[technicianTransportMode]) ? traveltypeFactors[technicianTransportMode] : 0;
  const technicianEmissions = technicianTravelDistance * technicianTravelFactor * num_maintenances;

  // Lubricant emissions
  const lubricantReplacementInterval = Number.isFinite(parseFloat(emissionData?.Lubricant_replacement_interval)) ? parseFloat(emissionData?.Lubricant_replacement_interval) : 1;
  const lubricantQuantityPerReplacement = Number.isFinite(parseFloat(emissionData?.Lubricant_quantity_per_replacement)) ? parseFloat(emissionData?.Lubricant_quantity_per_replacement) : 0;
  const totalOperatingHours = lifespan_years * operatingHoursPerYear;
  const numLubricantReplacements = lubricantReplacementInterval > 0 ? Math.floor(totalOperatingHours / lubricantReplacementInterval) : 0;
  const lubricantEmissionFactor = 2;
  const lubricantEmissions = numLubricantReplacements * lubricantQuantityPerReplacement * lubricantEmissionFactor;

  // Lubricant disposal emissions
  const disposalFactors = {
    landfill: 0.5,
    incineration: 1.0,
    recycling: 0.2
  };
  const lubricantDisposalMethod = typeof emissionData?.Lubricant_disposal_method === 'string' ? emissionData.Lubricant_disposal_method : "";
  const lubricantDisposalFactor = Number.isFinite(disposalFactors[lubricantDisposalMethod]) ? disposalFactors[lubricantDisposalMethod] : 0;
  const lubricantDisposalEmissions = lubricantQuantityPerReplacement * numLubricantReplacements * lubricantDisposalFactor;

  // Total maintenance emissions
  const totalMaintanenceEmissions = maintanenceEmissions + technicianEmissions + lubricantEmissions + lubricantDisposalEmissions;

  // End-of-life emissions
  const totalMass = materialRows.reduce((sum, row) => sum + (Number.isFinite(parseFloat(row.weight)) ? parseFloat(row.weight) : 0), 0);
  const recycle_rate_ptc = Number.isFinite(parseFloat(emissionData?.Recycle_rate_ptc)) ? parseFloat(emissionData?.Recycle_rate_ptc) : 0;
  const recycledMass = totalMass * recycle_rate_ptc / 100;
  const disposalMass = totalMass - recycledMass;
  const disposalMethod = typeof emissionData?.Disposal_method === 'string' ? emissionData.Disposal_method : "";
  const disposalEmissions = disposalMass * (Number.isFinite(disposalFactors[disposalMethod]) ? disposalFactors[disposalMethod] : 0);
  const recyclingCreditFactor = Number.isFinite(parseFloat(emissionData?.Recycling_credit_factor)) ? parseFloat(emissionData?.Recycling_credit_factor) : 0;
  const recyclingCredit = recycledMass * recyclingCreditFactor;
  const distanceToDisposalSite = Number.isFinite(parseFloat(emissionData?.Distance_to_disposal_site)) ? parseFloat(emissionData?.Distance_to_disposal_site) : 0;
  const transportToDisposalSite = disposalMass * distanceToDisposalSite * transportFactor;
  const endOfLifeEmissions = disposalEmissions - recyclingCredit + transportToDisposalSite;

  // Total emissions
  const totalEmissions =
    adjustedMaterialEmissions +
    transportEmissions +
    replacementEmissions +
    totalMaintanenceEmissions +
    endOfLifeEmissions +
    manufacturingEmissions;






  // Lookup SPI score(s) for selected country/countries
  const getSPI = (country) =>
    country ? spiByCountry.get(country.trim().toLowerCase()) : undefined;
  const selectedCountries = socialRows.map(r => r.country).filter(Boolean);
  const selectedScores = selectedCountries
    .map(getSPI)
    .filter((v) => typeof v === 'number');
  // If multiple countries are entered, average their scores (adjust if needed)
  const socialImpactScore =
    selectedScores.length
      ? selectedScores.reduce((a, b) => a + b, 0) / selectedScores.length
      : undefined;

  return (
    <div className="CalculatorPage three-col">
      <CalculatorColumn
        title="Emission Calculator"
        columnId="A"
        materialRows={materialRows}
        addMaterialRow={addMaterialRow}
        removeMaterialRow={removeMaterialRow}
        updateMaterialRow={updateMaterialRow}
        emissionData={emissionData}
        updateEmissionField={updateEmissionField}
        part_name={part_name}
        setPart_name={setPart_name}
        materialsList={materialsList}
      />

      <div className="Right-group">
        <CalculatorColumn
          title="Cost Calculator"
          columnId="B"
          materialRows={materialRows}
          addMaterialRow={addMaterialRow}
          removeMaterialRow={removeMaterialRow}
          updateMaterialRow={updateMaterialRow}
          materialOverheadPercent={materialOverheadPercent}
          setMaterialOverheadPercent={setMaterialOverheadPercent}
          manufacturingCost={manufacturingCost}
          setManufacturingCost={setManufacturingCost}
          manufacturingOverheadPercent={manufacturingOverheadPercent}
          setManufacturingOverheadPercent={setManufacturingOverheadPercent}
          adminPercent={adminPercent}
          setAdminPercent={setAdminPercent}
          salesPercent={salesPercent}
          setSalesPercent={setSalesPercent}
          energyCost={energyCost}
          setEnergyCost={setEnergyCost}
          usageCost={usageCost}
          setUsageCost={setUsageCost}
        />

        <CalculatorColumn
          title="Social Impact Calculator"
          columnId="C"
          socialRows={socialRows}
          addSocialRow={addSocialRow}
          removeSocialRow={removeSocialRow}
          updateSocialRow={updateSocialRow}
          totalCostOfGood={totalCostOfGood}
          totalEmissions={totalEmissions}
          socialImpactScore={socialImpactScore}
          saveResult={saveResult}
        />

      </div>
      <img src={Kuva1} alt="Logo" className="column-logo" />
      <button className='materials-button' onClick={() => navigate('/materials')} aria-label="Go to materials">
        <Database size={24} />
      </button>
      <button className='profile-button' onClick={() => navigate('/profile')} aria-label="Go to user profile">
        <UserCog size={24} />
      </button>
      <button className="info-button" onClick={() => setShowInfobox(true)} aria-label="Show info">
        <CircleQuestionMark size={24} />
      </button>
      {showInfobox && <Infobox onClose={() => setShowInfobox(false)} />}
    </div>
  );
}
