import React, { useState, useEffect } from 'react';

function CompletionTime() {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/log_importer/calculate-completion-times/')
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          setActivities(data.data);
          setIsLoading(false);
        }
      })
      .catch(error => {
        console.error('Error fetching completion times:', error);
        setIsLoading(false);
      });
  }, []);

  // Toggle for showing only incomplete items
  const handleToggleIncomplete = () => {
    setShowIncompleteOnly(!showIncompleteOnly);
  };

  // Filtered activities based on toggle state
  const filteredActivities = showIncompleteOnly
    ? activities.filter(activity => activity.incomplete_items.length > 0)
    : activities;

  return (
    <div>
      <h1>Completion Times by Activity</h1>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <label>
            <input
              type="checkbox"
              checked={showIncompleteOnly}
              onChange={handleToggleIncomplete}
            />
            Show Incomplete Items Only
          </label>
          
          <table border="1" cellPadding="10" style={{ marginTop: '20px', width: '100%' }}>
            <thead>
              <tr>
                <th>Activity Name</th>
                <th>Time to Complete (hours)</th>
                <th>Fastest Item</th>
              </tr>
            </thead>
            <tbody>
              {filteredActivities.map((activity, index) => {
                // Get the fastest item based on the item with the minimum drop rate
                const fastestItem = activity.incomplete_items.reduce((fastest, item) => {
                  return item.drop_rate_attempts < (fastest?.drop_rate_attempts || Infinity)
                    ? item
                    : fastest;
                }, null);

                return (
                  <tr key={index}>
                    <td>{activity.activity_name}</td>
                    <td>{activity.total_time.toFixed(2)}</td>
                    <td>{fastestItem ? fastestItem.item_name : 'N/A'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CompletionTime;
