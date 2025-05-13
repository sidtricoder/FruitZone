import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, User } from 'lucide-react';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-gradient-to-r from-green-400 to-lime-500 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-white hover:text-green-100 transition-colors duration-300">
          FruitZone
        </Link>
        <div className="flex items-center space-x-4">
          <Link to="/" className="text-white hover:text-green-100 transition-colors duration-300">Home</Link>
          <Link to="/shop" className="text-white hover:text-green-100 transition-colors duration-300">Shop</Link>
          {/* Add other nav links here */}
          <button className="text-white hover:text-green-100 transition-colors duration-300">
            <ShoppingCart size={24} />
          </button>
          <button className="text-white hover:text-green-100 transition-colors duration-300">
            <User size={24} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
