import React, { useState } from "react";

/**
 * Reusable delete button component with confirmation
 *
 * @param {Object} props Component properties
 * @param {string} props.table - Database table name (e.g., 'outreachevents', 'potentialpartnerships')
 * @param {number} props.id - ID of the item to delete
 * @param {string} props.itemName - Name of the item (for confirmation message)
 * @param {Function} props.onDelete - Callback function after successful deletion
 * @param {string} props.buttonText - Custom button text (optional)
 * @param {string} props.className - Additional CSS classes (optional)
 */
const DeleteButton = ({
  table,
  id,
  itemName,
  onDelete,
  buttonText = "Delete",
  className = "",
}) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  // First click initiates confirmation
  const handleInitialClick = () => {
    setIsConfirming(true);
    setError(null);
  };

  // Cancel deletion
  const handleCancel = (e) => {
    e.stopPropagation();
    setIsConfirming(false);
  };

  // Confirm and execute deletion
  const handleConfirmDelete = async (e) => {
    e.stopPropagation(); // Prevent event bubbling to parent elements

    if (!table || !id) {
      setError("Missing required data for deletion");
      return;
    }

    try {
      setIsDeleting(true);

      const token = localStorage.getItem("access_token");
      const response = await fetch("http://localhost:5001/api/delete_entry", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          table: table,
          id: id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete item");
      }

      // Call the onDelete callback to notify parent component
      if (onDelete && typeof onDelete === "function") {
        onDelete(id);
      }
    } catch (err) {
      console.error("Error deleting item:", err);
      setError(err.message || "Failed to delete item");
      setIsConfirming(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Button styling based on state
  const buttonClass = `delete-button ${className} ${
    isConfirming ? "confirming" : ""
  }`;

  return (
    <div className="delete-button-container">
      {!isConfirming ? (
        <button
          type="button"
          className={buttonClass}
          onClick={handleInitialClick}
          disabled={isDeleting}
        >
          {buttonText}
        </button>
      ) : (
        <div className="delete-confirmation">
          <p>Delete "{itemName}"?</p>
          <div className="confirmation-buttons">
            <button
              type="button"
              className="confirm-delete"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </button>
            <button
              type="button"
              className="cancel-delete"
              onClick={handleCancel}
              disabled={isDeleting}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && <p className="delete-error">{error}</p>}
    </div>
  );
};

export default DeleteButton;
