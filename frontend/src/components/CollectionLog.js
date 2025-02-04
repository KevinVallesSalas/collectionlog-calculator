import React, { useState, useEffect } from "react";
import ItemImage from "./ItemImage";

function CollectionLog() {
  const [logData, setLogData] = useState(null);
  const [groupedItems, setGroupedItems] = useState({});
  const [activeSection, setActiveSection] = useState("Bosses");
  const [activeSubsection, setActiveSubsection] = useState(null);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

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

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const containerWidth = Math.min(windowSize.width * 0.9, 900);
  const containerHeight = Math.min(windowSize.height * 0.8, 550);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#18120F]">
      {/* Responsive Collection Log Box */}
      <div
        className="bg-[#3A2A1B] border-4 border-[#1C1109] rounded-lg text-yellow-300 p-4 shadow-lg overflow-hidden"
        style={{ width: `${containerWidth}px`, height: `${containerHeight}px` }}
      >
        {/* Collection Log Header with Darker Border Below */}
        <div className="bg-[#2A1E14] text-orange-400 text-lg font-bold text-center py-2 border-b-4 border-[#1C1109]">
          Collection Log - {logData?.uniqueObtained || 0}/{logData?.uniqueItems || 0}
        </div>

        {/* Section Tabs - No border below, only between header and tabs */}
        <div className="flex">
          {Object.keys(groupedItems).map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`flex-1 text-center py-2 text-lg font-bold uppercase border-x-2 border-t-4 border-[#1C1109]
                ${
                  activeSection === section
                    ? "bg-[#4A3B2A] text-orange-400 rounded-t-lg"
                    : "bg-[#2A1E14] text-yellow-300 hover:bg-[#3B2C1A]"
                }`}
            >
              {section}
            </button>
          ))}
        </div>

        {/* Content Area - No border here */}
        <div className="flex overflow-hidden" style={{ height: `${containerHeight - 100}px` }}>
          {/* Sidebar (Thinner Border but Matching Darkness) */}
          <aside className="w-[30%] bg-[#2A1E14] border-r-2 border-[#1C1109] overflow-y-auto p-2 custom-scrollbar">
            <ul>
              {groupedItems[activeSection] &&
              Object.keys(groupedItems[activeSection]).length > 0 ? (
                Object.keys(groupedItems[activeSection]).map((subsection) => (
                  <li key={subsection}>
                    <button
                      onClick={() => setActiveSubsection(subsection)}
                      className={`block w-full text-left px-2 py-1 text-sm transition-all ${
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
          <main className="w-[70%] bg-[#3B2C1A] p-4 overflow-y-auto custom-scrollbar">
            <h2 className="text-lg text-orange-400 font-bold">{activeSubsection || activeSection}</h2>
            <p className="text-sm text-yellow-300">
              Obtained: 0/{groupedItems[activeSection]?.[activeSubsection]?.length || 0}
            </p>
            
            {activeSubsection &&
            groupedItems[activeSection][activeSubsection] &&
            groupedItems[activeSection][activeSubsection].length > 0 ? (
              <div className="grid grid-cols-5 gap-2 mt-3">
                {groupedItems[activeSection][activeSubsection].map((item, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <ItemImage 
                      itemName={item.name} 
                      className={`w-10 h-10 border-2 ${
                        item.obtained ? "border-green-500" : "border-red-500 opacity-50"
                      }`} 
                    />
                    <span className="text-xs">{item.name}</span>
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
