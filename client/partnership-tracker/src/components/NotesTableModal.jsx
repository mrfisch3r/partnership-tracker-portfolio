import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";

const NotesTableModal = ({
  isOpen,
  onClose,
  objectType,
  objectId,
  objectName,
}) => {
  const [notes, setNotes] = useState([]);
  const [newNoteText, setNewNoteText] = useState("");
  const [author, setAuthor] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editNoteText, setEditNoteText] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const modalRef = useRef(null);

  // Decode JWT to get current user info when modal opens
  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem("access_token");
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          setCurrentUser({
            id: payload.sub,
            username: payload.username || "User",
            role: payload.role || "viewer",
          });
        } catch (err) {
          console.error("Error decoding JWT:", err);
        }
      }
    }
  }, [isOpen]);

  // Reset messages when modal opens
  useEffect(() => {
    if (isOpen) {
      setError("");
      setSuccessMessage("");
      setEditingNoteId(null);
      setEditNoteText("");
    }
  }, [isOpen]);

  // Fetch notes when modal opens
  useEffect(() => {
    if (isOpen && objectType && objectId) {
      fetchNotes();
    }
  }, [isOpen, objectType, objectId]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const fetchNotes = async () => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(
        `http://localhost:5001/api/get_notes/${objectType}/${objectId}/notes`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch notes");
      }

      const data = await res.json();
      setNotes(data);
    } catch (err) {
      console.error("Error fetching notes:", err);
      setError(err.message || "Failed to load notes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();

    if (!newNoteText.trim()) {
      setError("Note text cannot be empty");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(
        `http://localhost:5001/api/add_note_to_entry/${objectType}/${objectId}/notes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            note_text: newNoteText,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to add note");
      }

      setSuccessMessage("Note added successfully");
      setNewNoteText("");
      // Don't clear author - they might add multiple notes

      // Refresh notes list
      await fetchNotes();
    } catch (err) {
      console.error("Error adding note:", err);
      setError(err.message || "Failed to add note");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditNote = async (noteId) => {
    if (!editNoteText.trim()) {
      setError("Note text cannot be empty");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(
        `http://localhost:5001/api/update_note/${noteId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            note_text: editNoteText,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update note");
      }

      setSuccessMessage("Note updated successfully");
      setEditingNoteId(null);
      setEditNoteText("");

      // Refresh notes list
      await fetchNotes();
    } catch (err) {
      console.error("Error updating note:", err);
      setError(err.message || "Failed to update note");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note?")) {
      return;
    }

    setError("");
    setSuccessMessage("");

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(
        `http://localhost:5001/api/delete_note/${noteId}`,
        {
          method: "DELETE",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete note");
      }

      setSuccessMessage("Note deleted successfully");

      // Refresh notes list
      await fetchNotes();
    } catch (err) {
      console.error("Error deleting note:", err);
      setError(err.message || "Failed to delete note");
    }
  };

  const startEditing = (note) => {
    setEditingNoteId(note.id);
    setEditNoteText(note.note_text);
    setError("");
    setSuccessMessage("");
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditNoteText("");
    setError("");
  };

  const canEditNote = (note) => {
    if (!currentUser) return false;
    // User can edit if they are the author OR if they have admin/owner role
    return (
      note.author === currentUser.username ||
      currentUser.role === "admin" ||
      currentUser.role === "owner"
    );
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="modal-overlay">
      <div className="notes-modal-fixed-layout" ref={modalRef}>
        <div className="modal-header">
          <h3>Notes for {objectName}</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Content */}
        <div className="modal-content-area">
          {/* Add new note form */}
          <form onSubmit={handleAddNote} className="add-note-form">
            <div className="form-group">
              <label>Note:</label>
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Enter note text..."
                rows="4"
                disabled={isSaving}
              />
            </div>
            <button type="submit" disabled={isSaving} className="blue-button">
              {isSaving ? "Adding..." : "Add Note"}
            </button>
            {currentUser && (
              <p
                style={{ fontSize: "0.85rem", color: "#666", marginTop: "8px" }}
              >
                Posting as: <strong>{currentUser.username}</strong>
              </p>
            )}
          </form>

          {error && <p className="error-message">{error}</p>}
          {successMessage && (
            <p className="success-message">{successMessage}</p>
          )}

          <hr />

          {/* Notes list */}
          <div className="notes-list">
            <h4>Previous Notes ({notes.length})</h4>
            {isLoading ? (
              <p>Loading notes...</p>
            ) : notes.length === 0 ? (
              <p className="no-notes">No notes yet</p>
            ) : (
              <div className="notes-timeline">
                {notes.map((note) => (
                  <div key={note.id} className="note-item">
                    <div className="note-header">
                      <strong>{note.author}</strong>
                      <div className="note-timestamps">
                        <span className="note-date">
                          Created: {formatDate(note.created_at)}
                        </span>
                        {note.updated_at &&
                          note.updated_at !== note.created_at && (
                            <span className="note-date note-edited">
                              Last edited: {formatDate(note.updated_at)}
                            </span>
                          )}
                      </div>
                    </div>
                    {editingNoteId === note.id ? (
                      <div className="edit-note-section">
                        <textarea
                          value={editNoteText}
                          onChange={(e) => setEditNoteText(e.target.value)}
                          rows="4"
                          disabled={isSaving}
                          className="edit-note-textarea"
                        />
                        <div className="edit-note-buttons">
                          <button
                            onClick={() => handleEditNote(note.id)}
                            disabled={isSaving}
                            className="save-button"
                          >
                            {isSaving ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={cancelEditing}
                            disabled={isSaving}
                            className="cancel-button"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="note-text">{note.note_text}</div>
                        {canEditNote(note) && (
                          <div className="note-actions">
                            <button
                              onClick={() => startEditing(note)}
                              className="edit-note-button"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="delete-note-button"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="red-button">
            Close
          </button>
        </div>
      </div>
    </div>
  );

  // Use React Portal to render at document root level
  return ReactDOM.createPortal(modalContent, document.body);
};

export default NotesTableModal;
