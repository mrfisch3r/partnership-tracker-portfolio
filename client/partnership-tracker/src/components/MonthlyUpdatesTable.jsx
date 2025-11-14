import React, { useState, useEffect } from "react";
import NotesTableModal from "./NotesTableModal";

const MonthlyUpdatesTable = ({
  filters,
  onUpdateSelect,
  refreshTrigger = 0,
  onAdd,
}) => {
  const [updates, setUpdates] = useState([]);
  const [sortOrder, setSortOrder] = useState("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState(null);

  // Helper function: Extract date from month_year field for comparison
  const getMonthAsDate = (monthStr) => {
    if (!monthStr) return new Date(0);

    // Try to parse different date formats (e.g., "Apr-24", "April 2024", "04/2024")
    let date;

    // Handle "Apr-24" format
    const monthYearPattern = /^([A-Za-z]{3})-(\d{2})$/;
    const match = monthStr.match(monthYearPattern);

    if (match) {
      const month = match[1];
      const year = "20" + match[2]; // Assuming 20xx for the year

      // Map month abbreviation to month number (0-indexed)
      const monthMap = {
        jan: 0,
        feb: 1,
        mar: 2,
        apr: 3,
        may: 4,
        jun: 5,
        jul: 6,
        aug: 7,
        sep: 8,
        oct: 9,
        nov: 10,
        dec: 11,
      };

      const monthNum = monthMap[month.toLowerCase()];
      if (monthNum !== undefined) {
        date = new Date(year, monthNum);
      }
    }

    // If previous format didn't match, try other formats or just use the string
    if (!date || isNaN(date.getTime())) {
      date = new Date(monthStr);
    }

    return !isNaN(date.getTime()) ? date : new Date(0);
  };

  // Fetch monthly updates data when component mounts or refreshTrigger changes
  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          "http://localhost:5001/api/get_monthly_updates"
        );
        if (!res.ok) {
          throw new Error("Failed to fetch monthly updates");
        }
        const data = await res.json();
        setUpdates(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching monthly updates:", err);
        setError("Failed to load monthly updates. Please try again later.");
        setLoading(false);
      }
    };

    fetchUpdates();
  }, [refreshTrigger]);

  // Filter updates based on sidebar filters
  const filtered = updates.filter((update) => {
    // Safety check for filters object
    if (!filters) return true;

    // Filter by organization name (if set) - monthly updates don't have organization field
    // but we'll keep the pattern consistent for future extensibility
    const byOrganization = true; // No organization filtering for monthly updates

    // Filter by target populations - monthly updates don't have target population field
    // but we'll keep the pattern consistent for future extensibility
    const byTargetPopulation = true; // No target population filtering for monthly updates

    // Filter by date range based on month_year field
    const byDateRange = (() => {
      try {
        // Additional safety check
        if (!filters || typeof filters !== "object") return true;
        if (!filters?.dateFilterType || filters?.dateFilterType === "all")
          return true;

        const monthDate = getMonthAsDate(update.month_year);
        if (monthDate.getTime() === 0) return false; // No valid date found

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
          return monthDate < filterDate;
        } else {
          // "after"
          return monthDate >= filterDate;
        }
      } catch (error) {
        console.error("Error in date filtering:", error);
        return true; // On error, show the item
      }
    })();

    return byOrganization && byTargetPopulation && byDateRange;
  });

  // Sort updates by month_year
  const sorted = [...filtered].sort((a, b) => {
    const dateA = getMonthAsDate(a.month_year);
    const dateB = getMonthAsDate(b.month_year);

    return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
  });

  // Toggle sort order between ascending and descending
  const toggleSort = () =>
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));

  // Format the month_year for display
  const formatMonthYear = (monthYearStr) => {
    if (!monthYearStr) return "N/A";
    return monthYearStr;
  };

  // Display just the beginning of the findings or barriers text
  const truncateText = (text, maxLength = 60) => {
    if (!text) return "N/A";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  if (loading) return <div>Loading monthly updates...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="partnership-table">
      <h2>Monthly Updates</h2>
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
        <p>
          Click on any row to view full details and notes. Monthly updates track
          progress, findings, and barriers encountered.
        </p>
      </div>

      {sorted.length === 0 ? (
        <p>
          No monthly updates found. Add your first update using the "Add New
          Monthly Update" button.
        </p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Month/Year</th>
              <th>Major Findings</th>
              <th>Barriers & Solutions</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((update) => (
              <tr
                key={update.id}
                onClick={() => onUpdateSelect(update)}
                style={{ cursor: "pointer" }}
              >
                <td>{formatMonthYear(update.month_year)}</td>
                <td>{update.major_findings}</td>
                <td>{update.barriers_and_solutions}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <button
                    className="view-notes-button"
                    onClick={() => {
                      setSelectedUpdate({
                        id: update.id,
                        name: `Monthly Update - ${formatMonthYear(
                          update.month_year
                        )}`,
                        type: "monthlyupdates",
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
        objectId={selectedUpdate?.id}
        objectType={selectedUpdate?.type}
        objectName={selectedUpdate?.name}
      />
    </div>
  );
};

export default MonthlyUpdatesTable;
