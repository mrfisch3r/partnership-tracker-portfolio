import React, { useState } from "react";
import UserManagement from "./UserManagement";
import TargetPopulationManagement from "./TargetPopulationManagement";

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
      </div>

      <div className="admin-content">
        {activeTab === "users" ? (
          <UserManagement />
        ) : (
          <TargetPopulationManagement />
        )}
      </div>
    </div>
  );
};

export default Admin;
