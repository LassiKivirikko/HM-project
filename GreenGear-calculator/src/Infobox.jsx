import React from 'react';
import { X } from 'lucide-react';
import './Infobox.css';
import Kuva2 from './assets/Kuva2.png';

function Infobox({ onClose }) {
  return (
    <div
      className="infobox-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Information"
    >
      <div className="infobox-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="infobox-close" onClick={onClose} aria-label="Close info">
          <X size={20} />
        </button>

        <div className="infobox-content">
          <h1>GreenGear information</h1>

          <h3>How Our Calculation Works</h3>
          <p>
            Our tool offers transparent and standardized evaluations of sustainability and costs for gearbox
            production. Here’s how we calculate the key indicators:
          </p>

          <h4>1. CO₂ Emission Data</h4>
          <ul>
            <li>We use verified emission factors from the German Environment Agency (Umweltbundesamt) via the ProBas database.</li>
            <li>Each material used in a gearbox (e.g., steel, aluminum, plastics) has a CO₂ emission value stated per kilogram.</li>
            <li>The tool multiplies these emission values by the material quantities entered to calculate the total CO₂ footprint of the gearbox.</li>
          </ul>

          <h4>2. Cost of Goods (COG) Calculation</h4>
          <p>Our cost evaluation follows a structured model that combines:</p>
          <ul>
            <li>Material costs: partially based on market values of materials (automatically retrieved from a database).</li>
            <li>Production costs: including energy, process, and labor costs, input values from company data.</li>
            <li>Administrative & sales costs: input values from company data.</li>
          </ul>

          <p>
            Here is an example:
            <img src={Kuva2} alt="Cost Calculation Example" style={{ display: 'block', margin: '10px auto' }} />
            <em>(Values highlighted in yellow are input fields provided by your company; all other values are calculated automatically.)</em>
          </p>

          <p>
            <a href="https://www.probas.umweltbundesamt.de/" target="_blank" rel="noopener noreferrer">
              https://www.probas.umweltbundesamt.de/
            </a>
          </p>

          <h4>3. Interactive Evaluation</h4>
          <ul>
            <li>Interactive dashboards for economic, ecological, and social dimensions.</li>
            <li>Backward goal-setting options to simulate the impact of alternative materials or production methods.</li>
          </ul>

          <h4>Source Transparency</h4>
          <p>
            All data sources are traceable and standardized to ensure accuracy, comparability, and EU sustainability
            compliance.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Infobox;