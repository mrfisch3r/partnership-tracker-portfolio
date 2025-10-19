import React, { useState, useEffect, useRef } from 'react';

const NotesModal = ({ isOpen, onClose, eventId, initialNotes, eventName, onSaveSuccess }) => {
  const [notes, setNotes] = useState(initialNotes || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const textareaRef = useRef(null);
  const modalRef = useRef(null);

  // Reset state when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      setNotes(initialNotes || '');
      setSaveMessage('');
      setIsEditing(false);
    }
  }, [isOpen, initialNotes]);

  // Focus management
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        textareaRef.current.focus();
      }, 50);
    }
  }, [isEditing]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Save notes changes
  const handleSaveNotes = async (e) => {
    if (e) {
      e.preventDefault();
    }
    
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      const res = await fetch(`http://localhost:5000/api/update_outreach_event/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notes: notes
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update notes');
      }
      
      setSaveMessage('Notes updated successfully');
      setIsEditing(false);
      
      if (onSaveSuccess) {
        onSaveSuccess(notes);
      }
    } catch (err) {
      console.error('Error updating notes:', err);
      setSaveMessage(`Error: ${err.message || 'Failed to update notes'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Simple change handler that only updates state
  const handleChange = (e) => {
    setNotes(e.target.value);
  };
  
  // Handle cancel edit
  const handleCancel = () => {
    setNotes(initialNotes || '');
    setIsEditing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.stopPropagation()}>
      <div className="notes-modal-fixed-layout" ref={modalRef} onMouseDown={(e) => e.stopPropagation()}>
        {/* Fixed header */}
        <div className="modal-header">
          <h3>Notes for {eventName}</h3>
          <button className="close-button" onClick={onClose}>X</button>
        </div>
        
        {/* Scrollable content area */}
        <div className="modal-content-area">
          {isEditing ? (
            <textarea
              ref={textareaRef}
              className="edit-notes-textarea"
              value={notes}
              onChange={handleChange}
              onMouseDown={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="notes-content">
              {notes || 'No notes available'}
            </div>
          )}
        </div>
        
        {/* Fixed footer with buttons */}
        <div className="modal-footer">
          {isEditing ? (
            <>
              <div className="button-group">
                <button 
                  type="button"
                  onClick={handleSaveNotes} 
                  disabled={isSaving}
                  className="save-button"
                >
                  {isSaving ? 'Saving...' : 'Save Notes'}
                </button>
                <button 
                  type="button"
                  onClick={handleCancel}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
              {saveMessage && (
                <p className={saveMessage.includes('Error') ? 'error-message' : 'success-message'}>
                  {saveMessage}
                </p>
              )}
            </>
          ) : (
            <div className="button-group">
              <button 
                onClick={() => setIsEditing(true)} 
                className="edit-button"
              >
                Edit Notes
              </button>
              <button onClick={onClose}>Close</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotesModal;