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

    fetch('http://127.0.0.1:8000/log_importer/collection-log/', {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === 'success') {
          setUploadStatus('File uploaded successfully!');
          localStorage.setItem('collectionLogData', JSON.stringify(data.data));

          fetchCompletionTimes(); // ✅ Trigger completion time calculations
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

    fetch('http://127.0.0.1:8000/log_importer/collection-log/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === 'success') {
          setUploadStatus('User data fetched successfully!');
          localStorage.setItem('collectionLogData', JSON.stringify(data.data));

          fetchCompletionTimes(); // ✅ Trigger completion time calculations
          onUploadComplete();
        } else {
          setUploadStatus(`Error: ${data.message}`);
        }
      })
      .catch((error) => {
        setUploadStatus(`Error fetching data: ${error}`);
      });
  };

  const fetchCompletionTimes = () => {
    const savedData = JSON.parse(localStorage.getItem('collectionLogData'));
    if (!savedData) {
      console.error('No collection log data found.');
      return;
    }

    // Extract completed items
    const completedItems = [];
    Object.values(savedData.sections).forEach((categories) => {
      Object.values(categories).forEach((items) => {
        items.forEach((item) => {
          if (item.obtained) completedItems.push(item.id);
        });
      });
    });

    fetch('http://127.0.0.1:8000/log_importer/calculate-completion-times/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        is_iron: false, // Default value, modify as needed
        completed_items: completedItems,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === 'success') {
          localStorage.setItem('completionTimes', JSON.stringify(data.data)); // ✅ Store computed times
        }
      })
      .catch((error) => {
        console.error('Error fetching completion times:', error);
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
