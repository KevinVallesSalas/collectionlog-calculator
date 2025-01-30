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

/**
 * Calculates the effective droprate for items not completed by the user,
 * ignoring items that have neither_inverse = 0 or null.
 * Returns 'n/a' if there are no uncompleted items or if the sum is 0.
 */
export function calculateEffectiveDroprateNeither(items, userData) {
  userData = validateUserData(userData); // Ensure valid userData

  const neitherSum = items
    .filter((i) => {
      const isUncompleted = !userData.completed_items.includes(i.id);
      const hasValidInverse = i.neither_inverse && i.neither_inverse > 0;
      return isUncompleted && hasValidInverse;
    })
    .reduce((acc, i) => acc + i.neither_inverse, 0);

  return neitherSum === 0 ? 'n/a' : 1 / neitherSum;
}

/**
 * Finds the minimum drop_rate_attempts among uncompleted items,
 * ignoring items with drop_rate_attempts <= 0 (which means "no data").
 * Returns 'n/a' if there are no valid uncompleted items.
 */
export function calculateEffectiveDroprateIndependent(items, userData) {
  userData = validateUserData(userData); // Ensure valid userData

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

/**
 * Time to complete items under the "exact" droprate logic.
 * Returns '' if droprate is 'n/a' or completionsPerHour is 0.
 */
export function calculateTimeToExact(items, completionsPerHour, userData) {
  userData = validateUserData(userData); // Ensure valid userData

  const droprate = calculateEffectiveDroprateNeither(items, userData);
  if (droprate === 'n/a' || completionsPerHour === 0) return '';
  return droprate / completionsPerHour;
}

/**
 * Time to complete items under the "independent" droprate logic.
 * Returns '' if droprate is 'n/a' or completionsPerHour is 0.
 */
export function calculateTimeToEi(items, completionsPerHour, userData) {
  userData = validateUserData(userData); // Ensure valid userData

  const droprate = calculateEffectiveDroprateIndependent(items, userData);
  if (droprate === 'n/a' || completionsPerHour === 0) return '';
  return droprate / completionsPerHour;
}

/**
 * Calculates the time to next log slot, incorporating extra time.
 * - Includes extraTimeToFirstCompletion in calculations.
 * - Returns:
 *   - 'No available data' if there are no numeric (>=0) values
 *   - Otherwise, the minimum time (in hours) divided by 24 (days).
 */
export function calculateTimeToNextLogSlot(items, completionsPerHour, extraTimeToFirstCompletion, userData) {
  userData = validateUserData(userData); // Ensure valid userData

  const valA = calculateEffectiveDroprateNeither(items, userData);
  const valB = calculateEffectiveDroprateIndependent(items, userData);
  const valC = calculateTimeToExact(items, completionsPerHour, userData);
  const valD = calculateTimeToEi(items, completionsPerHour, userData);

  const numericValues = [];
  [valA, valB, valC, valD].forEach((val) => {
    // Only consider valid numeric values > 0
    if (typeof val === 'number' && val > 0) {
      numericValues.push(val);
    }
  });

  if (numericValues.length === 0) {
    return 'No available data';
  }

  const minTime = Math.min(...numericValues);
  
  // ✅ Include extraTimeToFirstCompletion in the final calculation
  return (minTime + (extraTimeToFirstCompletion ?? 0)) / 24;
}
