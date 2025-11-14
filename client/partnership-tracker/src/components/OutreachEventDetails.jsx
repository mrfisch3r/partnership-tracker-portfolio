import React, { useState, useEffect } from "react";
import NotesTableModal from "./NotesTableModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

const OutreachEventDetails = ({
  event,
  onClose,
  onEventUpdated,
  onEventDeleted,
}) => {
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editFormData, setEditFormData] = useState({ ...event });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
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

  // Format contact information for better readability
  const formatContacts = (contacts) => {
    if (!contacts) return "No contact information available";

    // Replace newlines with proper HTML line breaks
    return contacts.split("\n").map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < contacts.split("\n").length - 1 && <br />}
      </React.Fragment>
    ));
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value,
    });
  };

  // Save changes to the event
  const handleSaveChanges = async () => {
    setIsSaving(true);
    setSaveMessage("");

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(
        `http://localhost:5001/api/update_outreach_event/${event.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(editFormData),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update event");
      }

      setSaveMessage("Event updated successfully");
      setIsEditing(false);

      // Notify parent component that the event was updated
      if (onEventUpdated) {
        onEventUpdated(data.event);
      }
    } catch (err) {
      console.error("Error updating event:", err);
      setSaveMessage(`Error: ${err.message || "Failed to update event"}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle notes update success
  const handleNotesUpdated = (updatedNotes) => {
    if (onEventUpdated) {
      const updatedEvent = {
        ...event,
        notes: updatedNotes,
      };
      onEventUpdated(updatedEvent);
    }
  };

  // Handle successful deletion
  const handleDeleteSuccess = () => {
    // Call the parent component's onEventDeleted function if it exists
    if (onEventDeleted && typeof onEventDeleted === "function") {
      onEventDeleted(event.id);
    }

    // Close the details modal
    onClose();
  };

  // Open delete confirmation modal
  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  return (
    <div className="partner-details">
      {/* Close button in top right corner */}
      <button className="close-button" onClick={onClose}>
        X
      </button>
      <h3>Outreach Event Details</h3>

      {isEditing ? (
        <div className="edit-event-form">
          {/* Edit form fields */}
          <div className="detail-row">
            <label htmlFor="edit-name">Name:</label>
            <input
              id="edit-name"
              name="name"
              value={editFormData.name || ""}
              onChange={handleChange}
            />
          </div>

          <div className="detail-row">
            <label htmlFor="edit-organization">Organization:</label>
            <input
              id="edit-organization"
              name="organization_name"
              value={editFormData.organization_name || ""}
              onChange={handleChange}
            />
          </div>

          <div className="detail-row">
            <label htmlFor="edit-contacts">Contact Info:</label>
            <textarea
              id="edit-contacts"
              name="contacts"
              value={editFormData.contacts || ""}
              onChange={handleChange}
              rows={4}
            />
          </div>

          <div className="detail-row">
            <label htmlFor="edit-target-population">Target Population:</label>
            <select
              id="edit-target-population"
              name="target_population"
              value={editFormData.target_population || ""}
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

          <div className="detail-row">
            <label htmlFor="edit-event-dates">Event Date(s):</label>
            <textarea
              id="edit-event-dates"
              name="event_dates"
              value={editFormData.event_dates || ""}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="detail-row">
            <label htmlFor="edit-reoccuring-event">
              Reoccuring Event? (Y/N) If so, List Frequency:
            </label>
            <textarea
              id="edit-reoccuring-event"
              name="reoccuring_event"
              value={editFormData.reoccuring_event || ""}
              onChange={handleChange}
              rows={3}
            />
          </div>

          {/* Edit mode actions with delete button */}
          <div className="actions">
            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="save-button"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={() => {
                setEditFormData({ ...event });
                setIsEditing(false);
              }}
              className="cancel-button"
            >
              Cancel
            </button>
            <button onClick={handleDeleteClick} className="delete-button">
              Delete Event
            </button>
          </div>

          {/* Display save message */}
          {saveMessage && (
            <p
              className={
                saveMessage.includes("Error")
                  ? "error-message"
                  : "success-message"
              }
            >
              {saveMessage}
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Display-only view */}
          <div className="detail-row">
            <strong>Name:</strong> {event.name || "N/A"}
          </div>

          <div className="detail-row">
            <strong>Organization:</strong> {event.organization_name || "N/A"}
          </div>

          <div className="detail-row">
            <strong>Contact Info:</strong>
            <div className="contact-info">{formatContacts(event.contacts)}</div>
          </div>

          <div className="detail-row">
            <strong>Target Population:</strong>
            <div>{event.target_population || "Not specified"}</div>
          </div>

          <div className="detail-row">
            <strong>Event Date(s):</strong> {event.event_dates || "N/A"}
          </div>

          <div className="detail-row">
            <strong>Reoccuring Event? (Y/N) If so, List Frequency:</strong>{" "}
            {event.reoccuring_event || "No"}
          </div>

          <div className="detail-row">
            <strong>Notes:</strong>
            {event.notes && event.notes.trim() ? (
              <button
                className="view-notes-button"
                onClick={() => setShowNotesModal(true)}
              >
                View Notes
              </button>
            ) : (
              <div>No notes available</div>
            )}
          </div>

          {/* View mode actions - only Edit button and Close */}
          <div className="actions">
            <button onClick={() => setIsEditing(true)} className="blue-button">
              Edit Details
            </button>
            <button onClick={onClose} className="red-button">
              Close
            </button>
          </div>
        </>
      )}

      {/* Use the NotesTableModal component */}
      <NotesTableModal
        isOpen={showNotesModal}
        onClose={() => setShowNotesModal(false)}
        objectId={event.id}
        objectType="siteevents"
        objectName={event.organization_name || event.name}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        table="outreachevents"
        id={event.id}
        itemName={event.name || "this event"}
        onDeleteSuccess={handleDeleteSuccess}
      />
    </div>
  );
};

export default OutreachEventDetails;
