// CollectionLog.js

import React, { useState, useEffect } from 'react';
import ItemImage from './ItemImage';

function CollectionLog() {
  const [logData, setLogData] = useState(null);
  const [groupedItems, setGroupedItems] = useState({});
  const [activeSection, setActiveSection] = useState("Bosses");
  const [activeSubsection, setActiveSubsection] = useState(null);

  useEffect(() => {
    // Load structured data from localStorage
    const savedData = JSON.parse(localStorage.getItem('collectionLogData'));
    if (savedData) {
      setLogData(savedData);
      const sections = savedData.sections || {
        "Bosses": {},
        "Raids": {},
        "Clues": {},
        "Minigames": {},
        "Other": {}
      };
      setGroupedItems(sections);
      const subs = Object.keys(sections[activeSection] || {});
      if (subs.length > 0) {
        setActiveSubsection(subs[0]);
      }
    }
  }, []);

  // Update activeSubsection when activeSection changes
  useEffect(() => {
    if (groupedItems[activeSection]) {
      const subs = Object.keys(groupedItems[activeSection]);
      setActiveSubsection(subs.length > 0 ? subs[0] : null);
    }
  }, [activeSection, groupedItems]);

  const clearStorage = () => {
    localStorage.removeItem('collectionLogData');
    localStorage.removeItem('completionTimes');
    setLogData(null);
    setGroupedItems({});
    setActiveSection("Bosses");
    setActiveSubsection(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded shadow-lg border border-gray-300 p-6">
        <h1 className="text-3xl font-bold mb-4 text-center">Collection Log</h1>
        
        {logData ? (
          <>
            {/* Header with overall progress */}
            <div className="mb-4 text-center">
              <p><strong>Username:</strong> {logData.username}</p>
              <p><strong>Account Type:</strong> {logData.accountType}</p>
              <p>
                <strong>Unique Slots Obtained:</strong> {logData.uniqueObtained} / {logData.uniqueItems}
              </p>
            </div>

            {/* Section Navigation */}
            <div className="flex justify-center gap-2 mb-4">
              {Object.keys(groupedItems).map(section => (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className={`px-4 py-2 rounded ${
                    activeSection === section ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'
                  }`}
                >
                  {section}
                </button>
              ))}
            </div>

            {/* Main layout: Sidebar & Grid */}
            <div className="flex flex-col md:flex-row">
              {/* Sidebar: Subcategories */}
              <aside className="md:w-1/4 md:mr-4 mb-4 md:mb-0">
                <h2 className="text-xl font-semibold mb-2">Categories</h2>
                {groupedItems[activeSection] && Object.keys(groupedItems[activeSection]).length > 0 ? (
                  <ul>
                    {Object.keys(groupedItems[activeSection]).map(subsection => (
                      <li key={subsection}>
                        <button
                          onClick={() => setActiveSubsection(subsection)}
                          className={`block w-full text-left px-3 py-2 rounded mb-1 ${
                            activeSubsection === subsection
                              ? 'bg-blue-400 text-white'
                              : 'hover:bg-blue-200'
                          }`}
                        >
                          {subsection}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No categories available.</p>
                )}
              </aside>

              {/* Grid of Items */}
              <main className="md:w-3/4">
                <h2 className="text-xl font-semibold mb-2">
                  {activeSubsection ? activeSubsection : activeSection}
                </h2>
                {activeSubsection &&
                groupedItems[activeSection][activeSubsection] &&
                groupedItems[activeSection][activeSubsection].length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {groupedItems[activeSection][activeSubsection].map((item, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <ItemImage
                          itemName={item.name}
                          fallbackSrc="/fallback.png"
                          style={{ width: '50px', height: '50px', marginBottom: '0.5rem' }}
                        />
                        <span className="text-sm text-center">{item.name}</span>
                        <span className="text-sm">{item.obtained ? '✅' : '❌'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No items in this category.</p>
                )}
              </main>
            </div>

            <div className="text-center mt-4">
              <button
                onClick={clearStorage}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                Clear Collection Log
              </button>
            </div>
          </>
        ) : (
          <p className="text-center">No data found. Please upload a collection log.</p>
        )}
      </div>
    </div>
  );
}

export default CollectionLog;
