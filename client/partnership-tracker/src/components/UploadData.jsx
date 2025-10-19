import React, { useState } from 'react';

const UploadData = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('http://127.0.0.1:5000/api/upload-partners', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setMessage(data.message);
    } catch (err) {
      console.error('Upload error:', err);
      setMessage('Error uploading file.');
    }
  };

  return (
    <div>
      <h2>Upload Previous Data</h2>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default UploadData;