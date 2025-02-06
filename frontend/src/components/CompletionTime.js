import React, { useState, useEffect, useRef } from 'react';
import { calculateTimeToNextLogSlot } from '../utils/calculations';

function findNextFastestItemName(items, userData) {
  if (!Array.isArray(items) || !Array.isArray(userData.completed_items)) {
    console.error("❌ Invalid data format:", { items, userData });
    return '-';
  }

  const completedSet = new Set(userData.completed_items.map(Number)); // Ensure IDs are numbers

  const uncompleted = items.filter((i) => !completedSet.has(i.id));

  if (uncompleted.length === 0) {
    return '-';
  }

  uncompleted.sort((a, b) => a.drop_rate_attempts - b.drop_rate_attempts);
  return uncompleted[0].name || '-';
}

const formatTimeInHMS = (days) => {
  if (!days || days === 'Done!' || days === 'No available data') {
    return days;
  }

  if (typeof days !== 'number' || days <= 0) {
    return 'Done!';
  }

  const totalSeconds = Math.floor(days * 24 * 3600);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

function CompletionTime({ userCompletionRates }) {
  const [rawActivities, setRawActivities] = useState([]);
  const [activities, setActivities] = useState([]);
  const [userData, setUserData] = useState({ completed_items: [] });
  const fetchedActivities = useRef(false);

  const [isIron, setIsIron] = useState(() => JSON.parse(localStorage.getItem('isIron')) ?? false);
  const [userToggled, setUserToggled] = useState(() => JSON.parse(localStorage.getItem('userToggledMode')) ?? false);
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

    if (!savedLogData || !savedLogData.sections || typeof savedLogData.sections !== 'object') {
      console.error("❌ Invalid structure for savedLogData.sections:", savedLogData?.sections);
      setUserData({ completed_items: [] });
      return;
    }

    const collectedItems = new Set();
    Object.values(savedLogData.sections).forEach((categories) => {
      Object.values(categories).forEach((items) => {
        if (!Array.isArray(items)) return;
        items.forEach((item) => {
          if (item.obtained) {
            collectedItems.add(Number(item.id)); // Ensure stored IDs are numbers
          }
        });
      });
    });

    console.log("✅ Extracted completed items:", [...collectedItems]);

    setUserData({
      completed_items: [...collectedItems],
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

    const activitiesWithUnifiedFields = rawActivities.map((activity) => {
      const mappedItems = activity.maps.map((m) => ({
        id: Number(m.item_id), // Ensure item ID is a number
        name: m.item_name,
        drop_rate_attempts: m.drop_rate_attempts,
        neither_inverse: m.neither_inverse ?? 0,
      }));
      return { ...activity, maps: mappedItems };
    });

    const newActivities = activitiesWithUnifiedFields.map((activity) => {
      const userRateMain = userCompletionRates[activity.activity_name]?.completions_per_hour_main;
      const userRateIron = userCompletionRates[activity.activity_name]?.completions_per_hour_iron;
      const defaultRateMain = activity.completions_per_hour_main ?? 0;
      const defaultRateIron = activity.completions_per_hour_iron ?? 0;

      const completionsPerHour = isIron ? userRateIron ?? defaultRateIron : userRateMain ?? defaultRateMain;

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
        0,
        userData || { completed_items: [] }
      );

      const fastestSlotName = findNextFastestItemName(activity.maps, userData || { completed_items: [] });

      return {
        activity_name: activity.activity_name,
        time_to_next_log_slot: nextSlotTime,
        fastest_slot_name: fastestSlotName,
        completions_per_hour: completionsPerHour,
      };
    });

    setActivities(newActivities);
  }, [rawActivities, isIron, userData, userCompletionRates]);

  const sortActivities = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    const sorted = [...activities].sort((a, b) => {
      let valA = a[key];
      let valB = b[key];

      if (key === 'time_to_next_log_slot') {
        valA = typeof valA === 'number' ? valA : Infinity;
        valB = typeof valB === 'number' ? valB : Infinity;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return direction === 'asc' ? valA - valB : valB - valA;
    });

    setActivities(sorted);
    setSortConfig({ key, direction });
  };

  return (
    <div>
      <h1>Completion Times by Activity</h1>
      <label>
        <input 
          type="checkbox" 
          checked={isIron} 
          onChange={() => setIsIron((prev) => {
            const newValue = !prev;
            localStorage.setItem('isIron', JSON.stringify(newValue));
            setUserToggled(true);
            localStorage.setItem('userToggledMode', JSON.stringify(true));
            return newValue;
          })} 
        />
        Iron Mode
      </label>

      {activities.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th onClick={() => sortActivities('activity_name')}>Activity Name</th>
              <th onClick={() => sortActivities('time_to_next_log_slot')}>Time to Next Log Slot</th>
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
