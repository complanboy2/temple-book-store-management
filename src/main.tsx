
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import './i18n';  // Import i18n initialization
import { AuthProvider } from './contexts/AuthContext';
import { StallProvider } from './contexts/StallContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <StallProvider>
          <App />
        </StallProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
