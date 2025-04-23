import React, { useState } from 'react';
import html2pdf from 'html2pdf.js';

const Sidebar = ({ onFilterChange }) => {
  const [organization, setOrganization] = useState('');
  const [targetPopulation, setTargetPopulation] = useState('');
  const [dateRange, setDateRange] = useState('all');

  // Update organization filter and notify parent component
  const handleOrganizationChange = (e) => {
    const newOrganization = e.target.value;
    setOrganization(newOrganization);
    onFilterChange({ 
      organization: newOrganization, 
      targetPopulation, 
      dateRange 
    });
  };

  // Update target population filter
  const handleTargetPopulationChange = (e) => {
    const newTargetPopulation = e.target.value;
    setTargetPopulation(newTargetPopulation);
    onFilterChange({ 
      organization, 
      targetPopulation: newTargetPopulation, 
      dateRange 
    });
  };

  // Update date range filter
  const handleDateRangeChange = (e) => {
    const newDateRange = e.target.value;
    setDateRange(newDateRange);
    onFilterChange({ 
      organization, 
      targetPopulation, 
      dateRange: newDateRange 
    });
  };

  // Handle print button click
  const handlePrint = () => {
    window.print();
  };

  // Handle export to PDF 
  const handleExportPDF = () => {
    // Get the main table content
    const contentElement = document.querySelector('.partnership-table');
    
    if (!contentElement) {
      alert('No content found to export. Please ensure you are viewing a table.');
      return;
    }
    
    // Create a clone of the element to avoid modifying the original
    const clonedContent = contentElement.cloneNode(true);
    
    // Remove any instruction text from the clone
    const instructions = clonedContent.querySelector('.table-instructions');
    if (instructions) {
      instructions.remove();
    }
    
    // Set PDF generation options
    const options = {
      margin: 10,
      filename: 'partnership-data-export.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    
    // Generate PDF
    html2pdf().from(clonedContent).set(options).save();
  };

  return (
    <aside className="sidebar">
      <h2>Filters</h2>
      
      <div className="filter-section">
        <label htmlFor="organization-filter">Organization:</label>
        <input
          id="organization-filter"
          type="text"
          value={organization}
          onChange={handleOrganizationChange}
          placeholder="Type to filter by organization"
        />
      </div>
      
      <div className="filter-section">
        <label htmlFor="population-filter">Target Population:</label>
        <select 
          id="population-filter" 
          value={targetPopulation} 
          onChange={handleTargetPopulationChange}
        >
          <option value="">All Populations</option>
          <option value="unhoused">Unhoused</option>
          <option value="youth">Youth</option>
          <option value="seniors">Seniors</option>
          <option value="lgbtq">LGBTQ+</option>
          <option value="substance">Substance Use</option>
          <option value="mental">Mental Health</option>
          <option value="families">Families</option>
        </select>
      </div>
      
      <div className="filter-section">
        <label htmlFor="date-range">Contact Date:</label>
        <select 
          id="date-range" 
          value={dateRange} 
          onChange={handleDateRangeChange}
        >
          <option value="all">All Time</option>
          <option value="last30">Last 30 Days</option>
          <option value="last90">Last 90 Days</option>
          <option value="last180">Last 6 Months</option>
          <option value="last365">Last Year</option>
        </select>
      </div>
      
      <div className="sidebar-actions">
        <button onClick={handlePrint} className="sidebar-button">
          Print View
        </button>
        <button onClick={handleExportPDF} className="sidebar-button">
          Export to PDF
        </button>
      </div>
      
      <div className="sidebar-help">
        <h3>Quick Help</h3>
        <p>Click on any row to view details.</p>
        <p>Use filters above to narrow down results.</p>
        <p>Add new partnerships using the "Add New" button.</p>
      </div>
    </aside>
  );
};

export default Sidebar;