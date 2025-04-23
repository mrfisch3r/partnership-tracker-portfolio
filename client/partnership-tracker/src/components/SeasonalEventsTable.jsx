import React, { useState, useEffect } from 'react';

const SeasonalEventsTable = ({ filters, onEventSelect }) => {
  // State for storing events data and sort order
  const [events, setEvents] = useState([]);
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch events data when component mounts
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await fetch('http://localhost:5000/api/get_seasonal_events');
        if (!res.ok) {
          throw new Error('Failed to fetch seasonal events');
        }
        const data = await res.json();
        setEvents(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching seasonal events:', err);
        setError('Failed to load seasonal events. Please try again later.');
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Filter events based on sidebar filters
  const filtered = events.filter((event) => {
    // Implementation placeholder for filtering by organization, county, etc.
    // when those filters are implemented in the sidebar
    return true;
  });

  // Extract the most recent date from a compound date string
  const extractLatestDate = (dateString) => {
    if (!dateString) return new Date(0);
    
    // Look for date patterns like MM/DD/YY or MM/DD/YYYY
    const datePattern = /(\d{1,2}\/\d{1,2}\/\d{2,4})/g;
    const matches = dateString.match(datePattern);
    
    if (!matches || matches.length === 0) return new Date(0);
    
    // Convert all found dates to Date objects
    const dates = matches.map(match => new Date(match));
    
    // Filter out invalid dates
    const validDates = dates.filter(date => !isNaN(date.getTime()));
    if (validDates.length === 0) return new Date(0);
    
    // Return the most recent date
    return new Date(Math.max(...validDates.map(date => date.getTime())));
  };

  // Sort events by date
  const sorted = [...filtered].sort((a, b) => {
    const dateA = extractLatestDate(a.event_dates);
    const dateB = extractLatestDate(b.event_dates);
    
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  // Toggle sort order between ascending and descending
  const toggleSort = () => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');

  // Format the event date for display (extracting the first date if multiple)
  const formatEventDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    // If there's location info, try to parse it
    if (dateString.includes(':')) {
      const parts = dateString.split(/[,\n]/).filter(Boolean);
      return parts.map(part => part.trim()).join(', ');
    }
    
    return dateString;
  };

  // Display just the beginning of the target population
  const truncateText = (text, maxLength = 40) => {
    if (!text) return 'N/A';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading) return <div>Loading seasonal events...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="partnership-table">
      <h2>Seasonal Events</h2>
      <button onClick={toggleSort}>
        Sort by Date ({sortOrder === 'desc' ? 'Newest First' : 'Oldest First'})
      </button>
      
      <div className="table-instructions">
        <p>Click on any row to view full details including notes.</p>
      </div>
      
      {sorted.length === 0 ? (
        <p>No seasonal events found. Add your first event using the "Add New Event" button.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Organization</th>
              <th>Target Population</th>
              <th>Event Date(s)</th>
              <th>Reoccuring Event?</th>
              <th>Has Notes</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((event) => (
              <tr
                key={event.id}
                onClick={() => onEventSelect(event)}
                style={{ cursor: 'pointer' }}
              >
                <td>{event.name || 'N/A'}</td>
                <td>{event.organization_name || 'N/A'}</td>
                <td>{truncateText(event.target_population)}</td>
                <td>{formatEventDate(event.event_dates)}</td>
                <td>{truncateText(event.reoccuring_event, 30)}</td>
                <td>
                  {event.notes && event.notes.trim() ? (
                    <span className="notes-indicator">Yes</span>
                  ) : 'No'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SeasonalEventsTable;