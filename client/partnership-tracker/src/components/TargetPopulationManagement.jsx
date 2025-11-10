import React, { useState, useEffect } from "react";

const TargetPopulationManagement = () => {
  const [populations, setPopulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [newPopulationName, setNewPopulationName] = useState("");

  useEffect(() => {
    fetchPopulations();
  }, []);

  const fetchPopulations = async () => {
    try {
      const res = await fetch(
        "http://localhost:5001/api/target_populations"
      );

      if (!res.ok) {
        throw new Error("Failed to fetch target populations");
      }

      const data = await res.json();
      setPopulations(data.target_populations || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching target populations:", err);
      setError(err.message || "Failed to load target populations");
      setLoading(false);
    }
  };

  const handleAddPopulation = async (e) => {
    e.preventDefault();
    
    if (!newPopulationName.trim()) {
      setError("Please enter a target population name");
      return;
    }

    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch(
        "http://localhost:5001/api/target_populations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({ name: newPopulationName.trim() }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add target population");
      }

      const data = await res.json();
      setSuccessMessage(data.message);
      setNewPopulationName("");

      // Refresh populations list
      await fetchPopulations();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error adding target population:", err);
      setError(err.message || "Failed to add target population");
    }
  };

  const handleDeletePopulation = async (populationId, populationName) => {
    if (!window.confirm(`Are you sure you want to delete "${populationName}"? This action cannot be undone.`)) {
      return;
    }

    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch(
        `http://localhost:5001/api/target_populations/${populationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete target population");
      }

      const data = await res.json();
      setSuccessMessage(data.message);

      // Refresh populations list
      await fetchPopulations();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error deleting target population:", err);
      setError(err.message || "Failed to delete target population");
    }
  };

  if (loading) {
    return (
      <div className="target-population-management">
        <h2>Target Population Management</h2>
        <p>Loading target populations...</p>
      </div>
    );
  }

  return (
    <div className="target-population-management">
      <h2>Target Population Management</h2>
      <p className="management-description">
        Manage target population options that appear in dropdowns when adding or editing entries.
      </p>

      {error && <div className="error-message">{error}</div>}
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

      <div className="add-population-form">
        <h3>Add New Target Population</h3>
        <form onSubmit={handleAddPopulation}>
          <div className="form-row">
            <input
              type="text"
              value={newPopulationName}
              onChange={(e) => setNewPopulationName(e.target.value)}
              placeholder="Enter target population name"
              className="population-input"
            />
            <button type="submit" className="add-population-button">
              Add
            </button>
          </div>
        </form>
      </div>

      <div className="populations-table-container">
        <table className="populations-table">
          <thead>
            <tr>
              <th>Target Population</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {populations.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ textAlign: "center", padding: "2rem", color: "#666" }}>
                  No target populations added yet. Add one above to get started.
                </td>
              </tr>
            ) : (
              populations.map((population) => (
                <tr key={population.id}>
                  <td>
                    <strong>{population.name}</strong>
                  </td>
                  <td>
                    {new Date(population.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </td>
                  <td>
                    <button
                      onClick={() => handleDeletePopulation(population.id, population.name)}
                      className="delete-population-button"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TargetPopulationManagement;

