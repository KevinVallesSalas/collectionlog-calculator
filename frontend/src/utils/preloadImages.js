/**
 * Preloads images for an array of { name, url } entries,
 * and saves failures to localStorage.
 *
 * @param {{ name: string, url: string }[]} items - The item name + URL pairs to preload.
 */
export function preloadImages(items) {
    // Load existing failures from localStorage or start fresh
    let failedImages = JSON.parse(localStorage.getItem("failedImageUrls")) || {};
  
    items.forEach(({ name, url }) => {
      const img = new Image();
  
      // If it fails to load, store it in localStorage
      img.onerror = () => {
        console.error(`Failed to preload: ${url}`);
        // Store in an object keyed by the item name
        // so it's easy to see which item is failing
        failedImages[name] = url;
        
        // Write it back to localStorage
        localStorage.setItem("failedImageUrls", JSON.stringify(failedImages));
      };
  
      // Trigger the load
      img.src = url;
    });
  }
  