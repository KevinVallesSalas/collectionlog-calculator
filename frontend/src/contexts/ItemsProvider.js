import React, { createContext, useContext, useEffect, useState } from "react";
import { preloadImages } from "../utils/preloadImages";

// Define the backend URL from the environment with a fallback to local
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";

const ItemsContext = createContext(null);

export function useItemsData() {
  return useContext(ItemsContext);
}

export function ItemsProvider({ children }) {
  const [itemsData, setItemsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BACKEND_URL}/log_importer/items-json/`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setItemsData(data);
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
