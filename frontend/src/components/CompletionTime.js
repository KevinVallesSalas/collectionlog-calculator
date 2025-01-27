import React, { useState, useEffect } from 'react';

function CompletionTime() {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isIron, setIsIron] = useState(false);
  const [completedItems, setCompletedItems] = useState([]);

  useEffect(() => {
    loadCompletedItems();
  }, []);

  useEffect(() => {
    if (completedItems.length > 0) {
      fetchCompletionTimes();
    } else {
      setActivities([]);
    }
  }, [isIron, completedItems]);

  const loadCompletedItems = () => {
    const savedData = JSON.parse(localStorage.getItem('collectionLogData'));
    if (savedData && savedData.sections) {
      const collected = [];

      Object.values(savedData.sections).forEach((categories) => {
        Object.values(categories).forEach((items) => {
          items.forEach(item => {
            if (item.obtained) collected.push(item.id);
          });
        });
      });

      setCompletedItems(collected);
    }
  };

  const fetchCompletionTimes = () => {
    setIsLoading(true);

    fetch(`http://127.0.0.1:8000/log_importer/calculate-completion-times/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        is_iron: isIron,
        completed_items: completedItems,
      }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          setActivities(data.data);
        }
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching completion times:', error);
        setIsLoading(false);
      });
  };

  const toggleIronMode = () => {
    setIsIron(!isIron);
  };

  const formatTimeInHMS = (days) => {
    if (typeof days !== 'number' || days <= 0) return "N/A";

    let totalSeconds = Math.floor(days * 24 * 3600);
    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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
      ) : (
        <table>
          <thead>
            <tr>
              <th>Index</th>
              <th>Activity Name</th>
              <th>Time to Next Log Slot</th>
              <th>Fastest Slot (Next Fastest Item)</th>
            </tr>
          </thead>
          <tbody>
            {activities.length > 0 ? (
              activities.map((activity, index) => (
                <tr key={index}>
                  <td>{activity.activity_index}</td>
                  <td>{activity.activity_name}</td>
                  <td>{formatTimeInHMS(activity.time_to_next_log_slot)}</td>
                  <td>{activity.fastest_slot_name || 'Unknown'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">No data available</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default CompletionTime;
