import React, { useState } from 'react';
import FetchCollectionlogData from './components/FetchCollectionLogData';
import CollectionLog from './components/CollectionLog';
import CompletionTime from './components/CompletionTime';
import CompletionRates from './components/CompletionRates';

function App() {
  const [activeTab, setActiveTab] = useState('upload'); // Default to Upload tab
  const [refreshLog, setRefreshLog] = useState(false);
  const [userCompletionRates, setUserCompletionRates] = useState(
    JSON.parse(localStorage.getItem('userCompletionRates')) || {} // ✅ Load from storage
  );

  // Function to trigger refresh of CollectionLog on upload complete
  const handleUploadComplete = () => {
    setRefreshLog(!refreshLog); // Toggle state to refresh collection log data
  };

  // Function to update user completion rates in state and localStorage
  const handleRatesUpdated = (newRates) => {
    setUserCompletionRates(newRates);
    localStorage.setItem('userCompletionRates', JSON.stringify(newRates));
    
    setRefreshLog((prev) => !prev); // ✅ Force re-render when user updates rates
  };
  

  const renderTabContent = () => {
    switch (activeTab) {
      case 'upload':
        return <FetchCollectionlogData onUploadComplete={handleUploadComplete} />;
      case 'collection':
        return <CollectionLog refreshLog={refreshLog} />;
      case 'completion':
        return <CompletionTime userCompletionRates={userCompletionRates} />; // ✅ Pass updated rates
      case 'completion-rates':
        return <CompletionRates onRatesUpdated={handleRatesUpdated} />; // ✅ Pass update function
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
        <button onClick={() => setActiveTab('completion-rates')} className={activeTab === 'completion-rates' ? 'active' : ''}>
          Completion Rates
        </button>
      </nav>

      {/* Tab Content */}
      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
}

export default App;
