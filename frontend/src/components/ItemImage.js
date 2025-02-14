import React from 'react';
import { useItemsData } from '../contexts/ItemsProvider';

const ItemImage = ({ itemId, fallbackName, alt, fallbackSrc = "/fallback.png", disableLink, ...props }) => {
  // Get the full items dictionary from context
  const itemsData = useItemsData();

  // Look up the item by its ID (keys are strings)
  const itemEntry = itemsData ? itemsData[String(itemId)] : null;
  
  // Use the imageUrl and wikiPageUrl from the itemEntry; fallback to our fallbackSrc if none found
  const imageUrl = itemEntry && itemEntry.imageUrl ? itemEntry.imageUrl : fallbackSrc;
  const wikiPageUrl = itemEntry && itemEntry.wikiPageUrl ? itemEntry.wikiPageUrl : null;
  
  // For the alt attribute, prefer the itemEntry's name; otherwise, use fallbackName or a default.
  const altText = alt || (itemEntry && itemEntry.name) || fallbackName || "Item image";

  const handleError = (e) => {
    if (!e.target.src.endsWith(fallbackSrc)) {
      console.error(`Failed to load image for itemId=${itemId}. Switching to fallback image.`);
      e.target.onerror = null;
      e.target.src = fallbackSrc;
    } else {
      console.error(`Fallback image also failed for itemId=${itemId}. Hiding image.`);
      e.target.style.display = 'none';
    }
  };

  const imageElement = (
    <img
      src={imageUrl}
      alt={altText}
      onError={handleError}
      loading="lazy"
      className="max-w-full max-h-full object-contain"
      style={{
        width: 'auto',
        height: 'auto',
        maxWidth: '100%',
        maxHeight: '100%',
        display: 'block'
      }}
      {...props}
    />
  );

  return (
    <div className="relative w-12 h-12 flex items-center justify-center overflow-hidden">
      {(!disableLink && wikiPageUrl) ? (
        <a href={wikiPageUrl} target="_blank" rel="noopener noreferrer">
          {imageElement}
        </a>
      ) : (
        imageElement
      )}
    </div>
  );
};

export default ItemImage;