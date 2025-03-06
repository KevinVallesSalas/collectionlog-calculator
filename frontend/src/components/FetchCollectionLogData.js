import React, { useState, useEffect } from 'react';
import { updateNextFastestItem } from '../utils/calculations';
import ItemImage from './ItemImage';

// Divider component: spans full width of the overview container
const Divider = () => (
  <div
    style={{
      width: "calc(100% + 2rem)",
      marginLeft: "-1rem",
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
  const [lastUpdated, setLastUpdated] = useState(localStorage.getItem('collectionLogLastUpdated'));
  const [activeTab, setActiveTab] = useState('api');
  
  // Get the saved log data
  const savedLogData = JSON.parse(localStorage.getItem('collectionLogData'));
  const displayedUsername = savedLogData?.username || "No Collection Log Data";
  // Use the totals directly from the file.
  const uniqueObtained = savedLogData?.uniqueObtained ?? 0;
  const uniqueItems = savedLogData?.uniqueItems ?? 0;

  // Next fastest item from localStorage
  const [nextFastestItem, setNextFastestItem] = useState(
    JSON.parse(localStorage.getItem('nextFastestItem')) || { id: null, name: '-' }
  );

  // Window size state for scaling
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
  
  // Define container dimensions based on the window size.
  const containerWidth = Math.floor(windowSize.width * 0.9);
  const containerHeight = Math.floor(windowSize.height * 0.8);

  // Recalculate next fastest item when active tab changes to 'upload'
  useEffect(() => {
    if (activeTab === 'upload') {
      updateNextFastestItem();
      const storedItem = JSON.parse(localStorage.getItem('nextFastestItem')) || { id: null, name: '-' };
      setNextFastestItem(storedItem);
    }
  }, [activeTab]);

  // Relative time helper
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

  // 3D button handlers
  const handleButtonMouseEnter = (e) => {
    e.currentTarget.style.backgroundColor = "#7f786d";
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

  // Reset data handler
  const handleResetData = () => {
    localStorage.clear();
    setLastUpdated("Data has been reset");
    setUploadStatus('Local storage has been reset.');
    setNextFastestItem({ id: null, name: '-' });
  };

  // Process fetched data (API & file upload)
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
      
      // We now rely on the file's provided totals.
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
      {/* 1) Collection Log Overview */}
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
        {/* Top summary using overall totals from the file */}
        <div style={{ fontSize: "1.4rem", fontWeight: "bold", marginBottom: "1rem", textAlign: "center" }}>
          {displayedUsername}'s Collection Log - {uniqueObtained}/{uniqueItems}
        </div>
        {/* Divider */}
        <Divider />

        {/* Note: Per-category blocks have been removed */}

        {/* Next Fastest Item container */}
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
              className="transition-transform duration-200 hover:scale-105 hover:underline"
              style={{
                color: "#fc961f",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ItemImage itemId={nextFastestItem.id} fallbackName={nextFastestItem.name} className="w-6 h-6" disableLink={true} />
              <span style={{ fontSize: "1.1rem", fontWeight: "bold", marginTop: "0.2rem" }}>
                {nextFastestItem.name}
              </span>
            </a>
          )}
        </div>

        {/* Reset button */}
        <button
          onClick={handleResetData}
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
            textAlign: "center",
            boxShadow: "0 4px #2a1e14",
            transition: "all 0.1s ease-in-out",
            marginBottom: "0.5rem",
          }}
        >
          Reset App Data
        </button>
        <div
          style={{
            textAlign: "center",
            fontStyle: "italic",
            fontSize: "0.8rem",
          }}
        >
          {lastUpdated ? `Last updated: ${getRelativeTime(lastUpdated)}` : ''}
        </div>
      </div>

      {/* 2) Instructions below the overview */}
      <div
        style={{
          marginBottom: "1rem",
          textAlign: "center",
          maxWidth: "600px",
          margin: "0 auto 1rem",
        }}
      >
        <h2 style={{ marginBottom: "0.5rem" }}>How To Use The App</h2>
        <p>
          Import and view your OSRS Collection Log data either by fetching it via the 
          <strong> collectionlog.net</strong> API or by manually uploading a <em>.json</em> file.
        </p>
      </div>

      {/* 3) Upload sections (tabs) at the bottom */}
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
