import React, { useState } from 'react';

function FileUpload({ onUploadComplete }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [username, setUsername] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleFileUpload = () => {
    if (!selectedFile) {
      setUploadStatus('Please select a file before uploading.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    // POST the file to your Django "collection-log" endpoint
    fetch('http://127.0.0.1:8000/log_importer/collection-log/', {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === 'success') {
          setUploadStatus('File uploaded successfully!');
          // Store the raw data in localStorage for the frontend to calculate
          localStorage.setItem('collectionLogData', JSON.stringify(data.data));
          // Let the parent component know upload is complete
          onUploadComplete();
        } else {
          setUploadStatus(`Error: ${data.message}`);
        }
      })
      .catch((error) => {
        setUploadStatus(`Error uploading file: ${error}`);
      });
  };

  const handleFetchUserData = () => {
    if (!username.trim()) {
      setUploadStatus('Please enter a username.');
      return;
    }

    // POST the username to your Django "collection-log" endpoint
    fetch('http://127.0.0.1:8000/log_importer/collection-log/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === 'success') {
          setUploadStatus('User data fetched successfully!');
          // Store the raw data in localStorage for the frontend to calculate
          localStorage.setItem('collectionLogData', JSON.stringify(data.data));
          // Let the parent component know fetch is complete
          onUploadComplete();
        } else {
          setUploadStatus(`Error: ${data.message}`);
        }
      })
      .catch((error) => {
        setUploadStatus(`Error fetching data: ${error}`);
      });
  };

  return (
    <div>
      <h2>Upload Collection Log</h2>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleFileUpload}>Upload File</button>

      <h2>Fetch User Data</h2>
      <input
        type="text"
        placeholder="Enter username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <button onClick={handleFetchUserData}>Fetch User Data</button>

      {uploadStatus && <p>{uploadStatus}</p>}
    </div>
  );
}

export default FileUpload;
