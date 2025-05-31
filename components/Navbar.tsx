import React, { useRef, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/contexts/CartContext'; // Import useCart
import { Button } from '@/components/ui/button';
import { UserCircle, Moon, Sun, Menu, X as CloseIcon, ShoppingCart, LogOut, User as UserIcon, Settings } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { supabase } from '@/lib/supabaseClient';

const Navbar: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { totalItems, toggleCart } = useCart(); // Get cart data from context
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);  const navRef = useRef<HTMLElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (navRef.current) {
      gsap.fromTo(navRef.current, 
        { y: -80, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.2 }
      );
    }
  }, []);
    // Check if user is admin using admin_or_not column  // Move useAuth hook to component level
  const auth = useAuth();
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      // First check: If not authenticated or no user ID, we're definitely not an admin
      if (!isAuthenticated || !auth.user?.id) {
        setIsAdmin(false);
        return;
      }
      
      // Second check: Use the admin_or_not from the user object directly if it exists
      if (auth.user.admin_or_not === true) {
        setIsAdmin(true);
        return;
      }

      // Third check: Set a timeout to avoid getting stuck
      const adminCheckTimeout = setTimeout(() => {
        console.log("Admin status check timed out");
        setIsAdmin(false); // Default to non-admin if check times out
      }, 3000); // 3 second timeout

      try {
        // Final check: Query the database
        const { data, error } = await supabase
          .from('users')
          .select('admin_or_not')
          .eq('id', auth.user.id)
          .single();
          
        clearTimeout(adminCheckTimeout);
        
        // Only set as admin if data exists, admin_or_not is true, and no error occurred
        const isAdminUser = !!data && data.admin_or_not === true && !error;
        setIsAdmin(isAdminUser);
        
        // If there's a mismatch between context and DB, update the user in context
        if (isAdminUser !== !!auth.user.admin_or_not) {
          console.log("Updating admin status in context", isAdminUser);
          auth.setUser({
            ...auth.user,
            admin_or_not: isAdminUser
          });
        }
      } catch (error) {
        clearTimeout(adminCheckTimeout);
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      }
    };
    
    checkAdminStatus();
  }, [isAuthenticated, auth.user?.id]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileDropdownRef]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (isProfileDropdownOpen) setIsProfileDropdownOpen(false);
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };
  
  const handleLogout = async () => {
    await logout();
    setIsProfileDropdownOpen(false);
    setIsMobileMenuOpen(false);
    navigate('/auth');
  };

  const handleMobileLinkClick = () => {
    setIsMobileMenuOpen(false);
  };
  
  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/shop", label: "Our Products" },
    { to: "/b2b", label: "B2B" }, // Assuming /b2b is a valid route
    { to: "/whats-daddy-for", label: "What’s Daddy for" }, // Assuming /whats-daddy-for is a valid route
    { to: "/about-us", label: "DryDaddy who?" }, // Changed from /drydaddy-who to /about-us
  ];

  return (
    <nav ref={navRef} className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/20 dark:border-gray-700/30 shadow-lg fixed w-full top-0 z-50 opacity-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          
          {/* Desktop Navigation Links - Left */}
          <div className="hidden lg:flex items-center space-x-1 flex-1">
            {navLinks.map((link) => (
              <Link key={link.label} to={link.to} className="group relative">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200"
                >
                  {link.label}
                </motion.div>
                <motion.div
                  className="absolute bottom-0 left-1/2 h-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                  initial={{ width: 0, x: "-50%" }}
                  whileHover={{ width: "80%" }}
                  transition={{ duration: 0.2 }}
                />
              </Link>
            ))}
          </div>

          {/* Desktop Logo - Center */}
          <div className="hidden lg:flex items-center justify-center flex-1">
            <Link 
              to="/" 
              className="flex items-center group" 
              onClick={() => { setIsMobileMenuOpen(false); setIsProfileDropdownOpen(false); }}
            >
              <motion.img 
                src="/static/images/Dry_Daddy.png" 
                alt="DryDaddy Logo" 
                className="h-72 xl:h-80 w-auto transition-transform duration-200 group-hover:scale-105"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              />
            </Link>
          </div>

          {/* Desktop Action Icons - Right */}
          <div className="hidden lg:flex items-center justify-end space-x-2 flex-1">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle theme"
                className="w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-600" />
                )}
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleCart}
                aria-label="My Cart" 
                className="relative w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
              >
                <ShoppingCart className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                {totalItems > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </Button>
            </motion.div>
            
            {isAuthenticated ? (
              <div className="relative" ref={profileDropdownRef}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleProfileDropdown} 
                    aria-label="User Profile"
                    className="w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                  >
                    <UserCircle className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                  </Button>
                </motion.div>
                <AnimatePresence>
                  {isProfileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-3 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl py-2 z-50 backdrop-blur-xl"
                    >
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <UserIcon size={18} className="mr-3 text-gray-500" /> 
                        <span className="font-medium">My Profile</span>
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <Settings size={18} className="mr-3 text-gray-500" /> 
                          <span className="font-medium">Admin Dashboard</span>
                        </Link>
                      )}
                      <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150"
                      >
                        <LogOut size={18} className="mr-3" /> 
                        <span className="font-medium">Log Out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link to="/auth">
                  <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium px-6 py-2 rounded-xl shadow-lg transition-all duration-200">
                    Login
                  </Button>
                </Link>
              </motion.div>
            )}
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden flex items-center justify-between w-full">
            {/* Mobile Logo */}
            <Link 
              to="/" 
              className="flex items-center" 
              onClick={() => { setIsMobileMenuOpen(false); setIsProfileDropdownOpen(false); }}
            >
              <motion.img 
                src="/static/images/Dry_Daddy.png" 
                alt="DryDaddy Logo" 
                className="h-72 w-auto"
                whileTap={{ scale: 0.95 }}
              />
            </Link>

            {/* Mobile Action Icons */}
            <div className="flex items-center space-x-1">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  aria-label="Toggle theme"
                  className="w-9 h-9 rounded-xl"
                >
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <Moon className="h-4 w-4 text-gray-600" />
                  )}
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => { toggleCart(); handleMobileLinkClick(); }}
                  aria-label="My Cart"
                  className="relative w-9 h-9 rounded-xl"
                >
                  <ShoppingCart className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  {totalItems > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center"
                    >
                      {totalItems}
                    </motion.span>
                  )}
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleMobileMenu}
                  aria-label="Toggle menu"
                  className="w-9 h-9 rounded-xl"
                >
                  <motion.div
                    animate={{ rotate: isMobileMenuOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isMobileMenuOpen ? (
                      <CloseIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    ) : (
                      <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    )}
                  </motion.div>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            ref={mobileMenuRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="lg:hidden bg-gray-900/95 dark:bg-gray-950/95 backdrop-blur-xl shadow-2xl absolute w-full top-16 left-0 z-40 overflow-hidden border-b border-gray-700/50 dark:border-gray-600/50"
          >
            <div className="px-4 pt-4 pb-6 space-y-3">
              {/* Navigation Links */}
              <div className="space-y-2">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={link.to}
                      onClick={handleMobileLinkClick}
                      className="group flex items-center px-4 py-4 rounded-xl text-lg font-semibold text-white dark:text-gray-100 hover:text-green-400 dark:hover:text-green-400 hover:bg-green-600/20 dark:hover:bg-green-900/30 transition-all duration-200 border border-gray-600/50 dark:border-gray-600/50 bg-gray-800/80 dark:bg-gray-800/60"
                    >
                      <motion.div
                        className="w-1.5 h-8 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full mr-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      />
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </div>
              
              {/* Divider */}
              <div className="border-t border-gray-600/50 dark:border-gray-600/50 my-4"></div>
              
              {/* User Actions */}
              <div className="space-y-2">
                {isAuthenticated ? (
                  <>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <Link
                        to="/profile"
                        onClick={handleMobileLinkClick}
                        className="flex items-center px-4 py-4 rounded-xl text-lg font-semibold text-white dark:text-gray-100 hover:bg-gray-700/60 dark:hover:bg-gray-700/60 transition-all duration-200 border border-gray-600/50 dark:border-gray-600/50 bg-gray-800/80 dark:bg-gray-800/60"
                      >
                        <UserIcon size={24} className="mr-4 text-gray-300 dark:text-gray-400" />
                        My Profile
                      </Link>
                    </motion.div>
                    {isAdmin && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 }}
                      >
                        <Link
                          to="/admin"
                          onClick={handleMobileLinkClick}
                          className="flex items-center px-4 py-4 rounded-xl text-lg font-semibold text-white dark:text-gray-100 hover:bg-gray-700/60 dark:hover:bg-gray-700/60 transition-all duration-200 border border-gray-600/50 dark:border-gray-600/50 bg-gray-800/80 dark:bg-gray-800/60"
                        >
                          <Settings size={24} className="mr-4 text-gray-300 dark:text-gray-400" />
                          Admin Dashboard
                        </Link>
                      </motion.div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 }}
                    >
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-4 rounded-xl text-lg font-semibold text-red-300 dark:text-red-400 hover:bg-red-800/40 dark:hover:bg-red-900/40 transition-all duration-200 border border-red-600/50 dark:border-red-700/50 bg-red-900/30 dark:bg-red-900/20"
                      >
                        <LogOut size={24} className="mr-4 text-red-300" />
                        Log Out
                      </button>
                    </motion.div>
                  </>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Link
                      to="/auth"
                      onClick={handleMobileLinkClick}
                      className="flex items-center justify-center w-full px-6 py-4 rounded-xl text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-green-400"
                    >
                      Login
                    </Link>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
