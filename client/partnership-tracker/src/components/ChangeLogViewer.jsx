import React, { useState, useEffect } from "react";

const ChangeLogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchLogs(1);
  }, []);

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `http://127.0.0.1:5001/api/changelogs?page=${page}&per_page=20`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch change logs");
      }

      const data = await response.json();

      // Handle new pagination response format
      if (data.logs) {
        setLogs(data.logs);
        setTotalPages(data.total_pages);
        setCurrentPage(data.current_page);
        setTotalItems(data.total_items);
      } else {
        // Fallback for non-paginated response (if API rollback occurs)
        setLogs(Array.isArray(data) ? data : []);
        setTotalPages(1);
        setCurrentPage(1);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
  };

  const closeDetails = () => {
    setSelectedLog(null);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchLogs(newPage);
    }
  };

  if (loading && logs.length === 0) return <div>Loading logs...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="user-management">
      <h2>System Change Log</h2>
      <p className="management-description">
        View history of all system modifications.
      </p>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>User</th>
              <th>Action</th>
              <th>Table</th>
              <th>Record ID</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
                <td>{log.username}</td>
                <td>
                  <span className={`badge badge-${log.action.toLowerCase()}`}>
                    {log.action}
                  </span>
                </td>
                <td>{log.table_name}</td>
                <td>{log.record_id}</td>
                <td>
                  <button
                    onClick={() => handleViewDetails(log)}
                    className="blue-button"
                    style={{ padding: "4px 12px", fontSize: "0.85rem" }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", color: "#999" }}>
                  No changes recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div
          className="pagination-controls"
          style={{
            marginTop: "20px",
            display: "flex",
            justifyContent: "center",
            gap: "15px",
            alignItems: "center",
          }}
        >
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1 || loading}
            className="sidebar-button"
            style={{ padding: "0.5rem 1rem", minWidth: "100px" }}
          >
            Previous
          </button>
          <span style={{ fontWeight: "bold", color: "#555" }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || loading}
            className="sidebar-button"
            style={{ padding: "0.5rem 1rem", minWidth: "100px" }}
          >
            Next
          </button>
        </div>
      )}

      {selectedLog && (
        <div className="modal-overlay" onClick={closeDetails}>
          <div
            className="notes-modal-fixed-layout"
            style={{ height: "auto", maxHeight: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Change Details</h3>
              <button className="close-button" onClick={closeDetails}>
                ×
              </button>
            </div>

            <div className="modal-content-area">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                }}
              >
                <div>
                  <h4>Previous Data</h4>
                  {selectedLog.previous_data ? (
                    <pre
                      style={{
                        background: "#f5f5f5",
                        padding: "10px",
                        borderRadius: "4px",
                        overflow: "auto",
                        maxHeight: "400px",
                        fontSize: "0.85rem",
                      }}
                    >
                      {JSON.stringify(selectedLog.previous_data, null, 2)}
                    </pre>
                  ) : (
                    <p style={{ color: "#999", fontStyle: "italic" }}>
                      None (New Entry)
                    </p>
                  )}
                </div>

                <div>
                  <h4>New Data</h4>
                  {selectedLog.new_data ? (
                    <pre
                      style={{
                        background: "#f5f5f5",
                        padding: "10px",
                        borderRadius: "4px",
                        overflow: "auto",
                        maxHeight: "400px",
                        fontSize: "0.85rem",
                      }}
                    >
                      {JSON.stringify(selectedLog.new_data, null, 2)}
                    </pre>
                  ) : (
                    <p style={{ color: "#999", fontStyle: "italic" }}>
                      None (Deleted Entry)
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-button" onClick={closeDetails}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChangeLogViewer;
