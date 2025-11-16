import React, { useState, useEffect } from "react";
import NotesTableModal from "./NotesTableModal";

const OutreachEventsTable = ({
  filters,
  onEventSelect,
  refreshTrigger = 0,
  onAdd,
}) => {
  // State for storing events data and sort order
  const [events, setEvents] = useState([]);
  const [sortOrder, setSortOrder] = useState("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Helper function: Extract the most recent date from a compound date string
  const extractLatestDate = (dateString) => {
    if (!dateString) return new Date(0);

    // Look for date patterns like MM/DD/YY or MM/DD/YYYY
    const datePattern = /(\d{1,2}\/\d{1,2}\/\d{2,4})/g;
    const matches = dateString.match(datePattern);

    if (!matches || matches.length === 0) return new Date(0);

    // Convert all found dates to Date objects
    const dates = matches.map((match) => new Date(match));

    // Filter out invalid dates
    const validDates = dates.filter((date) => !isNaN(date.getTime()));
    if (validDates.length === 0) return new Date(0);

    // Return the most recent date
    return new Date(Math.max(...validDates.map((date) => date.getTime())));
  };

  // Helper function: Extract the oldest date from a compound date string
  const extractOldestDate = (dateString) => {
    if (!dateString) return new Date(0);

    // Look for date patterns like MM/DD/YY or MM/DD/YYYY
    const datePattern = /(\d{1,2}\/\d{1,2}\/\d{2,4})/g;
    const matches = dateString.match(datePattern);

    if (!matches || matches.length === 0) return new Date(0);

    // Convert all found dates to Date objects
    const dates = matches.map((match) => new Date(match));

    // Filter out invalid dates
    const validDates = dates.filter((date) => !isNaN(date.getTime()));
    if (validDates.length === 0) return new Date(0);

    // Return the oldest date
    return new Date(Math.min(...validDates.map((date) => date.getTime())));
  };

  // Fetch events data when component mounts or refreshTrigger changes
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          "http://localhost:5001/api/get_outreach_events"
        );
        if (!res.ok) {
          throw new Error("Failed to fetch events");
        }
        const data = await res.json();
        setEvents(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching outreach events:", err);
        setError("Failed to load outreach events. Please try again later.");
        setLoading(false);
      }
    };

    fetchEvents();
  }, [refreshTrigger]); // Re-fetch when refreshTrigger changes

  // Filter events based on sidebar filters
  const filtered = events.filter((event) => {
    // Safety check for filters object
    if (!filters) return true;

    // Filter by organization name (if set)
    const byOrganization = filters.organization
      ? event.organization_name
          ?.toLowerCase()
          .includes(filters.organization.toLowerCase())
      : true;

    // Filter by target populations (if any selected)
    const byTargetPopulation =
      filters.targetPopulations && filters.targetPopulations.length > 0
        ? filters.targetPopulations.some((pop) =>
            event.target_population?.toLowerCase().includes(pop.toLowerCase())
          )
        : true;

    // Filter by date range
    const byDateRange = (() => {
      try {
        if (!filters?.dateFilterType || filters?.dateFilterType === "all")
          return true;

        const latestDate = extractLatestDate(event.event_dates);
        if (latestDate.getTime() === 0) return false; // No valid date found

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
          return latestDate < filterDate;
        } else {
          // "after"
          return latestDate >= filterDate;
        }
      } catch (error) {
        console.error("Error in date filtering:", error);
        return true; // On error, show the item
      }
    })();

    return byOrganization && byTargetPopulation && byDateRange;
  });

  // Sort events by date
  const sorted = [...filtered].sort((a, b) => {
    // Use newest date when sorting desc (newest first), oldest date when sorting asc (oldest first)
    const dateA =
      sortOrder === "desc"
        ? extractLatestDate(a.event_dates)
        : extractOldestDate(a.event_dates);
    const dateB =
      sortOrder === "desc"
        ? extractLatestDate(b.event_dates)
        : extractOldestDate(b.event_dates);

    return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
  });

  // Toggle sort order between ascending and descending
  const toggleSort = () =>
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));

  // Format the event date for display (extracting the first date if multiple)
  const formatEventDate = (dateString) => {
    if (!dateString) return "N/A";

    // If there's location info, try to parse it
    if (dateString.includes(":")) {
      const parts = dateString.split(/[,\n]/).filter(Boolean);
      return parts.map((part) => part.trim()).join(", ");
    }

    return dateString;
  };

  // Display just the beginning of the target population
  const truncateText = (text, maxLength = 40) => {
    if (!text) return "N/A";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  if (loading) return <div>Loading outreach events...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="partnership-table">
      <h2>Outreach Events</h2>
      <div className="table-controls">
        <button className="blue-button" onClick={toggleSort}>
          Sort by Date ({sortOrder === "desc" ? "Newest First" : "Oldest First"}
          )
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
        <p>Click on any row to view full details including notes.</p>
      </div>

      {sorted.length === 0 ? (
        <p>
          No outreach events found. Add your first event using the "Add New
          Event" button.
        </p>
      ) : (
        <table className="partnership-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Organization</th>
              <th>Target Population</th>
              <th>Event Date(s)</th>
              <th>Reoccuring Event?</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((event) => (
              <tr
                key={event.id}
                onClick={() => onEventSelect(event)}
                style={{ cursor: "pointer" }}
              >
                <td>{event.name || "N/A"}</td>
                <td>{event.organization_name || "N/A"}</td>
                <td>{event.target_population}</td>
                <td>{formatEventDate(event.event_dates)}</td>
                <td>{event.reoccuring_event}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <button
                    className="view-notes-button"
                    onClick={() => {
                      setSelectedEvent({
                        id: event.id,
                        name: event.organization_name || event.name,
                        type: "siteevents",
                      });
                      setNotesModalOpen(true);
                    }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <NotesTableModal
        isOpen={notesModalOpen}
        onClose={() => setNotesModalOpen(false)}
        objectId={selectedEvent?.id}
        objectType={selectedEvent?.type}
        objectName={selectedEvent?.name}
      />
    </div>
  );
};

export default OutreachEventsTable;
