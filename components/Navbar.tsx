import * as React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { UserCircle, Moon, Sun } from 'lucide-react'; // Added Moon and Sun icons
import { useTheme } from '@/components/ThemeProvider'; // Added useTheme hook

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, setTheme } = useTheme(); // Added theme state and setter
  const navRef = React.useRef(null);

  React.useEffect(() => {
    // gsap.from(navRef.current, {
    //   y: -100,
    //   opacity: 0,
    //   duration: 1,
    //   ease: 'power3.out'
    // });
  }, []);

  return (
    <nav ref={navRef} className="bg-background/80 backdrop-blur-md shadow-sm fixed w-full top-0 z-50 dark:bg-background/80">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8"> {/* Reduced horizontal padding */} 
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl sm:text-2xl font-bold text-primary"> {/* Adjusted text size for smaller screens */} 
              FruitZone
            </Link>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2"> {/* Reduced space between items */} 
            <Link to="/">
              <Button variant="ghost" size="sm">Home</Button> {/* Adjusted button size */} 
            </Link>
            <Link to="/shop">
              <Button variant="ghost" size="sm">Shop</Button> {/* Adjusted button size */} 
            </Link>

            {/* Theme Toggle Button */} 
            <Button 
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
              className="w-8 h-8 sm:w-auto sm:h-auto" /* Adjusted icon button size */
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> /* Adjusted icon size */
              ) : (
                <Moon className="h-4 w-4 sm:h-5 sm:w-5" /> /* Adjusted icon size */
              )}
            </Button>
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-1 sm:space-x-2"> {/* Reduced space for authenticated items */} 
                <Link to="/profile" className="text-gray-600 hover:text-green-600 p-1 sm:p-2 rounded-full"> {/* Adjusted padding */} 
                  <UserCircle size={20} className="sm:size-24" /> {/* Adjusted icon size */} 
                </Link>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {user?.mobile_number}
                </span>
                <Button variant="outline" size="sm" onClick={logout}> {/* Adjusted button size */} 
                  Logout
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button size="sm">Login</Button> {/* Adjusted button size */} 
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
