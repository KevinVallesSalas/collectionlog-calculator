import React, { useState, useEffect, useRef } from 'react';
import { calculateActivityData } from '../utils/calculations';
import ItemImage from './ItemImage';

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
  // Default sort: by time_to_next_log_slot (fastest first)
  const [sortConfig, setSortConfig] = useState({ key: 'time_to_next_log_slot', direction: 'asc' });

  // Fetch activities data once
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

  // Load collection log data and derive userData from localStorage
  useEffect(() => {
    const savedLogData = JSON.parse(localStorage.getItem('collectionLogData'));
    if (!savedLogData || !savedLogData.sections) {
      setUserData({ completed_items: [] });
      return;
    }
    const collectedItems = [];
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
      localStorage.setItem('userToggledMode', JSON.stringify(true));
    }
  }, [rawActivities, userToggled]);

  // Calculate activities and reapply sorting based on sortConfig
  useEffect(() => {
    if (!userData) return;
    const newActivities = rawActivities.map((activity) =>
      calculateActivityData(activity, userCompletionRates, isIron, userData)
    );
    if (sortConfig.key) {
      newActivities.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        if (sortConfig.key === 'time_to_next_log_slot') {
          // Treat non-number (i.e. "Done!" or "No available data") as done items,
          // and always sort them to the bottom.
          const aIsDone = (typeof valA !== 'number');
          const bIsDone = (typeof valB !== 'number');
          if (aIsDone && !bIsDone) return 1;
          if (!aIsDone && bIsDone) return -1;
          if (aIsDone && bIsDone) return 0;
        }
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        return 0;
      });
    }
    setActivities(newActivities);
  }, [rawActivities, isIron, userData, userCompletionRates, sortConfig]);

  // Toggle mode while preserving sort order
  const toggleIronMode = () => {
    setIsIron((prev) => {
      const newValue = !prev;
      localStorage.setItem('isIron', JSON.stringify(newValue));
      setUserToggled(true);
      localStorage.setItem('userToggledMode', JSON.stringify(true));
      return newValue;
    });
  };

  // Updated sort function: special comparator for time_to_next_log_slot so that done items are always at the bottom.
  const sortActivities = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    const sorted = [...activities].sort((a, b) => {
      if (key === 'time_to_next_log_slot') {
        const aValue = a[key];
        const bValue = b[key];
        const aIsDone = (typeof aValue !== 'number');
        const bIsDone = (typeof bValue !== 'number');
        if (aIsDone && !bIsDone) return 1;
        if (!aIsDone && bIsDone) return -1;
        if (aIsDone && bIsDone) return 0;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        return 0;
      } else {
        let valA = a[key];
        let valB = b[key];
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        if (valA < valB) return direction === 'asc' ? -1 : 1;
        return 0;
      }
    });
    setActivities(sorted);
    setSortConfig({ key, direction });
  };

  // Format time (H:M:S)
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

  // Return a color that scales linearly between green and red over the range 0 to 2 days
  const getTimeColor = (time) => {
    if (time === 'Done!' || time === 'No available data' || typeof time !== 'number') return '#c4b59e';
    const minTime = 0;
    const maxTime = 2;
    let t = (time - minTime) / (maxTime - minTime);
    if (t < 0) t = 0;
    if (t > 1) t = 1;
    const r = Math.round(t * 255);
    const g = Math.round(255 - t * 255);
    return `rgb(${r}, ${g}, 0)`;
  };

  return (
    <div className="collection-log-container mx-auto my-5">
      {/* Title Section */}
      <div className="flex flex-col items-center">
        <h1 className="text-2xl font-bold text-yellow-300 text-center">
          Completion Times by Activity
        </h1>
        <div className="mt-2 flex items-center space-x-3">
          <span className={`text-sm ${!isIron ? "font-bold" : "opacity-50"}`}>
            Normal Account Completion Rates
          </span>
          <label className="relative inline-block w-12 h-6">
            <input 
              type="checkbox" 
              checked={isIron} 
              onChange={toggleIronMode} 
              className="peer sr-only"
            />
            <div className="w-full h-full bg-gray-400 rounded-full transition-colors duration-300 peer-checked:bg-blue-500"></div>
            <div className="absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 transform peer-checked:translate-x-6"></div>
          </label>
          <span className={`text-sm ${isIron ? "font-bold" : "opacity-50"}`}>
            Ironman Completion Rates
          </span>
        </div>
      </div>

      {/* Divider row */}
      <div className="border-t border-gray-600 my-2"></div>

      {/* Sticky Header Row with bottom border */}
      <div className="sticky top-0 z-10 bg-[#3B2C1A] border-b border-gray-600">
        <div className="grid grid-cols-3 gap-x-4 font-bold text-center py-2">
          <div className="cursor-pointer hover:text-[#ffcc66]" onClick={() => sortActivities('activity_name')}>
            Activity Name {sortConfig.key === 'activity_name' ? (sortConfig.direction === 'asc' ? ' ⬆' : ' ⬇') : ''}
          </div>
          <div className="cursor-pointer hover:text-[#ffcc66]" onClick={() => sortActivities('time_to_next_log_slot')}>
            Time to Next Log Slot {sortConfig.key === 'time_to_next_log_slot' ? (sortConfig.direction === 'asc' ? ' ⬆' : ' ⬇') : ''}
          </div>
          <div className="text-center">Next Fastest Item</div>
        </div>
      </div>

      {/* Activity Rows */}
      {activities.length > 0 ? (
        <div>
          {activities.map((act, index) => (
            <div key={index} className="grid grid-cols-3 gap-x-4 border-b border-gray-600 py-2 items-center">
              <div className="text-center">{act.activity_name}</div>
              <div className="text-center" style={{ color: getTimeColor(act.time_to_next_log_slot) }}>
                {formatTimeInHMS(act.time_to_next_log_slot)}
              </div>
              <div className="text-center">
                {act.fastest_slot_name === "-" ? (
                  <span>-</span>
                ) : (
                  <a 
                    href={`https://oldschool.runescape.wiki/w/${encodeURIComponent(act.fastest_slot_name)}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center justify-center space-x-2 hover:underline"
                  >
                    {act.fastest_slot_id ? (
                      <ItemImage 
                        itemId={act.fastest_slot_id} 
                        fallbackName={act.fastest_slot_name} 
                        className="w-8 h-8" 
                      />
                    ) : null}
                    <span>{act.fastest_slot_name}</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-4 text-center text-yellow-300">
          No data available. Please upload a collection log.
        </p>
      )}
    </div>
  );
}

export default CompletionTime;
