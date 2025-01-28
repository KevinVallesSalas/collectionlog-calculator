import React, { useState, useEffect, useCallback } from 'react';

function CompletionTime() {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isIron, setIsIron] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'time_to_next_log_slot', direction: 'asc' });

  const calculateCompletionTimes = useCallback(() => {
    const savedLogData = JSON.parse(localStorage.getItem('collectionLogData'));

    if (!savedLogData || !savedLogData.sections) {
      setIsLoading(false);
      return;
    }

    const collectedItems = [];
    Object.values(savedLogData.sections).forEach((categories) => {
      Object.values(categories).forEach((items) => {
        items.forEach(item => {
          if (item.obtained) collectedItems.push(item.id);
        });
      });
    });

    setIsCalculating(true);
    fetch(`http://127.0.0.1:8000/log_importer/calculate-completion-times/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        is_iron: isIron,
        completed_items: collectedItems,
      }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          setActivities(data.data);
          localStorage.setItem('completionTimes', JSON.stringify(data.data));
        }
        setIsLoading(false);
        setIsCalculating(false);
      })
      .catch(error => {
        console.error('Error fetching completion times:', error);
        setIsLoading(false);
        setIsCalculating(false);
      });
  }, [isIron]);

  const loadCompletionTimes = useCallback(() => {
    setIsLoading(true);
    const storedData = JSON.parse(localStorage.getItem('completionTimes'));

    if (storedData) {
      setActivities(storedData);
      setIsLoading(false);
    } else {
      calculateCompletionTimes();
    }
  }, [calculateCompletionTimes]);

  useEffect(() => {
    loadCompletionTimes();
  }, [loadCompletionTimes]);

  const toggleIronMode = () => {
    setIsIron(!isIron);
    localStorage.removeItem('completionTimes');
    setActivities([]);
    calculateCompletionTimes();
  };

  const clearStorage = () => {
    localStorage.removeItem('collectionLogData');
    localStorage.removeItem('completionTimes');
    setActivities([]);
    setIsLoading(false);
  };

  const formatTimeInHMS = (days) => {
    if (typeof days !== 'number' || days <= 0) return "Done!";
    let totalSeconds = Math.floor(days * 24 * 3600);
    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const getNextFastestItemName = (timeToNextLogSlot, fastestSlotName) => {
    return (typeof timeToNextLogSlot !== 'number' || timeToNextLogSlot <= 0) ? '-' : fastestSlotName || '-';
  };

  const sortActivities = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    const sortedActivities = [...activities].sort((a, b) => {
      let valA = a[key];
      let valB = b[key];

      if (key === 'time_to_next_log_slot') {
        valA = typeof valA === 'number' && valA > 0 ? valA : Infinity;
        valB = typeof valB === 'number' && valB > 0 ? valB : Infinity;
      }

      if (direction === 'asc') return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
    });

    setSortConfig({ key, direction });
    setActivities(sortedActivities);
  };

  return (
    <div>
      <h1>Completion Times by Activity</h1>
      <label>
        <input type="checkbox" checked={isIron} onChange={toggleIronMode} />
        Iron Mode
      </label>

      {isLoading ? (
        <p>Loading...</p>
      ) : isCalculating ? (
        <p>Calculating completion times...</p>
      ) : activities.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th onClick={() => sortActivities('activity_name')} style={{ cursor: 'pointer' }}>
                Activity Name {sortConfig.key === 'activity_name' ? (sortConfig.direction === 'asc' ? '⬆' : '⬇') : ''}
              </th>
              <th onClick={() => sortActivities('time_to_next_log_slot')} style={{ cursor: 'pointer' }}>
                Time to Next Log Slot {sortConfig.key === 'time_to_next_log_slot' ? (sortConfig.direction === 'asc' ? '⬆' : '⬇') : ''}
              </th>
              <th>Fastest Slot (Next Fastest Item)</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity, index) => (
              <tr key={index}>
                <td>{activity.activity_name}</td>
                <td>{formatTimeInHMS(activity.time_to_next_log_slot)}</td>
                <td>{getNextFastestItemName(activity.time_to_next_log_slot, activity.fastest_slot_name)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No data available. Please upload a collection log.</p>
      )}

      {/* Clear Collection Log Button */}
      <button 
        onClick={clearStorage} 
        style={{
          marginTop: '20px', 
          padding: '10px', 
          backgroundColor: '#ff4d4d', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px'
        }}
      >
        Clear Collection Log
      </button>
    </div>
  );
}

export default CompletionTime;
