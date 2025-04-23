import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import PartnershipTable from './components/PartnershipTable';
import OutreachEventsTable from './components/OutreachEventsTable';
import SeasonalEventsTable from './components/SeasonalEventsTable';
import PartnerDetailsSection from './components/PartnerDetailsSection';
import OutreachEventDetails from './components/OutreachEventDetails';
import SeasonalEventDetails from './components/SeasonalEventDetails';
import CommentsSection from './components/CommentsSection';
import AddPartnerForm from './components/AddPartnerForm';
import AddOutreachEventForm from './components/AddOutreachEventForm';
import AddSeasonalEventForm from './components/AddSeasonalEventForm';
import './App.css';

function App() {
  // state for filter criteria – may fetch data from Flask based on these
  const [filters, setFilters] = useState({ county: '', partnerType: '' });
  
  // state for selected partner/event from the table
  const [selectedItem, setSelectedItem] = useState(null);
  
  // toggle to show comments vs. details
  const [showComments, setShowComments] = useState(false);
  
  // state for active view: "partners", "outreach", or "seasonal"
  const [activeView, setActiveView] = useState("partners");
  
  // state for active action: "view" or "add"
  const [activeAction, setActiveAction] = useState("view");

  // called when filter values change in Sidebar
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  // called when a row is clicked in either table
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

  // handle updates to events or partners
  const handleItemUpdated = (updatedItem) => {
    // Update the selected item with the updated data
    if (selectedItem && selectedItem.id === updatedItem.id) {
      setSelectedItem(updatedItem);
    }
  };

  // Get the appropriate label based on the active view
  const getActiveViewLabel = () => {
    switch (activeView) {
      case "partners":
        return "Partner";
      case "outreach":
        return "Outreach Event";
      case "seasonal":
        return "Seasonal Event";
      default:
        return "Item";
    }
  };

  // render either the table view or add form based on activeAction
  const renderMainContent = () => {
    if (activeAction === "add") {
      if (activeView === "partners") {
        return <AddPartnerForm onPartnerAdded={() => setActiveAction("view")} />;
      } else if (activeView === "outreach") {
        return <AddOutreachEventForm onEventAdded={() => setActiveAction("view")} />;
      } else if (activeView === "seasonal") {
        return <AddSeasonalEventForm onEventAdded={() => setActiveAction("view")} />;
      }
    }
    
    if (activeView === "partners") {
      return <PartnershipTable filters={filters} onPartnerSelect={handleItemSelect} />;
    } else if (activeView === "outreach") {
      return <OutreachEventsTable filters={filters} onEventSelect={handleItemSelect} />;
    } else if (activeView === "seasonal") {
      return <SeasonalEventsTable filters={filters} onEventSelect={handleItemSelect} />;
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

    if (activeView === "partners") {
      return (
        <PartnerDetailsSection 
          partner={selectedItem} 
          onClose={handleCloseDetails} 
          onComments={handleOpenComments}
          onPartnerUpdated={handleItemUpdated}
        />
      );
    } else if (activeView === "outreach") {
      return (
        <OutreachEventDetails
          event={selectedItem}
          onClose={handleCloseDetails}
          onEventUpdated={handleItemUpdated}
        />
      );
    } else if (activeView === "seasonal") {
      return (
        <SeasonalEventDetails
          event={selectedItem}
          onClose={handleCloseDetails}
          onEventUpdated={handleItemUpdated}
        />
      );
    }
  };

  return (
    <div className="app-container">
      <Header />
      {/* navigation buttons to switch views */}
      <div className="nav-buttons">
        <button 
          onClick={() => {
            setActiveView("partners");
            setActiveAction("view");
            setSelectedItem(null);
          }}
          className={activeView === "partners" ? "active" : ""}
        >
          Partners
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