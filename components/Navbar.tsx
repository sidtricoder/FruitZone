import * as React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { UserCircle, Moon, Sun, Menu, X as CloseIcon } from 'lucide-react'; // Added Menu and X icons
import { useTheme } from '@/components/ThemeProvider';
import { motion, AnimatePresence } from 'framer-motion'; // Import motion and AnimatePresence
import { gsap } from 'gsap';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const navRef = React.useRef<HTMLElement>(null);
  const mobileMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (navRef.current) {
      gsap.fromTo(navRef.current, 
        { y: -80, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.2 }
      );
    }
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu on link click
  const handleMobileLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav ref={navRef} className="bg-background/80 backdrop-blur-md shadow-sm fixed w-full top-0 z-50 dark:bg-background/80 opacity-0">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="text-xl sm:text-2xl font-bold text-primary">
              FruitZone
            </Link>
          </div>

          {/* Desktop Menu & Theme Toggle/User Auth */} 
          <div className="hidden md:flex items-center space-x-1 sm:space-x-2">
            <Link to="/">
              <Button variant="ghost" size="sm">Home</Button>
            </Link>
            <Link to="/shop">
              <Button variant="ghost" size="sm">Shop</Button>
            </Link>

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
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Link to="/profile" className="text-gray-600 hover:text-green-600 p-1 sm:p-2 rounded-full">
                  <UserCircle className="h-6 w-6 sm:h-8 sm:w-8 text-gray-700 dark:text-gray-300" />
                </Link>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {user?.mobile_number}
                </span>
                <Button variant="outline" size="sm" onClick={logout}>
                  Logout
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button size="sm">Login</Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */} 
          <div className="md:hidden flex items-center">
            {/* Theme toggle for mobile - placed before hamburger for consistency */} 
            <Button 
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
              className="w-8 h-8 mr-2" // Added margin for spacing from hamburger
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
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
            initial={{ opacity: 0, y: -20 }} // Start from slightly above and faded out
            animate={{ opacity: 1, y: 0 }} // Animate to full opacity and original position
            exit={{ opacity: 0, y: -20 }} // Animate out to above and faded
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden bg-background/95 dark:bg-background/95 backdrop-blur-lg shadow-lg absolute top-16 left-0 right-0 z-40 pb-4"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 flex flex-col items-center">
              <Link to="/" onClick={handleMobileLinkClick}>
                <Button variant="ghost" className="w-full justify-center py-3">Home</Button>
              </Link>
              <Link to="/shop" onClick={handleMobileLinkClick}>
                <Button variant="ghost" className="w-full justify-center py-3">Shop</Button>
              </Link>
              {isAuthenticated ? (
                <>
                  <Link to="/profile" onClick={handleMobileLinkClick}>
                    <Button variant="ghost" className="w-full justify-center py-3 flex items-center">
                      <UserCircle className="h-5 w-5 mr-2" /> Profile
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full justify-center py-3 mt-2" onClick={() => { logout(); handleMobileLinkClick(); }}>
                    Logout
                  </Button>
                </>
              ) : (
                <Link to="/auth" onClick={handleMobileLinkClick}>
                  <Button variant="ghost" className="w-full justify-center py-3">Login</Button>
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
