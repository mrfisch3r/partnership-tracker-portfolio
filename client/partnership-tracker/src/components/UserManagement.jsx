import React, { useState, useEffect } from "react";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    // Get current user ID from JWT
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setCurrentUserId(parseInt(payload.sub));
      } catch (err) {
        console.error("Error decoding JWT:", err);
      }
    }
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:5001/api/users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch users");
      }

      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch(
        `http://localhost:5001/api/users/${userId}/role`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update role");
      }

      const data = await res.json();
      setSuccessMessage(
        `Successfully updated ${data.user.username} to ${newRole}`
      );

      // Refresh users list
      await fetchUsers();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error updating role:", err);
      setError(err.message || "Failed to update role");
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (
      !window.confirm(
        `Are you sure you want to delete user "${username}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch(`http://localhost:5001/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete user");
      }

      const data = await res.json();
      setSuccessMessage(data.message);

      // Refresh users list
      await fetchUsers();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error deleting user:", err);
      setError(err.message || "Failed to delete user");
    }
  };

  if (loading) {
    return (
      <div className="user-management">
        <h2>User Management</h2>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="user-management">
      <h2>User Management</h2>
      <p className="management-description">
        Manage user roles and permissions. Changes take effect immediately.
      </p>

      {error && <div className="error-message">{error}</div>}
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Current Role</th>
              <th>Change Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isCurrentUser = user.id === currentUserId;
              return (
                <tr key={user.id}>
                  <td>
                    <strong>{user.username}</strong>
                    {isCurrentUser && (
                      <span className="current-user-badge"> (You)</span>
                    )}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    {isCurrentUser ? (
                      <span className="role-locked">
                        Cannot change your own role
                      </span>
                    ) : user.role === "owner" ? (
                      <span className="role-locked">
                        Owner role cannot be changed
                      </span>
                    ) : (
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(user.id, e.target.value)
                        }
                        className="role-select"
                      >
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                      </select>
                    )}
                  </td>
                  <td>
                    {isCurrentUser || user.role === "owner" ? (
                      <span className="role-locked">—</span>
                    ) : (
                      <button
                        onClick={() => handleDeleteUser(user.id, user.username)}
                        className="delete-user-button"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="role-descriptions">
        <h3>Role Descriptions</h3>
        <div className="role-description-item">
          <strong>Owner:</strong> Full access including user management, can
          edit any note (cannot be changed)
        </div>
        <div className="role-description-item">
          <strong>Admin:</strong> Full access including user management, can
          edit any note
        </div>
        <div className="role-description-item">
          <strong>User:</strong> Can view and edit data, add entries, edit own
          notes
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
