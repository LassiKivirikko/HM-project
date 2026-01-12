import { useState } from 'react';
import styles from './MaterialCard.module.css';
const initialNewMaterial = {
  name: '',
  default_co2_per_kg: '',
  default_cost_per_kg: '',
  default_currency: '',
};

const editableFields = [
  "name",
];

const AddMaterialFormCard = ({ onSave, onCancel }) => {
  const [newMaterial, setNewMaterial] = useState(initialNewMaterial);

  const handleChange = (target) => {
    const { name, value } = target;
    setNewMaterial(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    onSave(newMaterial);
    setNewMaterial(initialNewMaterial);
  };

  const handleCancel = () => {
    setNewMaterial(initialNewMaterial);
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2>Add New Material</h2>
      </div>

      <div className={styles.row}>
        {editableFields.map((key) => (
          <div key={key} className={styles.field}>
            <label className={styles.label}>{key + ":"}</label>
            <input
              type="text"
              name={key}
              value={newMaterial[key] ?? ""}
              onChange={(e) => handleChange(e.target)}
              className={styles.input}
            />
          </div>
        ))}
      </div>

      <div className={styles.buttonGroup}>
        <button onClick={handleSave} className={styles.button}>Save Material</button>
        <button onClick={handleCancel} className={styles.button}>Cancel</button>
      </div>
    </div>
  );
};

export default AddMaterialFormCard;