import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Monaco's automaticLayout can trigger this benign browser notice when panels resize.
// It is not a real error, but the development overlay would otherwise cover the page.
window.addEventListener('error', (event) => {
  if (event.message?.startsWith('ResizeObserver loop')) event.stopImmediatePropagation();
}, true);

const root =ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
