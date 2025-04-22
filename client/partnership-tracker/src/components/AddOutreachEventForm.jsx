import React, { useState } from 'react';

const AddOutreachEventForm = ({ onEventAdded }) => {
  // State for form data - matches database schema
  const [formData, setFormData] = useState({
    name: '',
    organization_name: '',
    contacts: '',
    target_population: '',
    event_dates: '',
    reoccuring_event: '',
    notes: ''
  });

  // State for displaying success/error messages
  const [message, setMessage] = useState('');

  // Handle changes to any form field
  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Send POST request to backend
      const res = await fetch('http://localhost:5000/api/add_outreach_event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      // Handle unsuccessful response
      if (!res.ok) {
        throw new Error(data.message || 'Failed to add outreach event');
      }
      
      // Display success message
      setMessage(data.message);
      if (onEventAdded) {
        onEventAdded(data.event);
      }
      
      // Reset form after successful submission
      setFormData({
        name: '',
        organization_name: '',
        contacts: '',
        target_population: '',
        event_dates: '',
        reoccuring_event: '',
        notes: ''
      });
      
    } catch (err) {
      console.error('Error adding outreach event:', err);
      setMessage(err.message || 'Error adding outreach event');
    }
  };

  return (
    <div className="add-partner-form">
      <h2>Add New Outreach Event</h2>
      <form onSubmit={handleSubmit}>
        {/* Event name input */}
        <div>
          <label htmlFor="name">Name:</label>
          <input 
            id="name"
            type="text" 
            name="name" 
            value={formData.name}
            onChange={handleChange} 
            required 
            placeholder="Event name"
          />
        </div>
        
        {/* Organization name input */}
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
        
        {/* Contact details textarea */}
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
        
        {/* Target population textarea */}
        <div>
          <label htmlFor="target_population">Target Population:</label>
          <textarea
            id="target_population"
            name="target_population"
            value={formData.target_population}
            onChange={handleChange}
            placeholder="Who is this event intended to serve?"
          />
        </div>
        
        {/* Event dates input */}
        <div>
          <label htmlFor="event_dates">Event Date(s):</label>
          <input
            id="event_dates"
            type="text"
            name="event_dates"
            value={formData.event_dates}
            onChange={handleChange}
            required
            placeholder="Date(s) of the event"
          />
        </div>
        
        {/* Recurring event input */}
        <div>
          <label htmlFor="reoccuring_event">Recurring Event:</label>
          <input
            id="reoccuring_event"
            type="text"
            name="reoccuring_event"
            value={formData.reoccuring_event}
            onChange={handleChange}
            placeholder="Is this a recurring event? If so, how often?"
          />
        </div>
        
        {/* Notes textarea */}
        <div>
          <label htmlFor="notes">Notes:</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Any additional notes about this event"
          />
        </div>

        <button type="submit">Add Event</button>
      </form>
      {/* Display success/error message if present */}
      {message && <p className={message.includes('Error') ? 'error' : 'success'}>{message}</p>}
    </div>
  );
};

export default AddOutreachEventForm;