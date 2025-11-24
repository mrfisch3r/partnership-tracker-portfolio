import React, { useState } from "react";
import NotesTableModal from "./NotesTableModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

const MonthlyUpdateDetails = ({
  update,
  onClose,
  onUpdateUpdated,
  onUpdateDeleted,
}) => {
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({ ...update });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value,
    });
  };

  // Save changes to the monthly update
  const handleSaveChanges = async () => {
    setIsSaving(true);
    setSaveMessage("");

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(
        `http://localhost:5001/api/update_monthly_update/${update.id}`,
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
        throw new Error(data.message || "Failed to update monthly record");
      }

      setSaveMessage("Monthly update record updated successfully");
      setIsEditing(false);

      // Notify parent component that the update was modified
      if (onUpdateUpdated) {
        onUpdateUpdated(data.update);
      }
    } catch (err) {
      console.error("Error updating monthly record:", err);
      setSaveMessage(
        `Error: ${err.message || "Failed to update monthly record"}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle notes update success
  const handleNotesUpdated = (updatedNotes) => {
    if (onUpdateUpdated) {
      const updatedRecord = {
        ...update,
        notes: updatedNotes,
      };
      onUpdateUpdated(updatedRecord);
    }
  };

  // Handle successful deletion
  const handleDeleteSuccess = () => {
    // Call the parent component's onUpdateDeleted function if it exists
    if (onUpdateDeleted && typeof onUpdateDeleted === "function") {
      onUpdateDeleted(update.id);
    }

    // Close the details modal
    onClose();
  };

  // Open delete confirmation modal
  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const formatText = (text) => {
    if (!text) return "None provided";

    // Replace newlines with proper HTML line breaks for display
    return text.split("\n").map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < text.split("\n").length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div 
          className="modal-fixed-layout"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h3>Monthly Update Details</h3>
            <button className="close-button" onClick={onClose}>×</button>
          </div>

          <div className="modal-content-area">
            {isEditing ? (
              <div className="edit-event-form" style={{ boxShadow: 'none', padding: 0 }}>
                {/* Edit form fields */}
                <div className="detail-row">
                  <label htmlFor="edit-month-year">Month/Year:</label>
                  <input
                    id="edit-month-year"
                    name="month_year"
                    value={editFormData.month_year || ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="detail-row">
                  <label htmlFor="edit-major-findings">
                    Any Major Findings in Reaching Target Population(s)?
                  </label>
                  <textarea
                    id="edit-major-findings"
                    name="major_findings"
                    value={editFormData.major_findings || ""}
                    onChange={handleChange}
                    rows={8}
                    className="wide-textarea"
                    style={{ minWidth: "100%" }}
                  />
                </div>

                <div className="detail-row">
                  <label htmlFor="edit-barriers">
                    Barriers Encountered and How the Barriers Were or Can Be
                    Addressed:
                  </label>
                  <textarea
                    id="edit-barriers"
                    name="barriers_and_solutions"
                    value={editFormData.barriers_and_solutions || ""}
                    onChange={handleChange}
                    rows={8}
                    className="wide-textarea"
                    style={{ minWidth: "100%" }}
                  />
                </div>

                <div className="detail-row">
                  <label htmlFor="edit-notes">
                    Other Additional Notes to Share from your County for the Month?
                  </label>
                  <textarea
                    id="edit-notes"
                    name="notes"
                    value={editFormData.notes || ""}
                    onChange={handleChange}
                    rows={8}
                    className="wide-textarea"
                    style={{ minWidth: "100%" }}
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
                  <strong>Month/Year:</strong> {update.month_year || "N/A"}
                </div>

                <div className="detail-row">
                  <strong>
                    Any Major Findings in Reaching Target Population(s)?
                  </strong>
                  <div className="long-content-container">
                    {formatText(update.major_findings)}
                  </div>
                </div>

                <div className="detail-row">
                  <strong>
                    Barriers Encountered and How the Barriers Were or Can Be
                    Addressed:
                  </strong>
                  <div className="long-content-container">
                    {formatText(update.barriers_and_solutions)}
                  </div>
                </div>

                <div className="detail-row">
                  <strong>
                    Other Additional Notes to Share from your County for the Month?
                  </strong>
                  {update.notes && update.notes.trim() ? (
                    <div>
                      <button
                        className="view-notes-button"
                        onClick={() => setShowNotesModal(true)}
                      >
                        View Notes
                      </button>
                      <small className="field-hint">
                        Click to view detailed notes in a separate window
                      </small>
                    </div>
                  ) : (
                    <div>No additional notes provided</div>
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
                      setEditFormData({ ...update });
                      setIsEditing(false);
                    }}
                    className="cancel-button"
                  >
                    Cancel
                  </button>
                  <button onClick={handleDeleteClick} className="delete-button">
                    Delete Monthly Update
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
        objectId={update.id}
        objectType="monthlyupdates"
        objectName={`Monthly Update - ${update.month_year}`}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        table="monthlyupdates"
        id={update.id}
        itemName={`Update for ${update.month_year || "this month"}`}
        onDeleteSuccess={handleDeleteSuccess}
      />
    </>
  );
};

export default MonthlyUpdateDetails;
