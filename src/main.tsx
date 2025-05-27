import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext'; // Import CartProvider
import { BrowserRouter as Router } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <CartProvider> {/* Wrap App with CartProvider */}
          <App />
        </CartProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>
);
