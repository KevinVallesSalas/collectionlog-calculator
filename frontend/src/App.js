import React, { useState } from 'react';
import { CSSTransition, SwitchTransition } from 'react-transition-group';
import './App.css';
import FetchCollectionlogData from './components/FetchCollectionLogData';
import CollectionLog from './components/CollectionLog';
import CompletionTime from './components/CompletionTime';
import { ItemsProvider } from './contexts/ItemsProvider';

function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [refreshLog, setRefreshLog] = useState(false);
  const [userCompletionRates] = useState(
    JSON.parse(localStorage.getItem('userCompletionRates')) || {}
  );

  const handleUploadComplete = () => {
    setRefreshLog(!refreshLog);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'upload':
        return <FetchCollectionlogData onUploadComplete={handleUploadComplete} />;
      case 'collection':
        return <CollectionLog refreshLog={refreshLog} />;
      case 'completion':
        return <CompletionTime userCompletionRates={userCompletionRates} />;
      default:
        return <FetchCollectionlogData onUploadComplete={handleUploadComplete} />;
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
              addEndListener={(node, done) => {
                node.addEventListener("transitionend", done, false);
              }}
              classNames="fade"
            >
              <div>
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
