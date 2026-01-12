import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './EnvironmentDataCard.module.css';

const MaterialCard = ({ material, onSave, onDelete, id }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMaterial, setEditedMaterial] = useState(material);

  // Keep local editable copy in sync when parent material prop changes
  useEffect(() => {
    setEditedMaterial(material);
  }, [material]);

  const handleChange = (target) => {
    const { name, value } = target;
    setEditedMaterial(prev => ({
      ...prev,
      [name]: value
    }));
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

  const handleSave = () => {
    onSave(editedMaterial);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedMaterial(material);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (typeof onDelete !== 'function') {
      console.error('onDelete is not a function for EnvironmentDataCard', { id, material });
      return;
    }
    onDelete(id);
    setIsEditing(false);
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2>{material.material_name}</h2>
        <button
          style={{ background: '#ad4a4aff' }}
          onClick={handleDelete}

        >delete</button>
      </div>

      <div className={styles.row}>
        {editableFields.map((key) => (
          <div key={key} className={styles.field}>
            <label className={styles.label}>{key + ":"}</label>
            {isEditing ? (
              <input
                type="text"
                name={key}
                value={editedMaterial[key] ?? ""}
                onChange={(e) => handleChange(e.target)}
                className={styles.input}
                maxLength={fieldLimits[key] || undefined}
              />
            ) : (
              <span className={styles.value}>{material[key] ?? "null"}</span>
            )}
          </div>
        ))}
      </div>
      {!isEditing ? (
        <button
          onClick={() => setIsEditing(true)}
          className={styles.button}
        >
          Edit
        </button>
      ) : (
        <div className={styles.buttonGroup}>
          <button onClick={handleSave} className={styles.button}>Save</button>
          <button onClick={handleCancel} className={styles.button}>Cancel</button>
        </div>
      )}
    </div>
  );
};


export default MaterialCard;