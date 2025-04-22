import React from 'react';

const PartnerDetailsSection = ({ partner, onClose, onComments }) => {
  return (
    <div className="partner-details">
      <button className="close-button" onClick={onClose}>X</button>
      <h3>Partner Details</h3>
      
      <div className="detail-row">
        <strong>Name:</strong> {partner.name || 'N/A'}
      </div>
      
      <div className="detail-row">
        <strong>Organization:</strong> {partner.organization_name || 'N/A'}
      </div>
      
      <div className="detail-row">
        <strong>Contact Information:</strong> 
        <div className="contact-info">
          {partner.contacts || 'No contact information available'}
        </div>
      </div>
      
      <div className="detail-row">
        <strong>Target Population:</strong> 
        <div>{partner.target_population || 'Not specified'}</div>
      </div>
      
      <div className="detail-row">
        <strong>Contact Date:</strong> {partner.contact_date || 'N/A'}
      </div>
      
      {partner.next_contact && (
        <div className="detail-row">
          <strong>Next Follow-up:</strong> {partner.next_contact}
        </div>
      )}
      
      {partner.notes && (
        <div className="detail-row">
          <strong>Notes:</strong>
          <div className="notes">{partner.notes}</div>
        </div>
      )}

      <div className="actions">
        <button onClick={onComments}>View Comments History</button>
      </div>
    </div>
  );
};

export default PartnerDetailsSection;