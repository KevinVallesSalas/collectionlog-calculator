import React, { useState } from 'react';
import FetchCollectionlogData from './components/FetchCollectionLogData';
import CollectionLog from './components/CollectionLog';
import CompletionTime from './components/CompletionTime';
import ActivityMapStatus from './components/ActivityMapStatus'; // Import the new component

function App() {
  const [activeTab, setActiveTab] = useState('upload'); // default to the Upload tab
  const [refreshLog, setRefreshLog] = useState(false);

  // Function to trigger refresh of CollectionLog and CompletionTime on upload complete
  const handleUploadComplete = () => {
    setRefreshLog(!refreshLog); // Toggle to force re-fetching or re-rendering of data
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'upload':
        return <FetchCollectionlogData onUploadComplete={handleUploadComplete} />;
      case 'collection':
        return <CollectionLog refreshLog={refreshLog} />;
      case 'completion':
        return <CompletionTime refreshLog={refreshLog} />;
      case 'activity-map': // New case for ActivityMapStatus
        return <ActivityMapStatus />;
      default:
        return <FetchCollectionlogData onUploadComplete={handleUploadComplete} />;
    }
  };

  return (
    <div className="App">
      <h1>Collection Log App</h1>
      {/* Navigation Tabs */}
      <nav>
        <button onClick={() => setActiveTab('upload')} className={activeTab === 'upload' ? 'active' : ''}>
          Upload
        </button>
        <button onClick={() => setActiveTab('collection')} className={activeTab === 'collection' ? 'active' : ''}>
          Collection Log
        </button>
        <button onClick={() => setActiveTab('completion')} className={activeTab === 'completion' ? 'active' : ''}>
          Completion Time
        </button>
        <button onClick={() => setActiveTab('activity-map')} className={activeTab === 'activity-map' ? 'active' : ''}>
          Activity Map Status
        </button> {/* New button for ActivityMapStatus */}
      </nav>
      
      {/* Tab Content */}
      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
}

export default App;
