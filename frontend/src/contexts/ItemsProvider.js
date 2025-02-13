import React, { createContext, useContext, useEffect, useState } from "react";
import { preloadImages } from "../utils/preloadImages";

const ItemsContext = createContext(null);

export function useItemsData() {
  return useContext(ItemsContext);
}

export function ItemsProvider({ children }) {
  const [itemsData, setItemsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/log_importer/items-json/")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setItemsData(data);
        // Render immediately since the default page doesn't need these images.
        setLoading(false);
        // Kick off image preloading in the background.
        const imageEntries = Object.values(data).map((item) => ({
          name: item.name,
          url: item.imageUrl,
        }));
        preloadImages(imageEntries)
          .catch((err) => console.error("Image preloading error:", err));
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading data...</div>;
  }

  return (
    <ItemsContext.Provider value={itemsData}>
      {children}
    </ItemsContext.Provider>
  );
}
