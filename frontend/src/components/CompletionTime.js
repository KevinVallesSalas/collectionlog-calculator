import React, { useState, useEffect, useRef } from 'react';
import { calculateActivityData, updateNextFastestItem, formatTimeInHMS, getTimeColor } from '../utils/calculations';
import { useItemsData } from '../contexts/ItemsProvider';
import ActivityRow from './ActivityRow';
import InfoPanels from './InfoPanels';

function CompletionTime({ onRatesUpdated }) {
  const itemsData = useItemsData();
  const [rawActivities, setRawActivities] = useState([]);
  const [activities, setActivities] = useState([]);
  const [userData, setUserData] = useState({ completed_items: [] });
  const [expandedActivity, setExpandedActivity] = useState(null);
  const activeRowRef = useRef(null);
  const listContainerRef = useRef(null);
  const [completionRates, setCompletionRates] = useState([]);
  const [isIron, setIsIron] = useState(() => JSON.parse(localStorage.getItem('isIron')) ?? false);
  const [userToggled, setUserToggled] = useState(() => JSON.parse(localStorage.getItem('userToggledMode')) ?? false);
  const [sortConfig, setSortConfig] = useState({ key: 'time_to_next_log_slot', direction: 'asc' });
  const [disabledActivities, setDisabledActivities] = useState(() => {
    return JSON.parse(localStorage.getItem('disabledActivities')) || {};
  });

  // These two states control which info panel is open.
  const [showGeneral, setShowGeneral] = useState(false);
  const [showAccount, setShowAccount] = useState(false);

  // Listen for window resize
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const containerWidth = windowSize.width * 0.9;
  const containerHeight = 750;

  // Load activities data
  useEffect(() => {
    const savedActivities = localStorage.getItem('activitiesData');
    if (savedActivities) {
      setRawActivities(JSON.parse(savedActivities));
    }
  }, []);

  // Load collection log data
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
            if (item.count > 0) {
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

  // Load completion rates data from local storage
  useEffect(() => {
    const defaultRates = JSON.parse(localStorage.getItem('defaultCompletionRates')) || [];
    const storedUserRates = JSON.parse(localStorage.getItem('userCompletionRates')) || {};
    const mergedRates = defaultRates.map(rate => ({
      activity_name: rate.activity_name || "Unknown Activity",
      user_completions_per_hour_main: storedUserRates[rate.activity_name]?.completions_per_hour_main ?? rate.completions_per_hour_main ?? 0,
      user_completions_per_hour_iron: storedUserRates[rate.activity_name]?.completions_per_hour_iron ?? rate.completions_per_hour_iron ?? 0,
      user_extra_time: storedUserRates[rate.activity_name]?.extra_time_to_first_completion ?? rate.extra_time_to_first_completion ?? 0,
      default_completions_per_hour_main: rate.completions_per_hour_main ?? 0,
      default_completions_per_hour_iron: rate.completions_per_hour_iron ?? 0,
      default_extra_time: rate.extra_time_to_first_completion ?? 0,
      notes: rate.notes ?? '',
      verification_source: rate.verification_source ?? ''
    }));
    setCompletionRates(mergedRates);
  }, []);

  // Calculate activities data from rawActivities
  useEffect(() => {
    if (rawActivities.length === 0) return;
    const ratesMapping = completionRates.reduce((acc, rate) => {
      acc[rate.activity_name] = {
        completions_per_hour_main: rate.user_completions_per_hour_main,
        completions_per_hour_iron: rate.user_completions_per_hour_iron,
        extra_time_to_first_completion: rate.user_extra_time,
      };
      return acc;
    }, {});
    const updatedActivities = rawActivities.map(activity =>
      calculateActivityData(activity, ratesMapping, isIron, userData)
    );
    updatedActivities.sort((a, b) => {
      const aDisabled = disabledActivities[a.activity_name] || false;
      const bDisabled = disabledActivities[b.activity_name] || false;
      if (aDisabled && !bDisabled) return 1;
      if (!aDisabled && bDisabled) return -1;
      const aTime = typeof a.time_to_next_log_slot === 'number' ? a.time_to_next_log_slot : Infinity;
      const bTime = typeof b.time_to_next_log_slot === 'number' ? b.time_to_next_log_slot : Infinity;
      return aTime - bTime;
    });
    setActivities(updatedActivities);
  }, [rawActivities, completionRates, isIron, userData, disabledActivities]);

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
    updateNextFastestItem();
    setTimeout(() => {
      if (expandedActivity && activeRowRef.current) {
        activeRowRef.current.scrollIntoView({ behavior: 'auto', block: 'center' });
      }
    }, 100);
  };

  const toggleExpandedActivity = (activityName) => {
    setExpandedActivity(expandedActivity === activityName ? null : activityName);
  };

  const handleDisableActivity = (activityName) => {
    setDisabledActivities(prev => {
      const newState = { ...prev, [activityName]: !prev[activityName] };
      localStorage.setItem('disabledActivities', JSON.stringify(newState));
      return newState;
    });
  };

  const sortActivities = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    const sortedActivities = [...activities].sort((a, b) => {
      const aDisabled = disabledActivities[a.activity_name] || false;
      const bDisabled = disabledActivities[b.activity_name] || false;
      if (aDisabled && !bDisabled) return 1;
      if (!aDisabled && bDisabled) return -1;
      let valA = a[key];
      let valB = b[key];
      if (key === 'time_to_next_log_slot') {
        const aIsDone = typeof valA !== 'number';
        const bIsDone = typeof valB !== 'number';
        if (aIsDone && !bIsDone) return 1;
        if (!aIsDone && bIsDone) return -1;
        if (aIsDone && bIsDone) return 0;
      }
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      return 0;
    });
    setSortConfig({ key, direction });
    setActivities(sortedActivities);
  };

  return (
    <div
      className="mx-auto my-5 p-4"
      style={{
        width: containerWidth,
        height: containerHeight,
        // Removed overflow hidden so the inner scroll container can scroll.
        backgroundColor: "#494034",
        border: "4px solid #5c5647",
        color: "#fc961f",
        textShadow: "1px 1px 0 #000",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* Header + Info Buttons in one row */}
      <div className="flex items-center justify-between w-full" style={{ flexShrink: 0 }}>
        <h1 className="text-2xl font-bold" style={{ color: "#fc961f" }}>
          Next Fastest Log Slot
        </h1>
        {/* Buttons for toggling Info Panels */}
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowGeneral(prev => !prev)}
            className="p-2 text-xl"
            style={{ color: "#fc961f", background: "none", border: "none", cursor: "pointer" }}
            title="General Info"
          >
            ℹ️
          </button>
          <button 
            onClick={() => setShowAccount(prev => !prev)}
            className="p-2 text-xl"
            style={{ color: "#fc961f", background: "none", border: "none", cursor: "pointer" }}
            title="Completion Rates"
          >
            ⇄
          </button>
        </div>
      </div>

      {/* InfoPanels component */}
      <InfoPanels
        isIron={isIron}
        setIsIron={setIsIron}
        setUserToggled={setUserToggled}
        showGeneral={showGeneral}
        setShowGeneral={setShowGeneral}
        showAccount={showAccount}
        setShowAccount={setShowAccount}
      />

      {/* Divider */}
      <div
        className="my-2"
        style={{ borderTop: "1px solid #5c5647", flexShrink: 0 }}
      ></div>

      {/* Sticky Header Row */}
      <div className="sticky top-0 z-10" style={{ backgroundColor: "#494034", borderBottom: "4px solid #5c5647" }}>
        <div className="grid grid-cols-3 gap-x-4 font-bold py-2 items-center">
          <div
            className="cursor-pointer hover:text-[#fc961f] text-left"
            onClick={() => sortActivities('activity_name')}
          >
            Activity Name
            {sortConfig.key === 'activity_name'
              ? sortConfig.direction === 'asc'
                ? ' ⬆'
                : ' ⬇'
              : ''}
          </div>
          <div
            className="cursor-pointer hover:text-[#fc961f] text-center place-self-center w-full"
            onClick={() => sortActivities('time_to_next_log_slot')}
          >
            Time to Next Log Slot
            {sortConfig.key === 'time_to_next_log_slot'
              ? sortConfig.direction === 'asc'
                ? ' ⬆'
                : ' ⬇'
              : ''}
          </div>
          <div className="text-center">Next Fastest Item</div>
        </div>
      </div>

      {/* Scrollable container for activity rows */}
      <div
        ref={listContainerRef}
        className="custom-scrollbar"
        style={{
          flex: 1,
          overflowY: "auto",
          paddingBottom: "1rem"
        }}
      >
        {activities.length > 0 ? (
          <div>
            {activities.map((act) => {
              const rate = completionRates.find(r => r.activity_name === act.activity_name);
              return (
                <ActivityRow
                  key={act.activity_name}
                  act={act}
                  expandedActivity={expandedActivity}
                  toggleExpandedActivity={toggleExpandedActivity}
                  activeRowRef={activeRowRef}
                  itemsData={itemsData}
                  rate={rate}
                  isIron={isIron}
                  handleRateChange={handleRateChange}
                  formatTimeInHMS={formatTimeInHMS}
                  getTimeColor={getTimeColor}
                  disabled={disabledActivities[act.activity_name] || false}
                  handleDisableActivity={handleDisableActivity}
                />
              );
            })}
          </div>
        ) : (
          <p className="py-4 text-center" style={{ color: "#fc961f" }}>
            No data available. Please upload a collection log.
          </p>
        )}
      </div>
    </div>
  );
}

export default CompletionTime;
