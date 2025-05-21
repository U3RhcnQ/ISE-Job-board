import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    // When served by Nginx in production, this will be a relative path
    // Nginx will proxy requests starting with /api/ to the backend
    fetch('/api/v1/greeting')
      .then(response => response.json())
      .then(data => setMessage(data.message))
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <p>Frontend says: {message}</p>
      </header>
    </div>
  );
}

export default App;
//test
