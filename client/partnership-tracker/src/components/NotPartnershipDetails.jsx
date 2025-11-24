import React, { useState, useEffect } from "react";
import NotesTableModal from "./NotesTableModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

const NotPartnershipDetails = ({
  partner,
  onClose,
  onPartnerUpdated,
  onPartnerDeleted,
}) => {
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({ ...partner });
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

  // Save changes to the partner
  const handleSaveChanges = async () => {
    setIsSaving(true);
    setSaveMessage("");

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(
        `http://localhost:5001/api/update_not_potential_partners/${partner.id}`,
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
        throw new Error(
          data.message || "Failed to update not potential partner"
        );
      }

      setSaveMessage("Not potential partner updated successfully");
      setIsEditing(false);

      // Notify parent component that the partner was updated
      if (onPartnerUpdated) {
        onPartnerUpdated(data.event);
      }
    } catch (err) {
      console.error("Error updating not potential partner:", err);
      setSaveMessage(
        `Error: ${err.message || "Failed to update not potential partner"}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle notes update success
  const handleNotesUpdated = (updatedNotes) => {
    if (onPartnerUpdated) {
      const updatedPartner = {
        ...partner,
        notes: updatedNotes,
      };
      onPartnerUpdated(updatedPartner);
    }
  };

  // Handle successful deletion
  const handleDeleteSuccess = () => {
    // Call the parent component's onPartnerDeleted function if it exists
    if (onPartnerDeleted && typeof onPartnerDeleted === "function") {
      onPartnerDeleted(partner.id);
    }

    // Close the details modal
    onClose();
  };

  // Open delete confirmation modal
  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div 
          className="modal-fixed-layout"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h3>Not Potential Partnership Details</h3>
            <button className="close-button" onClick={onClose}>×</button>
          </div>

          <div className="modal-content-area">
            {isEditing ? (
              <div className="edit-partnership-form" style={{ boxShadow: 'none', padding: 0 }}>
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
                  <label htmlFor="edit-contact-date">Contact Date:</label>
                  <textarea
                    id="edit-contact-date"
                    name="contact_date"
                    value={editFormData.contact_date || ""}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>

                <div className="detail-row">
                  <label htmlFor="edit-contact-attempt">
                    Type of Attempted Contact:
                  </label>
                  <textarea
                    id="edit-contact-attempt"
                    name="contact_attempt"
                    value={editFormData.contact_attempt || ""}
                    onChange={handleChange}
                    rows={3}
                  />
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
                  <strong>Name:</strong> {partner.name || "N/A"}
                </div>

                <div className="detail-row">
                  <strong>Organization:</strong> {partner.organization_name || "N/A"}
                </div>

                <div className="detail-row">
                  <strong>Contact Info:</strong>
                  <div className="contact-info">
                    {formatContacts(partner.contacts)}
                  </div>
                </div>

                <div className="detail-row">
                  <strong>Target Population:</strong>
                  <div>{partner.target_population || "Not specified"}</div>
                </div>

                <div className="detail-row">
                  <strong>Contact Date:</strong> {partner.contact_date || "N/A"}
                </div>

                <div className="detail-row">
                  <strong>Type of Attempted Contact:</strong>{" "}
                  {partner.contact_attempt || "Not specified"}
                </div>

                <div className="detail-row">
                  <strong>Notes:</strong>
                  {partner.notes && partner.notes.trim() ? (
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
              </>
            )}
          </div>

          <div className="modal-footer">
            <div className="actions" style={{ margin: 0 }}>
              {isEditing ? (
                <>
                  <button
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    className="save-button"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={() => {
                      setEditFormData({ ...partner });
                      setIsEditing(false);
                    }}
                    className="cancel-button"
                  >
                    Cancel
                  </button>
                  <button onClick={handleDeleteClick} className="delete-button">
                    Delete Not Potential Partner
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setIsEditing(true)} className="blue-button">
                    Edit Details
                  </button>
                  <button onClick={onClose} className="red-button">
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Use the NotesTableModal component */}
      <NotesTableModal
        isOpen={showNotesModal}
        onClose={() => setShowNotesModal(false)}
        objectId={partner.id}
        objectType="notpotentialpartnerships"
        objectName={partner.organization_name || partner.name}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        table="notpotentialpartnerships"
        id={partner.id}
        itemName={partner.name || "this not potential partner"}
        onDeleteSuccess={handleDeleteSuccess}
      />
    </>
  );
};

export default NotPartnershipDetails;
