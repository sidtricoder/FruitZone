import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../App'; // Corrected path
import './index.css'; // Assuming index.css is in the same src directory or handled by build
import { AuthProvider } from '../contexts/AuthContext'; // Corrected path
import { CartProvider } from '../contexts/CartContext'; // Corrected path
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
