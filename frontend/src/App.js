import React, { useState } from 'react';
import './App.css';
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
    <div className="min-h-screen bg-black flex flex-col">
      {/* Navigation Bar - Styled like Collection Log Tabs */}
      <nav className="bg-[#2A1E14] border-b-4 border-[#4A3B2A] py-2">
        <div className="max-w-4xl mx-auto flex justify-around text-yellow-300 text-sm font-bold uppercase">
          {[
            { key: 'upload', label: 'Upload' },
            { key: 'collection', label: 'Collection Log' },
            { key: 'completion', label: 'Completion Time' },
            { key: 'completion-rates', label: 'Completion Rates' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 ${
                activeTab === key
                  ? 'text-orange-400 border-b-2 border-orange-400'
                  : 'hover:text-orange-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Page Content - Centered Collection Log */}
      <div className="flex flex-grow items-center justify-center">
        {renderTabContent()}
      </div>
    </div>
  );
}

export default App;
