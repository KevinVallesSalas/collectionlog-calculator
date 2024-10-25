import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import CollectionLog from './components/CollectionLog';

function App() {
  const [refreshLog, setRefreshLog] = useState(false);

  const handleUploadComplete = () => {
    // Toggle the refresh state to force CollectionLog to refetch data
    setRefreshLog(!refreshLog);
  };

  return (
    <div className="App">
      <h1>Collection Log Uploader</h1>
      <FileUpload onUploadComplete={handleUploadComplete} />

      <h2>Collected Items</h2>
      <CollectionLog refreshLog={refreshLog} />
    </div>
  );
}

export default App;
