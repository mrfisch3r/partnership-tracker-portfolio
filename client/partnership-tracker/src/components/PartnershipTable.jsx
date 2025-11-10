import React, { useState, useEffect, useRef } from "react";
import NotesTableModal from "./NotesTableModal";

const PotentialPartnershipsTable = ({
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
  const tableRef = useRef(null);

  // Fetch partners data when component mounts or refreshTrigger changes
  useEffect(() => {
    async function fetchPartners() {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:5001/api/get_partners");
        if (!res.ok) {
          throw new Error("Failed to load potential partnerships");
        }
        const data = await res.json();
        setPartners(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching potential partnerships:", err);
        setError("Failed to load partnerships. Please try again later.");
        setLoading(false);
      }
    }
    fetchPartners();
  }, [refreshTrigger]);

  // Set current date for printing
  useEffect(() => {
    if (tableRef.current) {
      const today = new Date();
      const formattedDate = today.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      tableRef.current.setAttribute("data-print-date", formattedDate);
    }
  }, [partners]);

  // Filter based on sidebar controls
  const filtered = partners.filter((p) => {
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

    return byOrganization && byTargetPopulation;
  });

  // Extract the most recent contact date from the contact_date field
  const getRecentContactDate = (dateString) => {
    if (!dateString) return "";

    // Look for date patterns like MM/DD/YYYY or M/D/YY
    const datePattern = /(\d{1,2}\/\d{1,2}\/\d{2,4})/g;
    const matches = dateString.match(datePattern);

    if (!matches || matches.length === 0) return dateString;

    // Return the most recent date (which should be the last one)
    return matches[matches.length - 1];
  };

  // Sort by contact_date
  const sorted = [...filtered].sort((a, b) => {
    // Get the most recent date for each entry
    const dateA = getRecentContactDate(a.contact_date);
    const dateB = getRecentContactDate(b.contact_date);

    // Convert to Date objects for comparison
    const timeA = dateA ? new Date(dateA) : new Date(0);
    const timeB = dateB ? new Date(dateB) : new Date(0);

    // Sort in descending (newest first) or ascending (oldest first) order
    return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
  });

  const toggleSort = () => setSortOrder((o) => (o === "desc" ? "asc" : "desc"));

  if (loading) return <div>Loading potential partnerships...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="partnership-table" ref={tableRef}>
      <h2>Potential Partnerships</h2>
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
          No potential partnerships found. Add your first partnership using the
          "Add New Partner" button.
        </p>
      ) : (
        <table className="partnership-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Organization</th>
              <th>Target Population</th>
              <th>Most Recent Contact</th>
              <th>Next Contact Plan</th>
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
                  <td>{partner.next_contact}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      className="view-notes-button"
                      onClick={() => {
                        setSelectedPartner({
                          id: partner.id,
                          name: partner.organization_name || partner.name,
                          type: "potentialpartnerships",
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
        objectType={selectedPartner?.type}
        objectId={selectedPartner?.id}
        objectName={selectedPartner?.name}
      />
    </div>
  );
};

export default PotentialPartnershipsTable;
