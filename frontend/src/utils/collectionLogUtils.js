/**
 * Given the fetched collection log data, returns an object with counts
 * for each major category. Adjust the logic to match your logData structure.
 */
export function calculateCategoryCounts(logData) {
    // Assuming logData.sections has keys like "Bosses", "Raids", etc.
    const categories = ['Bosses', 'Raids', 'Clues', 'Minigames', 'Other'];
    const counts = {};
  
    categories.forEach(category => {
      const section = logData.sections?.[category] || {};
      let obtained = 0;
      let total = 0;
  
      // Loop through each subsection if applicable
      Object.values(section).forEach(activity => {
        if (activity.items && Array.isArray(activity.items)) {
          activity.items.forEach(item => {
            total++;
            if (item.obtained) {
              obtained++;
            }
          });
        }
      });
      counts[category] = { obtained, total };
    });
    return counts;
  }
  
  /**
   * Given the fetched collection log data, returns an array of the most recent
   * items (sorted by their obtained date), limited to the specified number.
   * Assumes each item has an 'obtainedAt' field that can be parsed as a date.
   */
  export function getRecentItems(logData, limit = 12) {
    const items = [];
  
    // Gather all items from all sections
    if (logData.sections) {
      Object.values(logData.sections).forEach(section => {
        Object.values(section).forEach(activity => {
          if (activity.items && Array.isArray(activity.items)) {
            activity.items.forEach(item => {
              if (item.obtained && item.obtainedAt) {
                items.push(item);
              }
            });
          }
        });
      });
    }
    // Sort items descending by obtainedAt
    items.sort((a, b) => new Date(b.obtainedAt) - new Date(a.obtainedAt));
  
    return items.slice(0, limit);
  }
  