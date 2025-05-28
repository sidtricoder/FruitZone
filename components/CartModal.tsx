import React from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Minus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import LazyImage from '@/components/ui/LazyImage';

const CartModal: React.FC = () => {
  const { cartItems, isCartOpen, toggleCart, removeFromCart, updateQuantity, cartTotal } = useCart();
  const navigate = useNavigate();

  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty. Please add items to proceed.");
      return;
    }
    toggleCart(); // Close cart modal if open
    navigate('/checkout', { state: { cartItems } });
  };

  if (!isCartOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={toggleCart} // Close on backdrop click
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-card rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-2xl font-semibold text-primary">Your Cart</h2>
          <button onClick={toggleCart} className="text-muted-foreground hover:text-foreground">
            <X size={24} />
          </button>
        </div>

        {cartItems.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">Your cart is empty.</p>
        ) : (
          <div className="p-6 overflow-y-auto flex-grow">
            {cartItems.map(item => (              <div key={item.id} className="flex items-center justify-between py-4 border-b border-border last:border-b-0">                <div className="flex items-center">
                  <LazyImage 
                    src={
                      Array.isArray(item.image_url) && item.image_url.length > 0
                        ? item.image_url[0]
                        : typeof item.image_url === 'string'
                          ? item.image_url
                          : '/static/images/product-placeholder.png'
                    } 
                    alt={item.name} 
                    className="w-16 h-16 object-contain bg-white rounded-md mr-4" 
                    loading="lazy" 
                    width={64} 
                    height={64} 
                  />
                  <div>
                    <h3 className="font-semibold text-foreground">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">₹{item.price.toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-1.5 bg-muted hover:bg-accent rounded-full text-muted-foreground hover:text-accent-foreground transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-8 text-center font-medium text-foreground">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-1.5 bg-muted hover:bg-accent rounded-full text-muted-foreground hover:text-accent-foreground transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-1.5 text-red-500 hover:text-red-700 transition-colors ml-2"
                    aria-label="Remove item"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {cartItems.length > 0 && (
          <div className="p-6 border-t border-border">
            <div className="flex justify-between items-center mb-4">
              <p className="text-lg font-semibold text-foreground">Total:</p>
              <p className="text-xl font-bold text-primary">₹{cartTotal.toLocaleString('en-IN')}</p>
            </div>
            <button
              onClick={handleProceedToCheckout}
              className="w-full bg-lime-500 hover:bg-lime-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300 shadow hover:shadow-md"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default CartModal;
