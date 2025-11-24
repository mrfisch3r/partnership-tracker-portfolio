import React, { useState, useEffect } from "react";
import NotesTableModal from "./NotesTableModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

const PartnershipDetails = ({
  partner,
  onClose,
  onComments,
  onPartnerUpdated,
  onPartnerDeleted,
}) => {
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({ ...partner });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [showContactHistory, setShowContactHistory] = useState(false);
  const [targetPopulations, setTargetPopulations] = useState([]);

  const normalizePartner = (partnerObj) => {
    if (!partnerObj) return partnerObj;
    const normalized = { ...partnerObj };

    if (
      normalized.organization_name === undefined &&
      normalized["organization name"] !== undefined
    ) {
      normalized.organization_name = normalized["organization name"];
    }

    if (
      normalized.target_population === undefined &&
      normalized["target population"] !== undefined
    ) {
      normalized.target_population = normalized["target population"];
    }

    if (
      normalized.contact_date === undefined &&
      normalized["contact date"] !== undefined
    ) {
      normalized.contact_date = normalized["contact date"];
    }

    if (
      normalized.next_contact === undefined &&
      normalized["next contact"] !== undefined
    ) {
      normalized.next_contact = normalized["next contact"];
    }

    return normalized;
  };

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

  // Process contact date history
  const parseContactHistory = (contactDateStr) => {
    if (!contactDateStr) return [];

    // Split by semicolons, line breaks, or other common separators
    const entries = contactDateStr
      .split(/[;\n]/)
      .map((entry) => entry.trim())
      .filter((entry) => entry);

    // Extract date patterns and format as entries
    return entries.map((entry) => {
      // Try to find date pattern
      const datePattern = /(\d{1,2}\/\d{1,2}\/\d{2,4})/;
      const dateMatch = entry.match(datePattern);

      if (dateMatch) {
        const date = dateMatch[0];
        const contact = entry.replace(date, "").trim();
        return { date, contact };
      }

      return { date: "", contact: entry };
    });
  };

  // Get most recent contact date
  const getMostRecentContact = (contactDateStr) => {
    if (!contactDateStr) return "No contact date recorded";

    const history = parseContactHistory(contactDateStr);
    if (history.length === 0) return contactDateStr;

    // Return the last entry (most recent) in formatted form
    const lastEntry = history[history.length - 1];
    if (lastEntry.date) {
      return `${lastEntry.date} - ${lastEntry.contact}`;
    }
    return lastEntry.contact;
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value,
    });
  };

  // Clean contact date history by removing trailing punctuation
  const cleanContactDateHistory = (contactDateStr) => {
    if (!contactDateStr) return contactDateStr;

    // Split by common separators, clean each entry, and rejoin
    const entries = contactDateStr
      .split(/[;\n]/)
      .map((entry) => entry.trim())
      .filter((entry) => entry);

    const cleanedEntries = entries.map((entry) => {
      // Remove trailing punctuation like :, -, etc.
      return entry.replace(/[;:,\s]*$/, "").trim();
    });

    return cleanedEntries.join("; ");
  };

  // Save changes to the partnership
  const handleSaveChanges = async () => {
    setIsSaving(true);
    setSaveMessage("");

    // Clean the contact date history before saving
    const cleanedFormData = {
      ...editFormData,
      contact_date: cleanContactDateHistory(editFormData.contact_date),
    };

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(
        `http://localhost:5001/api/update_potential_partners/${partner.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(cleanedFormData),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update partnership");
      }

      const updatedPartnerRaw = data.partner ?? data.event;
      if (!updatedPartnerRaw) {
        throw new Error("Server response missing updated partnership data");
      }

      const updatedPartner = normalizePartner(updatedPartnerRaw);
      if (!updatedPartner) {
        throw new Error("Server response missing updated partnership data");
      }

      setSaveMessage("Partnership updated successfully");
      setIsEditing(false);
      setEditFormData(updatedPartner);

      // Notify parent component that the partnership was updated
      if (onPartnerUpdated) {
        onPartnerUpdated(updatedPartner);
      }
    } catch (err) {
      console.error("Error updating partnership:", err);
      setSaveMessage(`Error: ${err.message || "Failed to update partnership"}`);
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

  // Toggle contact history visibility
  const toggleContactHistory = () => {
    setShowContactHistory(!showContactHistory);
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
            <h3>Potential Partnership Details</h3>
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
                  <label htmlFor="edit-contact-date">Contact Date History:</label>
                  <textarea
                    id="edit-contact-date"
                    name="contact_date"
                    value={editFormData.contact_date || ""}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Enter contact history in format: Method: MM/DD/YYYY"
                  />
                  <small className="field-hint">
                    Enter each contact on a new line or separate with semicolons
                  </small>
                </div>

                <div className="detail-row">
                  <label htmlFor="edit-next-contact">Next Contact Plan:</label>
                  <textarea
                    id="edit-next-contact"
                    name="next_contact"
                    value={editFormData.next_contact || ""}
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
                  <strong>Organization:</strong>{" "}
                  {partner.organization_name || "N/A"}
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
                  <strong>Most Recent Contact:</strong>
                  <div>
                    {getMostRecentContact(partner.contact_date)}
                    <button
                      className="view-history-button"
                      onClick={toggleContactHistory}
                      style={{ marginLeft: "10px" }}
                    >
                      {showContactHistory ? "Hide History" : "View History"}
                    </button>

                    {showContactHistory && (
                      <div className="contact-history-container">
                        <h4>Contact History</h4>
                        <ul className="contact-history-list">
                          {parseContactHistory(partner.contact_date).map(
                            (entry, index) => (
                              <li key={index}>
                                {entry.date ? (
                                  <>
                                    <strong>{entry.date}</strong>: {entry.contact}
                                  </>
                                ) : (
                                  entry.contact
                                )}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="detail-row">
                  <strong>Next Contact Plan:</strong>{" "}
                  {partner.next_contact || "No plan specified"}
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
                    Delete Partnership
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setIsEditing(true)} className="blue-button">
                    Edit Details
                  </button>
                  <button className="red-button" onClick={onClose}>
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
        objectType="potentialpartnerships"
        objectName={partner.organization_name || partner.name}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        table="potentialpartnerships"
        id={partner.id}
        itemName={partner.name || "this partnership"}
        onDeleteSuccess={handleDeleteSuccess}
      />
    </>
  );
};

export default PartnershipDetails;
