import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MaterialCard.module.css';

const MaterialCard = ({ material, onSave, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMaterial, setEditedMaterial] = useState(material);
  const navigate = useNavigate();

  const handleChange = (target) => {
    const { name, value } = target;
    setEditedMaterial(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const editableFields = [
    "name",
  ];

  const handleSave = () => {
    onSave(editedMaterial);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedMaterial(material);
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete(material.id);
    setIsEditing(false);
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2>{material.name}</h2>
        {isEditing && (
          <button style={{ background: '#ad4a4aff' }}
            onClick={handleDelete}
          >
            delete
          </button>
        )}
        <button
          onClick={() => navigate(`/materials/${material.id}/datasets`)}
        >view datasets</button>
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
              />
            ) : (
              <span className={styles.value}>{editedMaterial[key] ?? "null"}</span>
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