import React from 'react';

const PartnerDetailsSection = ({ partner, onClose, onComments }) => {
  return (
    <div className="partner-details">
      <button className="close-button" onClick={onClose}>X</button>
      <h3>Details for {partner.name}</h3>
      <p><strong>Organization:</strong> {partner.organization_name}</p>  {/* ← NEW */}
      <p><strong>County:</strong> {partner.county}</p>
      <p><strong>Status:</strong> {partner.status}</p>
      <p><strong>Last Updated:</strong> {partner.contact_date}</p>

      <h4>Contact Information</h4>
      <table>
        <thead>
          <tr>
            <th>Contact Name</th>
            <th>Address</th>
            <th>Phone</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {partner.contacts && partner.contacts.map((c, i) => (
            <tr key={i}>
              <td>{c.name}</td>
              <td>{c.address}</td>
              <td>{c.phone}</td>
              <td>{c.email}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={onComments}>Comments</button>
    </div>
  );
};

export default PartnerDetailsSection;