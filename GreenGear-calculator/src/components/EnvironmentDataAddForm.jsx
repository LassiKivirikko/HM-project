import { useState } from 'react';

import styles from './MaterialCard.module.css';

const initialNewData = {
  country_code: '',
  co2_per_kg: '',
  cost_per_kg: '',
  description: '',
};

const editableFields = [
  "country_code",
  "co2_per_kg",
  "cost_per_kg",
  "description",
];

const fieldLimits = {
  country_code: 3,
  description: 40,
}

const EnvironmentDataAddForm = ({ onSave, onCancel, name }) => {
  const [newMaterial, setNewMaterial] = useState(initialNewData);

  const handleChange = (target) => {
    const { name, value } = target;
    setNewMaterial(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    onSave(newMaterial);
    setNewMaterial(initialNewData);
  };

  const handleCancel = () => {
    setNewMaterial(initialNewData);
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2>Add New dataset for {name}</h2>
      </div>

      <div className={styles.row}>
        {editableFields.map((key) => (
          <div key={key} className={styles.field}>
            <label className={styles.label}>{key + ":"}</label>
            <input
              type={(key.includes('co2') || key.includes('energy') || key.includes('cost') || key.includes('spi')) ? "number" : "text"}
              name={key}
              value={newMaterial[key] ?? ""}
              onChange={(e) => handleChange(e.target)}
              className={styles.input}
              maxLength={fieldLimits[key] || undefined}
            />
          </div>
        ))}
      </div>

      <div className={styles.buttonGroup}>
        <button onClick={handleSave} className={styles.button}>Save dataset</button>
        <button onClick={handleCancel} className={styles.button}>Cancel</button>
      </div>
    </div>
  );
};

export default EnvironmentDataAddForm;