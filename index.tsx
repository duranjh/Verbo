import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Apply theme before React mounts so the first paint isn't wrong.
// Manual override (localStorage.theme) wins over the OS preference.
const stored = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const useDark = stored ? stored === 'dark' : prefersDark;
document.documentElement.classList.toggle('theme-dark', useDark);

if (!stored) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem('theme')) {
      document.documentElement.classList.toggle('theme-dark', e.matches);
    }
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
