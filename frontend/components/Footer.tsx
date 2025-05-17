import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-auto">
      <div className="container mx-auto px-6 text-center">
        <p>&copy; {new Date().getFullYear()} FruitZone. All rights reserved.</p>
        <p className="text-sm text-gray-400 mt-2">
          Dehydrated fruits and vegetables, fresh from nature to you.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
