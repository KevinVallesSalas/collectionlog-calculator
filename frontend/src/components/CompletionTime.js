import React, { useState, useEffect, useRef } from 'react';
import { calculateTimeToNextLogSlot } from '../utils/calculations';

function findNextFastestItemName(items, userData) {
  const uncompleted = items.filter((i) => userData?.completed_items && !userData.completed_items.includes(i.id));
  if (uncompleted.length === 0) {
    return '-';
  }
  uncompleted.sort((a, b) => a.drop_rate_attempts - b.drop_rate_attempts);
  return uncompleted[0].name || '-';
}

function CompletionTime({ userCompletionRates }) {
  const [rawActivities, setRawActivities] = useState([]);
  const [activities, setActivities] = useState([]);
  const [userData, setUserData] = useState({ completed_items: [] });
  const fetchedActivities = useRef(false);

  // ✅ Load mode & manual toggle flag from localStorage
  const [isIron, setIsIron] = useState(() => {
    return JSON.parse(localStorage.getItem('isIron')) ?? false;
  });
  const [userToggled, setUserToggled] = useState(() => {
    return JSON.parse(localStorage.getItem('userToggledMode')) ?? false;
  });

  const [sortConfig, setSortConfig] = useState({ key: 'activity_name', direction: 'asc' });

  useEffect(() => {
    if (fetchedActivities.current) return; // If already fetched, exit
    fetchedActivities.current = true; // Mark as fetched

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
  Object.values(savedLogData.sections).forEach((categories) => {
    Object.values(categories).forEach((items) => {
      items.forEach((item) => {
        if (item.obtained) {
          collectedItems.push(item.id);
        }
      });
    });
  });

  setUserData({ 
    completed_items: collectedItems, 
    accountType: savedLogData.accountType ?? "NORMAL"
  });

  // ✅ Reset mode only if the user hasn’t manually toggled it
  if (!userToggled) {
    const newMode = savedLogData.accountType === "IRONMAN";
    setIsIron(newMode);
    localStorage.setItem('isIron', JSON.stringify(newMode));
    localStorage.setItem('userToggledMode', JSON.stringify(false)); // ✅ Reset manual toggle flag
  }
}, [rawActivities, userToggled]); // ✅ Added `userToggled` to dependencies


  useEffect(() => {
    if (!userData) return;

    const activitiesWithUnifiedFields = rawActivities.map((activity) => {
      const mappedItems = activity.maps.map((m) => ({
        id: m.item_id,
        name: m.item_name,
        drop_rate_attempts: m.drop_rate_attempts,
        neither_inverse: m.neither_inverse,
      }));
      return { ...activity, maps: mappedItems };
    });

    const newActivities = activitiesWithUnifiedFields.map((activity) => {
      const userRateMain = userCompletionRates[activity.activity_name]?.completions_per_hour_main;
      const userRateIron = userCompletionRates[activity.activity_name]?.completions_per_hour_iron;
      const defaultRateMain = activity.completions_per_hour_main ?? 0;
      const defaultRateIron = activity.completions_per_hour_iron ?? 0;

      const userExtraTimeMain = userCompletionRates[activity.activity_name]?.extra_time_to_first_completion ?? 0;
      const userExtraTimeIron = userCompletionRates[activity.activity_name]?.extra_time_to_first_completion ?? 0;
      
      const defaultExtraTimeMain = activity.extra_time_to_first_completion ?? 0;
      const defaultExtraTimeIron = activity.extra_time_to_first_completion ?? 0;

      const completionsPerHour = isIron
        ? userRateIron ?? defaultRateIron
        : userRateMain ?? defaultRateMain;

        const extraTimeToFirstCompletion = isIron
        ? userExtraTimeIron || defaultExtraTimeIron
        : userExtraTimeMain || defaultExtraTimeMain;

      if (activity.maps.length === 0) {
        return {
          activity_name: activity.activity_name,
          time_to_next_log_slot: 'No available data',
          fastest_slot_name: '-',
        };
      }

      const nextSlotTime = calculateTimeToNextLogSlot(
        activity.maps,
        completionsPerHour,
        extraTimeToFirstCompletion,
        userData || { completed_items: [] }
      );

      const fastestSlotName = findNextFastestItemName(activity.maps, userData || { completed_items: [] });

      return {
        activity_name: activity.activity_name,
        time_to_next_log_slot: nextSlotTime,
        fastest_slot_name: fastestSlotName,
        completions_per_hour: completionsPerHour,
        extra_time_to_first_completion: extraTimeToFirstCompletion,
      };
    });

    setActivities(newActivities);
  }, [rawActivities, isIron, userData, userCompletionRates]);

  const toggleIronMode = () => {
    setIsIron((prev) => {
      const newValue = !prev;
      localStorage.setItem('isIron', JSON.stringify(newValue));
      setUserToggled(true); // ✅ Mark that the user manually changed the mode
      localStorage.setItem('userToggledMode', JSON.stringify(true)); // ✅ Persist manual toggle
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