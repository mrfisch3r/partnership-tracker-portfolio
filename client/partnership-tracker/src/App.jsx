import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import PartnershipTable from './components/PartnershipTable';
import OutreachEventsTable from './components/OutreachEventsTable';
import PartnerDetailsSection from './components/PartnerDetailsSection';
import OutreachEventDetails from './components/OutreachEventDetails';
import CommentsSection from './components/CommentsSection';
import AddPartnerForm from './components/AddPartnerForm';
import AddOutreachEventForm from './components/AddOutreachEventForm';
import './App.css';

function App() {
  // state for filter criteria – may fetch data from Flask based on these
  const [filters, setFilters] = useState({ county: '', partnerType: '' });
  
  // state for selected partner/event from the table
  const [selectedItem, setSelectedItem] = useState(null);
  
  // toggle to show comments vs. details
  const [showComments, setShowComments] = useState(false);
  
  // state for active view: "partners" or "outreach"
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

  // render either the table view or add form based on activeAction
  const renderMainContent = () => {
    if (activeAction === "add") {
      return activeView === "partners" 
        ? <AddPartnerForm onPartnerAdded={() => setActiveAction("view")} />
        : <AddOutreachEventForm onEventAdded={() => setActiveAction("view")} />;
    }
    
    return activeView === "partners"
      ? <PartnershipTable filters={filters} onPartnerSelect={handleItemSelect} />
      : <OutreachEventsTable filters={filters} onEventSelect={handleItemSelect} />;
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

    return activeView === "partners" ? (
      <PartnerDetailsSection 
        partner={selectedItem} 
        onClose={handleCloseDetails} 
        onComments={handleOpenComments}
      />
    ) : (
      <OutreachEventDetails
        event={selectedItem}
        onClose={handleCloseDetails}
      />
    );
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
          }}
          className={activeView === "partners" ? "active" : ""}
        >
          Partners
        </button>
        <button 
          onClick={() => {
            setActiveView("outreach");
            setActiveAction("view");
          }}
          className={activeView === "outreach" ? "active" : ""}
        >
          Outreach Events
        </button>
        <button 
          onClick={() => setActiveAction("add")}
          className={activeAction === "add" ? "active" : ""}
        >
          Add New {activeView === "partners" ? "Partner" : "Event"}
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