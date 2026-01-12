import React, { useEffect, useState, useRef } from 'react';
import './SavedResults.css';
import { useNavigate } from 'react-router-dom';
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import { Pie} from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend);

ChartJS.register(ArcElement, Tooltip, Legend);

export default function SavedResults() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selected, setSelected] = useState(null);
    const [editing, setEditing] = useState(null);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                setLoading(true);
                setError(null);
                // Try backend first
                const res = await fetch('/api/v1/evaluation');
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                if (!cancelled) setItems(Array.isArray(data) ? data : []);
            } catch (e) {
                // Fallback to localStorage snapshot
                console.warn('Falling back to local savedResults:', e?.message || e);
                const local = JSON.parse(localStorage.getItem('savedResults') || '[]');
                if (!cancelled) setItems(local);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, []);

    const goToCalculator = (e) => {
        e.preventDefault();
        navigate('/');
    };


    const deleteResult = async (item, index) => {
        const confirmed = window.confirm('Delete this evaluation and possibly its gearbox?');
        if (!confirmed) return;
        const isApi = Object.prototype.hasOwnProperty.call(item, 'id') && Object.prototype.hasOwnProperty.call(item, 'gearbox_id');
        if (isApi) {
            try {
                const resp = await fetch(`/api/v1/evaluation/${item.id}`, { method: 'DELETE' });
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            } catch (e) {
                alert(`Failed to delete evaluation: ${e?.message || e}`);
                return;
            }
        }
        setItems(prev => prev.filter((_, i) => i !== index));
        if (!isApi) {
            // Update localStorage for local items
            const current = JSON.parse(localStorage.getItem('savedResults') || '[]');
            current.splice(index, 1);
            localStorage.setItem('savedResults', JSON.stringify(current));
        }
    };

    return (
        <div style={{ padding: 16 }}>
            <div style={{ marginBottom: 12 }}>
                <button onClick={goToCalculator}>Back to Calculator</button>

            </div>

            <h2>Saved Results</h2>
            {loading && <p>Loading…</p>}
            {error && <p style={{ color: 'red' }}>{String(error)}</p>}

            {!loading && items.length === 0 && (
                <p>No saved results yet.</p>
            )}

            {!loading && items.length > 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '6px' }}>Model</th>
                            <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd', padding: '6px' }}>Total CO2 (kg)</th>
                            <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd', padding: '6px' }}>Total Cost</th>
                            <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd', padding: '6px' }}>Social Impact Score</th>
                            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '6px' }}>Source</th>
                            <th style={{ textAlign: 'center', borderBottom: '1px solid #ddd', padding: '6px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((it, idx) => {
                            // Determine if item is from API or localStorage
                            const isApi = Object.prototype.hasOwnProperty.call(it, 'id') && Object.prototype.hasOwnProperty.call(it, 'gearbox_id');
                            const modelName = isApi
                                ? (it.payload_json?.gearbox?.name || it.gearbox_name || `Gearbox ${it.gearbox_id}`)
                                : (it.payload_json?.gearbox?.name || it.emissionData?.Model || it.part_name || '—');
                            const co2Raw = isApi
                                ? (it.payload_json?.results?.total_co2_kg ?? it.total_co2_kg)
                                : (it?.payload_json?.results?.total_co2_kg ?? it?.results?.totalEmissions);
                            const costRaw = isApi
                                ? (it.payload_json?.results?.total_cost ?? it.total_cost)
                                : (it?.payload_json?.results?.total_cost ?? (it?.costs?.totalCostOfGood || it?.results?.totalCostOfGood));
                            const co2 = typeof co2Raw === 'string' ? parseFloat(co2Raw) : co2Raw;
                            // Checks for Social Impact Score in both API and local formats
                            const spi = isApi ? it.average_spi : (it?.results?.socialImpactScore || it?.socialImpactScore);
                            const cost = typeof costRaw === 'string' ? parseFloat(costRaw) : costRaw;
                            const currency = isApi ? (it.currency || 'EUR') : 'EUR';

                            return (
                                <tr key={idx}>
                                    <td style={{ borderBottom: '1px solid #eee', padding: '6px' }}>{modelName}</td>
                                    <td style={{ borderBottom: '1px solid #eee', padding: '6px', textAlign: 'right' }}>
                                        {typeof co2 === 'number' ? co2.toFixed(2) : '—'}
                                    </td>
                                    <td style={{ borderBottom: '1px solid #eee', padding: '6px', textAlign: 'right' }}>
                                        {typeof cost === 'number' ? `${cost.toFixed(2)} ${currency}` : '—'}
                                    </td>
                                    <td style={{ borderBottom: '1px solid #eee', padding: '6px' }}>{typeof spi === 'number' ? spi.toFixed(2) : (spi ?? '—')}</td>
                                    <td style={{ borderBottom: '1px solid #eee', padding: '6px' }}>{isApi ? 'database' : 'local'}</td>
                                    <td style={{ borderBottom: '1px solid #eee', padding: '6px', textAlign: 'center' }}>
                                        <button onClick={() => { setSelected(it); setEditing(null); }}>View</button>
                                        {selected === it && (
                                            <button style={{ marginLeft: 8 }} onClick={() => setSelected(null)}>Close</button>
                                        )}
                                        <button style={{ marginLeft: 8 }} onClick={() => deleteResult(it, idx)}>Delete</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
                        {selected && (
                            <DetailedView selected={selected} onClose={() => setSelected(null)} setItems={setItems}
                                key={selected.id || selected.timestamp || Math.random()}
                            />
                        )}
        </div>
    );
}

// Helper component to render detailed structured view
function DetailedView({ selected, onClose, setItems}) {
    const isApi = Object.prototype.hasOwnProperty.call(selected, 'id') && Object.prototype.hasOwnProperty.call(selected, 'gearbox_id');
    const [fullPayload, setFullPayload] = useState(null);
    const [loadingFull, setLoadingFull] = useState(false);
    useEffect(() => {
        let cancelled = false;
        async function loadFull() {
            if (!isApi || selected.payload_json) return;
            try {
                setLoadingFull(true);
                const res = await fetch(`/api/v1/evaluation/${selected.id}/full`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                if (!cancelled) setFullPayload(data);
            } catch (e) {
                console.warn('Failed to fetch full evaluation payload:', e?.message || e);
            } finally {
                if (!cancelled) setLoadingFull(false);
            }
        }
        loadFull();
        return () => { cancelled = true; };
    }, [isApi, selected.id, selected.payload_json]);
    const co2Raw = isApi
        ? ((selected.payload_json?.results?.total_co2_kg) ?? selected.total_co2_kg)
        : (selected?.payload_json?.results?.total_co2_kg ?? selected?.results?.totalEmissions);
    const costRaw = isApi
        ? ((selected.payload_json?.results?.total_cost) ?? selected.total_cost)
        : (selected?.payload_json?.results?.total_cost ?? selected?.costs?.totalCostOfGood ?? selected?.results?.totalCostOfGood);
    const co2 = typeof co2Raw === 'string' ? parseFloat(co2Raw) : co2Raw;
    const cost = typeof costRaw === 'string' ? parseFloat(costRaw) : costRaw;
    const currency = isApi ? (selected.currency || 'EUR') : 'EUR';
    // Normalize fullPayload if backend returned flat evaluation row (no nested structure)
    const normalizedFull = (() => {
        if (!fullPayload) return null;
        if (fullPayload.gearbox) return fullPayload; // already structured
        // Build minimal nested structure from flat row
        return {
            gearbox: {
                id: fullPayload.gearbox_id,
                name: fullPayload.gearbox_name,
                rated_power_kw: fullPayload.g_rated_power_kw || fullPayload.rated_power_kw,
                efficiency_percent: fullPayload.g_efficiency_percent || fullPayload.efficiency_percent,
                lifetime_years: fullPayload.g_lifetime_years || fullPayload.lifetime_years,
                operating_hours_per_year: fullPayload.g_operating_hours_per_year || fullPayload.operating_hours_per_year,
                electricity_emission_factor_kg_co2_per_kwh: fullPayload.g_emission_factor || fullPayload.electricity_emission_factor_kg_co2_per_kwh,
            },
            lifecycle: {},
            materials: [],
            social: { average_spi: fullPayload.average_spi },
            results: {
                total_co2_kg: fullPayload.total_co2_kg,
                total_cost: fullPayload.total_cost,
                currency: fullPayload.currency,
                average_spi: fullPayload.average_spi
            }
        };
    })();
    const payload = selected.payload_json || normalizedFull || {
        gearbox: {
            name: selected.emissionData?.Model || selected.part_name,
            rated_power_kw: selected.emissionData?.Rated_power,
            efficiency_percent: selected.emissionData?.Efficiency_ptc,
            lifetime_years: selected.emissionData?.lifespan,
            operating_hours_per_year: selected.emissionData?.Operating_hours_per_year,
            electricity_emission_factor_kg_co2_per_kwh: selected.emissionData?.Electricity_grid_emission_factor,
        },
        emissionData: selected.emissionData,
        materials: selected.materials,
        social: { average_spi: selected.socialImpactScore || selected.results?.socialImpactScore },
        results: selected.results || {
            total_co2_kg: selected.total_co2_kg,
            total_cost: selected.total_cost,
        }
    };

    const ed = payload.emissionData || {};
    const materials = payload.materials || [];
    const results = payload.results || {};
    const gearbox = payload.gearbox || {};
    const social = payload.social || {};
    const lifecycle = payload.lifecycle || {};
    const manufacturing = lifecycle.manufacturing || {};
    const transportation = Array.isArray(lifecycle.transportation) ? lifecycle.transportation[0] || {} : (lifecycle.transportation || {});
    const use_phase = lifecycle.use_phase || {};
    const maintenance = lifecycle.maintenance || {};
    const end_of_life = lifecycle.end_of_life || {};


    const field = (labelText, value, nameOverride) => {
        const missingVal = value === undefined || value === null || value === '' || value === "";
        return (
            <div className="row" key={labelText}>
                <div className="label">{labelText}</div>
                <div className={missingVal ? 'missing' : 'value'}>{missingVal ? 'value missing' : String(value)}</div>
                <input type="text" name={nameOverride || labelText} placeholder={missingVal ? '' : String(value)} defaultValue={missingVal ? '' : String(value)} />
            </div>
        );
    };

    const fieldConstants = (labelText, value) => {
        const missingVal = value === undefined || value === null || value === '' || value === "";
        return (
            <div className="row" key={labelText}>
                <div className="label">{labelText}</div>
                <div className={missingVal ? 'missing' : 'value'}>{missingVal ? 'value missing' : String(value)}</div>
            </div>
        );
    };

    // Field variant: display formatted text (€, %) but keep input default as raw numeric
    const fieldWithRaw = (labelText, displayValue, rawDefault, nameOverride) => {
        const dispMissing = displayValue === undefined || displayValue === null || displayValue === '' || displayValue === "";
        const rawMissing = rawDefault === undefined || rawDefault === null || rawDefault === '' || rawDefault === "";
        return (
            <div className="row" key={labelText}>
                <div className="label">{labelText}</div>
                <div className={dispMissing ? 'missing' : 'value'}>{dispMissing ? 'value missing' : String(displayValue)}</div>
                <input
                    type="text"
                    name={nameOverride || labelText}
                    placeholder={rawMissing ? '' : String(rawDefault)}
                    defaultValue={rawMissing ? '' : String(rawDefault)}
                />
            </div>
        );
    };

    const fieldSelect = (labelText, value, options, nameOverride) => {
        // Provide safe fallback options if none passed
        let fallbackOptions = Array.isArray(options) ? options.slice() : [];
        if (fallbackOptions.length === 0) {
            if (labelText === 'Mode') {
                fallbackOptions = ['Truck', 'Ship', 'Airplane', 'Train'];
            } else if (labelText === 'Energy Source Type') {
                fallbackOptions = ['Electricity', 'Diesel', 'Natural Gas', 'Renewable', 'Hybrid'];
            }
        }
        const displayValue = value === undefined || value === null ? '' : String(value);
        // Ensure current value appears in list so it stays selected
        if (displayValue && !fallbackOptions.includes(displayValue)) {
            fallbackOptions.unshift(displayValue);
        }
        return (
            <div className="row" key={labelText}>
                <div className="label">{labelText}</div>
                <div className="value">{displayValue || 'value missing'}</div>
                <select name={nameOverride || labelText} defaultValue={displayValue}>
                    {fallbackOptions.map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                    ))}
                </select>
            </div>
        );
    };

        const updateResults = async () => {
        if (!selected) return;
        // Determine if selected is from database or localStorage
        const isApi = Object.prototype.hasOwnProperty.call(selected, 'id') && Object.prototype.hasOwnProperty.call(selected, 'gearbox_id');
        // Collect updated values from the visible DetailedView inputs
        const panel = document.querySelector('.panel');
        const inputs = panel ? panel.querySelectorAll('.row input[type="text"]') : [];
        const selects = panel ? panel.querySelectorAll('.row select') : [];
        const updates = {};
        inputs.forEach((inp) => {
            const label = inp.getAttribute('name');
            const val = inp.value;
            if (label && String(val).trim() !== '') updates[label] = val;
        });
        selects.forEach((sel) => {
            const label = sel.getAttribute('name');
            const val = sel.value;
            if (label && val !== '') updates[label] = val;
        });

        // Map labels to payload paths for gearbox, materials, and emissionData
        const mapToPayload = (payload) => {
            const next = JSON.parse(JSON.stringify(payload || {}));
            next.gearbox = next.gearbox || {};
            next.emissionData = next.emissionData || {};
            const toNum = (v) => {
                if (typeof v === 'number') return v;
                if (typeof v === 'string') {
                    const cleaned = v.replace(/[^0-9.+\-]/g, '');
                    if (!cleaned.trim()) return undefined;
                    const n = parseFloat(cleaned);
                    return Number.isFinite(n) ? n : undefined;
                }
                return undefined;
            };
            // Prefer the list we are displaying: payload.materials, else fallback to selected.materials
            const materialsDisplay = (Array.isArray(materials) && materials.length > 0) ? materials : (Array.isArray(selected.materials) ? selected.materials : []);
            // Gearbox fields
            if ('Model / Name' in updates) next.gearbox.name = updates['Model / Name'];
            if ('Rated Power (kW)' in updates) next.gearbox.rated_power_kw = updates['Rated Power (kW)'];
            if ('Efficiency (%)' in updates) next.gearbox.efficiency_percent = updates['Efficiency (%)'];
            if ('Lifetime (years)' in updates) next.gearbox.lifetime_years = updates['Lifetime (years)'];
            if ('Operating Hours / Year' in updates) next.gearbox.operating_hours_per_year = updates['Operating Hours / Year'];
            if ('Electricity Emission Factor (kg CO2/kWh)' in updates) next.gearbox.electricity_emission_factor_kg_co2_per_kwh = updates['Electricity Emission Factor (kg CO2/kWh)'];
            if ('Functional Unit' in updates) next.emissionData.Functional_unit = updates['Functional Unit'];
            // Material fields
            if (!Array.isArray(next.materials)) {
                // Clone existing displayed materials so we can mutate safely
                next.materials = materialsDisplay.map(m => ({ ...m }));
            }
            materialsDisplay.forEach((m, i) => {
                const baseIdx = i;
                const target = next.materials[baseIdx] || (next.materials[baseIdx] = {});
                const compKey = `Component Name [${i}]`;
                const matKey = `Material Name [${i}]`;
                const massKey = `Mass (kg) [${i}]`;
                const recKey = `Recycled Content % [${i}]`;
                const scrapKey = `Scrap Rate % [${i}]`;
                const efKey = `Emission Factor (kg CO2/kg) [${i}]`;
                if (compKey in updates) { target.component_name = updates[compKey]; target.part_name = updates[compKey]; }
                if (matKey in updates) target.material_name = updates[matKey];
                if (massKey in updates) {
                    // Source data sometimes uses weight; set both
                    target.mass = updates[massKey];
                    target.weight = updates[massKey];
                }
                if (recKey in updates) target.recycled_content_percent = updates[recKey];
                if (scrapKey in updates) target.scrap_rate_percent = updates[scrapKey];
                if (efKey in updates) target.emission = updates[efKey];
            });
            // Manufacturing fields
            if ('Electricity Consumption (kWh/unit)' in updates) next.emissionData.Electricity_consumption_manufacturing = updates['Electricity Consumption (kWh/unit)'];
            if ('Fuel Energy Consumption (MJ/unit)' in updates) next.emissionData.Fuel_energy_consumption = updates['Fuel Energy Consumption (MJ/unit)'];
            if ('Manufacturing Waste (kg/unit)' in updates) next.emissionData.Manufacturing_waste = updates['Manufacturing Waste (kg/unit)'];
            if ('Factory Location' in updates) next.emissionData.Factory_location = updates['Factory Location'];
            if ('Production Rate %' in updates) next.emissionData.Production_rate_ptc = updates['Production Rate %'];

            // Transportation fields
            if ('Description' in updates) next.emissionData.Transportation_desc = updates['Description'];
            if ('Distance (km)' in updates) next.emissionData.Transportation_distance = updates['Distance (km)'];
            if ('Mode' in updates) next.emissionData.Transportation_type = updates['Mode'];
            if ('Mass (kg)' in updates) next.emissionData.Transport_mass = updates['Mass (kg)'];
            // Use Phase fields
            if ('Average Load Factor %' in updates) next.emissionData.Average_load_factor = updates['Average Load Factor %'];
            if ('Use Operating Hours (h)' in updates) next.emissionData.Use_operating_hours = updates['Use Operating Hours (h)'];
            if ('Energy Source Type' in updates) next.emissionData.Energy_source_type = updates['Energy Source Type'];
            if ('Maintenance Interval (years)' in updates) next.emissionData.Maintanence_interval = updates['Maintenance Interval (years)'];
            if ('Lubricant Replacement Interval (h)' in updates) next.emissionData.Lubricant_replacement_interval = updates['Lubricant Replacement Interval (h)'];
            if ('Lubricant Quantity / Replacement (kg)' in updates) next.emissionData.Lubricant_quantity_per_replacement = updates['Lubricant Quantity / Replacement (kg)'];
            // Maintenance fields
            if ('Technician Travel Mode' in updates) next.emissionData.Technician_transport_mode = updates['Technician Travel Mode'];
            if ('Technician Travel Distance (km)' in updates) next.emissionData.Technician_travel_distance = updates['Technician Travel Distance (km)'];
            if ('Lubricant Disposal Method' in updates) next.emissionData.Lubricant_disposal_method = updates['Lubricant Disposal Method'];
            if ('Replaced Part Indices' in updates) next.emissionData.Replaced_part_indices = updates['Replaced Part Indices'];
            // End-of-life fields
            if ('Recycle Rate %' in updates) next.emissionData.Recycle_rate_ptc = updates['Recycle Rate %'];
            if ('Disposal Method' in updates) next.emissionData.Disposal_method = updates['Disposal Method'];
            if ('Recycling Credit Factor' in updates) next.emissionData.Recycling_credit_factor = updates['Recycling Credit Factor'];
            if ('Distance to Disposal Site (km)' in updates) next.emissionData.Distance_to_disposal_site = updates['Distance to Disposal Site (km)'];
            if ('Transport Mode to Disposal Site' in updates) next.emissionData.Transport_mode_to_disposal_site = updates['Transport Mode to Disposal Site'];
            // Cost fields -> write into results (numerics) and costs (percents/other). Persist as numbers.
            next.results = next.results || {};
            next.costs = next.costs || {};
            if ('Material Cost' in updates) next.results.material_cost = toNum(updates['Material Cost']);
            if ('Manufacturing Cost' in updates) next.results.manufacturing_cost = toNum(updates['Manufacturing Cost']);
            if ('Energy Cost' in updates) next.results.use_phase_energy_cost = toNum(updates['Energy Cost']);
            if ('Total Cost of Good' in updates) next.results.total_cost = toNum(updates['Total Cost of Good']);
            if ('Usage Cost' in updates) next.costs.usageCost = toNum(updates['Usage Cost']);
            if ('Material Overhead (%)' in updates) next.costs.materialOverheadPercent = toNum(updates['Material Overhead (%)']);
            if ('Manufacturing Overhead (%)' in updates) next.costs.manufacturingOverheadPercent = toNum(updates['Manufacturing Overhead (%)']);
            if ('Administrative Cost (%)' in updates) next.costs.adminPercent = toNum(updates['Administrative Cost (%)']);
            if ('Sales Cost (%)' in updates) next.costs.salesPercent = toNum(updates['Sales Cost (%)']);
            // Social Impact Score
            if ('Average SPI' in updates) next.social.average_spi = toNum(updates['Average SPI']);
            // Total results
            if ('Total CO2 (kg)' in updates) next.results.total_co2_kg = toNum(updates['Total CO2 (kg)']);
            if ('Total Cost' in updates) next.results.total_cost = toNum(updates['Total Cost']);


            return next;
        };

        if (isApi) {
            // Start from the currently displayed payload to avoid losing fields
            const basePayload = payload || selected.payload_json || {};
            const newPayload = mapToPayload(basePayload);
            // Recompute totals based on current edited values and persist inside payload_json
            try {
                const { co2, cost } = computeLiveTotals(newPayload);
                newPayload.results = newPayload.results || {};
                if (typeof co2 === 'number' && Number.isFinite(co2)) newPayload.results.total_co2_kg = co2;
                if (typeof cost === 'number' && Number.isFinite(cost)) newPayload.results.total_cost = cost;
            } catch {}
            try {
                const resp = await fetch(`/api/v1/evaluation/${selected.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ payload_json: newPayload })
                });
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                alert('Results updated. Reloading list…');
                onClose();
                // Refresh items
                const res = await fetch('/api/v1/evaluation');
                const data = await res.json();
                if (typeof setItems === 'function') {
                    setItems(Array.isArray(data) ? data : []);
                }
            } catch (e) {
                alert(`Failed to update on server: ${e?.message || e}`);
            }
        } else {
            // Local item: update localStorage snapshot
            const nextItem = { ...selected };
            const baseLocal = (payload || selected.payload_json) || {
                gearbox: {
                    name: selected.emissionData?.Model || selected.part_name,
                    rated_power_kw: selected.emissionData?.Rated_power,
                    efficiency_percent: selected.emissionData?.Efficiency_ptc,
                    lifetime_years: selected.emissionData?.lifespan,
                    operating_hours_per_year: selected.emissionData?.Operating_hours_per_year,
                    electricity_emission_factor_kg_co2_per_kwh: selected.emissionData?.Electricity_grid_emission_factor,
                },
                emissionData: selected.emissionData,
                materials: selected.materials,
                social: { average_spi: selected.socialImpactScore || selected.results?.socialImpactScore },
                results: selected.results || {}
            };
            const mapped = mapToPayload(baseLocal);
            try {
                const { co2, cost } = computeLiveTotals(mapped);
                mapped.results = mapped.results || {};
                if (typeof co2 === 'number' && Number.isFinite(co2)) mapped.results.total_co2_kg = co2;
                if (typeof cost === 'number' && Number.isFinite(cost)) mapped.results.total_cost = cost;
            } catch {}
            nextItem.payload_json = mapped;
            const current = JSON.parse(localStorage.getItem('savedResults') || '[]');
            const idx = current.findIndex((it) => it.timestamp === selected.timestamp);
            if (idx >= 0) {
                current[idx] = nextItem;
                localStorage.setItem('savedResults', JSON.stringify(current));
                if (typeof setItems === 'function') {
                    setItems(current);
                }
                alert('Local result updated.');
                // Close the view to reflect changes in the list
                onClose();
            } else {
                alert('Could not find local entry to update.');
            }
        }
    };

    const numberOrBlank = (v) => (typeof v === 'number' && Number.isFinite(v) ? v.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) : v);

    // Live preview state for dynamic recalculation
    const [liveCO2, setLiveCO2] = useState(null);
    const [liveCost, setLiveCost] = useState(null);
    const [emissionsBreakdown, setEmissionsBreakdown] = useState(null);
    const [costBreakdown, setCostBreakdown] = useState(null);
    // Chart refs for exporting images
    const emissionsChartRef = useRef(null);
    const costChartRef = useRef(null);

    // Helper: parse numeric safely
    const num = (v) => {
        if (v === undefined || v === null) return 0;
        if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
        const cleaned = String(v).replace(/[^0-9.+-]/g, '');
        const n = parseFloat(cleaned);
        return Number.isFinite(n) ? n : 0;
    };

    // Compute emissions & cost similar to Calculator logic but based on current (possibly edited) inputs.
    const computeLiveTotals = (currentPayload) => {
        if (!currentPayload) return { co2: null, cost: null };
        const matRows = Array.isArray(currentPayload.materials) ? currentPayload.materials : [];
        // Derive recycle & scrap rates: prefer emissionData global; else average of rows.
        const recycleRate = num(currentPayload.emissionData?.Recycle_ptc) || (() => {
            const vals = matRows.map(r => num(r.recycled_content_percent)).filter(v => v > 0);
            return vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length) : 0;
        })();
        const scrapRate = num(currentPayload.emissionData?.Scrap_rate_ptc) || (() => {
            const vals = matRows.map(r => num(r.scrap_rate_percent)).filter(v => v > 0);
            return vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length) : 0;
        })();

        // Adjusted material emissions (per-row scrap & recycle if present)
        const adjustedMaterialEmissions = matRows.reduce((sum, row) => {
            const weight = num(row.mass || row.weight);
            const emissionFactor = num(row.emission);
            const rowRecycle = num(row.recycled_content_percent);
            const rowScrap = num(row.scrap_rate_percent);
            const effectiveRecycle = rowRecycle > 0 ? rowRecycle : recycleRate;
            const effectiveScrap = rowScrap > 0 ? rowScrap : scrapRate;
            const processedWeight = weight * (1 + effectiveScrap / 100);
            const nonRecycledFraction = 1 - effectiveRecycle / 100;
            return sum + processedWeight * emissionFactor * nonRecycledFraction;
        }, 0);

        // Manufacturing emissions
        const manufacturing = currentPayload.lifecycle?.manufacturing || {};
        const electricityManufacturing = num(manufacturing.electricity_consumption_kwh_per_unit ?? currentPayload.emissionData?.Electricity_consumption_manufacturing);
        const fuelManufacturing = num(manufacturing.fuel_consumption_mj_per_unit ?? currentPayload.emissionData?.Fuel_energy_consumption);
        const manufacturingWaste = num(manufacturing.manufacturing_waste_kg_per_unit ?? currentPayload.emissionData?.Manufacturing_waste);
        const gridEmissionFactor = num(currentPayload.gearbox?.electricity_emission_factor_kg_co2_per_kwh ?? currentPayload.emissionData?.Electricity_grid_emission_factor) || 0.4;
        const fuelEmissionFactor = 0.27;
        const manufacturingEmissions = (electricityManufacturing * gridEmissionFactor) + (fuelManufacturing * fuelEmissionFactor) + (manufacturingWaste * 1);

        // Transportation emissions
        const transport = Array.isArray(currentPayload.lifecycle?.transportation) ? currentPayload.lifecycle.transportation[0] || {} : (currentPayload.lifecycle?.transportation || {});
        const transportTypeFactors = { truck: 0.1, ship: 0.01, train: 0.03, airplane: 0.5 };
        const transportMode = String(transport.transport_mode || currentPayload.emissionData?.Transportation_type || '').toLowerCase();
        const transportFactor = transportTypeFactors[transportMode] || 0;
        const transportMassKg = num((typeof transport.transport_mass_tonnes === 'number' ? transport.transport_mass_tonnes * 1000 : transport.transport_mass_tonnes) ?? currentPayload.emissionData?.Transport_mass);
        const transportDistance = num(transport.distance_km ?? currentPayload.emissionData?.Transportation_distance);
        const transportEmissions = transportMassKg * transportDistance * transportFactor;

        // Use phase emissions
        const ratedPower = num(currentPayload.gearbox?.rated_power_kw ?? currentPayload.emissionData?.Rated_power);
        const efficiency = num(currentPayload.gearbox?.efficiency_percent ?? currentPayload.emissionData?.Efficiency_ptc);
        const averageLoadFactor = num(currentPayload.emissionData?.Average_load_factor ?? currentPayload.lifecycle?.use_phase?.average_load_factor);
        const operatingHoursPerYear = num(currentPayload.gearbox?.operating_hours_per_year ?? currentPayload.emissionData?.Operating_hours_per_year);
        const input_power = ratedPower * efficiency / 100;
        const input_power_avg = input_power * (averageLoadFactor / 100);
        const power_loss = input_power_avg * (1 - (efficiency / 100));
        const annual_energy_loss = power_loss * operatingHoursPerYear;
        const energysourceTypeFactors = { gridelectricity: 0.4, renewablemix: 0.1, diesel: 0.27, nuclear: 0.012, natural_gas: 0.2, gasoline: 0.24 };
        const energy_source_type = String(currentPayload.lifecycle?.use_phase?.energy_source_type || currentPayload.emissionData?.Energy_source_type || '').toLowerCase();
        const gridElecFactor = num(currentPayload.emissionData?.gridelectricity_emission_factor) || energysourceTypeFactors[energy_source_type] || 0;
        const lifespan_years = num(currentPayload.gearbox?.lifetime_years ?? currentPayload.emissionData?.lifespan) || 1;
        const replacementEmissions = annual_energy_loss * gridElecFactor * lifespan_years; // align with Calculator's annual_use_emissions * lifespan

        // Maintenance emissions
        const maintenance = currentPayload.lifecycle?.maintenance || {};
        const replacedPartIndicesRaw = currentPayload.emissionData?.Replaced_part_indices || maintenance.replaced_part_indices || [];
        const replacedPartIndices = Array.isArray(replacedPartIndicesRaw) ? replacedPartIndicesRaw : String(replacedPartIndicesRaw).split(',').map(s => parseInt(s.trim(),10)).filter(n => Number.isFinite(n));
        const emission_factor_replaced_parts = replacedPartIndices.reduce((sum, idx) => {
            const row = matRows[idx] || {};
            const emission = num(row.emission);
            const weight = num(row.mass || row.weight);
            return sum + emission * weight;
        }, 0);
        const traveltypeFactors = { car: 0.2, van: 0.3, plane: 0.2, walk: 0.0 };
        const maintIntervalYears = num(maintenance.maintenance_interval_years ?? currentPayload.emissionData?.Maintanence_interval) || lifespan_years;
        const numMaintenances = Math.floor(lifespan_years / (maintIntervalYears || 1));
        const maintanenceEmissions = emission_factor_replaced_parts * numMaintenances;
        const technicianTravelDistance = num(maintenance.technician_travel_distance_km ?? currentPayload.emissionData?.Technician_travel_distance);
        const technicianTransportMode = String(maintenance.service_transport_mode || currentPayload.emissionData?.Technician_transport_mode || '').toLowerCase();
        const technicianTravelFactor = traveltypeFactors[technicianTransportMode] || 0;
        const technicianEmissions = technicianTravelDistance * technicianTravelFactor * numMaintenances;
        const lubricantReplacementInterval = num(currentPayload.lifecycle?.use_phase?.lubricant_replacement_interval_hours ?? currentPayload.emissionData?.Lubricant_replacement_interval) || 1;
        const lubricantQuantityPerReplacement = num(currentPayload.lifecycle?.use_phase?.lubricant_quantity_per_replacement_liters ?? currentPayload.emissionData?.Lubricant_quantity_per_replacement);
        const totalOperatingHours = lifespan_years * operatingHoursPerYear;
        const numLubricantReplacements = lubricantReplacementInterval > 0 ? Math.floor(totalOperatingHours / lubricantReplacementInterval) : 0;
        const lubricantEmissionFactor = 2;
        const lubricantEmissions = numLubricantReplacements * lubricantQuantityPerReplacement * lubricantEmissionFactor;
        const disposalFactors = { landfill: 0.5, incineration: 1.0, recycling: 0.2 };
        const lubricantDisposalMethod = String(maintenance.lubricant_disposal_method || currentPayload.emissionData?.Lubricant_disposal_method || '').toLowerCase();
        const lubricantDisposalFactor = disposalFactors[lubricantDisposalMethod] || 0;
        const lubricantDisposalEmissions = lubricantQuantityPerReplacement * numLubricantReplacements * lubricantDisposalFactor;
        const totalMaintenanceEmissions = maintanenceEmissions + technicianEmissions + lubricantEmissions + lubricantDisposalEmissions;

        // End-of-life emissions
        const endOfLife = currentPayload.lifecycle?.end_of_life || {};
        const totalMass = matRows.reduce((sum, row) => sum + num(row.mass || row.weight), 0);
        const recycle_rate_ptc = num(endOfLife.recycling_rate_percent ?? currentPayload.emissionData?.Recycle_rate_ptc ?? recycleRate);
        const recycledMass = totalMass * recycle_rate_ptc / 100;
        const disposalMass = totalMass - recycledMass;
        const disposalMethod = String(endOfLife.disposal_method || currentPayload.emissionData?.Disposal_method || '').toLowerCase();
        const disposalEmissions = disposalMass * (disposalFactors[disposalMethod] || 0);
        const recyclingCreditFactor = num(endOfLife.recycling_credit_factor_kg_co2 ?? currentPayload.emissionData?.Recycling_credit_factor);
        const recyclingCredit = recycledMass * recyclingCreditFactor;
        const distanceToDisposalSite = num(endOfLife.transport_to_recycler_km ?? currentPayload.emissionData?.Distance_to_disposal_site);
        const transportToDisposalSite = disposalMass * distanceToDisposalSite * transportFactor;
        const endOfLifeEmissions = disposalEmissions - recyclingCredit + transportToDisposalSite;

        // Total emissions
        const totalEmissions = adjustedMaterialEmissions + transportEmissions + replacementEmissions + totalMaintenanceEmissions + endOfLifeEmissions + manufacturingEmissions;

        // Cost calculations (use summary fields; treat 'Material Cost' as base pre-overhead sum)
        const costs = currentPayload.costs || {};
        const materialCostField = num(costs.materialCostSum ?? currentPayload.results?.material_cost ?? costs.materialCost);
        const materialOverheadPercent = num(costs.materialOverheadPercent);
        const materialOverhead = materialCostField * (materialOverheadPercent / 100);
        const totalMaterialCost = materialCostField + materialOverhead;
        const manufacturingCostField = num(costs.manufacturingCost ?? currentPayload.results?.manufacturing_cost);
        const manufacturingOverheadPercent = num(costs.manufacturingOverheadPercent);
        const manufacturingOverhead = manufacturingCostField * (manufacturingOverheadPercent / 100);
        const totalProductionCost = totalMaterialCost + manufacturingCostField + manufacturingOverhead;
        const adminPercent = num(costs.adminPercent);
        const salesPercent = num(costs.salesPercent);
        const adminCost = totalProductionCost * (adminPercent / 100);
        const salesCost = totalProductionCost * (salesPercent / 100);
        const energyCost = num(costs.energyCost ?? currentPayload.results?.use_phase_energy_cost);
        const usageCost = num(costs.usageCost);
        const totalCostOfGood = totalProductionCost + adminCost + salesCost + energyCost + usageCost;

        const emissionsParts = {
            Materials: adjustedMaterialEmissions,
            Transportation: transportEmissions,
            UsePhaseEnergyLoss: replacementEmissions,
            Maintenance: totalMaintenanceEmissions,
            EndOfLife: endOfLifeEmissions,
            Manufacturing: manufacturingEmissions,
        };

        const costParts = {
            Materialcost: materialCostField,
            MaterialOverhead: materialOverhead,
            ManufacturingCost: manufacturingCostField,
            ManufacturingOverhead: manufacturingOverhead,
            AdministrativeCost: adminCost,
            SalesCost: salesCost,
            EnergyCost: energyCost,
            UsageCost: usageCost,
        };

        return { co2: totalEmissions, cost: totalCostOfGood, emissionsParts, costParts };
    };

    // Build a transient payload from current DOM inputs for live preview.
    const buildCurrentPayloadFromInputs = () => {
        const base = JSON.parse(JSON.stringify(payload || {}));
        const panelEl = document.querySelector('.panel');
        if (!panelEl) return base;
        const rows = panelEl.querySelectorAll('.row');
        const labelValueMap = {};
        rows.forEach(r => {
            const labelEl = r.querySelector('.label');
            if (!labelEl) return;
            const label = labelEl.textContent;
            const inputEl = r.querySelector('input, select');
            if (!inputEl) return;
            const val = inputEl.value;
            if (val !== '') labelValueMap[label] = val;
        });
        // Apply material row updates
        base.materials = Array.isArray(materials) ? JSON.parse(JSON.stringify(materials)) : [];
        base.materials.forEach((m,i) => {
            const massLabel = `Mass (kg) [${i}]`;
            const emissionLabel = `Emission Factor (kg CO2/kg) [${i}]`;
            const recycleLabel = `Recycled Content % [${i}]`;
            const scrapLabel = `Scrap Rate % [${i}]`;
            if (massLabel in labelValueMap) m.mass = num(labelValueMap[massLabel]);
            if (emissionLabel in labelValueMap) m.emission = num(labelValueMap[emissionLabel]);
            if (recycleLabel in labelValueMap) m.recycled_content_percent = num(labelValueMap[recycleLabel]);
            if (scrapLabel in labelValueMap) m.scrap_rate_percent = num(labelValueMap[scrapLabel]);
        });
        base.gearbox = base.gearbox || {};
        if ('Rated Power (kW)' in labelValueMap) base.gearbox.rated_power_kw = num(labelValueMap['Rated Power (kW)']);
        if ('Efficiency (%)' in labelValueMap) base.gearbox.efficiency_percent = num(labelValueMap['Efficiency (%)']);
        if ('Lifetime (years)' in labelValueMap) base.gearbox.lifetime_years = num(labelValueMap['Lifetime (years)']);
        if ('Operating Hours / Year' in labelValueMap) base.gearbox.operating_hours_per_year = num(labelValueMap['Operating Hours / Year']);
        if ('Electricity Emission Factor (kg CO2/kWh)' in labelValueMap) base.gearbox.electricity_emission_factor_kg_co2_per_kwh = num(labelValueMap['Electricity Emission Factor (kg CO2/kWh)']);

        base.emissionData = base.emissionData || {};
        // Map use phase / maintenance / transportation / end-of-life fields to emissionData analogs for algorithm compatibility
        if ('Average Load Factor %' in labelValueMap) base.emissionData.Average_load_factor = num(labelValueMap['Average Load Factor %']);
        if ('Use Operating Hours (h)' in labelValueMap) base.emissionData.Operating_hours_per_year = num(labelValueMap['Use Operating Hours (h)']);
        if ('Energy Source Type' in labelValueMap) base.emissionData.Energy_source_type = labelValueMap['Energy Source Type'];
        if ('Maintenance Interval (years)' in labelValueMap) base.emissionData.Maintanence_interval = num(labelValueMap['Maintenance Interval (years)']);
        if ('Lubricant Replacement Interval (h)' in labelValueMap) base.emissionData.Lubricant_replacement_interval = num(labelValueMap['Lubricant Replacement Interval (h)']);
        if ('Lubricant Quantity / Replacement (kg)' in labelValueMap) base.emissionData.Lubricant_quantity_per_replacement = num(labelValueMap['Lubricant Quantity / Replacement (kg)']);
        if ('Technician Travel Distance (km)' in labelValueMap) base.emissionData.Technician_travel_distance = num(labelValueMap['Technician Travel Distance (km)']);
        if ('Technician Travel Mode' in labelValueMap) base.emissionData.Technician_transport_mode = labelValueMap['Technician Travel Mode'];
        if ('Lubricant Disposal Method' in labelValueMap) base.emissionData.Lubricant_disposal_method = labelValueMap['Lubricant Disposal Method'];
        if ('Replaced Part Indices' in labelValueMap) base.emissionData.Replaced_part_indices = String(labelValueMap['Replaced Part Indices'])
            .split(',').map(s => parseInt(s.trim(),10)).filter(n => Number.isFinite(n));
        if ('Recycle Rate %' in labelValueMap) base.emissionData.Recycle_rate_ptc = num(labelValueMap['Recycle Rate %']);
        if ('Disposal Method' in labelValueMap) base.emissionData.Disposal_method = labelValueMap['Disposal Method'];
        if ('Recycling Credit Factor' in labelValueMap) base.emissionData.Recycling_credit_factor = num(labelValueMap['Recycling Credit Factor']);
        if ('Distance to Disposal Site (km)' in labelValueMap) base.emissionData.Distance_to_disposal_site = num(labelValueMap['Distance to Disposal Site (km)']);
        if ('Mode' in labelValueMap) base.emissionData.Transportation_type = labelValueMap['Mode'];
        if ('Mass (kg)' in labelValueMap) base.emissionData.Transport_mass = num(labelValueMap['Mass (kg)']);
        if ('Distance (km)' in labelValueMap) base.emissionData.Transportation_distance = num(labelValueMap['Distance (km)']);

        // Cost fields snapshot
        base.costs = base.costs || {};
        if ('Material Cost' in labelValueMap) base.costs.materialCostSum = num(labelValueMap['Material Cost']);
        if ('Material Overhead (%)' in labelValueMap) base.costs.materialOverheadPercent = num(labelValueMap['Material Overhead (%)']);
        if ('Manufacturing Cost' in labelValueMap) base.costs.manufacturingCost = num(labelValueMap['Manufacturing Cost']);
        if ('Manufacturing Overhead (%)' in labelValueMap) base.costs.manufacturingOverheadPercent = num(labelValueMap['Manufacturing Overhead (%)']);
        if ('Administrative Cost (%)' in labelValueMap) base.costs.adminPercent = num(labelValueMap['Administrative Cost (%)']);
        if ('Sales Cost (%)' in labelValueMap) base.costs.salesPercent = num(labelValueMap['Sales Cost (%)']);
        if ('Energy Cost' in labelValueMap) base.costs.energyCost = num(labelValueMap['Energy Cost']);
        if ('Usage Cost' in labelValueMap) base.costs.usageCost = num(labelValueMap['Usage Cost']);
        return base;
    };

    const runLiveRecalc = () => {
        const current = buildCurrentPayloadFromInputs();
        const { co2, cost, emissionsParts, costParts } = computeLiveTotals(current);
        setLiveCO2(co2);
        setLiveCost(cost);
        setEmissionsBreakdown(emissionsParts);
        setCostBreakdown(costParts);
    };

    // Attach listeners for dynamic update
    useEffect(() => {
        runLiveRecalc(); // initial
        const panelEl = document.querySelector('.panel');
        if (!panelEl) return;
        const handler = () => runLiveRecalc();
        panelEl.addEventListener('input', handler);
        panelEl.addEventListener('change', handler);
        return () => {
            panelEl.removeEventListener('input', handler);
            panelEl.removeEventListener('change', handler);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected]);

    const exportToPDF = (item, charts) => {
    const doc = new jsPDF();

    const isApi = Object.prototype.hasOwnProperty.call(item, "id");
    const model = isApi
        ? (item.payload_json?.gearbox?.name || item.gearbox_name)
        : (item.emissionData?.Model || item.part_name || "—");

    const co2Raw = isApi ? item.total_co2_kg : item?.results?.totalEmissions;
    const costRaw = isApi ? item.total_cost : (item?.costs?.totalCostOfGood || item?.results?.totalCostOfGood);
    const spiRaw = isApi ? item.average_spi : (item?.results?.socialImpactScore || item?.socialImpactScore);


    const co2 = Number(co2Raw)?.toFixed?.(2) || "—";
    const cost = Number(costRaw)?.toFixed?.(2) || "—";
    const spi = Number(spiRaw)?.toFixed?.(2) || "—";

    doc.setFontSize(18);
    doc.text("Gearbox Evaluation Report", 14, 20);

    doc.setFontSize(12);
    doc.text(`Model: ${model}`, 14, 35);
    doc.text(`Total CO2: ${co2} kg`, 14, 45);
    doc.text(`Total Cost: ${cost} EUR`, 14, 55);
    doc.text(`Social Impact Score: ${spi}`, 14, 65);



    const results = item.results || {};
    const rows = Object.entries(results).map(([key, value]) => [
        key,
        String(value ?? "—")
    ]);

    if (rows.length > 0) {
        autoTable(doc, {
            head: [["Field", "Value"]],
            body: rows,
            startY: 70,
        });
    }

    // Add chart images if provided
    let yAfterTable = doc.lastAutoTable ? (doc.lastAutoTable.finalY + 10) : 80;
    const addChart = (imgData, label) => {
        if (!imgData) return;
        doc.setFontSize(12);
        doc.text(label, 14, yAfterTable);
        const imgWidth = 90; // mm
        const imgHeight = 90; // mm (approx)
        doc.addImage(imgData, 'PNG', 14, yAfterTable + 4, imgWidth, imgHeight);
        yAfterTable += imgHeight + 14;
        doc.addPageIfNeeded = (yAfterTable) => {
            if (yAfterTable + imgHeight + 20 > doc.internal.pageSize.getHeight()) {
                doc.addPage();
                return 20; // reset y position
            }
        };
    };
    addChart(charts?.emissionsImg, 'Emissions Breakdown');
    addChart(charts?.costImg, 'Cost Breakdown');

    doc.save(`${model.replace(/\s+/g, "_")}_report.pdf`);
};

    return (
        <div className="panel">
            <div className="header">Evaluation Details: {gearbox.name || '—'}</div>
            <button className="closeBtn" onClick={onClose}>Close</button>
            {loadingFull && <div className="row"><div className="label">Loading details</div><div className="value">Fetching full inputs…</div></div>}

            <div className="section">
                <h4 className="sectionTitle">Gearbox</h4>
                {field('Model / Name', gearbox.name)}
                {field('Rated Power (kW)', gearbox.rated_power_kw)}
                {field('Efficiency (%)', gearbox.efficiency_percent)}
                {field('Lifetime (years)', gearbox.lifetime_years)}
                {field('Operating Hours / Year', gearbox.operating_hours_per_year)}
                {field('Electricity Emission Factor (kg CO2/kWh)', gearbox.electricity_emission_factor_kg_co2_per_kwh)}
                {field('Functional Unit', ed.Functional_unit)}
            </div>

            <div className="section">
                <h4 className="sectionTitle">Materials</h4>
                {materials.length === 0 && <div className="missing">No materials recorded</div>}
                {materials.map((m,i) => (
                    <div key={i} className="materialCard">
                        {field('Component Name', m.component_name || m.part_name, `Component Name [${i}]`)}
                        {field('Material Name', m.material_name || m.type, `Material Name [${i}]`)}
                        {field('Mass (kg)', m.mass || m.weight, `Mass (kg) [${i}]`)}
                        {field('Recycled Content %', m.recycled_content_percent || ed.Recycle_ptc, `Recycled Content % [${i}]`)}
                        {field('Scrap Rate %', m.scrap_rate_percent || ed.Scrap_rate_ptc, `Scrap Rate % [${i}]`)}
                        {field('Emission Factor (kg CO2/kg)', m.emission || '—', `Emission Factor (kg CO2/kg) [${i}]`)}
                    </div>
                ))}
                {fieldConstants('Total Material emissions (kg)', typeof results.materials_co2_total_kg === 'number' ? results.materials_co2_total_kg.toFixed(2) : (results.materials_co2_total_kg ?? '—'))}
            </div>

            <div className="section">
                <h4 className="sectionTitle">Manufacturing</h4>
                {/* prefer API lifecycle values; fallback to local ed.* */}
                {field('Electricity Consumption (kWh/unit)', manufacturing.electricity_consumption_kwh_per_unit ?? ed.Electricity_consumption_manufacturing)}
                {field('Fuel Energy Consumption (MJ/unit)', manufacturing.fuel_consumption_mj_per_unit ?? ed.Fuel_energy_consumption)}
                {field('Manufacturing Waste (kg/unit)', manufacturing.manufacturing_waste_kg_per_unit ?? ed.Manufacturing_waste)}
                {field('Factory Location', manufacturing.factory_location ?? ed.Factory_location)}
                {field('Production Rate %', manufacturing.production_rate_ptc ?? ed.Production_rate_ptc)}
                {fieldConstants('Total Manufacturing emissions (kg)', typeof results.manufacturing_co2_kg === 'number' ? Number(results.manufacturing_co2_kg).toFixed(2) : (results.manufacturing_co2_kg ?? '—'))}
            </div>

            <div className="section">
                <h4 className="sectionTitle">Transportation</h4>
                {field('Description', ed.Transportation_desc)}
                {field('Distance (km)', transportation.distance_km ?? ed.Transportation_distance)}
                {fieldSelect('Mode', transportation.transport_mode ?? ed.Transportation_type, ['Truck', 'Ship', 'Airplane', 'Train'])}
                {field('Mass (kg)', (typeof transportation.transport_mass_tonnes === 'number' ? transportation.transport_mass_tonnes * 1000 : undefined) ?? ed.Transport_mass)}
                {fieldConstants('Total Transportation emissions (kg)', typeof results.transportation_co2_kg === 'number' ? Number(results.transportation_co2_kg).toFixed(2) : (results.transportation_co2_kg ?? '—'))}
            </div>

            <div className="section">
                <h4 className="sectionTitle">Use Phase</h4>
                {field('Average Load Factor %', use_phase.average_load_factor ?? ed.Average_load_factor)}
                {field('Use Operating Hours (h)', ed.Use_operating_hours ?? use_phase.operating_hours_per_year)}
                {fieldSelect('Energy Source Type', ed.Energy_source_type ?? use_phase.energy_source_type)}
                {field('Maintenance Interval (years)', ed.Maintanence_interval ?? maintenance.maintenance_interval_years)}
                {field('Lubricant Replacement Interval (h)', ed.Lubricant_replacement_interval ?? use_phase.lubricant_replacement_interval_hours)}
                {field('Lubricant Quantity / Replacement (kg)', ed.Lubricant_quantity_per_replacement ?? use_phase.lubricant_quantity_per_replacement_liters)}
            </div>

            <div className="section">
                <h4 className="sectionTitle">Maintenance</h4>
                {fieldSelect('Technician Travel Mode', ed.Technician_transport_mode ?? maintenance.service_transport_mode, ['Car', 'Van', 'Plane', 'Walk'])}
                {field('Technician Travel Distance (km)', ed.Technician_travel_distance ?? maintenance.technician_travel_distance_km)}
                {fieldSelect('Lubricant Disposal Method', ed.Lubricant_disposal_method ?? maintenance.lubricant_disposal_method, ['Landfill', 'Incineration', 'Recycling'])}
                {field('Replaced Part Indices', Array.isArray(ed.Replaced_part_indices) && ed.Replaced_part_indices.length ? ed.Replaced_part_indices.join(', ') : '')}
            </div>

            <div className="section">
                <h4 className="sectionTitle">End of Life</h4>
                {field('Recycle Rate %', ed.Recycle_rate_ptc ?? end_of_life.recycling_rate_percent)}
                {fieldSelect('Disposal Method', ed.Disposal_method ?? end_of_life.disposal_method, ['Landfill', 'Incineration', 'Recycling'])}
                {field('Recycling Credit Factor', ed.Recycling_credit_factor ?? end_of_life.recycling_credit_factor_kg_co2)}
                {field('Distance to Disposal Site (km)', ed.Distance_to_disposal_site ?? end_of_life.transport_to_recycler_km)}
                {fieldSelect('Disposal Site Travel Mode', end_of_life.disposalsite_travel_mode ?? ed.Disposalsite_travel_mode, ['Truck', 'Train', 'Ship', 'Airplane'])}
                {fieldConstants('Total End-of-life emissions (kg)', typeof results.end_of_life_co2_kg === 'number' ? Number(results.end_of_life_co2_kg).toFixed(2) : (results.end_of_life_co2_kg ?? '—'))}
            </div>

            <div className="section">
                <h4 className="sectionTitle">Cost Breakdown</h4>
                {(() => {
                    const costs = (payload && payload.costs) || selected.costs || {};
                    const parseNum = (v) => {
                        if (typeof v === 'number') return v;
                        const n = Number(v);
                        return Number.isFinite(n) ? n : undefined;
                    };
                    const fmtPercent = (v) => {
                        if (v === '' || v === null || v === undefined) return '';
                        const n = Number(String(v).replace(/[^0-9.+\-]/g, ''));
                        return Number.isFinite(n) ? `${n} %` : '';
                    };
                    // logic for the results to show as "missing value" if the corresponding input values are all blank
                    const materialsArr = selected.materials || [];
                    const allMaterialCostsBlank = materialsArr.length === 0 || materialsArr.every(m => !m.cost || m.cost === '' || m.cost === null);
                    const rawManufacturingBlank = costs.manufacturingCost === '' || costs.manufacturingCost === undefined || costs.manufacturingCost === null;
                    const rawEnergyBlank = costs.energyCost === '' || costs.energyCost === undefined || costs.energyCost === null;
                    const rawUsageBlank = costs.usageCost === '' || costs.usageCost === undefined || costs.usageCost === null;
                    const rawMaterialCost = parseNum(results.material_cost) ?? parseNum(costs.materialCostSum);
                    const rawManufacturingCost = parseNum(results.manufacturing_cost) ?? parseNum(costs.manufacturingCost);
                    const rawEnergyCost = parseNum(results.use_phase_energy_cost) ?? parseNum(costs.energyCost);
                    const rawUsageCost = parseNum(costs.usageCost);
                    const materialCost = rawMaterialCost;
                    const manufacturingCost = rawManufacturingCost;
                    const energyCostVal = rawEnergyCost;
                    const usageCostVal = rawUsageCost;
                    const rawMaterialOverheadPercent = costs.materialOverheadPercent ?? '';
                    const rawManufacturingOverheadPercent = costs.manufacturingOverheadPercent ?? '';
                    const rawAdminPercent = costs.adminPercent ?? '';
                    const rawSalesPercent = costs.salesPercent ?? '';
                    const materialOverheadPercent = fmtPercent(rawMaterialOverheadPercent);
                    const manufacturingOverheadPercent = fmtPercent(rawManufacturingOverheadPercent);
                    const adminPercent = fmtPercent(rawAdminPercent);
                    const salesPercent = fmtPercent(rawSalesPercent);
                    const totalCostVal = parseNum(results.total_cost) ?? parseNum(costs.totalCostOfGood);
                    const allOverheadPercentsBlank = [materialOverheadPercent, manufacturingOverheadPercent, adminPercent, salesPercent].every(p => p === '' || p === null || p === undefined);
                    const materialCostMissing = materialCost === undefined || (materialCost === 0 && allMaterialCostsBlank);
                    const manufacturingCostMissing = manufacturingCost === undefined || (manufacturingCost === 0 && rawManufacturingBlank);
                    const energyCostMissing = energyCostVal === undefined || (energyCostVal === 0 && rawEnergyBlank);
                    const usageCostMissing = usageCostVal === undefined || (usageCostVal === 0 && rawUsageBlank);

                    return (
                        <>
                            {fieldWithRaw('Material Cost', materialCostMissing ? '' : materialCost.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) + " €", rawMaterialCost)}
                            {fieldWithRaw('Material Overhead (%)', materialOverheadPercent, rawMaterialOverheadPercent)}
                            {fieldWithRaw('Manufacturing Cost', manufacturingCostMissing ? '' : manufacturingCost.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) + " €", rawManufacturingCost)}
                            {fieldWithRaw('Manufacturing Overhead (%)', manufacturingOverheadPercent, rawManufacturingOverheadPercent)}
                            {fieldWithRaw('Administrative Cost (%)', adminPercent, rawAdminPercent)}
                            {fieldWithRaw('Sales Cost (%)', salesPercent, rawSalesPercent)}
                            {fieldWithRaw('Energy Cost', energyCostMissing ? '' : energyCostVal.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) + " €", rawEnergyCost)}
                            {fieldWithRaw('Usage Cost', usageCostMissing ? '' : usageCostVal.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) + " €", rawUsageCost)}
                        </>
                    );
                })()}
            </div>

            <div className="section">
                <h4 className="sectionTitle">Graphs of Emissions and Cost Breakdown</h4>
                <h5>Emissions Breakdown (kg CO2)</h5>
                {emissionsBreakdown && (
                    <div style={{ display: 'flex', alignItems : 'center', justifyContent: 'center', maxWidth: '50%', marginLeft: 'auto', marginRight: 'auto' }}>
                        <Pie
                            ref={emissionsChartRef}
                            data={{
                                labels: Object.keys(emissionsBreakdown),
                                datasets: [{
                                    label: 'Emissions (kg)',
                                    data: Object.values(emissionsBreakdown).map(v => (typeof v === 'number' ? v : 0)),
                                    backgroundColor: ['#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f','#edc948'],
                                }]
                            }}
                            options={{ plugins: { legend: { position: 'bottom' } } }}
                        />
                    </div>
                )}
                <h5>Cost Breakdown (EUR)</h5>
                {costBreakdown && (
                    <div style={{ display: 'flex', alignItems : 'center', justifyContent: 'center', maxWidth: '50%', marginLeft: 'auto', marginRight: 'auto' }}>
                        <Pie
                            ref={costChartRef}
                            data={{
                                labels: Object.keys(costBreakdown),
                                datasets: [{
                                    label: 'Costs',
                                    data: Object.values(costBreakdown).map(v => (typeof v === 'number' ? v : 0)),
                                    backgroundColor: ['#af7aa1','#ff9da7','#9c755f','#bab0ab','#86bcbd','#f4a259','#2d93ad','#6c5b7b'],
                                }]
                            }}
                            options={{ plugins: { legend: { position: 'bottom' } } }}
                        />
                    </div>
                )}
            </div>

            <div className="section">
                <h4 className="sectionTitle">Results</h4>
                {fieldConstants('Live Total CO2 (kg)', (typeof liveCO2 === 'number' && Number.isFinite(liveCO2)) ? liveCO2.toFixed(2) : '—')}
                {fieldConstants(`Live Total Cost (${currency})`, (typeof liveCost === 'number' && Number.isFinite(liveCost)) ? liveCost.toFixed(2) : '—')}
                {fieldConstants('Total CO2 (kg)', (typeof co2 === 'number' && Number.isFinite(co2)) ? co2.toFixed(2) : '—')}
                {fieldConstants(`Total Cost (${currency})`, (typeof cost === 'number' && Number.isFinite(cost)) ? cost.toFixed(2) : '—')}
                {fieldConstants('Average SPI', numberOrBlank(results.average_spi || social.average_spi))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={updateResults}>Update results</button>
                <button onClick={() => {
                    try {
                        const emissionsImg = emissionsChartRef.current?.toBase64Image?.() || emissionsChartRef.current?.canvas?.toDataURL?.('image/png');
                        const costImg = costChartRef.current?.toBase64Image?.() || costChartRef.current?.canvas?.toDataURL?.('image/png');
                        exportToPDF(selected, { emissionsImg, costImg });
                    } catch (e) {
                        alert(`Failed to capture charts for PDF: ${e?.message || e}`);
                        exportToPDF(selected);
                    }
                }}>Export to PDF</button>
            </div>
        </div>
    );
}