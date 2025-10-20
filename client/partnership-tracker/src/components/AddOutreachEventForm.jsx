import React, { useState } from "react";

const AddOutreachEventForm = ({ onEventAdded }) => {
  // State for form data - matches database schema
  const [formData, setFormData] = useState({
    name: "",
    organization_name: "",
    contacts: "",
    target_population: "",
    event_dates: "",
    reoccuring_event: "",
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
    if (!formData.name || !formData.organization_name) {
      setMessage("Name and Organization are required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      // Send POST request to backend
      const res = await fetch("http://localhost:5001/api/add_outreach_event", {
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
        throw new Error(data.message || "Failed to add outreach event");
      }

      // Display success message
      setMessage(data.message || "Outreach event added successfully");
      if (onEventAdded) {
        onEventAdded(data.event);
      }

      // Reset form after successful submission
      setFormData({
        name: "",
        organization_name: "",
        contacts: "",
        target_population: "",
        event_dates: "",
        reoccuring_event: "",
        notes: "",
      });
    } catch (err) {
      console.error("Error adding outreach event:", err);
      setMessage(err.message || "Error adding outreach event");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generic sample data to show as examples
  const examples = {
    name: "John Smith",
    organization: "Community Health Center",
    contacts: "Program Director\njsmith@example.com\n555-123-4567",
    target_population: "Underserved populations, youth at risk",
    event_dates: "Main Street Clinic: 06/15/23\nEastside Center: 07/21/23",
    reoccuring_event:
      "Y - Quarterly testing events, additional events scheduled as needed",
  };

  return (
    <div className="add-partner-form">
      <h2>Add New Outreach Event</h2>

      <div className="form-instructions">
        <h4>Data Format Guidelines</h4>
        <p>Please format your data as follows:</p>
        <ul>
          <li>
            <strong>Name:</strong> Person's name or event title
          </li>
          <li>
            <strong>Organization:</strong> Full organization name
          </li>
          <li>
            <strong>Contact Info:</strong> Include position, email, phone
            (separate with line breaks)
          </li>
          <li>
            <strong>Event Dates:</strong> Include location and date (e.g.,
            "Location: MM/DD/YY")
          </li>
        </ul>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Event name input */}
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

        {/* Organization name input */}
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

        {/* Contact details textarea */}
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
            Include position, email, phone - one item per line
          </small>
        </div>

        {/* Target population textarea */}
        <div>
          <label htmlFor="target_population">Target Population:</label>
          <textarea
            id="target_population"
            name="target_population"
            value={formData.target_population}
            onChange={handleChange}
            placeholder={examples.target_population}
            rows={3}
          />
          <small className="field-hint">
            Describe who this event/outreach serves
          </small>
        </div>

        {/* Event dates input */}
        <div>
          <label htmlFor="event_dates">Event Date(s):</label>
          <textarea
            id="event_dates"
            name="event_dates"
            value={formData.event_dates}
            onChange={handleChange}
            placeholder={examples.event_dates}
            rows={3}
          />
          <small className="field-hint">
            Include location: date format (one per line)
          </small>
        </div>

        {/* Recurring event input with updated label */}
        <div>
          <label htmlFor="reoccuring_event">
            Reoccuring Event? (Y/N) If so, List Frequency:
          </label>
          <textarea
            id="reoccuring_event"
            name="reoccuring_event"
            value={formData.reoccuring_event}
            onChange={handleChange}
            placeholder={examples.reoccuring_event}
            rows={3}
          />
        </div>

        {/* Notes textarea */}
        <div>
          <label htmlFor="notes">Notes:</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Enter detailed notes about interactions, history, and follow-up plans."
            rows={8}
          />
          <small className="field-hint">
            These notes will be viewable in a separate window when viewing event
            details
          </small>
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding..." : "Add Event"}
        </button>
      </form>
      {/* Display success/error message if present */}
      {message && (
        <p
          className={
            message.includes("Error") || message.includes("Failed")
              ? "error"
              : "success"
          }
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default AddOutreachEventForm;
