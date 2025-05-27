import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Correct: App.tsx is at the root
import './index.css';
import { ThemeProvider } from './components/ThemeProvider'; // Correct: ThemeProvider is in ./components/
import { CartProvider } from './contexts/CartContext'; // Added: CartProvider from ./contexts/
import { BrowserRouter as Router } from 'react-router-dom'; // Added: Router for context providers that use routing hooks

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router> { /* Router needs to wrap providers that might use navigate() or other router hooks */}
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <CartProvider>
          <App />
        </CartProvider>
      </ThemeProvider>
    </Router>
  </React.StrictMode>
);
