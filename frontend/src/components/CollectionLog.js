import React, { useState, useEffect } from 'react';

function CollectionLog({ refreshLog }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    // Fetch the data from local storage on component load and when `refreshLog` changes
    const collectionLogData = localStorage.getItem('collectionLogData');
    if (collectionLogData) {
      setItems(JSON.parse(collectionLogData));
    } else {
      setItems([]); // Clear the list if no data in local storage
    }
  }, [refreshLog]); // Use `refreshLog` to trigger re-fetch when new data is uploaded

  const clearStorage = () => {
    // Clear local storage and reset items
    localStorage.removeItem('collectionLogData');
    setItems([]);
  };

  return (
    <div>
      <h1>Collection Log</h1>
      <ul>
        {items.length > 0 ? (
          items.map((item) => (
            <li key={item.id}>
              {item.name} - {item.obtained ? 'Collected' : 'Not Collected'}
            </li>
          ))
        ) : (
          <p>No items found. Upload a new collection log.</p>
        )}
      </ul>
      {/* Button to clear local storage if needed */}
      <button onClick={clearStorage}>Clear Collection Log</button>
    </div>
  );
}

export default CollectionLog;
