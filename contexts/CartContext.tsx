import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Product } from '@/pages/ShopPage'; // Assuming Product interface is exported from ShopPage

export interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  isCartOpen: boolean;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, newQuantity: number) => void;
  toggleCart: () => void;
  clearCart: () => void;
  totalItems: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (product: Product, quantity: number = 1) => {
    setCartItems(prevItems => {
      const itemInCart = prevItems.find(item => item.id === product.id);
      if (itemInCart) {
        return prevItems.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prevItems, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const toggleCart = () => {
    setIsCartOpen(prev => !prev);
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  // Optional: Persist cart to localStorage
  useEffect(() => {
    const storedCart = localStorage.getItem('fruitZoneCart');
    if (storedCart) {
      setCartItems(JSON.parse(storedCart));
    }
  }, []);

  useEffect(() => {
    if (cartItems.length > 0 || localStorage.getItem('fruitZoneCart')) { // only update if cartItems has content or was loaded
        localStorage.setItem('fruitZoneCart', JSON.stringify(cartItems));
    }
  }, [cartItems]);


  return (
    <CartContext.Provider value={{ 
      cartItems, 
      isCartOpen, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      toggleCart, 
      clearCart,
      totalItems,
      cartTotal 
    }}>
      {children}
    </CartContext.Provider>
  );
};
