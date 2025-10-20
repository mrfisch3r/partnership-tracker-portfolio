import React, { useState } from 'react';

const AddPartnershipForm = ({ onPartnerAdded }) => {
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.organization_name) {
      setMessage('Name and Organization are required fields');
      return;
    }
    
    try {
      setIsSubmitting(true);
      const res = await fetch('http://localhost:5001/api/add_potential_partner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to add partnership');
      }
      
      setMessage(data.message || 'Partnership added successfully');
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
      console.error('Error adding partnership:', err);
      setMessage(err.message || 'Error adding partnership');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generic example data for placeholders - NOT the real data from your example
  const examples = {
    name: "Contact Name(s)",
    organization: "Organization Name",
    contacts: "Phone: 555-123-4567\nEmail: contact@example.org",
    target_population: "Description of population served",
    contact_date: "Phone call: MM/DD/YYYY\nEmail: MM/DD/YYYY",
    next_contact: "Planning to follow up by phone next month"
  };

  return (
    <div className="add-partner-form">
      <h2>Add New Potential Partnership</h2>
      
      <div className="form-instructions">
        <h4>Data Format Guidelines</h4>
        <p>Please format your data as follows:</p>
        <ul>
          <li><strong>Name:</strong> Individual contact name(s)</li>
          <li><strong>Organization:</strong> Full organization name</li>
          <li><strong>Contact Info:</strong> Include phone, email, etc. (separate with line breaks)</li>
          <li><strong>Contact Date:</strong> Include method and date (e.g., "Email: MM/DD/YYYY")</li>
        </ul>
      </div>
      
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
            placeholder={examples.name}
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
            placeholder={examples.organization}
          />
        </div>
        
        <div>
          <label htmlFor="contacts">Contact Info:</label>
          <textarea
            id="contacts"
            name="contacts"
            value={formData.contacts}
            onChange={handleChange}
            placeholder={examples.contacts}
            rows={4}
          />
          <small className="field-hint">Include phone, email, address - one item per line</small>
        </div>
        
        <div>
          <label htmlFor="target_population">Target Population:</label>
          <textarea
            id="target_population"
            name="target_population"
            value={formData.target_population}
            onChange={handleChange}
            placeholder={examples.target_population}
            rows={3}
          />
        </div>
        
        <div>
          <label htmlFor="contact_date">Contact Date/Method:</label>
          <textarea
            id="contact_date"
            name="contact_date"
            value={formData.contact_date}
            onChange={handleChange}
            placeholder={examples.contact_date}
            rows={4}
          />
          <small className="field-hint">Format as "Method: MM/DD/YYYY" with one entry per line</small>
        </div>
        
        <div>
          <label htmlFor="next_contact">Type of Attempted Contact/Date of Next Attempt:</label>
          <textarea
            id="next_contact"
            name="next_contact"
            value={formData.next_contact}
            onChange={handleChange}
            placeholder={examples.next_contact}
            rows={3}
          />
        </div>
        
        <div>
          <label htmlFor="notes">Notes:</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Enter detailed notes about this potential partnership"
            rows={8}
          />
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add Partnership'}
        </button>
      </form>
      
      {message && (
        <p className={message.includes('Error') || message.includes('Failed') ? 'error-message' : 'success-message'}>
          {message}
        </p>
      )}
    </div>
  );
};

export default AddPartnershipForm;