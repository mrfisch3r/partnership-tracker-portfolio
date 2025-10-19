import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import PotentialPartnershipsTable from './components/PartnershipTable';
import OutreachEventsTable from './components/OutreachEventsTable';
import SeasonalEventsTable from './components/SeasonalEventsTable';
import NotPartnershipsTable from './components/NotPartnershipsTable';
import MonthlyUpdatesTable from './components/MonthlyUpdatesTable';
import PartnershipDetails from './components/PartnerDetailsSection';
import OutreachEventDetails from './components/OutreachEventDetails';
import SeasonalEventDetails from './components/SeasonalEventDetails';
import NotPartnershipDetails from './components/NotPartnershipDetails';
import MonthlyUpdateDetails from './components/MonthlyUpdateDetails';
import CommentsSection from './components/CommentsSection';
import AddPartnershipForm from './components/AddPartnerForm';
import AddOutreachEventForm from './components/AddOutreachEventForm';
import AddSeasonalEventForm from './components/AddSeasonalEventForm';
import AddNotPartnershipForm from './components/AddNotPartnershipForm';
import AddMonthlyUpdateForm from './components/AddMonthlyUpdateForm';
import './App.css';

function App() {
  // state for filter criteria
  const [filters, setFilters] = useState({ organization: '', county: '' });
  
  // state for selected item from the table
  const [selectedItem, setSelectedItem] = useState(null);
  
  // toggle to show comments vs. details
  const [showComments, setShowComments] = useState(false);
  
  // state for active view: "partnerships", "outreach", "seasonal", "notPartnerships", or "monthlyUpdates"
  const [activeView, setActiveView] = useState("partnerships");
  
  // state for active action: "view" or "add"
  const [activeAction, setActiveAction] = useState("view");
  
  // state to force table refreshes after item deletion
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
    setRefreshTrigger(prev => prev + 1);
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
        return <AddPartnershipForm onPartnerAdded={() => setActiveAction("view")} />;
      } else if (activeView === "outreach") {
        return <AddOutreachEventForm onEventAdded={() => setActiveAction("view")} />;
      } else if (activeView === "seasonal") {
        return <AddSeasonalEventForm onEventAdded={() => setActiveAction("view")} />;
      } else if (activeView === "notPartnerships") {
        return <AddNotPartnershipForm onPartnerAdded={() => setActiveAction("view")} />;
      } else if (activeView === "monthlyUpdates") {
        return <AddMonthlyUpdateForm onUpdateAdded={() => setActiveAction("view")} />;
      }
    }
    
    if (activeView === "partnerships") {
      return <PotentialPartnershipsTable 
               filters={filters} 
               onPartnerSelect={handleItemSelect} 
               refreshTrigger={refreshTrigger} 
             />;
    } else if (activeView === "outreach") {
      return <OutreachEventsTable 
               filters={filters} 
               onEventSelect={handleItemSelect} 
               refreshTrigger={refreshTrigger} 
             />;
    } else if (activeView === "seasonal") {
      return <SeasonalEventsTable 
               filters={filters} 
               onEventSelect={handleItemSelect} 
               refreshTrigger={refreshTrigger} 
             />;
    } else if (activeView === "notPartnerships") {
      return <NotPartnershipsTable 
               filters={filters} 
               onPartnerSelect={handleItemSelect} 
               refreshTrigger={refreshTrigger} 
             />;
    } else if (activeView === "monthlyUpdates") {
      return <MonthlyUpdatesTable 
               filters={filters} 
               onUpdateSelect={handleItemSelect} 
               refreshTrigger={refreshTrigger} 
             />;
    }
  };

  // render details/comments modal based on current state
  const renderDetails = () => {
    if (!selectedItem) return null;
    
    if (showComments) {
      return (
        <CommentsSection 
          partner={selectedItem} 
          onClose={handleCloseComments} 
        />
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
      </div>
      <div className="main-content">
        <Sidebar onFilterChange={handleFilterChange} />
        {renderMainContent()}
      </div>
      {renderDetails()}
    </div>
  );
}

export default App;