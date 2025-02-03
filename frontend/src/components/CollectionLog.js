import React, { useState, useEffect } from "react";
import ItemImage from "./ItemImage";

function CollectionLog() {
  const [logData, setLogData] = useState(null);
  const [groupedItems, setGroupedItems] = useState({});
  const [activeSection, setActiveSection] = useState("Bosses");
  const [activeSubsection, setActiveSubsection] = useState(null);

  useEffect(() => {
    const savedData = JSON.parse(localStorage.getItem("collectionLogData"));
    if (savedData) {
      setLogData(savedData);
      const sections = savedData.sections || {
        Bosses: {},
        Raids: {},
        Clues: {},
        Minigames: {},
        Other: {},
      };
      setGroupedItems(sections);
      const subs = Object.keys(sections[activeSection] || {});
      if (subs.length > 0) {
        setActiveSubsection(subs[0]);
      }
    }
  }, []);

  useEffect(() => {
    if (groupedItems[activeSection]) {
      const subs = Object.keys(groupedItems[activeSection]);
      setActiveSubsection(subs.length > 0 ? subs[0] : null);
    }
  }, [activeSection, groupedItems]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      {/* Main Collection Log Box */}
      <div className="w-full max-w-4xl bg-[#453A28] border-4 border-[#332717] rounded-lg text-yellow-300 p-4 shadow-lg">
        
        {/* Header Bar (Removed Search & Menu Button) */}
        <div className="flex justify-between items-center border-b-4 border-[#2A1E14] pb-2 mb-2">
          <h1 className="text-2xl font-bold text-yellow-400 mx-auto">
            Collection Log - {logData?.uniqueObtained || 0}/{logData?.uniqueItems || 0}
          </h1>
          <button className="text-yellow-400 hover:text-white">✖</button>
        </div>

        {/* Section Tabs */}
        <div className="flex justify-around border-b-4 border-[#2A1E14] py-2">
          {Object.keys(groupedItems).map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`px-4 py-1 uppercase text-sm font-bold ${
                activeSection === section
                  ? "text-orange-400 border-b-2 border-orange-400"
                  : "text-yellow-300 hover:text-orange-300"
              }`}
            >
              {section}
            </button>
          ))}
        </div>

        <div className="flex h-[400px]">
          {/* Sidebar */}
          <aside className="w-1/3 bg-[#2A1E14] border-r-4 border-[#4A3B2A] overflow-y-auto p-2">
            <ul>
              {groupedItems[activeSection] &&
              Object.keys(groupedItems[activeSection]).length > 0 ? (
                Object.keys(groupedItems[activeSection]).map((subsection) => (
                  <li key={subsection}>
                    <button
                      onClick={() => setActiveSubsection(subsection)}
                      className={`block w-full text-left px-2 py-1 text-sm ${
                        activeSubsection === subsection
                          ? "text-orange-400"
                          : "text-yellow-300 hover:text-orange-300"
                      }`}
                    >
                      {subsection}
                    </button>
                  </li>
                ))
              ) : (
                <p className="text-sm text-gray-400">No categories available.</p>
              )}
            </ul>
          </aside>

          {/* Main Log View */}
          <main className="w-2/3 bg-[#3B2C1A] p-4 overflow-y-auto">
            <h2 className="text-lg text-orange-400 font-bold">{activeSubsection || activeSection}</h2>
            <p className="text-sm text-yellow-300">
              Obtained: 0/{groupedItems[activeSection]?.[activeSubsection]?.length || 0}
            </p>
            
            {activeSubsection &&
            groupedItems[activeSection][activeSubsection] &&
            groupedItems[activeSection][activeSubsection].length > 0 ? (
              <div className="grid grid-cols-5 gap-4 mt-3">
                {groupedItems[activeSection][activeSubsection].map((item, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <ItemImage itemName={item.name} className="w-12 h-12" />
                    <span className="text-sm">{item.name}</span>
                    <span>{item.obtained ? "✅" : "❌"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 mt-3">No items available.</p>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default CollectionLog;
