import React from 'react';
import { renderToString } from 'react-dom/server';
import { BrowserRouter } from 'react-router-dom';
import App from './src/App.jsx';

try {
  console.log("Starting render test...");
  // Attempting a simple import of the Dashboard to see if there are undefined variables at the top level
  import('./src/pages/Dashboard.jsx').then(() => console.log("Dashboard imported successfully")).catch(err => console.error("Import error:", err));
} catch (error) {
  console.error("Render Error:", error);
}
