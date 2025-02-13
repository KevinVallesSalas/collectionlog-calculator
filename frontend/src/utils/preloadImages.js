/**
 * Preloads images for an array of { name, url } entries,
 * and saves failures to localStorage.
 *
 * Returns a promise that resolves when all images have either loaded or failed.
 *
 * @param {{ name: string, url: string }[]} items - The item name + URL pairs to preload.
 * @returns {Promise<Array<{ name: string, url: string, status: string }>>}
 */
export function preloadImages(items) {
  let failedImages = JSON.parse(localStorage.getItem("failedImageUrls")) || {};

  const loadPromises = items.map(({ name, url }) =>
    new Promise((resolve) => {
      const img = new Image();

      img.onload = () => {
        // Successfully loaded image; resolve silently.
        resolve({ name, url, status: "loaded" });
      };

      img.onerror = () => {
        // Log only failures.
        console.error(`Failed to preload: ${url}`);
        failedImages[name] = url;
        localStorage.setItem("failedImageUrls", JSON.stringify(failedImages));
        resolve({ name, url, status: "failed" });
      };

      img.src = url;
    })
  );

  return Promise.all(loadPromises);
}
