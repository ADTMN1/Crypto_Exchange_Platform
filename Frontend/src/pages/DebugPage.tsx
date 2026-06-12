import React from 'react';

export default function DebugPage() {
  console.log('DebugPage component rendering...');
  
  return (
    <div style={{
      padding: '2rem',
      backgroundColor: '#0f172a',
      color: '#e2e8f0',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1>Debug Page</h1>
      <p>If you can see this page without errors, the basic React setup is working.</p>
      <p>Current time: {new Date().toISOString()}</p>
      
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#1e293b', borderRadius: '8px' }}>
        <h2>Debug Info:</h2>
        <ul>
          <li>React Version: {React.version}</li>
          <li>User Agent: {navigator.userAgent}</li>
          <li>Location: {window.location.href}</li>
        </ul>
      </div>
    </div>
  );
}