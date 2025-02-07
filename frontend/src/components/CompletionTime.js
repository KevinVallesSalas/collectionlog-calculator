import React, { useState, useEffect, useRef } from 'react';
import { calculateActivityData } from '../utils/calculations';

function CompletionTime({ userCompletionRates }) {
  const [rawActivities, setRawActivities] = useState([]);
  const [activities, setActivities] = useState([]);
  const [userData, setUserData] = useState({ completed_items: [] });
  const fetchedActivities = useRef(false);

  // Load mode & manual toggle flag from localStorage
  const [isIron, setIsIron] = useState(() => {
    return JSON.parse(localStorage.getItem('isIron')) ?? false;
  });
  const [userToggled, setUserToggled] = useState(() => {
    return JSON.parse(localStorage.getItem('userToggledMode')) ?? false;
  });
  const [sortConfig, setSortConfig] = useState({ key: 'activity_name', direction: 'asc' });

  useEffect(() => {
    if (fetchedActivities.current) return;
    fetchedActivities.current = true;
    async function fetchActivitiesData() {
      try {
        const response = await fetch('http://127.0.0.1:8000/log_importer/get-activities-data/');
        const json = await response.json();
        if (json.status === 'success') {
          setRawActivities(json.data);
        }
      } catch (error) {
        console.error('Error fetching activities data:', error);
      }
    }
    fetchActivitiesData();
  }, []);

  useEffect(() => {
    const savedLogData = JSON.parse(localStorage.getItem('collectionLogData'));
    if (!savedLogData || !savedLogData.sections) {
      setUserData({ completed_items: [] });
      return;
    }
    const collectedItems = [];
    // Iterate over each section and activity, checking for an "items" array.
    Object.values(savedLogData.sections).forEach((section) => {
      Object.values(section).forEach((activity) => {
        if (activity.items && Array.isArray(activity.items)) {
          activity.items.forEach((item) => {
            if (item.obtained) {
              collectedItems.push(item.id);
            }
          });
        }
      });
    });
    setUserData({
      completed_items: collectedItems,
      accountType: savedLogData.accountType ?? "NORMAL"
    });
    if (!userToggled) {
      const newMode = savedLogData.accountType === "IRONMAN";
      setIsIron(newMode);
      localStorage.setItem('isIron', JSON.stringify(newMode));
      localStorage.setItem('userToggledMode', JSON.stringify(false));
    }
  }, [rawActivities, userToggled]);

  useEffect(() => {
    if (!userData) return;
    const newActivities = rawActivities.map((activity) =>
      calculateActivityData(activity, userCompletionRates, isIron, userData)
    );
    setActivities(newActivities);
  }, [rawActivities, isIron, userData, userCompletionRates]);

  const toggleIronMode = () => {
    setIsIron((prev) => {
      const newValue = !prev;
      localStorage.setItem('isIron', JSON.stringify(newValue));
      setUserToggled(true);
      localStorage.setItem('userToggledMode', JSON.stringify(true));
      return newValue;
    });
  };

  const sortActivities = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    const sorted = [...activities].sort((a, b) => {
      let valA = a[key];
      let valB = b[key];
      if (key === 'time_to_next_log_slot') {
        valA = typeof valA === 'number' ? valA : valA === 'Done!' ? Infinity : Infinity;
        valB = typeof valB === 'number' ? valB : valB === 'Done!' ? Infinity : Infinity;
      }
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      return 0;
    });
    setActivities(sorted);
    setSortConfig({ key, direction });
  };

  const formatTimeInHMS = (days) => {
    if (days === 'Done!' || days === 'No available data') {
      return days;
    }
    if (typeof days !== 'number' || days <= 0) {
      return 'Done!';
    }
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
        <input 
          type="checkbox" 
          checked={isIron} 
          onChange={toggleIronMode} 
        />
        Iron Mode
      </label>
      {activities.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th onClick={() => sortActivities('activity_name')} style={{ cursor: 'pointer' }}>
                Activity Name {sortConfig.key === 'activity_name' ? (sortConfig.direction === 'asc' ? ' ⬆' : ' ⬇') : ''}
              </th>
              <th onClick={() => sortActivities('time_to_next_log_slot')} style={{ cursor: 'pointer' }}>
                Time to Next Log Slot {sortConfig.key === 'time_to_next_log_slot' ? (sortConfig.direction === 'asc' ? ' ⬆' : ' ⬇') : ''}
              </th>
              <th>Next Fastest Item</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((act, index) => (
              <tr key={index}>
                <td>{act.activity_name}</td>
                <td>{formatTimeInHMS(act.time_to_next_log_slot)}</td>
                <td>{act.fastest_slot_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No data available. Please upload a collection log.</p>
      )}
    </div>
  );
}

export default CompletionTime;
