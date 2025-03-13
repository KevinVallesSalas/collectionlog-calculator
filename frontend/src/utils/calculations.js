/*******************************************************
 * calculations.js (Includes Extra Time in Calculation)
 *******************************************************/

function validateUserData(userData) {
  if (!userData || !Array.isArray(userData.completed_items)) {
    console.warn("Warning: userData is undefined or invalid. Defaulting to empty array.");
    return { completed_items: [] };
  }
  return userData; 
}

export function calculateEffectiveDroprateNeither(items, userData) {
  userData = validateUserData(userData);
  const neitherSum = items
    .filter((i) => {
      const isUncompleted = !userData.completed_items.includes(i.id);
      const hasValidInverse = i.neither_inverse && i.neither_inverse > 0;
      return isUncompleted && hasValidInverse;
    })
    .reduce((acc, i) => acc + i.neither_inverse, 0);
  return neitherSum === 0 ? 'n/a' : 1 / neitherSum;
}

export function calculateEffectiveDroprateIndependent(items, userData) {
  userData = validateUserData(userData);
  const attempts = items
    .filter((i) => {
      const isUncompleted = !userData.completed_items.includes(i.id);
      const hasValidAttempts = i.drop_rate_attempts && i.drop_rate_attempts > 0;
      return isUncompleted && hasValidAttempts;
    })
    .map((i) => i.drop_rate_attempts);
  if (attempts.length === 0) return 'n/a';
  return Math.min(...attempts);
}

export function calculateTimeToExact(items, completionsPerHour, userData) {
  userData = validateUserData(userData);
  const droprate = calculateEffectiveDroprateNeither(items, userData);
  if (droprate === 'n/a' || completionsPerHour === 0) return '';
  return droprate / completionsPerHour;
}

export function calculateTimeToEi(items, completionsPerHour, userData) {
  userData = validateUserData(userData);
  const droprate = calculateEffectiveDroprateIndependent(items, userData);
  if (droprate === 'n/a' || completionsPerHour === 0) return '';
  return droprate / completionsPerHour;
}

export function calculateTimeToNextLogSlot(items, completionsPerHour, extraTimeToFirstCompletion, userData) {
  userData = validateUserData(userData);
  const uncompletedItems = items.filter((item) => !userData.completed_items.includes(item.id));
  if (uncompletedItems.length === 0) {
    return 'Done!';
  }
  const valA = calculateEffectiveDroprateNeither(items, userData);
  const valB = calculateEffectiveDroprateIndependent(items, userData);
  const valC = calculateTimeToExact(items, completionsPerHour, userData);
  const valD = calculateTimeToEi(items, completionsPerHour, userData);
  const numericValues = [];
  [valA, valB, valC, valD].forEach((val) => {
    if (typeof val === 'number' && val > 0) {
      numericValues.push(val);
    }
  });
  if (numericValues.length === 0) {
    return 'No available data';
  }
  const minTime = Math.min(...numericValues);
  return (minTime + (extraTimeToFirstCompletion ?? 0)) / 24;
}

/* --- New functions --- */

/**
 * Finds the next fastest uncompleted item and returns an object with its id and name.
 */
export function findNextFastestItem(items, userData) {
  userData = validateUserData(userData);
  const uncompleted = items.filter((i) => !userData.completed_items.includes(i.id));
  if (uncompleted.length === 0) return { id: null, name: '-' };
  uncompleted.sort((a, b) => a.drop_rate_attempts - b.drop_rate_attempts);
  return { id: uncompleted[0].id, name: uncompleted[0].name || '-' };
}

/**
 * Given an activity and the current user settings, returns an object with:
 * - time_to_next_log_slot
 * - fastest_slot_name
 * - fastest_slot_id
 * along with the user rates.
 */
export function calculateActivityData(activity, userCompletionRates, isIron, userData) {
  const mappedItems = (Array.isArray(activity.maps) ? activity.maps : []).map((m) => ({
    id: m.item_id,
    name: m.item_name,
    drop_rate_attempts: m.drop_rate_attempts,
    neither_inverse: m.neither_inverse,
  }));

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

  if (mappedItems.length === 0) {
    return {
      activity_name: activity.activity_name,
      time_to_next_log_slot: 'No available data',
      fastest_slot_name: '-',
      fastest_slot_id: null,
    };
  }

  const nextSlotTime = calculateTimeToNextLogSlot(
    mappedItems,
    completionsPerHour,
    extraTimeToFirstCompletion,
    userData || { completed_items: [] }
  );

  const fastestSlot = findNextFastestItem(mappedItems, userData || { completed_items: [] });

  return {
    activity_name: activity.activity_name,
    time_to_next_log_slot: nextSlotTime,
    fastest_slot_name: fastestSlot.name,
    fastest_slot_id: fastestSlot.id,
    completions_per_hour: completionsPerHour,
    extra_time_to_first_completion: extraTimeToFirstCompletion,
  };
}

/**
 * Updates the next fastest item in localStorage.
 * Merges user rates (from "userCompletionRates") with default rates.
 */
export function updateNextFastestItem() {
  const savedActivities = JSON.parse(localStorage.getItem('activitiesData')) || [];
  const savedLogData = JSON.parse(localStorage.getItem('collectionLogData'));
  if (!savedLogData || !savedLogData.sections) {
    localStorage.setItem('nextFastestItem', JSON.stringify({ id: null, name: '-' }));
    localStorage.setItem('nextFastestItemName', '-');
    return;
  }
  const defaultRates = JSON.parse(localStorage.getItem('defaultCompletionRates')) || [];
  const storedUserRates = JSON.parse(localStorage.getItem('userCompletionRates')) || {};
  const ratesMapping = {};
  defaultRates.forEach(rate => {
    ratesMapping[rate.activity_name] = {
      completions_per_hour_main: storedUserRates[rate.activity_name]?.completions_per_hour_main ?? rate.completions_per_hour_main ?? 0,
      completions_per_hour_iron: storedUserRates[rate.activity_name]?.completions_per_hour_iron ?? rate.completions_per_hour_iron ?? 0,
      extra_time_to_first_completion: storedUserRates[rate.activity_name]?.extra_time_to_first_completion ?? rate.extra_time_to_first_completion ?? 0,
    };
  });
  const collectedItems = [];
  Object.values(savedLogData.sections).forEach(section => {
    Object.values(section).forEach(activity => {
      if (activity.items && Array.isArray(activity.items)) {
        activity.items.forEach(item => {
          if (item.obtained) collectedItems.push(item.id);
        });
      }
    });
  });
  const userData = {
    completed_items: collectedItems,
    accountType: savedLogData.accountType || "NORMAL"
  };
  const isIron = JSON.parse(localStorage.getItem('isIron')) ?? false;
  const newActivities = savedActivities.map(activity =>
    calculateActivityData(activity, ratesMapping, isIron, userData)
  );
  newActivities.sort((a, b) => {
    const aVal = typeof a.time_to_next_log_slot === 'number' ? a.time_to_next_log_slot : Infinity;
    const bVal = typeof b.time_to_next_log_slot === 'number' ? b.time_to_next_log_slot : Infinity;
    return aVal - bVal;
  });
  const validActivities = newActivities.filter(
    (act) => typeof act.time_to_next_log_slot === 'number' && act.time_to_next_log_slot > 0
  );
  const nextFastest = validActivities.length > 0 ? validActivities[0] : null;
  if (nextFastest) {
    const obj = { id: nextFastest.fastest_slot_id, name: nextFastest.fastest_slot_name };
    localStorage.setItem('nextFastestItem', JSON.stringify(obj));
    localStorage.setItem('nextFastestItemName', nextFastest.fastest_slot_name);
  } else {
    localStorage.setItem('nextFastestItem', JSON.stringify({ id: null, name: '-' }));
    localStorage.setItem('nextFastestItemName', '-');
  }
}

/**
 * Converts a time in days to a formatted string "HH:MM:SS".
 */
export function formatTimeInHMS(days) {
  if (days === 'Done!' || days === 'No available data') return days;
  if (typeof days !== 'number' || days <= 0) return 'Done!';
  const totalSeconds = Math.floor(days * 24 * 3600);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Returns a color based on the time value.
 * If time is 'Done!' or 'No available data', returns a default color.
 * Otherwise, the color transitions from green to red as time increases from 0 to 2 days.
 */
export function getTimeColor(time) {
  if (time === 'Done!' || time === 'No available data' || typeof time !== 'number') return '#c4b59e';
  const minTime = 0, maxTime = 2;
  let t = (time - minTime) / (maxTime - minTime);
  t = Math.min(Math.max(t, 0), 1);
  const r = Math.round(t * 255);
  const g = Math.round(255 - t * 255);
  return `rgb(${r}, ${g}, 0)`;
}


