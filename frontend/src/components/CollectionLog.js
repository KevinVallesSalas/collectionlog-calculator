import React, { useState, useEffect } from 'react';

function CollectionLog() {
  const [logData, setLogData] = useState(null);
  const [groupedItems, setGroupedItems] = useState({});
  const [activeSection, setActiveSection] = useState("Bosses"); // Default section

  useEffect(() => {
    // Load structured data from localStorage
    const savedData = JSON.parse(localStorage.getItem('collectionLogData'));

    if (savedData) {
      setLogData(savedData);

      // Ensure sections exist
      const sections = savedData.sections || {
        "Bosses": {},
        "Raids": {},
        "Clues": {},
        "Minigames": {},
        "Other": {}
      };

      setGroupedItems(sections);
    }
  }, []);

  const clearStorage = () => {
    localStorage.removeItem('collectionLogData');  // ✅ Remove collection log data
    localStorage.removeItem('completionTimes');   // ✅ Remove calculated completion times
    setLogData(null);
    setGroupedItems({});
    setActiveSection("Bosses"); // Reset to default section
  };

  return (
    <div>
      <h1>Collection Log</h1>

      {logData ? (
        <div>
          <p><strong>Username:</strong> {logData.username}</p>
          <p><strong>Account Type:</strong> {logData.accountType}</p>
          <p><strong>Unique Slots Obtained:</strong> {logData.uniqueObtained} / {logData.uniqueItems}</p>

          {/* Section Selection Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            {Object.keys(groupedItems).map((section) => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                style={{
                  padding: '10px',
                  cursor: 'pointer',
                  backgroundColor: activeSection === section ? '#007bff' : '#ddd',
                  color: activeSection === section ? 'white' : 'black',
                  border: 'none',
                  borderRadius: '5px'
                }}
              >
                {section}
              </button>
            ))}
          </div>

          {/* Display Selected Section */}
          <div>
            <h2>{activeSection}</h2>
            {Object.keys(groupedItems[activeSection] || {}).length === 0 ? (
              <p>No items found in this category.</p>
            ) : (
              Object.entries(groupedItems[activeSection]).map(([subsection, items]) => (
                <div key={subsection}>
                  <h3>{subsection}</h3>
                  {items.length > 0 ? (
                    <ul>
                      {items.map((item, index) => (
                        <li key={index}>
                          {item.name} - <strong>{item.obtained ? '✅ Obtained' : '❌ Not Obtained'}</strong>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No items collected yet.</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <p>No data found. Please upload a collection log.</p>
      )}

      <button 
        onClick={clearStorage} 
        style={{ marginTop: '20px', padding: '10px', backgroundColor: '#ff4d4d', color: 'white', border: 'none', borderRadius: '5px' }}>
        Clear Collection Log
      </button>
    </div>
  );
}

export default CollectionLog;
