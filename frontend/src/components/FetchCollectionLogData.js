import React, { useState, useEffect } from 'react';
import { useTransition, animated } from 'react-spring';
import { updateNextFastestItem } from '../utils/calculations';
import ItemImage from './ItemImage';

// Define the backend URL from environment variables with fallback to local dev URL
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000';

// Divider component with full container width
const Divider = () => (
  <div
    style={{
      width: "100%",
      borderBottom: "4px solid #5c5647",
      marginTop: "0.5rem",
      marginBottom: "0.5rem",
    }}
  />
);

function FetchCollectionLogData({ onUploadComplete }) {
  const [username, setUsername] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [lastUpdated, setLastUpdated] = useState(localStorage.getItem('collectionLogLastUpdated') || '');

  // Load collection log data from localStorage
  const savedLogData = JSON.parse(localStorage.getItem('collectionLogData'));
  const hasData = !!savedLogData;
  const displayedUsername = hasData ? (savedLogData.username || "API Fetch") : "No Username";
  const uniqueObtained = hasData ? (savedLogData.uniqueObtained || 0) : 0;
  const uniqueItems = hasData ? (savedLogData.uniqueItems || 0) : 0;

  // Next fastest item
  const [nextFastestItem, setNextFastestItem] = useState(
    JSON.parse(localStorage.getItem('nextFastestItem')) || { id: null, name: '-' }
  );

  // Window sizing
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const containerWidth = Math.floor(windowSize.width * 0.9);

  // Relative time helper
  const getRelativeTime = (timestamp) => {
    if (!hasData || !timestamp) return 'No data';
    const updatedDate = new Date(timestamp);
    if (isNaN(updatedDate.getTime())) return 'No data';
    const diffMs = Date.now() - updatedDate.getTime();
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);
    if (seconds < 60) return `${seconds} seconds ago`;
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24)   return `${hours} hours ago`;
    return `${days} days ago`;
  };

  // 3D button event handlers
  const handleButtonMouseEnter = (e) => { e.currentTarget.style.backgroundColor = "#7f786d"; };
  const handleButtonMouseLeave = (e) => {
    e.currentTarget.style.backgroundColor = "#6f675e";
    e.currentTarget.style.transform = "translateY(0px)";
  };
  const handleButtonMouseDown = (e) => {
    e.currentTarget.style.transform = "translateY(2px)";
    e.currentTarget.style.boxShadow = "0 2px #2a1e14";
  };
  const handleButtonMouseUp = (e) => {
    e.currentTarget.style.transform = "translateY(0px)";
    e.currentTarget.style.boxShadow = "0 4px #2a1e14";
  };

  // Panel state: "closed", "buttons", or "api"
  const [panelStage, setPanelStage] = useState('closed');
  const mainButtonLabel = panelStage === 'closed' ? 'Fetch Data via API' : 'Close Panel';
  // NEW state for info panels:
  const [selectedInfo, setSelectedInfo] = useState(null);

  // Toggle info panel function
  const toggleInfo = (panel) => {
    setSelectedInfo(selectedInfo === panel ? null : panel);
  };

  // Define info panel transition
  const infoTransition = useTransition(selectedInfo, {
    from: { opacity: 0, maxHeight: 0 },
    enter: { opacity: 1, maxHeight: 800 },
    leave: { opacity: 0, maxHeight: 0 },
    config: { duration: 300 },
    key: selectedInfo,
  });

  // Function to render info panel content
  const renderInfoContent = (panel) => {
    if (panel === 'about') {
      return (
        <div>
          <p style={{ textAlign: "center", margin: "0.5rem 0", fontSize: "1.2rem" }}>
            Welcome to <strong>OSRS Collection Log Adviser</strong> – the ultimate tool to streamline your collection log slot progress!<br/>Below are the main sections of the app:
          </p>
          <div style={{ marginBottom: "1rem", padding: "0.5rem", border: "1px solid #5c5647", borderRadius: "8px", backgroundColor: "#28251e" }}>
            <p style={{ textAlign: "left", margin: "0.5rem 0", fontSize: "1rem", color: "#fc961f" }}>
              <strong>Get Started (Upload Your Data)</strong>
            </p>
            <p style={{ textAlign: "left", margin: "0.5rem 0", fontSize: "1rem" }}>
              Start by uploading your collection log data. In this section, you'll use the TempleOSRS API to fetch your log data, ensuring your Collection Log and Fastest Log Slots sections are up to date with your in-game progress.
            </p>
          </div>
          <div style={{ marginBottom: "1rem", padding: "0.5rem", border: "1px solid #5c5647", borderRadius: "8px", backgroundColor: "#28251e" }}>
            <p style={{ textAlign: "left", margin: "0.5rem 0", fontSize: "1rem", color: "#fc961f" }}>
              <strong>Collection Log</strong>
            </p>
            <p style={{ textAlign: "left", margin: "0.5rem 0", fontSize: "1rem" }}>
              View all your collected items in one convenient location. This tab provides an at-a-glance summary of your progress, so you can quickly see which items you’ve acquired and which ones remain.
            </p>
          </div>
          <div style={{ marginBottom: "1rem", padding: "0.5rem", border: "1px solid #5c5647", borderRadius: "8px", backgroundColor: "#28251e" }}>
            <p style={{ textAlign: "left", margin: "0.5rem 0", fontSize: "1rem", color: "#fc961f" }}>
              <strong>Fastest Log Slots</strong>
            </p>
            <p style={{ textAlign: "left", margin: "0.5rem 0", fontSize: "1rem" }}>
              Discover which in-game activities grant log slots the fastest. This section enables you to filter and sort activities by the estimated time to your next log slot. It also allows you to adjust the completion rates and select between completion rates for a Main account or an Ironman.
            </p>
          </div>
        </div>
      );
    } else if (panel === 'api') {
      return (
        <div>
          <p style={{ textAlign: "left", margin: "0.5rem 0", fontSize: "1rem" }}>
            Your personalized experience begins with uploading your collection log data.
            The app leverages the TempleOSRS API to seamlessly retrieve and integrate your log details.
            Once your data is fetched, you can easily track your collection progress and determine the most efficient activities to maximize your log slots.
          </p>
          <h4 style={{ textAlign: "left", margin: "0.5rem 0", color: "#fc961f", fontSize: "1rem" }}>
            <strong>How do I syncronize my items?</strong>
          </h4>
          <ul style={{ textAlign: "left", margin: "0.5rem 0", color: "#fc961f", paddingLeft: "1.5rem", listStyleType: "disc", fontSize: "1rem" }}>
            <li>
              Open your configuration tab in RuneLite. <span style={{ color: "red" }}>(Red highlight)</span>
            </li>
            <li>
              Navigate to the plugin hub. <span style={{ color: "blue" }}>(Blue highlight)</span>
            </li>
            <li>
              Search for "templeosrs" and install the plugin. <span style={{ color: "yellow" }}>(Yellow highlight)</span>
            </li>
            <li>
              Install the TempleOSRS plugin. <span style={{ color: "pink" }}>(Pink highlight)</span>
            </li>
            <li>
              Open your collection log interface and there should be a button on the top right corner to synchronize your items with TempleOSRS server. <span style={{ color: "red" }}>(Red highlight)</span>
            </li>
          </ul>
          <img src="https://templeosrs.com/resources/collection-log/setup/plugin-hub.png" alt="Plugin Hub" style={{ maxWidth: "100%", marginBottom: "0.5rem" }} />
          <img src="https://templeosrs.com/resources/collection-log/setup/clog-sync.png" alt="Collection Log Sync" style={{ maxWidth: "100%", marginBottom: "0.5rem" }} />
          <p style={{ textAlign: "left", margin: "0.5rem 0", fontSize: "1rem" }}>
            For more information, please refer to the <a href="https://templeosrs.com/faq.php#FAQ_22" target="_blank" rel="noopener noreferrer" style={{ color: "#fc961f", textDecoration: "underline" }}>FAQ on the TempleOSRS site</a>.
          </p>
        </div>
      );
    } else if (panel === 'credits') {
      return (
        <div>
          <p style={{ fontSize: "1rem", textAlign: "left", margin: "0.5rem 0" }}>
            <strong>Log Advisor Spreadsheet:</strong><br/>
            The app utilizes the completion rates and activity index from the original Log Adviser spreadsheet by Main Mukkor. These components power our calculations, ensuring that the activity estimates are both accurate and tailored to your gameplay.
          </p>
          <p style={{ fontSize: "1rem", textAlign: "left", margin: "0.5rem 0" }}>
            <strong>Log Hunters Discord:</strong><br/>
            A special shoutout to the Log Hunters Discord community for hosting and supporting the spreadsheet. For updates, tips, and anything collection log related, be sure to check out the Discord server!
          </p>
          <p style={{ fontSize: "1rem", textAlign: "left", margin: "0.5rem 0" }}>
            <strong>OSRS Wiki:</strong><br/>
            A huge thank you to the wiki – arguably the best resource for any game. They are used in this app to provide images and item information links.
          </p>
        </div>
      );
    }
    return null;
  };

  // Toggle main button
  const handleMainButtonClick = () => {
    setPanelStage((prev) => (prev === 'api' || prev === 'buttons' ? 'closed' : 'api'));
  };

  // Toggle to API panel (for fetching new data)
  const handleFetchNewDataClick = () => {
    setPanelStage('api');
  };

  // Reset data handler
  const handleResetData = () => {
    localStorage.clear();
    setLastUpdated('');
    setUploadStatus('Local storage has been reset.');
    setNextFastestItem({ id: null, name: '-' });
    setPanelStage('closed');
  };

  // Process fetched data
  const processFetchedLogData = (data) => {
    if (data.status === 'success') {
      setUploadStatus('Log fetched successfully!');
      const logData = data.data;
      if (logData.sections?.Bosses) {
        Object.keys(logData.sections.Bosses).forEach((boss) => {
          if (!logData.sections.Bosses[boss].killCount) {
            logData.sections.Bosses[boss].killCount = { name: "Unknown", amount: 0 };
          }
        });
      }
      localStorage.setItem('collectionLogData', JSON.stringify(logData));
      const newMode = logData.accountType === "IRONMAN";
      localStorage.setItem('isIron', JSON.stringify(newMode));
      localStorage.setItem('userToggledMode', JSON.stringify(false));
      const now = new Date().toString();
      localStorage.setItem('collectionLogLastUpdated', now);
      setLastUpdated(now);
      Promise.all([
        fetch(`${BACKEND_URL}/log_importer/get-activities-data/`),
        fetch(`${BACKEND_URL}/log_importer/get-completion-rates/`)
      ])
        .then(async ([activitiesRes, ratesRes]) => {
          const activitiesJson = await activitiesRes.json();
          const ratesJson = await ratesRes.json();
          if (activitiesJson.status === 'success') {
            localStorage.setItem('activitiesData', JSON.stringify(activitiesJson.data));
          }
          if (ratesJson.status === 'success' && Array.isArray(ratesJson.data)) {
            localStorage.setItem('defaultCompletionRates', JSON.stringify(ratesJson.data));
          }
          updateNextFastestItem();
          setNextFastestItem(JSON.parse(localStorage.getItem('nextFastestItem')));
        })
        .catch((error) => console.error("Error fetching supplementary data:", error));
      setPanelStage('closed');
      onUploadComplete();
    } else {
      setUploadStatus(`Error: ${data.message}`);
    }
  };

  // .net API fetch for username-based data
  const handleFetchUserData = () => {
    if (!username.trim()) {
      setUploadStatus('Please enter a username.');
      return;
    }
    fetch(`${BACKEND_URL}/log_importer/collection-log/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    })
      .then(response => response.json())
      .then(processFetchedLogData)
      .catch(error => setUploadStatus(`Error fetching data: ${error}`));
  };

  // Single transition for panel content based on panelStage
  const panelTransition = useTransition(panelStage === 'closed' ? null : panelStage, {
    from: { opacity: 0, maxHeight: 0 },
    enter: { opacity: 1, maxHeight: 600 },
    leave: { opacity: 0, maxHeight: 0 },
    config: { duration: 300 },
    key: panelStage,
  });

  // Style objects
  const mainButtonStyle = {
    width: "90%",
    padding: "0.7rem",
    backgroundColor: panelStage !== 'closed' ? "#7f786d" : "#6f675e",
    border: "1px solid #5c5647",
    color: "#fc961f",
    cursor: "pointer",
    borderRadius: "4px",
    fontWeight: "bold",
    fontSize: "1rem",
    textAlign: "center",
    boxShadow: "0 4px #2a1e14",
    transition: "all 0.1s ease-in-out",
    marginBottom: "0.5rem",
  };

  const actionButtonStyle = {
    flex: 1,
    padding: "0.8rem",
    backgroundColor: "#6f675e",
    border: "1px solid #5c5647",
    color: "#fc961f",
    cursor: "pointer",
    borderRadius: "4px",
    fontWeight: "bold",
    fontSize: "1rem",
    boxShadow: "0 4px #2a1e14",
    transition: "all 0.1s ease-in-out",
    margin: "0.5rem",
    textAlign: "center",
  };

  const statusMessageStyle = {
    textAlign: "center",
    marginTop: "1rem",
    fontSize: "1.1rem",
    fontWeight: "bold",
    color: "#fc961f",
    backgroundColor: "#3e3529",
    padding: "0.5rem",
    border: "2px solid #fc961f",
    borderRadius: "4px",
    maxWidth: "600px",
    margin: "1rem auto 0 auto",
  };

  // Helper function to get active style for section buttons
  const getSectionButtonStyle = (section) => ({
    ...mainButtonStyle,
    ...(selectedInfo === section && { backgroundColor: "#8f877f", transform: "translateY(2px)", boxShadow: "none" })
  });

  // Render panel content based on panelStage
  const renderPanelContent = (stage) => {
    if (stage === 'buttons') {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: "1rem",
          }}
        >
          <button
            onClick={handleResetData}
            onMouseEnter={handleButtonMouseEnter}
            onMouseLeave={handleButtonMouseLeave}
            onMouseDown={handleButtonMouseDown}
            onMouseUp={handleButtonMouseUp}
            style={actionButtonStyle}
          >
            Reset Data
          </button>
          <button
            onClick={handleFetchNewDataClick}
            onMouseEnter={handleButtonMouseEnter}
            onMouseLeave={handleButtonMouseLeave}
            onMouseDown={handleButtonMouseDown}
            onMouseUp={handleButtonMouseUp}
            style={actionButtonStyle}
          >
            Fetch New Data
          </button>
        </div>
      );
    } else if (stage === 'api') {
      return (
        <div
          style={{
            backgroundColor: "#3e3529",
            border: "4px solid #5c5647",
            borderRadius: "8px",
            padding: "1rem",
            boxShadow: "0 4px 8px rgba(0,0,0,0.4)",
            marginBottom: "0.5rem",
            width: "100%",
            overflow: "hidden",
          }}
        >
          <h3 style={{ textAlign: "center", marginBottom: "0.5rem", fontWeight: "bold" }}>
            Fetch Data via TempleOSRS API
          </h3>
          <p style={{ fontSize: "0.9rem", marginBottom: "1rem", textAlign: "center" }}>
            Enter your <strong>TempleOSRS</strong> username.
          </p>

          {/* Centered container for input + buttons */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "90%",
              margin: "0 auto",
            }}
          >
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                marginBottom: "0.5rem",
                backgroundColor: "#28251e",
                border: "1px solid #5c5647",
                color: "#fc961f",
                borderRadius: "4px",
              }}
            />

            {/* Flex row for side-by-side buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
                marginTop: "0.5rem",
              }}
            >
              <button
                onClick={handleFetchUserData}
                onMouseEnter={handleButtonMouseEnter}
                onMouseLeave={handleButtonMouseLeave}
                onMouseDown={handleButtonMouseDown}
                onMouseUp={handleButtonMouseUp}
                style={{ ...actionButtonStyle, margin: 0, width: "48%" }}
              >
                Fetch User Data
              </button>

              <button
                onClick={handleResetData}
                onMouseEnter={handleButtonMouseEnter}
                onMouseLeave={handleButtonMouseLeave}
                onMouseDown={handleButtonMouseDown}
                onMouseUp={handleButtonMouseUp}
                style={{ ...actionButtonStyle, margin: 0, width: "48%" }}
              >
                Reset Data
              </button>
            </div>
          </div>

          <p style={{ fontSize: "0.8rem", textAlign: "center", marginTop: "1rem" }}>
            For instructions on how to synchronize your items, please see the{" "}
            <a
              href="https://templeosrs.com/faq.php#FAQ_22"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#fc961f", textDecoration: "underline" }}
            >
              FAQ
            </a>{" "}
            on the TempleOSRS site.
          </p>
        </div>
      );
    }
    return null;
  };

  const panelContent = panelTransition((styleProps, stage) => {
    if (!stage) return null;
    return (
      <animated.div
        style={{
          ...styleProps,
          overflow: "hidden",
          width: "90%",
          marginBottom: "0.5rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {renderPanelContent(stage)}
      </animated.div>
    );
  });

  return (
    <div
      style={{
        width: containerWidth,
        minHeight: "750px",
        height: "auto",
        margin: "1rem auto",
        backgroundColor: "#494034",
        border: "4px solid #5c5647",
        color: "#fc961f",
        padding: "1rem",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center", // added for vertical centering
      }}
    >
      {/* Getting Started Container */}
      <div style={{
        width: "100%",
        backgroundColor: "#3e3529",
        border: "6px solid #5c5647",
        borderRadius: "12px",
        padding: "1rem",
        marginBottom: "1rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        color: "#fc961f"
      }}>
        <h3 style={{ fontSize: "1.6rem", fontWeight: "bold", marginBottom: "1rem", textAlign: "center" }}>
          OSRS Collection Log Advisor
        </h3>
        {/* Buttons Row */}
        <div style={{ display: "flex", justifyContent: "space-around", width: "90%", marginBottom: "1rem" }}>
          <button
            onClick={() => toggleInfo('about')}
            onMouseEnter={handleButtonMouseEnter}
            onMouseLeave={handleButtonMouseLeave}
            onMouseDown={handleButtonMouseDown}
            onMouseUp={handleButtonMouseUp}
            style={getSectionButtonStyle('about')}
          >
            About the App
          </button>
          <button
            onClick={() => toggleInfo('api')}
            onMouseEnter={handleButtonMouseEnter}
            onMouseLeave={handleButtonMouseLeave}
            onMouseDown={handleButtonMouseDown}
            onMouseUp={handleButtonMouseUp}
            style={getSectionButtonStyle('api')}
          >
            TempleOSRS API
          </button>
          <button
            onClick={() => toggleInfo('credits')}
            onMouseEnter={handleButtonMouseEnter}
            onMouseLeave={handleButtonMouseLeave}
            onMouseDown={handleButtonMouseDown}
            onMouseUp={handleButtonMouseUp}
            style={getSectionButtonStyle('credits')}
          >
            Credits
          </button>
        </div>
        {/* Animated Info Panel */}
        {infoTransition((styleProps, item) => 
          item ? (
            <animated.div style={{
              ...styleProps,
              overflow: "hidden",
              width: "90%",
              textAlign: "left",
              padding: "0.5rem",
              backgroundColor: "#28251e",
              border: "2px solid #5c5647",
              borderRadius: "8px",
              marginBottom: "0.5rem"
            }}>
              {renderInfoContent(item)}
            </animated.div>
          ) : null
        )}
      </div>
      
      {/* Overview Container */}
      <div
        style={{
          backgroundColor: "#3e3529",
          border: "6px solid #5c5647",
          borderRadius: "12px",
          padding: "1rem",
          marginBottom: "1rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        { hasData ? (
          <>
            {/* Header */}
            <div style={{ fontSize: "1.4rem", fontWeight: "bold", marginBottom: "1rem", textAlign: "center" }}>
              {displayedUsername}'s Collection Log - {uniqueObtained}/{uniqueItems}
            </div>
            <Divider />
            {/* Next Fastest Item */}
            <div
              style={{
                backgroundColor: "#28251e",
                border: "2px solid #5c5647",
                borderRadius: "8px",
                width: "90%",
                marginBottom: "1rem",
                padding: "0.5rem",
                textAlign: "center",
              }}
            >
              {nextFastestItem.name === '-' ? (
                <div style={{ fontSize: "1rem", fontWeight: "bold", color: "#c2b59b" }}>-</div>
              ) : (
                <a
                  href={`https://oldschool.runescape.wiki/w/${encodeURIComponent(nextFastestItem.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#fc961f",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                  }}
                >
                  <ItemImage itemId={nextFastestItem.id} fallbackName={nextFastestItem.name} className="w-6 h-6" disableLink={true} />
                  <span style={{ fontSize: "1.1rem", fontWeight: "bold", marginTop: "0.2rem" }}>
                    {nextFastestItem.name}
                  </span>
                </a>
              )}
            </div>
          </>
        ) : (
          <div style={{ fontSize: "1.2rem", marginBottom: "1rem", textAlign: "center" }}>
            No data uploaded.
          </div>
        )}
        {/* Main Toggle Button and other content */}
        {/* ...existing code for main toggle button, panel content, last updated... */}
        <button
          onClick={handleMainButtonClick}
          onMouseEnter={handleButtonMouseEnter}
          onMouseLeave={handleButtonMouseLeave}
          onMouseDown={handleButtonMouseDown}
          onMouseUp={handleButtonMouseUp}
          style={mainButtonStyle}
        >
          {mainButtonLabel}
        </button>

        {/* Animated Panel Content */}
        {panelContent}

        {/* Last Updated */}
        <div
          style={{
            textAlign: "center",
            fontStyle: "italic",
            fontSize: "0.8rem",
          }}
        >
          {`Last updated: ${getRelativeTime(lastUpdated)}`}
        </div>
      </div>

      {/* Prominent Status Message */}
      {uploadStatus && (
        <div style={statusMessageStyle}>
          {uploadStatus}
        </div>
      )}
    </div>
  );
}

export default FetchCollectionLogData;
