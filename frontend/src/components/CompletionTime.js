import React, { useState, useEffect } from 'react';

function CompletionTime() {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isIron, setIsIron] = useState(false);
  const [completedItems, setCompletedItems] = useState([]);

  useEffect(() => {
    loadCompletedItems(); // Load completed items from local storage
  }, []);

  useEffect(() => {
    fetchCompletionTimes(); // Fetch completion times whenever isIron or completedItems changes
  }, [isIron, completedItems]);

  const loadCompletedItems = () => {
    const savedData = JSON.parse(localStorage.getItem('collectionLogData'));
    if (savedData) {
      const completed = savedData
        .filter(item => item.obtained)
        .map(item => item.id);
      setCompletedItems(completed);
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

  const formatTimeInHours = (time) => {
    return typeof time === 'number' ? `${time.toFixed(2)} hours` : time;
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
              <th>Completions/hr</th>
              <th>Extra Time to First Completion (hours)</th>
              <th>Effective Droprate (Neither)</th>
              <th>Time to Neither</th>
              <th>Effective Droprate (Independent)</th>
              <th>Time to Independent</th>
              <th>Effective Droprate (Exact)</th>
              <th>Time to Exact</th>
              <th>Effective Droprate (E&I)</th>
              <th>Time to E&I</th>
              <th>Fastest Item ID</th>
              <th>Time to Next Log Slot</th>
              <th>Fastest Slot</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity, index) => (
              <tr key={index}>
                <td>{activity.activity_index}</td>
                <td>{activity.activity_name}</td>
                <td>{activity.completions_per_hour}</td>
                <td>{formatTimeInHours(activity.extra_time_to_first_completion)}</td>
                <td>{activity.droprate_neither}</td>
                <td>{formatTimeInHours(activity.time_to_neither)}</td>
                <td>{activity.droprate_independent}</td>
                <td>{formatTimeInHours(activity.time_to_independent)}</td>
                <td>{activity.droprate_exact}</td>
                <td>{formatTimeInHours(activity.time_to_exact)}</td>
                <td>{activity.droprate_ei}</td>
                <td>{formatTimeInHours(activity.time_to_ei)}</td>
                <td>{activity.fastest_item_id}</td>
                <td>{formatTimeInHours(activity.time_to_next_log_slot)}</td>
                <td>{activity.fastest_slot}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default CompletionTime;
