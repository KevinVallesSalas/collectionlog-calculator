import React, { useState, useEffect } from "react";
import ItemImage from "./ItemImage";

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

  // Overall container dimensions
  const containerWidth = Math.min(windowSize.width * 0.9, 850);
  const containerHeight = Math.min(windowSize.height * 0.85, 550);

  // Hardcode 6 columns, ~5.5 rows to see part of the 6th
  const columns = 6;
  const rowCount = 5.5; // 5 full rows + partial 6th row
  const gapSize = 6;    // Gap in px between items

  // The main content is 70% of the container width (minus some padding/border).
  const mainContentWidth = containerWidth * 0.7 - 24;

  // Approximate how much vertical space is left after header/tabs, etc.
  // Adjust these values as needed to fine-tune:
  const headerHeight = 32;
  const tabsHeight = 36;
  const borderHeight = 4;       // top/bottom border in your container
  const mainContentPadding = 24; // p-3 top+bottom in the main content
  const leftoverHeight =
    containerHeight - (headerHeight + tabsHeight + borderHeight + mainContentPadding);

  // 1) Item size based on width
  //    total horizontal gap = (columns - 1) * gapSize
  const totalHorizontalGap = (columns - 1) * gapSize;
  const itemSizeByWidth = (mainContentWidth - totalHorizontalGap) / columns;

  // 2) Item size based on height (for ~5.5 rows)
  //    total vertical gap = (rowCount - 1) * gapSize
  const totalVerticalGap = (rowCount - 1) * gapSize;
  const itemSizeByHeight = (leftoverHeight - totalVerticalGap) / rowCount;

  // 3) Final itemSize = min of both to avoid overflow
  const itemSize = Math.floor(Math.min(itemSizeByWidth, itemSizeByHeight));

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="fixed bg-black bg-opacity-90 text-white text-xs px-2 py-1 rounded shadow-lg z-50 pointer-events-none"
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

      {/* Main Container */}
      <div
        className="flex flex-col border-4 shadow-lg"
        style={{
          width: containerWidth,
          height: containerHeight,
          borderColor: "#5c5647",      // Tiny border
          backgroundColor: "#494034",  // Main background
          color: "#fc961f",            // Default text color
          textShadow: "1px 1px 0 #000" // Slight drop shadow on all text
        }}
      >
        {/* Header */}
        <div
          className="text-center py-1 font-bold text-sm border-b-4"
          style={{
            borderColor: "#5c5647",
            backgroundColor: "#494034",
          }}
        >
          Collection Log - {logData?.uniqueObtained || 0}/{logData?.uniqueItems || 0}
        </div>

        {/* Tabs Row */}
        <div className="flex">
          {Object.keys(groupedItems).map((section) => {
            const active = activeSection === section;
            return (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`
                  flex-1 px-3 py-2 text-sm uppercase font-bold
                  border border-[#5c5647] border-b-0
                  rounded-t-xl
                  ${
                    active
                      ? "bg-[#3e3529]" // Active tab color
                      : "bg-[#28251e]" // Inactive tab color
                  }
                `}
                style={{ color: "#fc961f" }}
              >
                {section}
              </button>
            );
          })}
        </div>

        {/* Bottom Container */}
        <div
          className="flex flex-grow min-h-0 border"
          style={{
            borderColor: "#5c5647",
            borderTop: "0px",
          }}
        >
          {/* Left Sidebar */}
          <aside
            className="overflow-y-auto text-sm custom-scrollbar"
            style={{
              width: "30%",
              backgroundColor: "#494034",
              borderRight: "1px solid #5c5647",
              padding: 0
            }}
          >
            {groupedItems[activeSection] &&
            Object.keys(groupedItems[activeSection]).length > 0 ? (
              <ul style={{ margin: 0, padding: 0 }}>
                {Object.keys(groupedItems[activeSection]).map((subsection, index) => {
                  const items = groupedItems[activeSection][subsection]?.items || [];
                  const obtainedCount = items.filter((i) => i.obtained).length;
                  const totalItems = items.length;
                  const isComplete = obtainedCount === totalItems;
                  const isSelected = subsection === activeSubsection;

                  // Row background color
                  const rowBackground = isSelected
                    ? "#6f675e" // selected subsection
                    : index % 2 === 0
                    ? "#453c31" // even row
                    : "#564d42"; // odd row

                  return (
                    <li
                      key={subsection}
                      style={{
                        listStyle: "none",
                        margin: 0,
                        padding: 0
                      }}
                    >
                      <button
                        onClick={() => setActiveSubsection(subsection)}
                        className="w-full text-left"
                        style={{
                          backgroundColor: rowBackground,
                          color: isComplete ? "#00ff00" : "#fc961f",
                          textShadow: "inherit",
                          border: "none",
                          padding: "0.5rem",
                          display: "block"
                        }}
                      >
                        {subsection}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-xs" style={{ padding: "0.5rem" }}>
                No categories available.
              </p>
            )}
          </aside>

          {/* Main Content */}
          <main
            className="p-3 flex-grow overflow-y-auto text-sm custom-scrollbar"
            style={{ backgroundColor: "#494034" }}
          >
            {activeSubsection && groupedItems[activeSection][activeSubsection] ? (
              <>
                {/* Subsection Name */}
                <h2 className="font-bold text-base mb-1" style={{ color: "#fc961f" }}>
                  {activeSubsection}
                </h2>

                {/* Obtained Count */}
                {(() => {
                  const items = groupedItems[activeSection][activeSubsection]?.items || [];
                  const obtainedCount = items.filter((item) => item.obtained).length;
                  const totalItems = items.length;
                  let obtainedColor = "#fc961f";
                  if (obtainedCount === 0) obtainedColor = "#ff0000";
                  if (obtainedCount === totalItems && totalItems > 0) obtainedColor = "#00ff00";

                  return (
                    <p className="mb-1">
                      Obtained:{" "}
                      <span style={{ color: obtainedColor }}>
                        {obtainedCount}/{totalItems}
                      </span>
                    </p>
                  );
                })()}

                {/* Kill Count */}
                {(() => {
                  const killCount =
                    groupedItems[activeSection][activeSubsection]?.killCount || {};
                  if (killCount.name && killCount.amount > 0) {
                    return (
                      <p className="mb-2">
                        {killCount.name}: {killCount.amount}
                      </p>
                    );
                  }
                  return null;
                })()}

                {/* Items Grid */}
                <div
                  className="grid gap-1"
                  style={{
                    // Force 6 columns at the computed itemSize
                    gridTemplateColumns: `repeat(${columns}, ${itemSize}px)`,
                    // Also fix row height so they're square
                    gridAutoRows: `${itemSize}px`,
                  }}
                >
                  {groupedItems[activeSection][activeSubsection].items.map(
                    (item, index) => (
                      <div
                        key={index}
                        className="relative group"
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
                        onMouseLeave={() =>
                          setTooltip({ visible: false, text: "", x: 0, y: 0 })
                        }
                      >
                        <ItemImage
                          itemId={item.id}
                          fallbackName={item.name}
                          // Dim if not obtained
                          className={item.obtained ? "opacity-100" : "opacity-30"}
                          style={{ width: "100%", height: "100%" }}
                        />
                        {item.quantity > 0 && (
                          <span className="absolute top-0 left-0 bg-black bg-opacity-75 text-yellow-200 text-xs font-bold px-1 rounded">
                            {item.quantity}
                          </span>
                        )}
                      </div>
                    )
                  )}
                </div>
              </>
            ) : (
              <p className="text-xs" style={{ color: "#fc961f" }}>
                No items available.
              </p>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default CollectionLog;
