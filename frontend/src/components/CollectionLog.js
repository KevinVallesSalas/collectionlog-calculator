import React, { useState, useEffect } from "react";
import ItemImage from "./ItemImage";

// Updated scrollbar styles: wider and stronger 3D effect
const CustomScrollbarStyles = () => (
  <style>{`
    /* For WebKit-based browsers (Chrome, Safari, etc.) */
    .custom-scrollbar::-webkit-scrollbar {
      width: 24px;          /* scrollbar thickness */
      height: 24px;
      background: #3e3529;  /* fallback background */
    }

    .custom-scrollbar::-webkit-scrollbar-track {
      background-color: #3e3529; /* dark brown track */
      border: 2px solid #5c5647; /* border to match your overall UI */
    }

    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: #564d42; /* lighter brown thumb */
      border: 2px solid #5c5647;
      /* Stronger inset shadow for a more pronounced 3D effect */
      box-shadow: inset 3px 3px 0 #453c31;
    }

    /* Style the up/down arrow buttons */
    .custom-scrollbar::-webkit-scrollbar-button {
      background-color: #564d42; /* same as thumb */
      border: 2px solid #5c5647;
      box-shadow: inset 3px 3px 0 #453c31;
    }

    /* For Firefox */
    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: #564d42 #3e3529;
    }
  `}</style>
);

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

  // Load collection log data from localStorage
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

  // Update activeSubsection when activeSection or groupedItems changes
  useEffect(() => {
    if (groupedItems[activeSection]) {
      const subs = Object.keys(groupedItems[activeSection]);
      setActiveSubsection(subs.length > 0 ? subs[0] : null);
    }
  }, [activeSection, groupedItems]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Container dimensions:
  const containerWidth = windowSize.width * 0.9;
  const containerHeight = 750; // fixed

  // Main area width is 70% of the container width.
  const mainContentWidth = containerWidth * 0.7;

  // Grid settings:
  const columns = 6;
  const imageSize = 64; // each item image cell

  // Calculate gap for columns
  const gapBetween = (mainContentWidth / columns) - imageSize;
  const edgePadding = gapBetween / 2;
  const verticalGap = 6; // fixed vertical gap

  return (
    <>
      <CustomScrollbarStyles />

      <div className="mx-auto my-5 p-4 relative">
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

        <div
          className="flex flex-col border-4 shadow-lg"
          style={{
            width: containerWidth,
            height: containerHeight,
            borderColor: "#5c5647",
            backgroundColor: "#494034",
            color: "#fc961f",
            textShadow: "1px 1px 0 #000"
          }}
        >
          {/* Main header */}
          <div
            className="text-center font-bold text-sm border-b-4"
            style={{
              padding: "12px",
              borderColor: "#5c5647",
              backgroundColor: "#494034",
            }}
          >
            Collection Log - {logData?.uniqueObtained || 0}/{logData?.uniqueItems || 0}
          </div>

          {/* Section Tabs */}
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
                    ${active ? "bg-[#3e3529]" : "bg-[#28251e]"}
                  `}
                  style={{ color: "#fc961f" }}
                >
                  {section}
                </button>
              );
            })}
          </div>

          {/* Bottom container with sidebar and main content */}
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
                    const rowBackground = isSelected
                      ? "#6f675e"
                      : index % 2 === 0
                      ? "#453c31"
                      : "#564d42";
                    return (
                      <li key={subsection} style={{ listStyle: "none", margin: 0, padding: 0 }}>
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

            {/* Main Content Area */}
            <main
              className="flex-grow overflow-y-auto text-sm custom-scrollbar"
              style={{ backgroundColor: "#494034", padding: 0 }}
            >
              {activeSubsection && groupedItems[activeSection][activeSubsection] ? (
                <>
                  {/* Section header with fixed padding */}
                  <div
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #5c5647",
                      marginBottom: "12px",
                    }}
                  >
                    <h2 className="font-bold text-base mb-1" style={{ color: "#fc961f" }}>
                      {activeSubsection}
                    </h2>
                    {(() => {
                      const items = groupedItems[activeSection][activeSubsection]?.items || [];
                      const obtainedCount = items.filter((item) => item.obtained).length;
                      const totalItems = items.length;
                      let obtainedColor = "#a50000";
                      if (obtainedCount === totalItems && totalItems > 0) {
                        obtainedColor = "#00ff00";
                      } else if (obtainedCount > 0 && obtainedCount < totalItems) {
                        obtainedColor = "#f1f100";
                      }
                      return (
                        <p className="mb-1">
                          Obtained:{" "}
                          <span style={{ color: obtainedColor }}>
                            {obtainedCount}/{totalItems}
                          </span>
                        </p>
                      );
                    })()}
                    {(() => {
                      const killCount = groupedItems[activeSection][activeSubsection]?.killCount || {};
                      if (killCount.name && killCount.amount > 0) {
                        return (
                          <p className="mb-0">
                            <span style={{ color: "#fc961f" }}>{killCount.name}:</span>{" "}
                            <span style={{ color: "#ffffff" }}>{killCount.amount}</span>
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  {/* Grid container wrapper with adjusted left/right padding */}
                  <div style={{ paddingLeft: edgePadding, paddingRight: edgePadding }}>
                    <div
                      className="grid"
                      style={{
                        gridTemplateColumns: `repeat(${columns}, ${imageSize}px)`,
                        gridAutoRows: `${imageSize}px`,
                        columnGap: gapBetween,
                        rowGap: verticalGap
                      }}
                    >
                      {groupedItems[activeSection][activeSubsection].items.map((item, index) => (
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
                          onMouseLeave={() => setTooltip({ visible: false, text: "", x: 0, y: 0 })}
                        >
                          <ItemImage
                            itemId={item.id}
                            fallbackName={item.name}
                            className={item.obtained ? "opacity-100" : "opacity-30"}
                            style={{ width: "100%", height: "100%" }}
                          />
                          {item.quantity > 1 && (
                            <span
                              className="absolute top-0 left-0 text-xs font-bold px-1"
                              style={{
                                color: "#f1f100",
                                textShadow: "2px 2px 2px rgba(0, 0, 0, 0.5)",
                              }}
                            >
                              {item.quantity}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
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
    </>
  );
}

export default CollectionLog;
