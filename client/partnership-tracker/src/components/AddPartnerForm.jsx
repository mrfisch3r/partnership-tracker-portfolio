import React, { useState } from 'react';

const AddPartnerForm = ({ onPartnerAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    organization_name: '',
    contacts: '',
    target_population: '',
    contact_date: '',
    next_contact: '',
    notes: ''
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/add_potential_partner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to add partner');
      }
      
      setMessage(data.message);
      if (onPartnerAdded) {
        onPartnerAdded(data.partner);
      }
      
      // Clear form on success
      setFormData({
        name: '',
        organization_name: '',
        contacts: '',
        target_population: '',
        contact_date: '',
        next_contact: '',
        notes: ''
      });
      
    } catch (err) {
      console.error('Error adding partner:', err);
      setMessage(err.message || 'Error adding partner');
    }
  };

  return (
    <div className="add-partner-form">
      <h2>Add New Community Partner</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Name:</label>
          <input 
            id="name"
            type="text" 
            name="name" 
            value={formData.name}
            onChange={handleChange} 
            required 
            placeholder="Contact name"
          />
        </div>
        
        <div>
          <label htmlFor="organization_name">Organization:</label>
          <input 
            id="organization_name"
            type="text" 
            name="organization_name" 
            value={formData.organization_name}
            onChange={handleChange} 
            required 
            placeholder="Organization name"
          />
        </div>
        
        <div>
          <label htmlFor="contacts">Contact Details:</label>
          <textarea
            id="contacts"
            name="contacts"
            value={formData.contacts}
            onChange={handleChange}
            placeholder="Phone numbers, email addresses, etc."
          />
        </div>
        
        <div>
          <label htmlFor="target_population">Target Population:</label>
          <textarea
            id="target_population"
            name="target_population"
            value={formData.target_population}
            onChange={handleChange}
            placeholder="Describe the population this partnership aims to serve"
          />
        </div>
        
        <div>
          <label htmlFor="contact_date">Contact Date:</label>
          <input
            id="contact_date"
            type="date"
            name="contact_date"
            value={formData.contact_date}
            onChange={handleChange}
            required
          />
        </div>
        
        <div>
          <label htmlFor="next_contact">Next Follow-up Plan:</label>
          <input
            id="next_contact"
            type="text"
            name="next_contact"
            value={formData.next_contact}
            onChange={handleChange}
            placeholder="When to contact next (e.g., 'Call back in May')"
          />
        </div>
        
        <div>
          <label htmlFor="notes">Notes:</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Any additional notes about this partnership"
          />
        </div>

        <button type="submit">Add Partner</button>
      </form>
      {message && <p className={message.includes('Error') ? 'error' : 'success'}>{message}</p>}
    </div>
  );
};

export default AddPartnerForm;