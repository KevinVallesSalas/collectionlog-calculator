import React, { useState, useEffect } from "react";
import ItemImage from "./ItemImage";
// You can keep the import if other components need it, otherwise remove it:
// import { useItemsData } from "../contexts/ItemsProvider";

function CollectionLog() {
  const [logData, setLogData] = useState(null);
  const [groupedItems, setGroupedItems] = useState({});
  const [activeSection, setActiveSection] = useState("Bosses");
  const [activeSubsection, setActiveSubsection] = useState(null);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [tooltip, setTooltip] = useState({ visible: false, text: "", x: 0, y: 0 });

  // 1) Load collection log data from localStorage
  useEffect(() => {
    const savedData = JSON.parse(localStorage.getItem("collectionLogData"));
    if (savedData) {
      setLogData(savedData);
      setGroupedItems(savedData.sections || {});
      const subs = Object.keys(savedData.sections?.[activeSection] || {});
      if (subs.length > 0) {
        setActiveSubsection(subs[0]);
      }
    }
  }, [activeSection]);

  // 2) Update activeSubsection whenever activeSection or groupedItems changes
  useEffect(() => {
    if (groupedItems[activeSection]) {
      const subs = Object.keys(groupedItems[activeSection]);
      setActiveSubsection(subs.length > 0 ? subs[0] : null);
    }
  }, [activeSection, groupedItems]);

  // 3) Handle window resize
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#18120F] relative">
      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="fixed bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded shadow-lg z-50 pointer-events-none"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            whiteSpace: "nowrap",
          }}
        >
          <div className="font-bold">{tooltip.text.split("\n")[0]}</div>
          {tooltip.text.split("\n")[1] && (
            <div className="text-gray-300">{tooltip.text.split("\n")[1]}</div>
          )}
        </div>
      )}

      {/* Responsive Collection Log Box */}
      <div
        className="bg-[#3A2A1B] border-4 border-[#1C1109] rounded-lg text-yellow-300 p-4 shadow-lg flex flex-col"
        style={{ width: `${containerWidth}px`, height: `${containerHeight}px` }}
      >
        {/* Collection Log Header */}
        <div className="bg-[#2A1E14] text-orange-400 text-lg font-bold text-center py-2 border-b-4 border-[#1C1109]">
          Collection Log - {logData?.uniqueObtained || 0}/{logData?.uniqueItems || 0}
        </div>

        {/* Section Tabs */}
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

        {/* Content Area */}
        <div className="flex flex-grow min-h-0">
          {/* Left Sidebar */}
          <aside className="w-[30%] bg-[#2A1E14] border-r-2 border-[#1C1109] overflow-y-auto p-2 custom-scrollbar">
            <ul>
              {groupedItems[activeSection] &&
              Object.keys(groupedItems[activeSection]).length > 0 ? (
                Object.keys(groupedItems[activeSection]).map((subsection) => {
                  const items = groupedItems[activeSection][subsection]?.items || [];
                  const obtainedCount = items.filter((item) => item.obtained).length;
                  const totalItems = items.length;
                  const subsectionClass =
                    obtainedCount === totalItems ? "text-green-400" : "text-yellow-300";

                  return (
                    <li key={subsection}>
                      <button
                        onClick={() => setActiveSubsection(subsection)}
                        className={`block w-full text-left px-2 py-1 text-sm transition-all ${subsectionClass} hover:text-orange-300`}
                      >
                        {subsection}
                      </button>
                    </li>
                  );
                })
              ) : (
                <p className="text-sm text-gray-400">No categories available.</p>
              )}
            </ul>
          </aside>

          {/* Main Content */}
          <main className="w-[70%] bg-[#3B2C1A] p-4 overflow-y-auto custom-scrollbar flex-grow min-h-0">
            {activeSubsection && groupedItems[activeSection][activeSubsection] ? (
              <>
                {/* Subsection Header */}
                <h2 className="text-lg text-orange-400 font-bold">{activeSubsection}</h2>

                {/* Obtained Items Count */}
                {(() => {
                  const items = groupedItems[activeSection][activeSubsection]?.items || [];
                  const obtainedCount = items.filter((item) => item.obtained).length;
                  const totalItems = items.length;
                  const obtainedNumberColor =
                    obtainedCount === 0
                      ? "text-red-400"
                      : obtainedCount === totalItems
                      ? "text-green-400"
                      : "text-yellow-300";

                  return (
                    <p className="text-sm text-yellow-300 font-bold">
                      Obtained:{" "}
                      <span className={obtainedNumberColor}>
                        {obtainedCount}/{totalItems}
                      </span>
                    </p>
                  );
                })()}

                {/* Kill Count Display */}
                {(() => {
                  const killCount = groupedItems[activeSection][activeSubsection]?.killCount || {};
                  return killCount.name && killCount.amount > 0 ? (
                    <p className="text-sm text-yellow-300">
                      {killCount.name}: {killCount.amount}
                    </p>
                  ) : null;
                })()}

                {/* Items Display */}
                <div className="grid grid-cols-5 gap-2 mt-3">
                  {groupedItems[activeSection][activeSubsection].items.map((item, index) => (
                    <div
                      key={index}
                      className="relative group w-12 h-12"
                      onMouseEnter={(e) => {
                        let tooltipText = item.name;
                        if (item.obtained && item.obtainedAt) {
                          tooltipText += `\nObtained: ${new Date(item.obtainedAt)
                            .toISOString()
                            .split("T")[0]}`;
                        }
                        setTooltip({
                          visible: true,
                          text: tooltipText,
                          x: e.clientX + 10,
                          y: e.clientY + 10,
                        });
                      }}
                      onMouseLeave={() => setTooltip({ visible: false, text: "", x: 0, y: 0 })}
                    >
                      <ItemImage
                        itemId={item.id}
                        fallbackName={item.name}
                        className={`w-12 h-12 ${item.obtained ? "opacity-100" : "opacity-30"}`}
                      />
                      {item.quantity > 0 && (
                        <span className="absolute top-0 left-0 bg-black bg-opacity-75 text-yellow-300 text-xs font-bold px-1 rounded">
                          {item.quantity}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </>
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
