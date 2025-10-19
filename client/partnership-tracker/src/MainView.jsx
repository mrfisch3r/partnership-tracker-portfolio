import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import PotentialPartnershipsTable from "./components/PartnershipTable";
import OutreachEventsTable from "./components/OutreachEventsTable";
import SeasonalEventsTable from "./components/SeasonalEventsTable";
import NotPartnershipsTable from "./components/NotPartnershipsTable";
import MonthlyUpdatesTable from "./components/MonthlyUpdatesTable";
import PartnershipDetails from "./components/PartnerDetailsSection";
import OutreachEventDetails from "./components/OutreachEventDetails";
import SeasonalEventDetails from "./components/SeasonalEventDetails";
import NotPartnershipDetails from "./components/NotPartnershipDetails";
import MonthlyUpdateDetails from "./components/MonthlyUpdateDetails";
import CommentsSection from "./components/CommentsSection";
import AddPartnershipForm from "./components/AddPartnerForm";
import AddOutreachEventForm from "./components/AddOutreachEventForm";
import AddSeasonalEventForm from "./components/AddSeasonalEventForm";
import AddNotPartnershipForm from "./components/AddNotPartnershipForm";
import AddMonthlyUpdateForm from "./components/AddMonthlyUpdateForm";
import "./MainView.css";

export function MainView() {
  // state for filter criteria
  const [filters, setFilters] = useState({ organization: "", county: "" });

  // state for selected item from the table
  const [selectedItem, setSelectedItem] = useState(null);

  // state for username
  const [username, setUsername] = useState("User");

  // toggle to show comments vs. details
  const [showComments, setShowComments] = useState(false);

  // state for active view: "partnerships", "outreach", "seasonal", "notPartnerships", or "monthlyUpdates"
  const [activeView, setActiveView] = useState("partnerships");

  // state for active action: "view" or "add"
  const [activeAction, setActiveAction] = useState("view");

  // state to force table refreshes after item deletion
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Decode JWT to get username
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        console.log("JWT Payload:", payload); // Debug log
        // Username should be at the top level of the payload (from additional_claims)
        const username = payload.username || payload.role || "User";
        setUsername(username);
      } catch (error) {
        console.error("JWT Decode Error:", error);
        setUsername("User");
      }
    }
  }, []);

  // called when filter values change in Sidebar
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  // called when a row is clicked in any table
  const handleItemSelect = (item) => {
    setSelectedItem(item);
    setShowComments(false);
  };

  // close the details modal
  const handleCloseDetails = () => {
    setSelectedItem(null);
  };

  // open the comments for the selected item
  const handleOpenComments = () => {
    setShowComments(true);
  };

  // close the comments modal and clear selection
  const handleCloseComments = () => {
    setShowComments(false);
    setSelectedItem(null);
  };

  // handle updates to items
  const handleItemUpdated = (updatedItem) => {
    // Update the selected item with the updated data
    if (selectedItem && selectedItem.id === updatedItem.id) {
      setSelectedItem(updatedItem);
    }

    // Force a refresh of the table data
    triggerTableRefresh();
  };

  // handle item deletion
  const handleItemDeleted = (itemId) => {
    // Clear the selected item if it was deleted
    if (selectedItem && selectedItem.id === itemId) {
      setSelectedItem(null);
    }

    // Force a refresh of the table data
    triggerTableRefresh();
  };

  // force tables to refresh their data
  const triggerTableRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Get the appropriate label based on the active view
  const getActiveViewLabel = () => {
    switch (activeView) {
      case "partnerships":
        return "Partnership";
      case "outreach":
        return "Outreach Event";
      case "seasonal":
        return "Seasonal Event";
      case "notPartnerships":
        return "Not Potential Partner";
      case "monthlyUpdates":
        return "Monthly Update";
      default:
        return "Item";
    }
  };

  // render either the table view or add form based on activeAction
  const renderMainContent = () => {
    if (activeAction === "add") {
      if (activeView === "partnerships") {
        return (
          <AddPartnershipForm onPartnerAdded={() => setActiveAction("view")} />
        );
      } else if (activeView === "outreach") {
        return (
          <AddOutreachEventForm onEventAdded={() => setActiveAction("view")} />
        );
      } else if (activeView === "seasonal") {
        return (
          <AddSeasonalEventForm onEventAdded={() => setActiveAction("view")} />
        );
      } else if (activeView === "notPartnerships") {
        return (
          <AddNotPartnershipForm
            onPartnerAdded={() => setActiveAction("view")}
          />
        );
      } else if (activeView === "monthlyUpdates") {
        return (
          <AddMonthlyUpdateForm onUpdateAdded={() => setActiveAction("view")} />
        );
      }
    }

    if (activeView === "partnerships") {
      return (
        <PotentialPartnershipsTable
          filters={filters}
          onPartnerSelect={handleItemSelect}
          refreshTrigger={refreshTrigger}
        />
      );
    } else if (activeView === "outreach") {
      return (
        <OutreachEventsTable
          filters={filters}
          onEventSelect={handleItemSelect}
          refreshTrigger={refreshTrigger}
        />
      );
    } else if (activeView === "seasonal") {
      return (
        <SeasonalEventsTable
          filters={filters}
          onEventSelect={handleItemSelect}
          refreshTrigger={refreshTrigger}
        />
      );
    } else if (activeView === "notPartnerships") {
      return (
        <NotPartnershipsTable
          filters={filters}
          onPartnerSelect={handleItemSelect}
          refreshTrigger={refreshTrigger}
        />
      );
    } else if (activeView === "monthlyUpdates") {
      return (
        <MonthlyUpdatesTable
          filters={filters}
          onUpdateSelect={handleItemSelect}
          refreshTrigger={refreshTrigger}
        />
      );
    }
  };

  // render details/comments modal based on current state
  const renderDetails = () => {
    if (!selectedItem) return null;

    if (showComments) {
      return (
        <CommentsSection partner={selectedItem} onClose={handleCloseComments} />
      );
    }

    if (activeView === "partnerships") {
      return (
        <PartnershipDetails
          partner={selectedItem}
          onClose={handleCloseDetails}
          onComments={handleOpenComments}
          onPartnerUpdated={handleItemUpdated}
          onPartnerDeleted={handleItemDeleted}
        />
      );
    } else if (activeView === "outreach") {
      return (
        <OutreachEventDetails
          event={selectedItem}
          onClose={handleCloseDetails}
          onEventUpdated={handleItemUpdated}
          onEventDeleted={handleItemDeleted}
        />
      );
    } else if (activeView === "seasonal") {
      return (
        <SeasonalEventDetails
          event={selectedItem}
          onClose={handleCloseDetails}
          onEventUpdated={handleItemUpdated}
          onEventDeleted={handleItemDeleted}
        />
      );
    } else if (activeView === "notPartnerships") {
      return (
        <NotPartnershipDetails
          partner={selectedItem}
          onClose={handleCloseDetails}
          onPartnerUpdated={handleItemUpdated}
          onPartnerDeleted={handleItemDeleted}
        />
      );
    } else if (activeView === "monthlyUpdates") {
      return (
        <MonthlyUpdateDetails
          update={selectedItem}
          onClose={handleCloseDetails}
          onUpdateUpdated={handleItemUpdated}
          onUpdateDeleted={handleItemDeleted}
        />
      );
    }
  };

  return (
    <div className="app-container">
      {/* navigation buttons to switch views */}
      <div className="nav-buttons">
        <button
          onClick={() => {
            setActiveView("partnerships");
            setActiveAction("view");
            setSelectedItem(null);
          }}
          className={activeView === "partnerships" ? "active" : ""}
        >
          Potential Partnerships
        </button>
        <button
          onClick={() => {
            setActiveView("outreach");
            setActiveAction("view");
            setSelectedItem(null);
          }}
          className={activeView === "outreach" ? "active" : ""}
        >
          Outreach Events
        </button>
        <button
          onClick={() => {
            setActiveView("seasonal");
            setActiveAction("view");
            setSelectedItem(null);
          }}
          className={activeView === "seasonal" ? "active" : ""}
        >
          Seasonal Events
        </button>
        <button
          onClick={() => {
            setActiveView("notPartnerships");
            setActiveAction("view");
            setSelectedItem(null);
          }}
          className={activeView === "notPartnerships" ? "active" : ""}
        >
          Not Potential Partnerships
        </button>
        <button
          onClick={() => {
            setActiveView("monthlyUpdates");
            setActiveAction("view");
            setSelectedItem(null);
          }}
          className={activeView === "monthlyUpdates" ? "active" : ""}
        >
          Monthly Updates
        </button>
        <button
          onClick={() => {
            setActiveAction("add");
            setSelectedItem(null);
          }}
          className={activeAction === "add" ? "active" : ""}
        >
          Add New {getActiveViewLabel()}
        </button>
        <div style={{ marginLeft: "auto" }}>
          <p1 style={{ marginRight: "8px" }}>{username}</p1>
          <button
            className="red-button"
            style={{}}
            onClick={() => {
              localStorage.removeItem("access_token");
              window.location.reload();
            }}
          >
            Log Out
          </button>
        </div>
      </div>

      <div className="main-content">
        <Sidebar onFilterChange={handleFilterChange} />
        {renderMainContent()}
      </div>
      {renderDetails()}
    </div>
  );
}
