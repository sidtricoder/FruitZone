import * as React from 'react';
import { Link } from 'react-router-dom';
// import { ShoppingCart, User } from 'lucide-react'; // Removed unused import
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { gsap } from 'gsap';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navRef = React.useRef(null);

  React.useEffect(() => {
    gsap.from(navRef.current, {
      y: -100,
      opacity: 0,
      duration: 1,
      ease: 'power3.out'
    });
  }, []);

  return (
    <nav ref={navRef} className="bg-white/80 backdrop-blur-md shadow-sm fixed w-full top-0 z-50">
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
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
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
