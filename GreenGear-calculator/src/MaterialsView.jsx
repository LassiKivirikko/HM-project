import { useState, useEffect } from "react";
import styles from "./MaterialsView.module.css";
import MaterialCard from "./components/MaterialCard.jsx";
import MaterialAddFormCard from "./components/MaterialAddForm.jsx";
import { useNavigate } from "react-router-dom";

const MaterialsView = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddMatForm, setShowAddMatForm] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || "";
  const BASE_URL = `${API_BASE}/api/v1`;
  const navigate = useNavigate();
  const fetchMaterials = async () => {
    try {
      const res = await fetch(`${BASE_URL}/materials`);
      const data = await res.json();
      setMaterials(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching materials:", error);
      setError(error);
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMaterials();
  }, []);

  const saveToBackend = async (material) => {

    console.log("Saving environmental data for material:", material);
    try {
      const res = await fetch(`${BASE_URL}/materials/${material.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(material),
      });
      fetchMaterials();
    } catch (error) {
      console.error("Error saving material:", error);
      setError(error);
    }
  };

  const handleAddMaterialSave = async (newMaterialData) => {
    const numericFields = [
      "default_co2_per_kg",
      "default_co2_fossil_kg",
      "default_co2_biogenic_kg",
      "default_energy_mj_per_kg",
      "default_cost_per_kg",
      "default_spi",
    ];
    const cleanedData = {
      manually_added: false
    };
    for (const key in newMaterialData) {
      let value = newMaterialData[key];
      if (value === '') {
        value = null;
      }
      if (numericFields.includes(key)) {
        cleanedData[key] = value === null ? null : parseFloat(value);
        if (cleanedData[key] !== null && isNaN(cleanedData[key])) {
          console.warn(`Non-numeric data found for ${key}. Sending as null.`);
          cleanedData[key] = null;
        }

      } else {
        cleanedData[key] = value;
      }
    }

    console.log("Saving NEW material to backend:", cleanedData);

    try {
      const res = await fetch(`${BASE_URL}/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedData),
      });

      if (!res.ok) {
        const errorDetails = await res.json();
        console.error("API Error saving material:", errorDetails);
        throw new Error(`Failed to save material. Server status: ${res.status}.`);
      }
      const savedMaterial = await res.json();
      setShowAddMatForm(false);
      setMaterials(prev => [...prev, savedMaterial.material]);

    } catch (error) {
      console.error("Error saving new material:", error);
      setError(error.message || "An unknown error occurred during save.");
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    try {
      const res = await fetch(`${BASE_URL}/materials/${materialId}`, {
        method: 'DELETE',
      });
      console.log("Delete response status:", res.status);
      fetchMaterials();
    } catch (error) {
      console.error("Error deleting material:", error);
      setError(error);
    }
  }



  const handleAddMaterialCancel = () => {
    setShowAddMatForm(false);
  };

  const addMaterialForm = () => {
    if (!showAddMatForm) return null;
    return (
      <div className={styles.addMaterialForm}>
        <MaterialAddFormCard
          onSave={handleAddMaterialSave}
          onCancel={handleAddMaterialCancel}
        />
      </div>
    )
  }

  return (
    <section className={styles.materialsSection}>
      <button
        onClick={() => navigate('/')}
      >back
      </button>
      <h1>Materials</h1>
      <button onClick={() => setShowAddMatForm(true)}>add material +</button>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>Error loading materials: {error.message}</p>
      ) : (
        <div className={styles.materialsContainer}>
          {addMaterialForm()}
          <h2>update materials:</h2>
          <div className={styles.materialsList}>
            {materials
              .filter((mat) => mat.manually_added === false)
              .map((material) => (
                <MaterialCard key={material.id} material={material} onSave={saveToBackend} onDelete={handleDeleteMaterial} />
              ))}
          </div>

        </div>
      )}
    </section>
  )
};

export default MaterialsView;