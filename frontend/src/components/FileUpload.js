import React, { useState } from 'react';

function FileUpload({ onUploadComplete }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [username, setUsername] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleFileUpload = () => {
    const formData = new FormData();
    formData.append('file', selectedFile);

    fetch('http://127.0.0.1:8000/log_importer/upload/', {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === 'success') {
          setUploadStatus('File uploaded successfully!');
          localStorage.setItem('collectionLogData', JSON.stringify(data.data));
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
    fetch('http://127.0.0.1:8000/log_importer/fetch-user/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === 'success') {
          setUploadStatus('User data fetched successfully!');
          localStorage.setItem('collectionLogData', JSON.stringify(data.data));
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
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleFileUpload}>Upload File</button>

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
