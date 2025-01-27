import React, { useState, useEffect } from 'react';

function ActivityMapStatus() {
  const [activityMapItems, setActivityMapItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completedItems, setCompletedItems] = useState([]);

  useEffect(() => {
    fetchActivityMapStatus();
    loadCompletedItems();
  }, []);

  const fetchActivityMapStatus = () => {
    setIsLoading(true);
    fetch('http://127.0.0.1:8000/log_importer/activity-map-status/')
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          setActivityMapItems(data.data);
        }
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching activity map status:', error);
        setIsLoading(false);
      });
  };

  const loadCompletedItems = () => {
    const savedData = JSON.parse(localStorage.getItem('collectionLogData'));
    if (savedData) {
      const completed = [];

      // Extract completed item IDs from all sections
      Object.values(savedData.sections || {}).forEach(section => {
        Object.values(section).forEach(entry => {
          entry.forEach(item => {
            if (item.obtained) {
              completed.push(item.id);
            }
          });
        });
      });

      setCompletedItems(completed);
    }
  };

  const calculateActiveStatus = (item) => {
    const isCompleted = completedItems.includes(item.item_id);
    const requiresPrevious = item.requires_previous;

    // Find previous item based on sequence number
    const previousItem = activityMapItems.find(i => i.activity_index === item.activity_index - 1);
    const previousItemCompleted = previousItem ? completedItems.includes(previousItem.item_id) : true;

    return !isCompleted && (previousItemCompleted || !requiresPrevious);
  };

  return (
    <div>
      <h1>Activity Map Status</h1>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Activity Index</th>
                <th>Activity Name</th>
                <th>Completions per Hour</th>
                <th>Additional Time to First Completion (hours)</th>
                <th>Item ID</th>
                <th>Item Name</th>
                <th>Completed</th>
                <th>Requires Previous</th>
                <th>Active</th>
                <th>Exact</th>
                <th>Independent</th>
                <th>Drop Rate (Attempts)</th>
                <th>E&I</th>
                <th>E</th>
                <th>I</th>
                <th>Neither^(-1)</th>
              </tr>
            </thead>
            <tbody>
              {activityMapItems.map((item, index) => (
                <tr key={index}>
                  <td>{item.activity_index}</td>
                  <td>{item.activity_name}</td>
                  <td>{item.completions_per_hour}</td>
                  <td>{item.additional_time_to_first_completion}</td>
                  <td>{item.item_id}</td>
                  <td>{item.item_name}</td>
                  <td>{completedItems.includes(item.item_id) ? 'Yes' : 'No'}</td>
                  <td>{item.requires_previous ? 'Yes' : 'No'}</td>
                  <td>{calculateActiveStatus(item) ? 'Yes' : 'No'}</td>
                  <td>{item.exact ? 'Yes' : 'No'}</td>
                  <td>{item.independent ? 'Yes' : 'No'}</td>
                  <td>{item.drop_rate_attempts}</td>
                  <td>{item.e_and_i}</td>
                  <td>{item.e_only}</td>
                  <td>{item.i_only}</td>
                  <td>{item.neither_inverse}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ActivityMapStatus;
