import React, { useState, useEffect } from 'react';

function ActivityMapStatus() {
  const [activityMapItems, setActivityMapItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState({ completed_items: [] }); // Initialize user data

  useEffect(() => {
    fetchActivityMapStatus();
  }, []);

  const fetchActivityMapStatus = () => {
    setIsLoading(true);
    fetch('http://127.0.0.1:8000/log_importer/activity-map-status/')
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          // Ensure user data is structured correctly
          setUserData(data.user_data || { completed_items: [] }); // Set to empty if not provided
          setActivityMapItems(data.data);
        }
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching activity map status:', error);
        setIsLoading(false);
      });
  };

  const calculateActiveStatus = (item) => {
    const isCompleted = userData.completed_items.includes(item.item_id);
    const requiresPrevious = item.requires_previous;
    // Check if the previous item in sequence is completed
    const previousItemCompleted = item.sequence > 0 && userData.completed_items.includes(item.sequence - 1);

    return !isCompleted && (previousItemCompleted || !requiresPrevious);
  };

  return (
    <div>
      <h1>Activity Map Status</h1>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Activity Name</th>
              <th>Item Name</th>
              <th>Completed</th>
              <th>Requires Previous</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {activityMapItems.map((item, index) => (
              <tr key={index}>
                <td>{item.activity_name}</td>
                <td>{item.item_name}</td>
                <td>{item.completed ? 'Yes' : 'No'}</td>
                <td>{item.requires_previous ? 'Yes' : 'No'}</td>
                <td>{calculateActiveStatus(item) ? 'Yes' : 'No'}</td> {/* Calculate active status dynamically */}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ActivityMapStatus;
