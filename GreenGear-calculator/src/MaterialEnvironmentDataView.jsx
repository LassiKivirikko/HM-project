import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styles from './MaterialsView.module.css';
import MaterialCard from './components/EnvironmentDataCard.jsx';
import EnvironmentDataAddForm from './components/EnvironmentDataAddForm.jsx';
import { useNavigate } from 'react-router-dom';

const MaterialEnvironmentDataView = () => {
  const { materialId } = useParams();
  const [environmentData, setEnvironmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_BASE = import.meta.env.VITE_API_URL || "";
  const BASE_URL = `${API_BASE}/api/v1`;
  const [materialName, setMaterialName] = useState("");
  const [showAddMatForm, setShowAddMatForm] = useState(false);
  const navigate = useNavigate();

  const fetchEnvironmentData = async () => {
    try {
      const res = await fetch(`${BASE_URL}/environment_data/material/${materialId}`);
      const data = await res.json();
      setEnvironmentData(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching material environment data:", error);
      setError(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnvironmentData();
    fetchName(materialId).then(name => setMaterialName(name));
  }, [materialId]);

  const fetchName = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/materials/${id}`);
      const data = await res.json();
      console.log("Fetched material name:", data.name);
      return data[0].name;
    } catch (error) {
      console.error("Error fetching material name:", error);
      return "Unknown Material";
    }
  };

  const saveToBackend = async (data) => {

    console.log("Saving material:", data);
    try {
      const res = await fetch(`${BASE_URL}/environment_data/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      fetchEnvironmentData();
    } catch (error) {
      console.error("Error saving material:", error);
      setError(error);
    }
  };

  const handleAdd = async (newData) => {
    const numericFields = [
      "co2_fossil_kg",
      "co2_biogenic_kg",
      "co2_per_kg",
      "energy_per_kg_mj",
      "cost_per_kg",
      "spi",
    ];

    const cleanedData = {
      material_id: parseInt(materialId),
      manually_added: false,
      material_name: materialName
    };

    for (const key in newData) {
      let value = newData[key];

      if (numericFields.includes(key)) {
        if (value === '' || value === undefined || value === null) {
          cleanedData[key] = null;
        } else {
          cleanedData[key] = parseFloat(value);
          if (isNaN(cleanedData[key])) {
            cleanedData[key] = null;
            console.warn(`Value for ${key} could not be parsed as a number: ${newData[key]}`);
          }
        }
      } else {
        cleanedData[key] = value === '' ? null : value;
      }
    }

    console.log("Saving NEW dataset to backend:", cleanedData);

    try {
      const res = await fetch(`${BASE_URL}/environment_data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedData),
      });

      if (!res.ok) {
        const errorBody = await res.json();
        console.error("API Error during save:", errorBody);
        throw new Error(`Failed to save data. Server responded with ${res.status}`);
      }
      const savedData = await res.json();
      setShowAddMatForm(false);
      setEnvironmentData(prev => [...prev, savedData.environment_data]);
    } catch (error) {
      console.error("Error saving new material:", error);
    }
  };

  const handleAddCancel = () => {
    setShowAddMatForm(false);
  };

  const addMaterialForm = () => {
    if (!showAddMatForm) return null;
    return (
      <div className={styles.addMaterialForm}>
        <EnvironmentDataAddForm
          onSave={handleAdd}
          onCancel={handleAddCancel}
          name={materialName}
        />
      </div>
    )
  }

  const handleDelete = async (dataId) => {
    try {
      const res = await fetch(`${BASE_URL}/environment_data/${dataId}`, { method: 'DELETE' });
      if (res.status === 204) {
        fetchEnvironmentData();
        return;
      }
      const bodyText = await res.text().catch(() => '');
      if (res.status === 404) {
        alert('Dataset not found or already deleted.');
      } else if (res.status === 400) {
        alert('Delete failed (bad request). Please verify the dataset ID.');
      } else if (!res.ok) {
        alert('Server error deleting dataset.');
        console.error(`Delete failed ${res.status}: ${bodyText}`);
      } else {
        fetchEnvironmentData();
      }
    } catch (error) {
      console.error('Error deleting dataset:', error);
      setError(error);
    }
  };

  return (
    <section className={styles.materialsSection}>
      <button onClick={() => navigate('/materials')}>back</button>
      <h1>datasets for {materialName}</h1>
      <button onClick={() => setShowAddMatForm(true)}>add dataset +</button>
      {addMaterialForm()}
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>Error loading materials: {error.message}</p>
      ) : (
        <div className={styles.materialsContainer}>
          <h2>update materials:</h2>
          <div className={styles.materialsList}>
              {environmentData.map((data) => (
                <MaterialCard
                  key={data.id}
                  id={data.id}
                  material={data}
                  onSave={saveToBackend}
                  onDelete={handleDelete}
                />
              ))}
          </div>

        </div>
      )}
    </section>
  )
};

export default MaterialEnvironmentDataView;