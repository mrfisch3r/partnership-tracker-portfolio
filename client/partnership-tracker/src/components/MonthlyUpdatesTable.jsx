import React, { useState, useEffect } from "react";

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

  // Filter updates based on sidebar filters (e.g., date range)
  const filtered = updates.filter((update) => {
    // Implementation for filtering to be added as needed
    // For now, return all updates
    return true;
  });

  // Extract date from month_year field for sorting
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
      try {
        date = new Date(monthStr);
      } catch (e) {
        return new Date(0);
      }
    }

    return isNaN(date.getTime()) ? new Date(0) : date;
  };

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
              <th>Has Notes</th>
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
                <td>
                  {update.notes && update.notes.trim() ? (
                    <span className="notes-indicator">Yes</span>
                  ) : (
                    "No"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MonthlyUpdatesTable;
