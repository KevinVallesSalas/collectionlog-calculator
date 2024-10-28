import React, { useState, useEffect } from 'react';

function CollectionLog() {
  const [items, setItems] = useState([]);
  const [displayUnique, setDisplayUnique] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [collectedItems, setCollectedItems] = useState(0);
  const [uniqueItems, setUniqueItems] = useState(0);
  const [uniqueCollectedItems, setUniqueCollectedItems] = useState(0);

  useEffect(() => {
    // Load data from localStorage
    const savedData = JSON.parse(localStorage.getItem('collectionLogData'));

    if (savedData) {
      setItems(savedData);

      // Calculate total and collected items
      const total = savedData.length;
      const collected = savedData.filter(item => item.obtained).length;

      // Calculate unique and unique collected items
      const uniqueNames = new Set(savedData.map(item => item.name));
      const uniqueCount = uniqueNames.size;
      const uniqueCollectedCount = new Set(
        savedData.filter(item => item.obtained).map(item => item.name)
      ).size;

      setTotalItems(total);
      setCollectedItems(collected);
      setUniqueItems(uniqueCount);
      setUniqueCollectedItems(uniqueCollectedCount);
    }
  }, []);

  const clearStorage = () => {
    localStorage.removeItem('collectionLogData');
    setItems([]);
    setTotalItems(0);
    setCollectedItems(0);
    setUniqueItems(0);
    setUniqueCollectedItems(0);
  };

  return (
    <div>
      <h1>Collection Log</h1>
      <button onClick={() => setDisplayUnique(!displayUnique)}>
        Toggle to {displayUnique ? 'Total Slots' : 'Unique Slots'}
      </button>
      
      {displayUnique ? (
        <div>
          <p>Unique Log Slots: {uniqueItems}</p>
          <p>Unique Collected Slots: {uniqueCollectedItems}</p>
        </div>
      ) : (
        <div>
          <p>Total Log Slots: {totalItems}</p>
          <p>Total Collected Slots: {collectedItems}</p>
        </div>
      )}

      <ul>
        {items.length > 0 ? (
          items.map((item, index) => (
            <li key={`${item.id}-${index}`}>
              {item.name} - {item.obtained ? 'Collected' : 'Not Collected'}
            </li>
          ))
        ) : (
          <p>No items found. Upload a new collection log.</p>
        )}
      </ul>

      <button onClick={clearStorage}>Clear Collection Log</button>
    </div>
  );
}

export default CollectionLog;
