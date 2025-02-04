import React, { useState } from 'react'; 

function FetchCollectionLogData({ onUploadComplete }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [username, setUsername] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const processFetchedLogData = (data) => {
    if (data.status === 'success') {
      setUploadStatus('Log fetched successfully!');
      
      // ✅ Store collection log data along with boss kill counts
      const logData = data.data;

      if (logData.sections?.Bosses) {
        Object.keys(logData.sections.Bosses).forEach((boss) => {
          if (!logData.sections.Bosses[boss].killCount) {
            logData.sections.Bosses[boss].killCount = { name: "Unknown", amount: 0 }; // Default if missing
          }
        });
      }

      // ✅ Save the data to local storage
      localStorage.setItem('collectionLogData', JSON.stringify(logData));

      // ✅ Store Ironman status
      const newMode = logData.accountType === "IRONMAN";
      localStorage.setItem('isIron', JSON.stringify(newMode));
      localStorage.setItem('userToggledMode', JSON.stringify(false));

      // ✅ Notify the app that new data is available
      onUploadComplete();
    } else {
      setUploadStatus(`Error: ${data.message}`);
    }
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
      .then(processFetchedLogData)
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
      .then(processFetchedLogData)
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

export default FetchCollectionLogData;
