/*******************************************************
 * calculations.js (Includes Extra Time in Calculation)
 *******************************************************/

/**
 * Ensures userData is always an object with completed_items as an array.
 */
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
 * Finds the next fastest uncompleted item and returns both its id and name.
 */
export function findNextFastestItem(items, userData) {
  userData = validateUserData(userData);
  const uncompleted = items.filter((i) => !userData.completed_items.includes(i.id));
  if (uncompleted.length === 0) return { id: null, name: '-' };
  uncompleted.sort((a, b) => a.drop_rate_attempts - b.drop_rate_attempts);
  return { id: uncompleted[0].id, name: uncompleted[0].name || '-' };
}

/**
 * Given an activity and the current user settings, this function
 * returns an object with the calculated time to next log slot and fastest slot info.
 */
export function calculateActivityData(activity, userCompletionRates, isIron, userData) {
  // Create unified fields from activity.maps
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

  // Use the new helper to get both the fastest slot’s id and name.
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
