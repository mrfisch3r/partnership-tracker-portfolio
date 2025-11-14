import React, { useState, useEffect } from "react";

const AddNotPartnershipForm = ({ onPartnerAdded }) => {
  const [formData, setFormData] = useState({
    name: "",
    organization_name: "",
    contacts: "",
    target_population: "",
    contact_date: "",
    contact_attempt: "",
    notes: "",
  });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [targetPopulations, setTargetPopulations] = useState([]);

  useEffect(() => {
    // Fetch target populations on component mount
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name || !formData.organization_name) {
      setMessage("Name and Organization are required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("access_token");
      const res = await fetch(
        "http://localhost:5001/api/add_not_potential_partner",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to add not potential partner");
      }

      setMessage(data.message || "Not potential partner added successfully");
      if (onPartnerAdded) {
        onPartnerAdded(data.not_potential_partner);
      }

      // Clear form on success
      setFormData({
        name: "",
        organization_name: "",
        contacts: "",
        target_population: "",
        contact_date: "",
        contact_attempt: "",
        notes: "",
      });
    } catch (err) {
      console.error("Error adding not potential partner:", err);
      setMessage(err.message || "Error adding not potential partner");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generic example data for placeholders
  const examples = {
    name: "Contact Name",
    organization: "Organization Name",
    contacts: "Phone: 555-123-4567\nEmail: contact@example.org",
    target_population: "Description of population served",
    contact_date: "MM/DD/YYYY",
    contact_attempt: "Phone call, email, in-person meeting",
  };

  return (
    <div className="add-partner-form">
      <h2>Add New Not Potential Partnership</h2>

      <div className="form-instructions">
        <h4>Data Format Guidelines</h4>
        <p>Please format your data as follows:</p>
        <ul>
          <li>
            <strong>Name:</strong> Individual contact name(s)
          </li>
          <li>
            <strong>Organization:</strong> Full organization name
          </li>
          <li>
            <strong>Contact Info:</strong> Include phone, email, etc. (separate
            with line breaks)
          </li>
          <li>
            <strong>Contact Date:</strong> Date of most recent contact
            (MM/DD/YYYY format)
          </li>
          <li>
            <strong>Type of Attempted Contact:</strong> Methods used to contact
            the organization
          </li>
        </ul>
      </div>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Name:</label>
          <input
            id="name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder={examples.name}
          />
        </div>

        <div>
          <label htmlFor="organization_name">Organization:</label>
          <input
            id="organization_name"
            type="text"
            name="organization_name"
            value={formData.organization_name}
            onChange={handleChange}
            required
            placeholder={examples.organization}
          />
        </div>

        <div>
          <label htmlFor="contacts">Contact Info:</label>
          <textarea
            id="contacts"
            name="contacts"
            value={formData.contacts}
            onChange={handleChange}
            placeholder={examples.contacts}
            rows={4}
          />
          <small className="field-hint">
            Include phone, email, address - one item per line
          </small>
        </div>

        <div>
          <label htmlFor="target_population">Target Population:</label>
          <select
            id="target_population"
            name="target_population"
            value={formData.target_population}
            onChange={handleChange}
            required
          >
            <option value="">Select target population...</option>
            {targetPopulations.map((pop) => (
              <option key={pop.id} value={pop.name}>
                {pop.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="contact_date">Contact Date:</label>
          <input
            id="contact_date"
            type="text"
            name="contact_date"
            value={formData.contact_date}
            onChange={handleChange}
            placeholder={examples.contact_date}
          />
          <small className="field-hint">Format as MM/DD/YYYY</small>
        </div>

        <div>
          <label htmlFor="contact_attempt">Type of Attempted Contact:</label>
          <textarea
            id="contact_attempt"
            name="contact_attempt"
            value={formData.contact_attempt}
            onChange={handleChange}
            placeholder={examples.contact_attempt}
            rows={3}
          />
          <small className="field-hint">
            Describe methods used to attempt contact
          </small>
        </div>

        <div>
          <label htmlFor="notes">Notes:</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Enter detailed notes about why this is not a potential partnership and any other relevant information"
            rows={8}
          />
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding..." : "Add Not Potential Partner"}
        </button>
      </form>

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

export default AddNotPartnershipForm;
