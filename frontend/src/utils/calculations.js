/*******************************************************
 * calculations.js (Zero attempts => "no data" logic)
 *******************************************************/

/**
 * Calculates the effective droprate for items not completed by the user,
 * ignoring items that have neither_inverse = 0 or null.
 * Returns 'n/a' if there are no uncompleted items or if the sum is 0.
 */
export function calculateEffectiveDroprateNeither(items, userData) {
  // Sum up neither_inverse only for uncompleted items that have a valid (>0) neither_inverse
  const neitherSum = items
    .filter((i) => {
      const isUncompleted = !userData.completed_items.includes(i.id);
      const hasValidInverse = i.neither_inverse && i.neither_inverse > 0;
      return isUncompleted && hasValidInverse;
    })
    .reduce((acc, i) => acc + i.neither_inverse, 0);

  // If no valid items or sum=0, return 'n/a'
  return neitherSum === 0 ? 'n/a' : 1 / neitherSum;
}

/**
 * Finds the minimum drop_rate_attempts among uncompleted items,
 * ignoring items with drop_rate_attempts <= 0 (which means "no data").
 * Returns 'n/a' if there are no valid uncompleted items.
 */
export function calculateEffectiveDroprateIndependent(items, userData) {
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
  const droprate = calculateEffectiveDroprateNeither(items, userData);
  if (droprate === 'n/a' || completionsPerHour === 0) return '';
  return droprate / completionsPerHour;
}

/**
 * Time to complete items under the "independent" droprate logic.
 * Returns '' if droprate is 'n/a' or completionsPerHour is 0.
 */
export function calculateTimeToEi(items, completionsPerHour, userData) {
  const droprate = calculateEffectiveDroprateIndependent(items, userData);
  if (droprate === 'n/a' || completionsPerHour === 0) return '';
  return droprate / completionsPerHour;
}

/**
 * Chooses the smallest *positive* value among the droprates/times
 * and returns that value divided by 24 (to convert from hours to days).
 * Returns:
 *  - 'No available data' if there are no numeric (>=0) values
 *  - otherwise, the min time (hours) / 24 => days
 *
 * NOTE: we removed "if any droprate/time is 0 => 'Done!'" 
 * so items with 0 attempts are now simply ignored (treated as 'n/a').
 */
export function calculateTimeToNextLogSlot(items, completionsPerHour, userData) {
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

  // If we have no numeric (valid) values, return "No available data"
  if (numericValues.length === 0) {
    return 'No available data';
  }

  // Otherwise, take the minimum (in hours) and convert to days by dividing by 24
  const minTime = Math.min(...numericValues);
  return minTime / 24;
}
