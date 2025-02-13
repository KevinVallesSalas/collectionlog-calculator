import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring } from 'react-spring';
import { calculateActivityData } from '../utils/calculations';
import ItemImage from './ItemImage';
import { useItemsData } from '../contexts/ItemsProvider';

function DebouncedInput({ type = "text", value, onDebouncedChange, delay = 500, ...props }) {
  const [internalValue, setInternalValue] = useState(value);
  const timerRef = useRef(null);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onDebouncedChange(newValue);
    }, delay);
  };

  const handleBlur = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    onDebouncedChange(internalValue);
  };

  return (
    <input
      type={type}
      value={internalValue}
      onChange={handleChange}
      onBlur={handleBlur}
      {...props}
    />
  );
}

function CompletionTime({ onRatesUpdated }) {
  const itemsData = useItemsData();

  const [rawActivities, setRawActivities] = useState([]);
  const [activities, setActivities] = useState([]);
  const [userData, setUserData] = useState({ completed_items: [] });
  const fetchedActivities = useRef(false);

  // Name of the currently expanded activity.
  const [expandedActivity, setExpandedActivity] = useState(null);
  // Ref for the active row element.
  const activeRowRef = useRef(null);
  // Ref for the scrollable container.
  const listContainerRef = useRef(null);

  const [completionRates, setCompletionRates] = useState([]);
  const fetchedRates = useRef(false);

  const [isIron, setIsIron] = useState(() => JSON.parse(localStorage.getItem('isIron')) ?? false);
  const [userToggled, setUserToggled] = useState(() => JSON.parse(localStorage.getItem('userToggledMode')) ?? false);
  const [sortConfig, setSortConfig] = useState({ key: 'time_to_next_log_slot', direction: 'asc' });

  // Set up a spring for the container's scroll position.
  // We extract the API from the spring array.
  const [ , api ] = useSpring(() => ({
    scroll: 0,
    config: { duration: 500 }
  }));

  // Fetch activities data.
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

  // Load collection log data.
  useEffect(() => {
    const savedLogData = JSON.parse(localStorage.getItem('collectionLogData'));
    if (!savedLogData || !savedLogData.sections) {
      setUserData({ completed_items: [] });
      return;
    }
    const collectedItems = [];
    Object.values(savedLogData.sections).forEach(section => {
      Object.values(section).forEach(activity => {
        if (activity.items && Array.isArray(activity.items)) {
          activity.items.forEach(item => {
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

  // Fetch completion rates.
  useEffect(() => {
    if (fetchedRates.current) return;
    fetchedRates.current = true;
    async function fetchCompletionRates() {
      try {
        const response = await fetch('http://127.0.0.1:8000/log_importer/get-completion-rates/');
        const json = await response.json();
        if (json.status === 'success' && Array.isArray(json.data)) {
          const defaultRates = json.data;
          const storedRates = JSON.parse(localStorage.getItem('userCompletionRates')) || {};
          const mergedRates = defaultRates.map(rate => ({
            activity_name: rate.activity_name || "Unknown Activity",
            user_completions_per_hour_main: storedRates[rate.activity_name]?.completions_per_hour_main ?? rate.completions_per_hour_main ?? 0,
            user_completions_per_hour_iron: storedRates[rate.activity_name]?.completions_per_hour_iron ?? rate.completions_per_hour_iron ?? 0,
            user_extra_time: storedRates[rate.activity_name]?.extra_time_to_first_completion ?? rate.extra_time_to_first_completion ?? 0,
            default_completions_per_hour_main: rate.completions_per_hour_main ?? 0,
            default_completions_per_hour_iron: rate.completions_per_hour_iron ?? 0,
            default_extra_time: rate.extra_time_to_first_completion ?? 0,
            notes: rate.notes ?? '',
            verification_source: rate.verification_source ?? ''
          }));
          setCompletionRates(mergedRates);
        } else {
          console.error("Invalid API response format:", json);
        }
      } catch (error) {
        console.error('Error fetching completion rates:', error);
      }
    }
    fetchCompletionRates();
  }, []);

  const handleRateChange = (activityName, key, value) => {
    const updatedRates = completionRates.map(rate =>
      rate.activity_name === activityName ? { ...rate, [key]: value } : rate
    );
    setCompletionRates(updatedRates);
    const storedRates = updatedRates.reduce((acc, rate) => {
      acc[rate.activity_name] = {
        completions_per_hour_main: rate.user_completions_per_hour_main,
        completions_per_hour_iron: rate.user_completions_per_hour_iron,
        extra_time_to_first_completion: rate.user_extra_time
      };
      return acc;
    }, {});
    localStorage.setItem('userCompletionRates', JSON.stringify(storedRates));
    if (onRatesUpdated) onRatesUpdated(storedRates);
  };

  const toggleExpandedActivity = (activityName) => {
    if (expandedActivity === activityName) {
      setExpandedActivity(null);
    } else {
      setExpandedActivity(activityName);
    }
  };

  // When expandedActivity changes (or activities update), calculate the target scroll position.
  // The formula centers the active row in the container.
  useEffect(() => {
    if (expandedActivity && activeRowRef.current && listContainerRef.current) {
      // No delay here: we calculate using the current layout.
      const container = listContainerRef.current;
      const activeRow = activeRowRef.current;
      // Standard centering formula:
      let targetScroll = activeRow.offsetTop - (container.clientHeight / 2) + (activeRow.clientHeight / 2);
      // Clamp targetScroll within container bounds.
      targetScroll = Math.max(0, Math.min(targetScroll, container.scrollHeight - container.clientHeight));
      // Animate scroll via react-spring with a fixed duration.
      api.start({ scroll: targetScroll, config: { duration: 500 } });
    }
  }, [expandedActivity, activities, api]);

  useEffect(() => {
    if (!userData) return;
    const ratesMapping = completionRates.reduce((acc, rate) => {
      acc[rate.activity_name] = {
        completions_per_hour_main: rate.user_completions_per_hour_main,
        completions_per_hour_iron: rate.user_completions_per_hour_iron,
        extra_time_to_first_completion: rate.user_extra_time
      };
      return acc;
    }, {});
    const newActivities = rawActivities.map(activity =>
      calculateActivityData(activity, ratesMapping, isIron, userData)
    );
    if (sortConfig.key) {
      newActivities.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        if (sortConfig.key === 'time_to_next_log_slot') {
          const aIsDone = typeof valA !== 'number';
          const bIsDone = typeof valB !== 'number';
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
  }, [rawActivities, isIron, userData, completionRates, sortConfig]);

  const sortActivities = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    const sorted = [...activities].sort((a, b) => {
      if (key === 'time_to_next_log_slot') {
        const aValue = a[key];
        const bValue = b[key];
        const aIsDone = typeof aValue !== 'number';
        const bIsDone = typeof bValue !== 'number';
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

  const formatTimeInHMS = (days) => {
    if (days === 'Done!' || days === 'No available data') return days;
    if (typeof days !== 'number' || days <= 0) return 'Done!';
    let totalSeconds = Math.floor(days * 24 * 3600);
    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const getTimeColor = (time) => {
    if (time === 'Done!' || time === 'No available data' || typeof time !== 'number') return '#c4b59e';
    const minTime = 0, maxTime = 2;
    let t = (time - minTime) / (maxTime - minTime);
    t = Math.min(Math.max(t, 0), 1);
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
          <span className={`text-sm py-1 px-2 rounded transition-colors duration-300 ${!isIron ? "bg-yellow-300 text-black" : "bg-transparent text-yellow-300"}`}>
            Normal Account Completion Rates
          </span>
          <label className="relative inline-block w-12 h-6">
            <input
              type="checkbox"
              checked={isIron}
              onChange={() => {
                setIsIron(prev => {
                  const newValue = !prev;
                  localStorage.setItem('isIron', JSON.stringify(newValue));
                  setUserToggled(true);
                  localStorage.setItem('userToggledMode', JSON.stringify(true));
                  return newValue;
                });
              }}
              className="peer sr-only"
            />
            <div className="w-full h-full bg-[#5A4736] rounded-full transition-colors duration-500"></div>
            <div className="absolute top-1 left-1 bg-[#c4b59e] w-4 h-4 rounded-full transition-transform duration-500 transform peer-checked:translate-x-6"></div>
          </label>
          <span className={`text-sm py-1 px-2 rounded transition-colors duration-300 ${isIron ? "bg-yellow-300 text-black" : "bg-transparent text-yellow-300"}`}>
            Ironman Completion Rates
          </span>
        </div>
      </div>

      {/* Divider row */}
      <div className="border-t border-gray-600 my-2"></div>

      {/* Sticky Header Row */}
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

      {/* Scrollable container for the activity rows */}
      <div
        ref={listContainerRef}
        className="overflow-y-auto scrollable-container"
        style={{ height: '90vh', maxHeight: '750px' }}
      >
        {activities.length > 0 ? (
          <div>
            {activities.map((act) => {
              const rate = completionRates.find(r => r.activity_name === act.activity_name);
              const isActive = act.activity_name === expandedActivity;
              // Attach the ref only to the active row.
              const rowRef = isActive ? activeRowRef : null;
              const wikiUrl =
                itemsData &&
                itemsData[String(act.fastest_slot_id)] &&
                itemsData[String(act.fastest_slot_id)].wikiPageUrl
                  ? itemsData[String(act.fastest_slot_id)].wikiPageUrl
                  : `https://oldschool.runescape.wiki/w/${encodeURIComponent(act.fastest_slot_name)}`;
              return (
                <div
                  key={act.activity_name}
                  ref={rowRef}
                  className="snap-center rounded-lg shadow-lg mb-4 overflow-hidden border border-white"
                >
                  {/* Main Row */}
                  <div
                    className="grid grid-cols-3 gap-x-4 py-2 items-center cursor-pointer px-4 transition-colors duration-500 bg-[#3B2C1A] border-b"
                    onClick={() => toggleExpandedActivity(act.activity_name)}
                  >
                    <div className="text-center">{act.activity_name}</div>
                    <div className="text-center" style={{ color: getTimeColor(act.time_to_next_log_slot) }}>
                      {formatTimeInHMS(act.time_to_next_log_slot)}
                    </div>
                    <div className="text-center">
                      {act.fastest_slot_name === '-' ? (
                        <span>-</span>
                      ) : (
                        <a
                          href={wikiUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center space-x-2 transition-transform duration-200 hover:scale-105 hover:underline"
                        >
                          {act.fastest_slot_id && (
                            <ItemImage
                              itemId={act.fastest_slot_id}
                              fallbackName={act.fastest_slot_name}
                              className="w-8 h-8"
                              disableLink={true}
                            />
                          )}
                          <span>{act.fastest_slot_name}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Detail Section using Framer Motion */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        key={act.activity_name}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="detail-section px-4 rounded-b-lg overflow-hidden"
                      >
                        <div className="py-2">
                          <div className="grid grid-cols-3 gap-4">
                            <div className={`flex flex-col items-center gap-2 border rounded p-1 ${!isIron ? 'border-yellow-300' : 'border-transparent'}`}>
                              <label className={`block text-sm font-semibold text-center ${!isIron ? 'text-yellow-300' : 'text-[#c4b59e]'}`}>
                                Completions/hr (Main):
                              </label>
                              <DebouncedInput
                                type="number"
                                value={rate ? rate.user_completions_per_hour_main : ''}
                                onDebouncedChange={(newVal) =>
                                  handleRateChange(act.activity_name, 'user_completions_per_hour_main', Number(newVal))
                                }
                                min="0"
                                className="border p-1 rounded text-center bg-[#d2b48c] text-black"
                                title={rate ? `Default: ${rate.default_completions_per_hour_main}` : ''}
                              />
                            </div>
                            <div className={`flex flex-col items-center gap-2 border rounded p-1 ${isIron ? 'border-yellow-300' : 'border-transparent'}`}>
                              <label className={`block text-sm font-semibold text-center ${isIron ? 'text-yellow-300' : 'text-[#c4b59e]'}`}>
                                Completions/hr (Iron):
                              </label>
                              <DebouncedInput
                                type="number"
                                value={rate ? rate.user_completions_per_hour_iron : ''}
                                onDebouncedChange={(newVal) =>
                                  handleRateChange(act.activity_name, 'user_completions_per_hour_iron', Number(newVal))
                                }
                                min="0"
                                className="border p-1 rounded text-center bg-[#d2b48c] text-black"
                                title={rate ? `Default: ${rate.default_completions_per_hour_iron}` : ''}
                              />
                            </div>
                            <div className="flex flex-col items-center gap-2">
                              <label className="block text-sm font-semibold text-center text-[#c4b59e]">
                                Extra Time (hrs):
                              </label>
                              <DebouncedInput
                                type="number"
                                value={rate ? rate.user_extra_time : ''}
                                onDebouncedChange={(newVal) =>
                                  handleRateChange(act.activity_name, 'user_extra_time', Number(newVal))
                                }
                                min="0"
                                className="border p-1 rounded text-center bg-[#d2b48c] text-black"
                                title={rate ? `Default: ${rate.default_extra_time} hours` : ''}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <div>
                              <label className="block text-sm font-semibold text-center text-[#c4b59e]">
                                Notes:
                              </label>
                              <div className="border p-1 rounded bg-[#d2b48c] text-center text-black">
                                {rate ? rate.notes || '-' : '-'}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-center text-[#c4b59e]">
                                Verification Source:
                              </label>
                              <div className="border p-1 rounded bg-[#d2b48c] text-center text-black">
                                {rate ? rate.verification_source || '-' : '-'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-4 text-center text-yellow-300">
            No data available. Please upload a collection log.
          </p>
        )}
      </div>
    </div>
  );
}

export default CompletionTime;
