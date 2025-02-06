import React, { createContext, useContext, useEffect, useState } from "react";

const ItemsContext = createContext(null);

export function useItemsData() {
  return useContext(ItemsContext);
}

export function ItemsProvider({ children }) {
  const [itemsData, setItemsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hit your Django endpoint
    fetch("http://127.0.0.1:8000/log_importer/items-json/")
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      //console.log("Loaded items:", data);
      setItemsData(data);
      setLoading(false);
    })
    .catch((err) => {
      console.error("Failed to load items.json:", err);
      setLoading(false);
    });
  
  }, []);

  if (loading) {
    return <div>Loading item data...</div>;
  }

  return (
    <ItemsContext.Provider value={itemsData}>
      {children}
    </ItemsContext.Provider>
  );
}
