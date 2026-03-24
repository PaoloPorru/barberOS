import React from 'react';
import ReactDOM from 'react-dom/client';

if (import.meta.env.PROD && !import.meta.env.VITE_API_BASE_URL?.trim()) {
  console.warn(
    '[BarberOS] Su Vercel imposta VITE_API_BASE_URL=https://…onrender.com/api (Environment Variables, tutti gli ambienti di build). Senza, il proxy /api va spesso in 504 con Render free.'
  );
}
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
