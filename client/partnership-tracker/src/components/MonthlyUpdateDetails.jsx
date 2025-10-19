import React, { useState } from 'react';
import NotesModal from './NotesModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';

const MonthlyUpdateDetails = ({ update, onClose, onUpdateUpdated, onUpdateDeleted }) => {
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({ ...update });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value
    });
  };

  // Save changes to the monthly update
  const handleSaveChanges = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      const res = await fetch(`http://localhost:5000/api/update_monthly_update/${update.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editFormData)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update monthly record');
      }
      
      setSaveMessage('Monthly update record updated successfully');
      setIsEditing(false);
      
      // Notify parent component that the update was modified
      if (onUpdateUpdated) {
        onUpdateUpdated(data.update);
      }
    } catch (err) {
      console.error('Error updating monthly record:', err);
      setSaveMessage(`Error: ${err.message || 'Failed to update monthly record'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle notes update success
  const handleNotesUpdated = (updatedNotes) => {
    if (onUpdateUpdated) {
      const updatedRecord = {
        ...update,
        notes: updatedNotes
      };
      onUpdateUpdated(updatedRecord);
    }
  };

  // Handle successful deletion
  const handleDeleteSuccess = () => {
    // Call the parent component's onUpdateDeleted function if it exists
    if (onUpdateDeleted && typeof onUpdateDeleted === 'function') {
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
    if (!text) return 'None provided';
    
    // Replace newlines with proper HTML line breaks for display
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className="partner-details monthly-update-details">
      {/* Close button in top right corner */}
      <button className="close-button" onClick={onClose}>X</button>
      <h3>Monthly Update Details</h3>
      
      {isEditing ? (
        <div className="edit-event-form">
          {/* Edit form fields */}
          <div className="detail-row">
            <label htmlFor="edit-month-year">Month/Year:</label>
            <input
              id="edit-month-year"
              name="month_year"
              value={editFormData.month_year || ''}
              onChange={handleChange}
            />
          </div>
          
          <div className="detail-row">
            <label htmlFor="edit-major-findings">Any Major Findings in Reaching Target Population(s)?</label>
            <textarea
              id="edit-major-findings"
              name="major_findings"
              value={editFormData.major_findings || ''}
              onChange={handleChange}
              rows={8}
              className="wide-textarea"
              style={{ minWidth: '100%' }}
            />
          </div>
          
          <div className="detail-row">
            <label htmlFor="edit-barriers">Barriers Encountered and How the Barriers Were or Can Be Addressed:</label>
            <textarea
              id="edit-barriers"
              name="barriers_and_solutions"
              value={editFormData.barriers_and_solutions || ''}
              onChange={handleChange}
              rows={8}
              className="wide-textarea"
              style={{ minWidth: '100%' }}
            />
          </div>
          
          <div className="detail-row">
            <label htmlFor="edit-notes">Other Additional Notes to Share from your County for the Month?</label>
            <textarea
              id="edit-notes"
              name="notes"
              value={editFormData.notes || ''}
              onChange={handleChange}
              rows={8}
              className="wide-textarea"
              style={{ minWidth: '100%' }}
            />
          </div>
          
          {/* Save and Cancel buttons with Delete button */}
          <div className="actions">
            <button 
              onClick={handleSaveChanges} 
              disabled={isSaving}
              className="save-button"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
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
            <button
              onClick={handleDeleteClick}
              className="delete-button"
            >
              Delete Monthly Update
            </button>
          </div>
          
          {/* Display save message */}
          {saveMessage && (
            <p className={saveMessage.includes('Error') ? 'error-message' : 'success-message'}>
              {saveMessage}
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Display-only view */}
          <div className="detail-row">
            <strong>Month/Year:</strong> {update.month_year || 'N/A'}
          </div>
          
          <div className="detail-row">
            <strong>Any Major Findings in Reaching Target Population(s)?</strong> 
            <div className="long-content-container">
              {formatText(update.major_findings)}
            </div>
          </div>
          
          <div className="detail-row">
            <strong>Barriers Encountered and How the Barriers Were or Can Be Addressed:</strong> 
            <div className="long-content-container">
              {formatText(update.barriers_and_solutions)}
            </div>
          </div>
          
          <div className="detail-row">
            <strong>Other Additional Notes to Share from your County for the Month?</strong>
            {update.notes && update.notes.trim() ? (
              <div>
                <button 
                  className="view-notes-button" 
                  onClick={() => setShowNotesModal(true)}
                >
                  View Notes
                </button>
                <small className="field-hint">Click to view detailed notes in a separate window</small>
              </div>
            ) : (
              <div>No additional notes provided</div>
            )}
          </div>
        </>
      )}

      {/* Action buttons - only Edit and Close in view mode */}
      <div className="actions">
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)} 
            className="edit-button"
          >
            Edit Details
          </button>
        )}
        <button onClick={onClose}>Close</button>
      </div>
      
      {/* Use the NotesModal component */}
      <NotesModal
        isOpen={showNotesModal}
        onClose={() => setShowNotesModal(false)}
        eventId={update.id}
        initialNotes={update.notes}
        eventName={update.month_year}
        onSaveSuccess={handleNotesUpdated}
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
    </div>
  );
};

export default MonthlyUpdateDetails;