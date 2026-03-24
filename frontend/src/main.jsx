import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#181818', color: '#f5f0e8', border: '1px solid #2a2a2a', fontFamily: '"DM Sans"' },
          success: { iconTheme: { primary: '#c9a84c', secondary: '#0a0a0a' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
