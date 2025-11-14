import React, { useState, useEffect } from "react";
import html2pdf from "html2pdf.js";

const Sidebar = ({ onFilterChange }) => {
  const [organization, setOrganization] = useState("");
  const [targetPopulations, setTargetPopulations] = useState([]);
  const [selectedPopulations, setSelectedPopulations] = useState([]);
  const [dateFilterType, setDateFilterType] = useState("all");
  const [dateComparison, setDateComparison] = useState("after");
  const [customMonth, setCustomMonth] = useState("");
  const [customDay, setCustomDay] = useState("");
  const [customYear, setCustomYear] = useState("");
  const [showPopulationDropdown, setShowPopulationDropdown] = useState(false);

  // Fetch target populations on component mount
  useEffect(() => {
    const fetchTargetPopulations = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/target_populations");
        if (res.ok) {
          const data = await res.json();
          setTargetPopulations(data.target_populations || []);
        }
      } catch (err) {
        console.error("Error fetching target populations:", err);
      }
    };
    fetchTargetPopulations();
  }, []);

  // Update organization filter and notify parent component
  const handleOrganizationChange = (e) => {
    const newOrganization = e.target.value;
    setOrganization(newOrganization);
    onFilterChange({
      organization: newOrganization,
      targetPopulations: selectedPopulations,
      dateFilterType,
      dateComparison,
      customMonth,
      customDay,
      customYear,
    });
  };

  // Handle checkbox toggle for target populations
  const handlePopulationToggle = (populationName) => {
    let updatedSelections;
    if (selectedPopulations.includes(populationName)) {
      updatedSelections = selectedPopulations.filter(
        (p) => p !== populationName
      );
    } else {
      updatedSelections = [...selectedPopulations, populationName];
    }
    setSelectedPopulations(updatedSelections);
    onFilterChange({
      organization,
      targetPopulations: updatedSelections,
      dateFilterType,
      dateComparison,
      customMonth,
      customDay,
      customYear,
    });
  };

  // Update date filter
  const handleDateFilterTypeChange = (e) => {
    const newType = e.target.value;
    setDateFilterType(newType);
    updateFilters({
      dateFilterType: newType,
      dateComparison,
      customMonth,
      customDay,
      customYear,
    });
  };

  const handleDateComparisonChange = (e) => {
    const newComparison = e.target.value;
    setDateComparison(newComparison);
    updateFilters({
      dateFilterType,
      dateComparison: newComparison,
      customMonth,
      customDay,
      customYear,
    });
  };

  const handleCustomDateChange = (field, value) => {
    switch (field) {
      case "month":
        setCustomMonth(value);
        break;
      case "day":
        setCustomDay(value);
        break;
      case "year":
        setCustomYear(value);
        break;
    }
    updateFilters({
      dateFilterType,
      dateComparison,
      customMonth: field === "month" ? value : customMonth,
      customDay: field === "day" ? value : customDay,
      customYear: field === "year" ? value : customYear,
    });
  };

  // Helper function to update filters
  const updateFilters = (dateFilter) => {
    onFilterChange({
      organization,
      targetPopulations: selectedPopulations,
      ...dateFilter,
    });
  };

  // Handle print button click
  const handlePrint = () => {
    window.print();
  };

  // Handle export to PDF
  const handleExportPDF = () => {
    // Get the main table content
    const contentElement = document.querySelector(".partnership-table");

    if (!contentElement) {
      alert(
        "No content found to export. Please ensure you are viewing a table."
      );
      return;
    }

    // Create a clone of the element to avoid modifying the original
    const clonedContent = contentElement.cloneNode(true);

    // Remove any instruction text from the clone
    const instructions = clonedContent.querySelector(".table-instructions");
    if (instructions) {
      instructions.remove();
    }

    // Set PDF generation options
    const options = {
      margin: 10,
      filename: "partnership-data-export.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
    };

    // Generate PDF
    html2pdf().from(clonedContent).set(options).save();
  };

  return (
    <aside className="sidebar">
      <h2>Filters</h2>

      <div className="filter-section">
        <label htmlFor="organization-filter">Organization:</label>
        <input
          id="organization-filter"
          type="text"
          value={organization}
          onChange={handleOrganizationChange}
          placeholder="Type to filter by organization"
        />
      </div>

      <div className="filter-section">
        <label>Target Population:</label>
        <div className="population-filter-container">
          <button
            className="population-filter-toggle"
            onClick={() => setShowPopulationDropdown(!showPopulationDropdown)}
            type="button"
          >
            {selectedPopulations.length === 0
              ? "All Populations"
              : `${selectedPopulations.length} selected`}
            <span
              className={`dropdown-arrow ${
                showPopulationDropdown ? "open" : ""
              }`}
            >
              ▼
            </span>
          </button>
          {showPopulationDropdown && (
            <div className="population-checklist">
              {targetPopulations.length === 0 ? (
                <div className="population-empty">
                  No target populations configured. Admins can add them in the
                  Admin panel.
                </div>
              ) : (
                targetPopulations.map((pop) => (
                  <label key={pop.id} className="population-checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedPopulations.includes(pop.name)}
                      onChange={() => handlePopulationToggle(pop.name)}
                    />
                    <span>{pop.name}</span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="filter-section">
        <label>Date:</label>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <select
            id="date-filter-type"
            value={dateFilterType}
            onChange={handleDateFilterTypeChange}
            style={{
              width: "100%",
              padding: "0.6rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          >
            <option value="all">All Time</option>
            <option value="custom">Custom Date</option>
          </select>

          {dateFilterType === "custom" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <select
                id="date-comparison"
                value={dateComparison}
                onChange={handleDateComparisonChange}
                style={{
                  width: "100%",
                  padding: "0.6rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              >
                <option value="before">Before</option>
                <option value="after">After</option>
              </select>

              <div
                style={{
                  display: "flex",
                  gap: "0.48rem",
                  alignItems: "center",
                }}
              >
                <input
                  type="text"
                  placeholder="MM"
                  value={customMonth}
                  onChange={(e) =>
                    handleCustomDateChange("month", e.target.value)
                  }
                  maxLength="2"
                  style={{
                    width: "48px",
                    padding: "0.5rem",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    textAlign: "center",
                    fontSize: "0.9rem",
                  }}
                />
                <span style={{ fontSize: "0.95rem", color: "#666" }}>/</span>
                <input
                  type="text"
                  placeholder="DD"
                  value={customDay}
                  onChange={(e) =>
                    handleCustomDateChange("day", e.target.value)
                  }
                  maxLength="2"
                  style={{
                    width: "48px",
                    padding: "0.5rem",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    textAlign: "center",
                    fontSize: "0.9rem",
                  }}
                />
                <span style={{ fontSize: "0.95rem", color: "#666" }}>/</span>
                <input
                  type="text"
                  placeholder="YYYY"
                  value={customYear}
                  onChange={(e) =>
                    handleCustomDateChange("year", e.target.value)
                  }
                  maxLength="4"
                  style={{
                    width: "66px",
                    padding: "0.5rem",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    textAlign: "center",
                    fontSize: "0.9rem",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="sidebar-actions">
        <button onClick={handlePrint} className="sidebar-button">
          Print View
        </button>
        <button onClick={handleExportPDF} className="sidebar-button">
          Export to PDF
        </button>
      </div>

      <div className="sidebar-help">
        <h3>Quick Help</h3>
        <p>Click on any row to view details.</p>
        <p>Use filters above to narrow down results.</p>
        <p>Add new partnerships using the "Add New" button.</p>
      </div>
    </aside>
  );
};

export default Sidebar;
