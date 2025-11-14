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

  const parseContactHistory = (contactDateStr) => {
    if (!contactDateStr) return [];

    const entries = contactDateStr
      .split(/[;\n]/)
      .map((entry) => entry.trim())
      .filter(Boolean);

    return entries.map((entry) => {
      const datePattern = /(\d{1,2}\/\d{1,2}\/\d{2,4})/;
      const dateMatch = entry.match(datePattern);

      if (dateMatch) {
        const date = dateMatch[0];
        let contact = entry
          .replace(date, "")
          .replace(/^[-–—:]\s*/, "")
          .trim();
        contact = contact.replace(/[:\-–—]+\s*$/, "").trim();
        return { date, contact };
      }

      return { date: "", contact: entry };
    });
  };

  const getMostRecentContactInfo = (contactDateStr) => {
    if (!contactDateStr) {
      return {
        display: "",
        sortDate: new Date(0),
      };
    }

    const history = parseContactHistory(contactDateStr);
    if (history.length === 0) {
      return {
        display: contactDateStr,
        sortDate: new Date(0),
      };
    }

    const lastEntry = history[history.length - 1];

    const display = lastEntry.date
      ? lastEntry.contact
        ? `${lastEntry.date} - ${lastEntry.contact}`
        : lastEntry.date
      : lastEntry.contact;

    const sortDate =
      lastEntry.date && !Number.isNaN(new Date(lastEntry.date).getTime())
        ? new Date(lastEntry.date)
        : new Date(0);

    return { display, sortDate };
  };

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

        const { sortDate } = getMostRecentContactInfo(p.contact_date);
        if (!sortDate || sortDate.getTime() === 0) return false; // No valid date found

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
          return sortDate < filterDate;
        } else {
          // "after"
          return sortDate >= filterDate;
        }
      } catch (error) {
        console.error("Error in date filtering:", error);
        return true; // On error, show the item
      }
    })();

    return byOrganization && byTargetPopulation && byDateRange;
  });

  // Sort by contact_date
  const sorted = [...filtered].sort((a, b) => {
    const { sortDate: dateA } = getMostRecentContactInfo(a.contact_date);
    const { sortDate: dateB } = getMostRecentContactInfo(b.contact_date);

    // Sort in descending (newest first) or ascending (oldest first) order
    return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
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
              const { display: mostRecentContact } = getMostRecentContactInfo(
                partner.contact_date
              );

              return (
                <tr
                  key={partner.id}
                  onClick={() => onPartnerSelect(partner)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{partner.name || "N/A"}</td>
                  <td>{partner.organization_name || "N/A"}</td>
                  <td>{partner.target_population}</td>
                  <td>{mostRecentContact || "N/A"}</td>
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
