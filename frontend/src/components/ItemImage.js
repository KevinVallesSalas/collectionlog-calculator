import React from 'react';

// Optional manual mapping for items that don't follow the standard naming convention.
const imageMapping = {
  // "Ikkle hydra": "Ikkle_hydra.png",
  // Add any manual mappings as needed.
};

const ItemImage = ({ itemName, alt, fallbackSrc = "/fallback.png", ...props }) => {
  // Determine the file name: use a manual mapping if available; otherwise, replace spaces with underscores and append .png.
  const imageFileName = imageMapping[itemName] || itemName.replace(/\s+/g, '_') + '.png';
  const imageUrl = `https://oldschool.runescape.wiki/images/${imageFileName}`;

  const handleError = (e) => {
    // Check if the src already ends with our fallback filename.
    if (!e.target.src.endsWith(fallbackSrc)) {
      console.error(`Failed to load image for "${itemName}" from ${imageUrl}. Switching to fallback image.`);
      // Remove the error handler to avoid looping.
      e.target.onerror = null;
      // Switch to the fallback image.
      e.target.src = fallbackSrc;
    } else {
      console.error(`Fallback image also failed for "${itemName}". Hiding image.`);
      e.target.style.display = 'none';
    }
  };

  return (
    <img
      src={imageUrl}
      alt={alt || itemName}
      onError={handleError}
      loading="lazy"
      {...props}
    />
  );
};

export default ItemImage;
