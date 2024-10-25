import React, { useState } from 'react';

function FileUpload({ onUploadComplete }) {
  const [selectedFile, setSelectedFile] = useState(null);
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

    fetch('http://127.0.0.1:8000/log_importer/upload/', {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === 'success') {
          setUploadStatus('File uploaded successfully!');
          // Store the uploaded data in localStorage
          localStorage.setItem('collectionLogData', JSON.stringify(data.data));

          // Trigger re-fetch in parent component without reloading the page
          onUploadComplete();
        } else {
          setUploadStatus(`Error: ${data.message}`);
        }
      })
      .catch((error) => {
        setUploadStatus(`Error uploading file: ${error}`);
      });
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleFileUpload}>Upload File</button>
      {uploadStatus && <p>{uploadStatus}</p>}
    </div>
  );
}

export default FileUpload;
