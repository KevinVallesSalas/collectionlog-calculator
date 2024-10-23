import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:8000/')
      .then(response => setData(response.data))
      .catch(error => console.error(error));
  }, []);

  return (
    <div className="App">
      <h1>Collection Log</h1>
      {data ? <p>{data.Hello}</p> : <p>Loading...</p>}
    </div>
  );
}

export default App;
