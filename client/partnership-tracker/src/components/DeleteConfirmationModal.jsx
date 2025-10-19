import React, { useState } from 'react';

/**
 * A modal dialog for confirming item deletion
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {Function} props.onClose - Function to call when closing the modal
 * @param {string} props.table - Database table name (e.g., 'outreachevents')
 * @param {number} props.id - ID of the item to delete
 * @param {string} props.itemName - Name of the item to display in confirmation
 * @param {Function} props.onDeleteSuccess - Function to call after successful deletion
 */
const DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  table, 
  id, 
  itemName, 
  onDeleteSuccess 
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  // Handle deletion
  const handleDelete = async () => {
    if (!table || !id) {
      setError("Missing required data for deletion");
      return;
    }
    
    try {
      setIsDeleting(true);
      setError(null);
      
      const response = await fetch('http://localhost:5000/api/delete_entry', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          table: table,
          id: id
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete item');
      }
      
      // Call the onDeleteSuccess callback to notify parent component
      if (onDeleteSuccess && typeof onDeleteSuccess === 'function') {
        onDeleteSuccess(id);
      }
      
      // Close the modal
      onClose();
      
    } catch (err) {
      console.error('Error deleting item:', err);
      setError(err.message || 'Failed to delete item');
    } finally {
      setIsDeleting(false);
    }
  };

  // If the modal is not open, don't render anything
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="delete-confirmation-modal" onClick={e => e.stopPropagation()}>
        <h3>Confirm Deletion</h3>
        
        <div className="confirmation-content">
          <p>Are you sure you want to delete <strong>{itemName}</strong>?</p>
          <p className="delete-warning">This action cannot be undone.</p>
          
          {error && (
            <div className="delete-error">
              {error}
            </div>
          )}
        </div>
        
        <div className="modal-actions">
          <button 
            className="delete-confirm-button"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Yes, Delete'}
          </button>
          <button 
            className="delete-cancel-button"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;