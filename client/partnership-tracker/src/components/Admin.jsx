import React, { useState } from "react";
import UserManagement from "./UserManagement";
import TargetPopulationManagement from "./TargetPopulationManagement";
import ChangeLogViewer from "./ChangeLogViewer";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div className="admin-container">
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          User Management
        </button>
        <button
          className={`admin-tab ${activeTab === "populations" ? "active" : ""}`}
          onClick={() => setActiveTab("populations")}
        >
          Target Populations
        </button>
        <button
          className={`admin-tab ${activeTab === "logs" ? "active" : ""}`}
          onClick={() => setActiveTab("logs")}
        >
          Change Logs
        </button>
      </div>

      <div className="admin-content">
        {activeTab === "users" ? (
          <UserManagement />
        ) : activeTab === "populations" ? (
          <TargetPopulationManagement />
        ) : (
          <ChangeLogViewer />
        )}
      </div>
    </div>
  );
};

export default Admin;
