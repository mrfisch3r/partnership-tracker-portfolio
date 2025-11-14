import React, { useState, useEffect } from "react";
import NotesTableModal from "./NotesTableModal";

const NotPartnershipsTable = ({
  filters,
  onPartnerSelect,
  refreshTrigger = 0,
  onAdd,
}) => {
  const [partners, setPartners] = useState([]);
  const [sortOrder, setSortOrder] = useState("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);

  // Helper function: Extract the most recent contact date from the contact_date field
  const getRecentContactDate = (contactStr) => {
    if (!contactStr) return null;

    // Look for date patterns like MM/DD/YY or MM/DD/YYYY
    const datePattern = /(\d{1,2}\/\d{1,2}\/\d{2,4})/g;
    const matches = contactStr.match(datePattern);

    if (!matches || matches.length === 0) return null;

    // Convert all found dates to Date objects
    const dates = matches.map((match) => new Date(match));

    // Filter out invalid dates
    const validDates = dates.filter((date) => !isNaN(date.getTime()));
    if (validDates.length === 0) return null;

    // Return the most recent date as a string
    const mostRecentDate = new Date(
      Math.max(...validDates.map((date) => date.getTime()))
    );
    return mostRecentDate.toLocaleDateString("en-US");
  };

  // Fetch partners data when component mounts or refreshTrigger changes
  useEffect(() => {
    async function fetchPartners() {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:5001/api/get_not_partners");
        if (!res.ok) {
          throw new Error("Failed to load not potential partnerships");
        }
        const data = await res.json();
        setPartners(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching not potential partnerships:", err);
        setError(
          "Failed to load not potential partnerships. Please try again later."
        );
        setLoading(false);
      }
    }
    fetchPartners();
  }, [refreshTrigger]);

  // Filter based on sidebar controls
  const filtered = partners.filter((p) => {
    // Safety check for filters object
    if (!filters) return true;

    // Filter by organization name (if set)
    const byOrganization = filters.organization
      ? p.organization_name
          ?.toLowerCase()
          .includes(filters.organization.toLowerCase())
      : true;

    // Filter by target populations (if any selected)
    const byTargetPopulation =
      filters.targetPopulations && filters.targetPopulations.length > 0
        ? filters.targetPopulations.some((pop) =>
            p.target_population?.toLowerCase().includes(pop.toLowerCase())
          )
        : true;

    // Filter by date range
    const byDateRange = (() => {
      try {
        if (!filters?.dateFilterType || filters?.dateFilterType === "all")
          return true;

        const recentDate = getRecentContactDate(p.contact_date);
        if (!recentDate) return false;

        const contactDate = new Date(recentDate);
        if (isNaN(contactDate.getTime())) return false;

        // Build custom filter date from MM/DD/YYYY inputs
        const customMonth = filters?.customMonth
          ? parseInt(filters.customMonth)
          : null;
        const customDay = filters?.customDay
          ? parseInt(filters.customDay)
          : null;
        const customYear = filters?.customYear
          ? parseInt(filters.customYear)
          : null;

        if (
          !customMonth ||
          !customDay ||
          !customYear ||
          customMonth < 1 ||
          customMonth > 12 ||
          customDay < 1 ||
          customDay > 31 ||
          customYear < 1900 ||
          customYear > 2100
        ) {
          return true; // Invalid date input, show all
        }

        const filterDate = new Date(customYear, customMonth - 1, customDay);

        const comparison = filters?.dateComparison || "after";
        if (comparison === "before") {
          return contactDate < filterDate;
        } else {
          // "after"
          return contactDate >= filterDate;
        }
      } catch (error) {
        console.error("Error in date filtering:", error);
        return true; // On error, show the item
      }
    })();

    return byOrganization && byTargetPopulation && byDateRange;
  });

  // Helper to get the last date from a string for sorting
  const getLastDateForSort = (dateString) => {
    if (!dateString) return "";
    const datePattern = /(\d{1,2}\/\d{1,2}\/\d{2,4})/g;
    const matches = dateString.match(datePattern);
    if (!matches || matches.length === 0) return dateString;
    return matches[matches.length - 1];
  };

  // Sort by contact_date
  const sorted = [...filtered].sort((a, b) => {
    // Get the most recent date for each entry
    const dateA = getLastDateForSort(a.contact_date);
    const dateB = getLastDateForSort(b.contact_date);

    // Convert to Date objects for comparison
    const timeA = dateA ? new Date(dateA) : new Date(0);
    const timeB = dateB ? new Date(dateB) : new Date(0);

    // Sort in descending (newest first) or ascending (oldest first) order
    return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
  });

  const toggleSort = () => setSortOrder((o) => (o === "desc" ? "asc" : "desc"));

  if (loading) return <div>Loading not potential partnerships...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="partnership-table">
      <h2>Not Potential Partnerships</h2>
      <div className="table-controls">
        <button className="blue-button" onClick={toggleSort}>
          Sort by Contact Date (
          {sortOrder === "desc" ? "Newest First" : "Oldest First"})
        </button>
        {onAdd && (
          <button
            className="blue-button"
            onClick={onAdd}
            style={{ marginLeft: "1rem" }}
          >
            + Add New Entry
          </button>
        )}
      </div>

      <div className="table-instructions">
        <p>
          Click on any row to view full details including contact history and
          notes.
        </p>
      </div>

      {sorted.length === 0 ? (
        <p>
          No "not potential partnerships" found. Add your first entry using the
          "Add New Not Potential Partner" button.
        </p>
      ) : (
        <table className="partnership-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Organization</th>
              <th>Target Population</th>
              <th>Contact Date</th>
              <th>Type of Attempted Contact</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((partner) => {
              // Get the most recent contact date for display
              const recentDate = getRecentContactDate(partner.contact_date);

              return (
                <tr
                  key={partner.id}
                  onClick={() => onPartnerSelect(partner)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{partner.name || "N/A"}</td>
                  <td>{partner.organization_name || "N/A"}</td>
                  <td>{partner.target_population}</td>
                  <td>{recentDate || "N/A"}</td>
                  <td>{(partner.contact_attempt, 30)}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      className="view-notes-button"
                      onClick={() => {
                        setSelectedPartner({
                          id: partner.id,
                          name: partner.organization_name || partner.name,
                          type: "notpotentialpartnerships",
                        });
                        setNotesModalOpen(true);
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <NotesTableModal
        isOpen={notesModalOpen}
        onClose={() => setNotesModalOpen(false)}
        objectId={selectedPartner?.id}
        objectType={selectedPartner?.type}
        objectName={selectedPartner?.name}
      />
    </div>
  );
};

export default NotPartnershipsTable;
