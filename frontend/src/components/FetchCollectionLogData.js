import React, { useState, useEffect } from 'react';
import { updateNextFastestItem } from '../utils/calculations';
import ItemImage from './ItemImage';

function FetchCollectionLogData({ onUploadComplete }) {
  const [username, setUsername] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [lastUpdated, setLastUpdated] = useState(localStorage.getItem('collectionLogLastUpdated'));
  const [activeTab, setActiveTab] = useState('api');

  // Window size for scaling
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  useEffect(() => {
    const handleResize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const containerWidth = Math.floor(windowSize.width * 0.9);
  const containerHeight = Math.floor(windowSize.height * 0.8);

  // Retrieve saved log data
  const savedLogData = JSON.parse(localStorage.getItem('collectionLogData'));
  const displayedUsername = savedLogData?.username || "No Collection Log Data";
  const uniqueObtained = savedLogData?.uniqueObtained ?? 0;
  const uniqueItems = savedLogData?.uniqueItems ?? 0;

  // Track next fastest item from localStorage (as an object)
  const [nextFastestItem, setNextFastestItem] = useState(
    JSON.parse(localStorage.getItem('nextFastestItem')) || { id: null, name: '-' }
  );

  // When active tab becomes 'upload', recalc next fastest item
  useEffect(() => {
    if (activeTab === 'upload') {
      updateNextFastestItem();
      const storedItem = JSON.parse(localStorage.getItem('nextFastestItem')) || { id: null, name: '-' };
      setNextFastestItem(storedItem);
    }
  }, [activeTab]);

  // Helper: relative time
  const getRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    const updatedDate = new Date(timestamp);
    const diffMs = Date.now() - updatedDate.getTime();
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (seconds < 60) return `${seconds} seconds ago`;
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24)   return `${hours} hours ago`;
    return `${days} days ago`;
  };

  // Button hover/press handlers for a 3D effect
  const handleButtonMouseEnter = (e) => {
    e.currentTarget.style.backgroundColor = "#7f786d"; // slightly lighter
  };
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

  // Reset data: instead of clearing the last updated value, we display a message.
  const handleResetData = () => {
    localStorage.clear();
    setLastUpdated("Data has been reset");
    setUploadStatus('Local storage has been reset.');
    setNextFastestItem({ id: null, name: '-' });
  };

  // Process fetched data (both API & file upload)
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

      // Supplementary requests for activities & rates
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
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
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

  return (
    <div
      style={{
        width: containerWidth,
        minHeight: containerHeight,
        backgroundColor: "#494034",
        border: "4px solid #5c5647",
        color: "#fc961f",
        padding: "1rem",
        margin: "1rem auto",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* TOP SECTION */}
      <div
        style={{
          flex: 1,
          marginBottom: "1rem",
          borderBottom: "2px solid #5c5647",
          paddingBottom: "1rem",
          display: "flex",
          flexDirection: "row",
          gap: "1rem",
        }}
      >
        {/* LEFT: Instructions */}
        <div style={{ flex: 1 }}>
          <h2 style={{ textAlign: "center", marginBottom: "0.5rem" }}>
            How To Use The App
          </h2>
          <p style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
            Import and view your OSRS Collection Log data either by fetching it via the 
            <strong> collectionlog.net</strong> API or by manually uploading a <em>.json</em> file.
            Use the tabs below to choose your method.
          </p>
        </div>

        {/* RIGHT COLUMN */}
        <div
          style={{
            width: "35%",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {/* Title above the container */}
          <div style={{ textAlign: "center", fontSize: "1.3rem", fontWeight: "bold" }}>
            Current Collection Log Data
          </div>

          {/* Main container with border, username, squares, reset button, and last updated */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#3e3529",
              border: "6px solid #5c5647",
              borderRadius: "12px",
              padding: "1rem",
            }}
          >
            {/* Username */}
            <div style={{ textAlign: "center", marginBottom: "1rem", fontSize: "3.8rem", fontWeight: "bold" }}>
              {displayedUsername}
            </div>

            {/* Expandable space for the squares */}
            <div
              style={{
                flex: 1,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                alignItems: "stretch",
                justifyItems: "center",
                marginBottom: "1rem",
              }}
            >
              {/* Collections Logged */}
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  backgroundColor: "#28251e",
                  border: "2px solid #5c5647",
                  borderRadius: "8px",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div style={{ fontSize: "2.4rem", color: "#fc961f", marginBottom: "0.3rem", marginTop: "0.3rem" }}>
                  Collections Logged:
                </div>
                <ItemImage itemId={0} fallbackName="Collection Log" className="w-8 h-8" disableLink={true} />
                <div style={{ fontSize: "1.3rem", fontWeight: "bold", marginTop: "0.2rem", color: "#00ff00" }}>
                  {uniqueObtained}/{uniqueItems}
                </div>
              </div>

              {/* Next Fastest Item */}
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  backgroundColor: "#28251e",
                  border: "2px solid #5c5647",
                  borderRadius: "8px",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div style={{ fontSize: "2.4rem", color: "#fc961f", marginBottom: "0.3rem", marginTop: "0.3rem" }}>
                  Next Fastest Item:
                </div>
                {nextFastestItem.name === '-' ? (
                  <div style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#c2b59b" }}>-</div>
                ) : (
                  <a
                    href={`https://oldschool.runescape.wiki/w/${encodeURIComponent(nextFastestItem.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-transform duration-200 hover:scale-105 hover:underline"
                    style={{ color: "#fc961f", display: "flex", flexDirection: "column", alignItems: "center" }}
                  >
                    <ItemImage itemId={nextFastestItem.id} fallbackName={nextFastestItem.name} className="w-8 h-8" disableLink={true} />
                    <span style={{ fontSize: "1.6rem", fontWeight: "bold", marginTop: "0.2rem" }}>
                      {nextFastestItem.name}
                    </span>
                  </a>
                )}
              </div>
            </div>

            {/* Reset button - bigger & 3D */}
            <button
              onClick={handleResetData}
              onMouseEnter={handleButtonMouseEnter}
              onMouseLeave={handleButtonMouseLeave}
              onMouseDown={handleButtonMouseDown}
              onMouseUp={handleButtonMouseUp}
              style={{
                width: "90%",
                padding: "0.7rem",
                margin: "0 auto",
                backgroundColor: "#6f675e",
                border: "1px solid #5c5647",
                color: "#fc961f",
                cursor: "pointer",
                borderRadius: "4px",
                fontWeight: "bold",
                fontSize: "1rem",
                textAlign: "center",
                boxShadow: "0 4px #2a1e14",
                transition: "all 0.1s ease-in-out",
              }}
            >
              Reset App Data
            </button>

            {/* Last updated time below the reset button */}
            <div
              style={{
                textAlign: "center",
                fontStyle: "italic",
                fontSize: "0.8rem",
                marginTop: "0.5rem",
              }}
            >
              {lastUpdated ? `Last updated: ${getRelativeTime(lastUpdated)}` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM TABS */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div className="flex" style={{ borderBottom: "4px solid #5c5647" }}>
          <button
            onClick={() => setActiveTab('api')}
            className={`
              flex-1 px-3 py-2 text-sm uppercase font-bold
              border border-[#5c5647] border-b-0 rounded-t-xl
              ${activeTab === 'api' ? "bg-[#3e3529]" : "bg-[#28251e]"}
            `}
            style={{ color: "#fc961f" }}
          >
            Use CollectionLog.net API
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`
              flex-1 px-3 py-2 text-sm uppercase font-bold
              border border-[#5c5647] border-b-0 rounded-t-xl
              ${activeTab === 'upload' ? "bg-[#3e3529]" : "bg-[#28251e]"}
            `}
            style={{ color: "#fc961f" }}
          >
            Manually Upload .json
          </button>
        </div>
        <div
          style={{
            border: "1px solid #5c5647",
            borderTop: "0px",
            backgroundColor: "#3e3529",
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "1rem",
            borderRadius: "0 0 8px 8px",
          }}
        >
          {activeTab === 'api' && (
            <div style={{ maxWidth: "500px", width: "100%" }}>
              <h3 style={{ textAlign: "center", marginBottom: "0.5rem" }}>
                Fetch Data via collectionlog.net
              </h3>
              <p style={{ fontSize: "0.9rem", marginBottom: "1rem" }}>
                Enter your <strong>collectionlog.net</strong> username below. 
                The app will contact the API and import your collection log data.
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
                    margin: "0 auto",
                    backgroundColor: "#6f675e",
                    border: "1px solid #5c5647",
                    color: "#fc961f",
                    cursor: "pointer",
                    borderRadius: "4px",
                    fontWeight: "bold",
                    fontSize: "1rem",
                    textAlign: "center",
                    boxShadow: "0 4px #2a1e14",
                    transition: "all 0.1s ease-in-out",
                  }}
                >
                  Fetch User Data
                </button>
              </div>
            </div>
          )}
          {activeTab === 'upload' && (
            <div style={{ maxWidth: "500px", width: "100%" }}>
              <h3 style={{ textAlign: "center", marginBottom: "0.5rem" }}>
                Manually Upload a JSON File
              </h3>
              <p style={{ fontSize: "0.9rem", marginBottom: "1rem" }}>
                Select a <em>.json</em> file containing your collection log data 
                and click “Upload File” to import it.
              </p>
              <input
                type="file"
                onChange={handleFileChange}
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  color: "#fc961f",
                }}
              />
              <div style={{ textAlign: "center" }}>
                <button
                  onClick={handleFileUpload}
                  onMouseEnter={handleButtonMouseEnter}
                  onMouseLeave={handleButtonMouseLeave}
                  onMouseDown={handleButtonMouseDown}
                  onMouseUp={handleButtonMouseUp}
                  style={{
                    width: "90%",
                    padding: "0.7rem",
                    margin: "0 auto",
                    backgroundColor: "#6f675e",
                    border: "1px solid #5c5647",
                    color: "#fc961f",
                    cursor: "pointer",
                    borderRadius: "4px",
                    fontWeight: "bold",
                    fontSize: "1rem",
                    textAlign: "center",
                    boxShadow: "0 4px #2a1e14",
                    transition: "all 0.1s ease-in-out",
                  }}
                >
                  Upload File
                </button>
              </div>
            </div>
          )}
        </div>
        {uploadStatus && (
          <p style={{ textAlign: "center", marginTop: "1rem" }}>
            {uploadStatus}
          </p>
        )}
      </div>
    </div>
  );
}

export default FetchCollectionLogData;
