import React from 'react';

const OutreachEventDetails = ({ event, onClose }) => {
  return (
    // Main modal container that shows event details
    <div className="partner-details">
      {/* Close button in top right corner */}
      <button className="close-button" onClick={onClose}>X</button>
      <h3>Outreach Event Details</h3>
      
      {/* Event name field */}
      <div className="detail-row">
        <strong>Name:</strong> {event.name || 'N/A'}
      </div>
      
      {/* Organization name field */}
      <div className="detail-row">
        <strong>Organization:</strong> {event.organization_name || 'N/A'}
      </div>
      
      {/* Contact information with special formatting */}
      <div className="detail-row">
        <strong>Contact Information:</strong> 
        <div className="contact-info">
          {event.contacts || 'No contact information available'}
        </div>
      </div>
      
      {/* Target population field */}
      <div className="detail-row">
        <strong>Target Population:</strong> 
        <div>{event.target_population || 'Not specified'}</div>
      </div>
      
      {/* Event dates field */}
      <div className="detail-row">
        <strong>Event Date(s):</strong> {event.event_dates || 'N/A'}
      </div>
      
      {/* Recurring event status */}
      <div className="detail-row">
        <strong>Recurring Event:</strong> {event.reoccuring_event || 'No'}
      </div>
      
      {/* Notes section - only shown if notes exist */}
      {event.notes && (
        <div className="detail-row">
          <strong>Notes:</strong>
          <div className="notes">{event.notes}</div>
        </div>
      )}
    </div>
  );
};

export default OutreachEventDetails;