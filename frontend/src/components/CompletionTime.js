import React, { useState, useEffect } from 'react';
import { calculateTimeToNextLogSlot } from '../utils/calculations';

/**
 * Helper function to find the "Next Fastest Item" name
 * based on uncompleted items' drop_rate_attempts.
 */
function findNextFastestItemName(items, userData) {
  const uncompleted = items.filter((i) => !userData.completed_items.includes(i.id));
  if (uncompleted.length === 0) {
    return '-';
  }
  // Sort ascending by drop_rate_attempts
  uncompleted.sort((a, b) => a.drop_rate_attempts - b.drop_rate_attempts);
  return uncompleted[0].name || '-';
}

function CompletionTime() {
  const [rawActivities, setRawActivities] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchingData, setFetchingData] = useState(true);
  const [isIron, setIsIron] = useState(false);

  const [sortConfig, setSortConfig] = useState({ key: 'activity_name', direction: 'asc' });

  // 1) Fetch raw activity data from your Django endpoint
  useEffect(() => {
    async function fetchActivitiesData() {
      try {
        setFetchingData(true);
        const response = await fetch('http://127.0.0.1:8000/log_importer/get-activities-data/');
        const json = await response.json();
        if (json.status === 'success') {
          setRawActivities(json.data);
        }
      } catch (error) {
        console.error('Error fetching activities data:', error);
      } finally {
        setFetchingData(false);
      }
    }
    fetchActivitiesData();
  }, []);

  // 2) Once rawActivities is loaded, compute final data for each activity
  useEffect(() => {
    if (rawActivities.length > 0) {
      const savedLogData = JSON.parse(localStorage.getItem('collectionLogData'));
      if (!savedLogData || !savedLogData.sections) {
        setIsLoading(false);
        return;
      }

      // Gather completed item IDs from local data
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

      const userData = { completed_items: collectedItems };

      // Transform item_id -> id, item_name -> name, etc.
      const activitiesWithUnifiedFields = rawActivities.map((activity) => {
        const mappedItems = activity.maps.map((m) => ({
          id: m.item_id,
          name: m.item_name,
          drop_rate_attempts: m.drop_rate_attempts,
          neither_inverse: m.neither_inverse,
        }));
        return { ...activity, maps: mappedItems };
      });

      // Build the final array with time calculations & next item
      const newActivities = activitiesWithUnifiedFields.map((activity) => {
        const completionsPerHour = isIron
          ? activity.completions_per_hour_iron
          : activity.completions_per_hour_main;

        // If no items at all
        if (activity.maps.length === 0) {
          return {
            activity_name: activity.activity_name,
            time_to_next_log_slot: 'No available data',
            fastest_slot_name: '-',
          };
        }

        // Check how many items remain uncompleted
        const uncompleted = activity.maps.filter(
          (i) => !userData.completed_items.includes(i.id)
        );
        if (uncompleted.length === 0) {
          // Everything is completed
          return {
            activity_name: activity.activity_name,
            time_to_next_log_slot: 'Done!',
            fastest_slot_name: '-',
          };
        }

        // Calculate the time to next slot
        const nextSlotTime = calculateTimeToNextLogSlot(
          activity.maps,
          completionsPerHour,
          userData
        );
        const fastestSlotName = findNextFastestItemName(activity.maps, userData);

        return {
          activity_name: activity.activity_name,
          time_to_next_log_slot: nextSlotTime,
          fastest_slot_name: fastestSlotName,
        };
      });

      setActivities(newActivities);
      setIsLoading(false);
    } else {
      if (!fetchingData) {
        setIsLoading(false);
      }
    }
  }, [rawActivities, isIron, fetchingData]);

  // Toggle Iron Mode
  const toggleIronMode = () => {
    setIsIron(!isIron);
  };

 // Sorting logic
const sortActivities = (key) => {
  let direction = 'asc';
  if (sortConfig.key === key && sortConfig.direction === 'asc') {
    direction = 'desc';
  }

  const sorted = [...activities].sort((a, b) => {
    let valA = a[key];
    let valB = b[key];

    if (key === 'time_to_next_log_slot') {
      // Convert times so that "Done!" => Infinity (goes to bottom in ascending)
      // Numeric times stay as-is. Anything else is also Infinity.
      valA =
        typeof valA === 'number'
          ? valA
          : valA === 'Done!'
          ? Infinity
          : Infinity; // e.g. 'No available data' => Infinity
      valB =
        typeof valB === 'number'
          ? valB
          : valB === 'Done!'
          ? Infinity
          : Infinity;
    }

    // Now do normal ascending/descending comparison
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    if (valA < valB) return direction === 'asc' ? -1 : 1;
    return 0;
  });

  setActivities(sorted);
  setSortConfig({ key, direction });
};


  // Convert numeric day values into HH:MM:SS strings
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

  // Loading states
  if (fetchingData && isLoading) {
    return <p>Loading data from server...</p>;
  }
  if (isLoading) {
    return <p>Calculating data...</p>;
  }

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
              <th
                onClick={() => sortActivities('activity_name')}
                style={{ cursor: 'pointer' }}
              >
                Activity Name
                {sortConfig.key === 'activity_name'
                  ? sortConfig.direction === 'asc'
                    ? ' ⬆'
                    : ' ⬇'
                  : ''}
              </th>

              <th
                onClick={() => sortActivities('time_to_next_log_slot')}
                style={{ cursor: 'pointer' }}
              >
                Time to Next Log Slot
                {sortConfig.key === 'time_to_next_log_slot'
                  ? sortConfig.direction === 'asc'
                    ? ' ⬆'
                    : ' ⬇'
                  : ''}
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
