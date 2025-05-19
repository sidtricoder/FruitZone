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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-primary">
              FruitZone
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="ghost">Home</Button>
            </Link>
            <Link to="/shop">
              <Button variant="ghost">Shop</Button>
            </Link>

            {/* Theme Toggle Button */} 
            <Button 
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link to="/profile" className="text-gray-600 hover:text-green-600 p-2 rounded-full">
                  <UserCircle size={24} />
                </Link>
                <span className="text-sm text-muted-foreground">
                  {user?.mobile_number}
                </span>
                <Button variant="outline" onClick={logout}>
                  Logout
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button>Login</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
