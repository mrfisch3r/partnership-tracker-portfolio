import React, { useState, useEffect } from 'react';

const OutreachEventsTable = ({ filters, onEventSelect }) => {
  // State for storing events data and sort order
  const [events, setEvents] = useState([]);
  const [sortOrder, setSortOrder] = useState('desc');

  // Fetch events data when component mounts
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/get_outreach_events');
        if (!res.ok) {
          throw new Error('Failed to fetch events');
        }
        const data = await res.json();
        setEvents(data);
      } catch (err) {
        console.error('Error fetching outreach events:', err);
      }
    };

    fetchEvents();
  }, []);

  // TODO: Implement filtering logic based on sidebar controls
  const filtered = events;

  // Sort events by date
  const sorted = [...filtered].sort((a, b) => {
    const dateA = new Date(a.event_dates);
    const dateB = new Date(b.event_dates);
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  // Toggle sort order between ascending and descending
  const toggleSort = () => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');

  return (
    <div className="partnership-table">
      <h2>Outreach Events</h2>
      <button onClick={toggleSort}>
        Sort by Date ({sortOrder === 'desc' ? 'Newest First' : 'Oldest First'})
      </button>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Organization</th>
            <th>Event Date(s)</th>
            <th>Recurring Event</th>
            <th>Target Population</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((event) => (
            <tr
              key={event.id}
              onClick={() => onEventSelect(event)}
              style={{ cursor: 'pointer' }}
            >
              <td>{event.name}</td>
              <td>{event.organization_name}</td>
              <td>{event.event_dates}</td>
              <td>{event.reoccuring_event}</td>
              <td>{event.target_population}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OutreachEventsTable;