import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
// We'll create a basic global stylesheet
import './index.css'; 

// This finds the <div id="root"> in your public/index.html
const rootElement = document.getElementById('root');

// This boots up the entire React application
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);