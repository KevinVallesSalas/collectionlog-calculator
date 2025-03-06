import React, { useState, useEffect } from 'react';
import { useTransition, animated } from 'react-spring';
import { updateNextFastestItem } from '../utils/calculations';
import ItemImage from './ItemImage';

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
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [lastUpdated, setLastUpdated] = useState(localStorage.getItem('collectionLogLastUpdated') || '');
  const [activeTab, setActiveTab] = useState('api');

  // Load collection log data from localStorage
  const savedLogData = JSON.parse(localStorage.getItem('collectionLogData'));
  const hasData = !!savedLogData;
  const displayedUsername = hasData ? (savedLogData.username || "Manual Upload") : "No Collection Log Data";
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

  // When switching to the 'upload' tab, update next fastest item.
  useEffect(() => {
    if (activeTab === 'upload') {
      updateNextFastestItem();
      const storedItem = JSON.parse(localStorage.getItem('nextFastestItem')) || { id: null, name: '-' };
      setNextFastestItem(storedItem);
    }
  }, [activeTab]);

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

  // Panel state: "closed", "buttons", or "tabs"
  const [panelStage, setPanelStage] = useState('closed');
  const mainButtonLabel = hasData ? "Manage Data" : "Upload Data";

  // Toggle main button
  const handleMainButtonClick = () => {
    if (!hasData) {
      setPanelStage((prev) => (prev === 'tabs' ? 'closed' : 'tabs'));
    } else {
      setPanelStage((prev) => (prev === 'buttons' || prev === 'tabs' ? 'closed' : 'buttons'));
    }
  };

  // Toggle between buttons and tabs
  const handleUploadNewDataClick = () => {
    setPanelStage((prev) => (prev === 'tabs' ? 'buttons' : 'tabs'));
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
        fetch('http://127.0.0.1:8000/log_importer/get-activities-data/'),
        fetch('http://127.0.0.1:8000/log_importer/get-completion-rates/')
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

  // .net API fetch
  const handleFetchUserData = () => {
    if (!username.trim()) {
      setUploadStatus('Please enter a username.');
      return;
    }
    fetch('http://127.0.0.1:8000/log_importer/collection-log/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    })
      .then(response => response.json())
      .then(processFetchedLogData)
      .catch(error => setUploadStatus(`Error fetching data: ${error}`));
  };

  // File handling
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0] || null);
  };
  const handleFileUpload = () => {
    if (!selectedFile) {
      setUploadStatus('Please select a file before uploading.');
      return;
    }
    const formData = new FormData();
    formData.append('file', selectedFile);
    fetch('http://127.0.0.1:8000/log_importer/collection-log/', {
      method: 'POST',
      body: formData,
    })
      .then(response => response.json())
      .then(processFetchedLogData)
      .catch(error => setUploadStatus(`Error uploading file: ${error}`));
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

  const tabContainerStyle = {
    display: "flex",
    borderBottom: "3px solid #5c5647",
    marginBottom: "1rem",
  };

  const tabButtonStyle = (tab) => ({
    flex: 1,
    padding: "0.8rem",
    fontSize: "0.9rem",
    fontWeight: "bold",
    textTransform: "uppercase",
    border: "none",
    backgroundColor: activeTab === tab ? "#3e3529" : "#28251e",
    color: "#fc961f",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    borderBottom: activeTab === tab ? "4px solid #fc961f" : "none",
  });

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
            onClick={handleUploadNewDataClick}
            onMouseEnter={handleButtonMouseEnter}
            onMouseLeave={handleButtonMouseLeave}
            onMouseDown={handleButtonMouseDown}
            onMouseUp={handleButtonMouseUp}
            style={actionButtonStyle}
          >
            Upload New Data
          </button>
        </div>
      );
    } else if (stage === 'tabs') {
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
          <div style={tabContainerStyle}>
            <button style={tabButtonStyle('api')} onClick={() => setActiveTab('api')}>
              API
            </button>
            <button style={tabButtonStyle('upload')} onClick={() => setActiveTab('upload')}>
              Upload
            </button>
          </div>
          {activeTab === 'api' && (
            <div style={{ maxWidth: "500px", margin: "0 auto" }}>
              <h3 style={{ textAlign: "center", marginBottom: "0.5rem", fontWeight: "bold" }}>
                Fetch Data via collectionlog.net
              </h3>
              <p style={{ fontSize: "0.9rem", marginBottom: "1rem", textAlign: "center" }}>
                Enter your <strong>collectionlog.net</strong> username.
              </p>
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "0.5rem",
                  marginBottom: "0.5rem",
                  backgroundColor: "#28251e",
                  border: "1px solid #5c5647",
                  color: "#fc961f",
                  borderRadius: "4px",
                }}
              />
              <div style={{ textAlign: "center" }}>
                <button
                  onClick={handleFetchUserData}
                  onMouseEnter={handleButtonMouseEnter}
                  onMouseLeave={handleButtonMouseLeave}
                  onMouseDown={handleButtonMouseDown}
                  onMouseUp={handleButtonMouseUp}
                  style={{
                    width: "90%",
                    padding: "0.7rem",
                    backgroundColor: "#6f675e",
                    border: "1px solid #5c5647",
                    color: "#fc961f",
                    cursor: "pointer",
                    borderRadius: "4px",
                    fontWeight: "bold",
                    fontSize: "1rem",
                    boxShadow: "0 4px #2a1e14",
                    transition: "all 0.1s ease-in-out",
                    margin: "0 auto",
                  }}
                >
                  Fetch User Data
                </button>
              </div>
            </div>
          )}
          {activeTab === 'upload' && (
            <div style={{ maxWidth: "500px", margin: "0 auto" }}>
              <h3 style={{ textAlign: "center", marginBottom: "0.5rem", fontWeight: "bold" }}>
                Manually Upload a JSON File
              </h3>
              <p style={{ fontSize: "0.9rem", marginBottom: "1rem", textAlign: "center" }}>
                Follow these steps:
              </p>
              <ol style={{ textAlign: "left", margin: "0 auto", maxWidth: "500px", fontSize: "0.9rem" }}>
                <li>Install the collectionlog plugin from the plugin hub on Runelite.</li>
                <li>Click through all Collection Log pages.</li>
                <li>Go to the Character Summary tab.</li>
                <li>Right-click the Collection Log section and hit "Export Collection Log".</li>
                <li>The file will be stored in the Runelite directory under <code>.runelite\collectionlog\exports</code>.</li>
                <li>Select that file and upload it below.</li>
              </ol>
              {/* "Choose File" & "Upload File" side by side */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
                <label
                  style={{
                    ...actionButtonStyle,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0.5rem",
                    cursor: "pointer",
                  }}
                  onMouseEnter={handleButtonMouseEnter}
                  onMouseLeave={handleButtonMouseLeave}
                  onMouseDown={handleButtonMouseDown}
                  onMouseUp={handleButtonMouseUp}
                >
                  Choose File
                  <input
                    type="file"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                </label>
                <button
                  onClick={handleFileUpload}
                  onMouseEnter={handleButtonMouseEnter}
                  onMouseLeave={handleButtonMouseLeave}
                  onMouseDown={handleButtonMouseDown}
                  onMouseUp={handleButtonMouseUp}
                  style={actionButtonStyle}
                >
                  Upload File
                </button>
              </div>
              {selectedFile && (
                <p style={{ textAlign: "center", marginTop: "0.5rem" }}>
                  Selected: <strong>{selectedFile.name}</strong>
                </p>
              )}
            </div>
          )}
          {hasData && (
            <div style={{ textAlign: "center" }}>
              <button
                onClick={handleUploadNewDataClick}
                style={{
                  ...actionButtonStyle,
                  backgroundColor: "#28251e",
                  border: "1px solid #5c5647",
                  margin: 0,
                }}
                onMouseEnter={handleButtonMouseEnter}
                onMouseLeave={handleButtonMouseLeave}
                onMouseDown={handleButtonMouseDown}
                onMouseUp={handleButtonMouseUp}
              >
                Back
              </button>
            </div>
          )}
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
      }}
    >
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
        {/* Header */}
        <div style={{ fontSize: "1.4rem", fontWeight: "bold", marginBottom: "1rem", textAlign: "center" }}>
          {displayedUsername} - {uniqueObtained}/{uniqueItems}
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
          <div style={{ fontSize: "1.2rem", color: "#fc961f", marginBottom: "0.3rem" }}>
            Next Fastest Item
          </div>
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

        {/* Main Toggle Button */}
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
