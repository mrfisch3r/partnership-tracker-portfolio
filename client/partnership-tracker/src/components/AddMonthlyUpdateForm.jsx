import React, { useState } from "react";

const AddMonthlyUpdateForm = ({ onUpdateAdded }) => {
  // State for form data - matches database schema
  const [formData, setFormData] = useState({
    month_year: "",
    major_findings: "",
    barriers_and_solutions: "",
    notes: "",
  });

  // State for displaying success/error messages
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle changes to any form field
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!formData.month_year) {
      setMessage("Month/Year is a required field");
      return;
    }

    try {
      setIsSubmitting(true);
      // Send POST request to backend
      const res = await fetch("http://localhost:5001/api/add_monthly_update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      // Handle unsuccessful response
      if (!res.ok) {
        throw new Error(data.message || "Failed to add monthly update");
      }

      // Display success message
      setMessage(data.message || "Monthly update added successfully");
      if (onUpdateAdded) {
        onUpdateAdded(data.update);
      }

      // Reset form after successful submission
      setFormData({
        month_year: "",
        major_findings: "",
        barriers_and_solutions: "",
        notes: "",
      });
    } catch (err) {
      console.error("Error adding monthly update:", err);
      setMessage(err.message || "Error adding monthly update");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generic sample data to show as examples (not the real examples)
  const examples = {
    month_year: "MMM-YY (e.g., Jan-24)",
    major_findings:
      "Summary of important trends, successes, or insights identified during the month...",
    barriers_and_solutions:
      "Description of challenges encountered and steps taken to address them...",
    notes:
      "Any additional information that should be recorded for this month...",
  };

  return (
    <div className="add-partner-form">
      <h2>Add New Monthly Update</h2>

      <div className="form-instructions">
        <h4>Data Format Guidelines</h4>
        <p>Please format your data as follows:</p>
        <ul>
          <li>
            <strong>Month/Year:</strong> Use format MMM-YY (e.g., Jan-24,
            Feb-24)
          </li>
          <li>
            <strong>Major Findings:</strong> Include key insights related to
            reaching target populations
          </li>
          <li>
            <strong>Barriers & Solutions:</strong> Document challenges and how
            they were addressed
          </li>
          <li>
            <strong>Notes:</strong> Any additional information important for the
            monthly record
          </li>
        </ul>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Month/Year input */}
        <div>
          <label htmlFor="month_year">Month/Year:</label>
          <input
            id="month_year"
            type="text"
            name="month_year"
            value={formData.month_year}
            onChange={handleChange}
            required
            placeholder={examples.month_year}
          />
          <small className="field-hint">
            Format as MMM-YY (e.g., Jan-24, Feb-24)
          </small>
        </div>

        {/* Major Findings textarea */}
        <div>
          <label htmlFor="major_findings">
            Any Major Findings in Reaching Target Population(s)?
          </label>
          <textarea
            id="major_findings"
            name="major_findings"
            value={formData.major_findings}
            onChange={handleChange}
            placeholder={examples.major_findings}
            rows={8}
          />
          <small className="field-hint">
            Describe key trends, successes, or insights identified this month
          </small>
        </div>

        {/* Barriers & Solutions textarea */}
        <div>
          <label htmlFor="barriers_and_solutions">
            Barriers Encountered and How the Barriers Were or Can Be Addressed:
          </label>
          <textarea
            id="barriers_and_solutions"
            name="barriers_and_solutions"
            value={formData.barriers_and_solutions}
            onChange={handleChange}
            placeholder={examples.barriers_and_solutions}
            rows={8}
          />
          <small className="field-hint">
            Document challenges and how they were or will be addressed
          </small>
        </div>

        {/* Notes textarea */}
        <div>
          <label htmlFor="notes">
            Other Additional Notes to Share from your County for the Month?
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder={examples.notes}
            rows={8}
          />
          <small className="field-hint">
            Any additional information important for the monthly record
          </small>
        </div>

        <button type="submit" className="blue-button" disabled={isSubmitting}>
          {isSubmitting ? "Adding..." : "Add Monthly Update"}
        </button>
      </form>
      {/* Display success/error message if present */}
      {message && (
        <p
          className={
            message.includes("Error") || message.includes("Failed")
              ? "error-message"
              : "success-message"
          }
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default AddMonthlyUpdateForm;
