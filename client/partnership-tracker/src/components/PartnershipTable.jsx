import React, { useState, useEffect } from 'react';

const PartnershipTable = ({ filters, onPartnerSelect }) => {
  const [partners, setPartners] = useState([]);
  const [sortOrder, setSortOrder] = useState('desc');

  // → Fetch real data from Flask on mount
  useEffect(() => {
    async function fetchPartners() {
      try {
        const res = await fetch('http://localhost:5000/api/get_partners');
        if (!res.ok) {
          console.error('Failed to load partners:', res.statusText);
          return;
        }
        const data = await res.json();
        setPartners(data);
      } catch (err) {
        console.error('Error fetching partners:', err);
      }
    }
    fetchPartners();
  }, []);

  // Filter based on sidebar controls
  const filtered = partners.filter((p) => {
    const byCounty = filters.county ? p.county === filters.county : true;
    const byStatus = filters.partnerType ? p.status === filters.partnerType : true;
    return byCounty && byStatus;
  });

  // Sort by lastUpdated / contact_date
  const sorted = [...filtered].sort((a, b) => {
    const dateA = new Date(a.contact_date);
    const dateB = new Date(b.contact_date);
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const toggleSort = () => setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'));

  return (
    <div className="partnership-table">
      <h2>Community Partners</h2>
      <button onClick={toggleSort}>
        Sort by Recency ({sortOrder === 'desc' ? 'Newest First' : 'Oldest First'})
      </button>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Organization</th>     {/* ← NEW */}
            <th>County</th>
            <th>Status</th>
            <th>Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((partner) => (
            <tr
              key={partner.id}
              onClick={() => onPartnerSelect(partner)}
              style={{ cursor: 'pointer' }}
            >
              <td>{partner.name}</td>
              <td>{partner.organization_name}</td>  {/* ← NEW */}
              <td>{partner.county}</td>
              <td>{partner.status}</td>
              <td>{partner.contact_date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PartnershipTable;