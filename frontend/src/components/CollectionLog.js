import React, { useState, useEffect } from "react";
import ItemImage from "./ItemImage";

// Helper function to format names to Capital Case
function formatName(name) {
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const CustomScrollbarStyles = () => (
  <style>{`
    /* For WebKit-based browsers (Chrome, Safari, etc.) */
    .custom-scrollbar::-webkit-scrollbar {
      width: 24px;
      height: 24px;
      background: #3e3529;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background-color: #3e3529;
      border: 2px solid #5c5647;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: #564d42;
      border: 2px solid #5c5647;
      box-shadow: inset 3px 3px 0 #453c31;
    }
    .custom-scrollbar::-webkit-scrollbar-button {
      background-color: #564d42;
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
  const [activeSection, setActiveSection] = useState("");
  const [activeSubsection, setActiveSubsection] = useState(null);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [tooltip, setTooltip] = useState({
    visible: false,
    text: "",
    x: 0,
    y: 0,
  });

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = JSON.parse(localStorage.getItem("collectionLogData"));
    if (savedData) {
      setLogData(savedData);
      const sections = savedData.sections || {};
      setGroupedItems(sections);
      const sectionKeys = Object.keys(sections);
      if (sectionKeys.length > 0) {
        setActiveSection(sectionKeys[0]);
        const subs = Object.keys(sections[sectionKeys[0]]);
        setActiveSubsection(subs.length > 0 ? subs[0] : null);
      }
    }
  }, []);

  // When activeSection changes, update activeSubsection to first key if available
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

  // Dimensions for the container and grid
  const containerWidth = windowSize.width * 0.9;
  const containerHeight = 750; // fixed
  const mainContentWidth = containerWidth * 0.7;
  const columns = 6;
  const imageSize = 64;
  const gapBetween = mainContentWidth / columns - imageSize;
  const edgePadding = gapBetween / 2;
  const verticalGap = 6;

  // Unique overall obtained counts from logData for the header
  const uniqueObtained = logData?.uniqueObtained || 0;
  const uniqueItems = logData?.uniqueItems || 0;
  const headerObtainedColor =
    uniqueObtained === 0
      ? "#a50000"
      : uniqueObtained === uniqueItems && uniqueItems > 0
      ? "#00ff00"
      : "#f1f100";

  // For grid display, get current section/subsection items safely
  const currentItems =
    groupedItems[activeSection]?.[activeSubsection]?.items || [];
  const sectionObtained = currentItems.filter((item) => item.count > 0).length;
  const sectionTotal = currentItems.length;
  const sectionObtainedColor =
    sectionObtained === 0
      ? "#a50000"
      : sectionObtained === sectionTotal && sectionTotal > 0
      ? "#00ff00"
      : "#f1f100";

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
              <div className="text-gray-300">
                {tooltip.text.split("\n")[1]}
              </div>
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
            textShadow: "1px 1px 0 #000",
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
            {logData?.username
              ? `${logData.username}'s Collection Log`
              : "Collection Log"}{" "}
            - {" "}
            <span style={{ color: headerObtainedColor }}>
              {uniqueObtained}/{uniqueItems}
            </span>
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
                  {formatName(section)}
                </button>
              );
            })}
          </div>

          {/* Main container */}
          <div
            className="flex flex-grow min-h-0 border"
            style={{
              borderColor: "#5c5647",
              borderTop: "0px",
            }}
          >
            {/* Sidebar */}
            <aside
              className="overflow-y-auto text-sm custom-scrollbar"
              style={{
                width: "30%",
                backgroundColor: "#494034",
                borderRight: "1px solid #5c5647",
                padding: 0,
              }}
            >
              {groupedItems[activeSection] &&
              Object.keys(groupedItems[activeSection]).length > 0 ? (
                <ul style={{ margin: 0, padding: 0 }}>
                  {Object.keys(groupedItems[activeSection])
                    .sort()
                    .map((subsection, index) => {
                      const items =
                        groupedItems[activeSection][subsection]?.items || [];
                      const obtainedCountSub = items.filter(
                        (item) => item.count > 0
                      ).length;
                      const totalItemsSub = items.length;
                      const isComplete = obtainedCountSub === totalItemsSub;
                      const isSelected = subsection === activeSubsection;
                      const rowBackground = isSelected
                        ? "#6f675e"
                        : index % 2 === 0
                        ? "#453c31"
                        : "#564d42";
                      return (
                        <li
                          key={subsection}
                          style={{ listStyle: "none", margin: 0, padding: 0 }}
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
                              display: "block",
                            }}
                          >
                            {formatName(subsection)}
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
              className="flex-grow overflow-y-auto text-sm custom-scrollbar"
              style={{ backgroundColor: "#494034", padding: 0 }}
            >
              {activeSubsection &&
              groupedItems[activeSection]?.[activeSubsection] ? (
                <>
                  {/* Section Header */}
                  <div
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #5c5647",
                      marginBottom: "12px",
                    }}
                  >
                    <h2
                      className="font-bold text-base mb-1"
                      style={{ color: "#fc961f" }}
                    >
                      {formatName(activeSubsection)}
                    </h2>
                    <p className="mb-1">
                      Obtained:{" "}
                      <span style={{ color: sectionObtainedColor }}>
                        {sectionObtained}/{sectionTotal}
                      </span>
                    </p>
                    {/*
                    // Kill count functionality is commented out for now.
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
                    */}
                  </div>
                  {/* Grid */}
                  <div style={{ paddingLeft: edgePadding, paddingRight: edgePadding }}>
                    <div
                      className="grid"
                      style={{
                        gridTemplateColumns: `repeat(${columns}, ${imageSize}px)`,
                        gridAutoRows: `${imageSize}px`,
                        columnGap: gapBetween,
                        rowGap: verticalGap,
                      }}
                    >
                      {currentItems.map((item, index) => (
                        <div
                          key={index}
                          className="relative group"
                          onMouseEnter={(e) => {
                            let tooltipText = item.name;
                            if (item.count > 0 && item.date) {
                              tooltipText += `\nObtained: ${new Date(
                                item.date
                              )
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
                            className={item.count > 0 ? "opacity-100" : "opacity-30"}
                            style={{ width: "100%", height: "100%" }}
                          />
                          {item.count > 1 && (
                            <span
                              className="absolute top-0 left-0 text-xs font-bold px-1"
                              style={{
                                color: "#f1f100",
                                textShadow: "2px 2px 2px rgba(0, 0, 0, 0.5)",
                              }}
                            >
                              {item.count}
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
