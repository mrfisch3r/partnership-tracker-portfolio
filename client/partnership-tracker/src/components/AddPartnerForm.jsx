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
          <label>Name:</label>
          <input 
            type="text" 
            name="name" 
            value={formData.name}
            onChange={handleChange} 
            required 
          />
        </div>
        
        <div>
          <label>Organization Name:</label>
          <input 
            type="text" 
            name="organization_name" 
            value={formData.organization_name}
            onChange={handleChange} 
            required 
          />
        </div>
        
        <div>
          <label>Contacts:</label>
          <textarea
            name="contacts"
            value={formData.contacts}
            onChange={handleChange}
          />
        </div>
        
        <div>
          <label>Target Population:</label>
          <textarea
            name="target_population"
            value={formData.target_population}
            onChange={handleChange}
          />
        </div>
        
        <div>
          <label>Contact Date:</label>
          <input
            type="date"
            name="contact_date"
            value={formData.contact_date}
            onChange={handleChange}
            required
          />
        </div>
        
        <div>
          <label>Next Contact:</label>
          <input
            type="text"
            name="next_contact"
            value={formData.next_contact}
            onChange={handleChange}
          />
        </div>
        
        <div>
          <label>Notes:</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
          />
        </div>

        <button type="submit">Add Partner</button>
      </form>
      {message && <p className={message.includes('Error') ? 'error' : 'success'}>{message}</p>}
    </div>
  );
};

export default AddPartnerForm;