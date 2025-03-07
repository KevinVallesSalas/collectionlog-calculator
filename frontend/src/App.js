import React, { useState, useRef } from 'react';
import { CSSTransition, SwitchTransition } from 'react-transition-group';
import './App.css';
import FetchCollectionlogData from './components/FetchCollectionLogData';
import CollectionLog from './components/CollectionLog';
import CompletionTime from './components/CompletionTime';
import { ItemsProvider } from './contexts/ItemsProvider';

// Define the backend URL from an environment variable, defaulting to local dev URL if not set
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [refreshLog, setRefreshLog] = useState(false);
  const [userCompletionRates] = useState(
    JSON.parse(localStorage.getItem('userCompletionRates')) || {}
  );
  const nodeRef = useRef(null); // Create a ref for the transitioning element

  const handleUploadComplete = () => {
    setRefreshLog(!refreshLog);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'upload':
        return (
          <FetchCollectionlogData
            backendUrl={BACKEND_URL}
            onUploadComplete={handleUploadComplete}
          />
        );
      case 'collection':
        return <CollectionLog refreshLog={refreshLog} />;
      case 'completion':
        return <CompletionTime userCompletionRates={userCompletionRates} />;
      default:
        return (
          <FetchCollectionlogData
            backendUrl={BACKEND_URL}
            onUploadComplete={handleUploadComplete}
          />
        );
    }
  };

  return (
    <ItemsProvider>
      <div className="min-h-screen bg-black flex flex-col">
        {/* Navigation Bar */}
        <nav className="bg-[#2A1E14] border-b-4 border-[#4A3B2A] py-2">
          <div className="max-w-4xl mx-auto flex justify-around text-yellow-300 text-sm font-bold uppercase">
            {[
              { key: 'upload', label: 'Upload' },
              { key: 'collection', label: 'Collection Log' },
              { key: 'completion', label: 'Completion Time' },
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

        {/* Transitioning Tab Content */}
        <div className="flex flex-grow items-center justify-center">
          <SwitchTransition mode="out-in">
            <CSSTransition
              key={activeTab}
              nodeRef={nodeRef} // Pass the ref here
              timeout={100}   // Set a timeout if you don't use addEndListener
              classNames="fade"
            >
              <div ref={nodeRef}>
                {renderTabContent()}
              </div>
            </CSSTransition>
          </SwitchTransition>
        </div>
      </div>
    </ItemsProvider>
  );
}

export default App;
