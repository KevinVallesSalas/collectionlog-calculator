import React from 'react';
import { useItemsData } from '../contexts/ItemsProvider';

const ItemImage = ({
  itemId,
  fallbackName,
  alt,
  fallbackSrc = "/fallback.png",
  disableLink,
  ...props
}) => {
  const itemsData = useItemsData();
  const itemEntry = itemsData ? itemsData[String(itemId)] : null;
  const imageUrl = itemEntry && itemEntry.imageUrl ? itemEntry.imageUrl : fallbackSrc;
  const wikiPageUrl = itemEntry && itemEntry.wikiPageUrl ? itemEntry.wikiPageUrl : null;
  const altText = alt || (itemEntry && itemEntry.name) || fallbackName || "Item image";

  const handleError = (e) => {
    if (!e.target.src.endsWith(fallbackSrc)) {
      e.target.onerror = null;
      e.target.src = fallbackSrc;
    } else {
      e.target.style.display = 'none';
    }
  };

  return (
    <div className="relative group" style={{ width: "100%", height: "100%" }}>
      {/* Use absolute positioning to force full coverage */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        {(!disableLink && wikiPageUrl) ? (
          <a href={wikiPageUrl} target="_blank" rel="noopener noreferrer">
            <img
              src={imageUrl}
              alt={altText}
              onError={handleError}
              loading="lazy"
              className="object-contain"
              style={{
                width: "100%",
                height: "100%",
                display: "block"
              }}
              {...props}
            />
          </a>
        ) : (
          <img
            src={imageUrl}
            alt={altText}
            onError={handleError}
            loading="lazy"
            className="object-contain"
            style={{
              width: "100%",
              height: "100%",
              display: "block"
            }}
            {...props}
          />
        )}
      </div>
    </div>
  );
};

export default ItemImage;
