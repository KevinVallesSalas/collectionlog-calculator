import React, { useState, useEffect } from 'react';

function CompletionTime() {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isIron, setIsIron] = useState(false);
  const [userData, setUserData] = useState({ completed_items: [] }); // To store user data

  useEffect(() => {
    // Call to fetch user data
    fetchUserData(); 
  }, []);

  useEffect(() => {
    // Fetch completion times whenever isIron or userData changes
    fetchCompletionTimes();
  }, [isIron, userData]);

  const fetchUserData = () => {
    // Function to fetch user data from the JSON upload or any source
    fetch('http://127.0.0.1:8000/log_importer/upload-json/', { method: 'POST', body: JSON.stringify({}) }) // Modify as needed
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          setUserData(data.user_data); // Store the user data
        }
      })
      .catch(error => console.error('Error fetching user data:', error));
  };

  const fetchCompletionTimes = () => {
    setIsLoading(true);

    // Construct the query string for completed items
    const completedItemsQuery = userData.completed_items
      .map(itemId => `completed_items=${itemId}`)
      .join('&');

    fetch(`http://127.0.0.1:8000/log_importer/calculate-completion-times/?is_iron=${isIron}&${completedItemsQuery}`)
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
              <th>Activity Name</th>
              <th>Drop Rate (Neither)</th>
              <th>Drop Rate (Independent)</th>
              <th>Time to Exact</th>
              <th>Time to E&I</th>
              <th>Time to Next Log Slot</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity, index) => (
              <tr key={index}>
                <td>{activity.activity_name}</td>
                <td>{activity.droprate_neither}</td>
                <td>{activity.droprate_independent}</td>
                <td>{formatTimeInHours(activity.time_to_exact)}</td>
                <td>{formatTimeInHours(activity.time_to_ei)}</td>
                <td>{formatTimeInHours(activity.time_to_next_log_slot)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default CompletionTime;
