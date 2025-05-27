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
      if (!isAuthenticated || !auth.user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('admin_or_not')
          .eq('id', auth.user.id)
          .single();
          
        setIsAdmin(!!data && data.admin_or_not && !error);
      } catch (error) {
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
    { to: "/drydaddy-who", label: "DryDaddy who?" }, // Assuming /drydaddy-who is a valid route
  ];

  return (
    <nav ref={navRef} className="bg-background/80 backdrop-blur-md shadow-sm fixed w-full top-0 z-50 dark:bg-background/80 opacity-0">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center" onClick={() => { setIsMobileMenuOpen(false); setIsProfileDropdownOpen(false);}}>
              <img src="/static/images/Dry_Daddy.png" alt="DryDaddy Logo" className="h-20 w-auto" />
            </Link>
          </div>

          {/* Desktop Menu */} 
          <div className="hidden md:flex items-center space-x-1 sm:space-x-2">
            {navLinks.map(link => (
              <Link key={link.label} to={link.to}>
                <Button variant="ghost" size="sm">{link.label}</Button>
              </Link>
            ))}
          </div>

          {/* Right side icons - Desktop */}
          <div className="hidden md:flex items-center space-x-2">
            <Button 
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
              className="w-8 h-8 sm:w-auto sm:h-auto"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </Button>

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleCart} // Use toggleCart from context
              aria-label="My Cart" 
              className="relative"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Button>
            
            {isAuthenticated ? (
              <div className="relative" ref={profileDropdownRef}>
                <Button variant="ghost" size="icon" onClick={toggleProfileDropdown} aria-label="User Profile">
                  <UserCircle className="h-6 w-6 sm:h-7 sm:w-7 text-gray-700 dark:text-gray-300" />
                </Button>
                <AnimatePresence>
                  {isProfileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-md shadow-lg py-1 z-50"
                    >                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted w-full text-left"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <UserIcon size={16} className="mr-2" /> My Profile
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted w-full text-left"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <Settings size={16} className="mr-2" /> Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted w-full text-left"
                      >
                        <LogOut size={16} className="mr-2" /> Log Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/auth">
                <Button size="sm">Login</Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button & Icons */} 
          <div className="md:hidden flex items-center">
            <Button 
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
              className="w-8 h-8 mr-2"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* Updated Mobile Cart Link/Button to use toggleCart from context */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => { toggleCart(); handleMobileLinkClick(); }} // Use toggleCart from context
              aria-label="My Cart"
              className="relative mr-2"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Button>

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
              className="w-8 h-8"
            >
              {isMobileMenuOpen ? <CloseIcon className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            ref={mobileMenuRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden bg-background/95 backdrop-blur-md shadow-lg absolute w-full top-16 left-0 z-40 overflow-hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map(link => (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={handleMobileLinkClick}
                  className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-muted"
                >
                  {link.label}
                </Link>
              ))}
                {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    onClick={handleMobileLinkClick}
                    className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-muted"
                  >
                    My Profile
                  </Link>
                    {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={handleMobileLinkClick}
                      className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-muted"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-muted"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  onClick={handleMobileLinkClick}
                  className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-muted"
                >
                  Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
