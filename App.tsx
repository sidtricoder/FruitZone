import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { Toaster } from './components/ui/toaster';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartModal from './components/CartModal'; // Import CartModal
import ImageDebug from './components/ImageDebug'; // Import ImageDebug component

const ShopPage = lazy(() => import("./pages/ShopPage"));
const B2BPage = lazy(() => import("./pages/B2BPage")); // Import B2BPage
const CheckoutPage = lazy(() => import("./pages/CheckoutPage")); // Import CheckoutPage
const UserProfilePage = lazy(() => import("./pages/UserProfilePage")); // Import UserProfilePage
const AdminPage = lazy(() => import("./pages/AdminPage")); // Import AdminPage
const ProductPage = lazy(() => import("./pages/ProductPage")); // Import ProductPage
const AboutUsPage = lazy(() => import("./pages/AboutUsPage")); // Import AboutUsPage

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }

  return <>{children}</>;
}

function AppContent() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-green-500"></div></div>}>          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />            <Route 
              path="/shop" 
              element={
                <ProtectedRoute>
                  <ShopPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/products/:productId" 
              element={
                <ProtectedRoute>
                  <ProductPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/b2b" 
              element={
                <ProtectedRoute>
                  <B2BPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/checkout" 
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <UserProfilePage />
                </ProtectedRoute>
              } 
            />            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/about-us" 
              element={<AboutUsPage />} 
            />
            {/* Debug route */}
            <Route 
              path="/debug" 
              element={<ImageDebug />} 
            />
          </Routes>
        </Suspense>
      </main>
      <CartModal /> {/* Add CartModal here */}
      <Footer />
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
