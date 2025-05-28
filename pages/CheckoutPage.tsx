import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, CreditCard, User, Home, Phone } from 'lucide-react'; // Removed Mail
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number | null;
  image_url: string | string[] | null;
  created_at: string | null;
  updated_at: string | null;
  b2b_price: number | null;
  b2b_minimum_quantity: number | null;
  is_b2b: boolean;
  type?: string | null;
}

interface CartItem extends Product {
  quantity: number;
}

const CheckoutPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { user } = useAuth(); 

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    stateProvince: '', 
    postalCode: '',
    country: 'India', 
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (location.state && location.state.cartItems) {
      setCartItems(location.state.cartItems as CartItem[]);
    } else {
      console.warn('No cart items found in location state. Consider redirecting.');
      // navigate('/shop'); 
    }

    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.full_name || prev.fullName,
        phone: user.mobile_number || prev.phone,
        address: user.default_street_address_line_1 || prev.address,
        city: user.default_city || prev.city,
        stateProvince: user.default_state_province_region || prev.stateProvince,
        postalCode: user.default_postal_code || prev.postalCode,
        country: user.default_country || prev.country,
      }));
    }
  }, [location.state, user]); // Removed navigate from dependencies as it's stable

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!user) {
      alert('You must be logged in to place an order.');
      setIsSubmitting(false);
      navigate('/login'); 
      return;
    }
    const userId = user.id;

    if (cartItems.length === 0) {
      alert('Your cart is empty. Please add items before checking out.');
      navigate('/shop'); 
      setIsSubmitting(false);
      return;
    }    const orderDetails = {
      user_id: userId,
      status: 'pending',
      total_amount: totalAmount,
      shipping_full_name: formData.fullName,
      shipping_street_address_line_1: formData.address,
      shipping_city: formData.city,
      shipping_state_province_region: formData.stateProvince,
      shipping_postal_code: formData.postalCode,
      shipping_country: formData.country,
      shipping_phone_number: formData.phone,
    };
    
    try {
      // Insert order first
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([orderDetails])
        .select();

      if (orderError) {
        console.error('Error inserting order:', orderError);
        alert(`Error placing order: ${orderError.message}`);
        setIsSubmitting(false);
        return;
      }

      // Get the new order ID
      const orderId = orderData[0].id;

      // Create order items for each product in the cart
      const orderItems = cartItems.map(item => ({
        order_id: orderId,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      // Insert order items
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error inserting order items:', itemsError);
        alert(`Error saving order items: ${itemsError.message}`);
        setIsSubmitting(false);
        return;
      }

      console.log('Order submitted successfully:', orderData);
      alert('Order placed successfully!');
      // Clear cart after successful order
      localStorage.removeItem('fruitZoneCart');
      navigate('/'); 
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const shippingCost = cartItems.length > 0 ? 50 : 0; 
  const totalAmount = calculateSubtotal() + shippingCost;

  if (cartItems.length === 0 && !(location.state && location.state.cartItems)) {
    return (
        <div className="min-h-screen bg-background pt-24 pb-12 flex flex-col items-center justify-center"> 
            <p className="text-xl text-muted-foreground mb-4">Your cart is empty or items not loaded.</p> 
            <button
                onClick={() => navigate('/shop')} 
                className="bg-lime-500 hover:bg-lime-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
                Go to Shop
            </button>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12"> 
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-4xl font-bold text-center text-primary mb-8 sm:mb-12" 
        >
          Checkout
        </motion.h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2 bg-card p-6 sm:p-8 rounded-xl shadow-lg" 
          >
            <h2 className="text-2xl font-semibold text-foreground mb-6">Shipping & Contact Information</h2> 
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-muted-foreground mb-1">Full Name</label> 
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" /> 
                  <input type="text" name="fullName" id="fullName" value={formData.fullName} onChange={handleInputChange} required className="w-full p-3 pl-10 border border-border rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 bg-input text-foreground placeholder:text-muted-foreground" /> 
                </div>
              </div>
              {/* Removed Email Input Field */}
            </div>

            <div className="mb-6">
              <label htmlFor="phone" className="block text-sm font-medium text-muted-foreground mb-1">Phone Number</label> 
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" /> 
                <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleInputChange} required className="w-full p-3 pl-10 border border-border rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 bg-input text-foreground placeholder:text-muted-foreground" /> 
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="address" className="block text-sm font-medium text-muted-foreground mb-1">Street Address</label> 
              <div className="relative">
                <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" /> 
                <input type="text" name="address" id="address" value={formData.address} onChange={handleInputChange} required className="w-full p-3 pl-10 border border-border rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 bg-input text-foreground placeholder:text-muted-foreground" /> 
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-muted-foreground mb-1">City</label> 
                <input type="text" name="city" id="city" value={formData.city} onChange={handleInputChange} required className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 bg-input text-foreground placeholder:text-muted-foreground" /> 
              </div>
              <div>
                <label htmlFor="stateProvince" className="block text-sm font-medium text-muted-foreground mb-1">State/Province</label> 
                <input type="text" name="stateProvince" id="stateProvince" value={formData.stateProvince} onChange={handleInputChange} required className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 bg-input text-foreground placeholder:text-muted-foreground" /> 
              </div>
              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-muted-foreground mb-1">Postal Code</label> 
                <input type="text" name="postalCode" id="postalCode" value={formData.postalCode} onChange={handleInputChange} required className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 bg-input text-foreground placeholder:text-muted-foreground" /> 
              </div>
            </div>
            <div className="mb-6">
                <label htmlFor="country" className="block text-sm font-medium text-muted-foreground mb-1">Country</label> 
                <select name="country" id="country" value={formData.country} onChange={handleInputChange} className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 bg-input text-foreground">
                  <option value="India" className="bg-input text-foreground">India</option> 
                </select>
            </div>


            <h2 className="text-2xl font-semibold text-foreground mb-6 mt-8">Payment Details</h2> 
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-500 p-4 rounded-md mb-6"> 
              <p className="text-sm text-yellow-700 dark:text-yellow-300">This is a demo. Please do not enter real card details.</p> 
            </div>
            <div className="mb-6">
              <label htmlFor="cardNumber" className="block text-sm font-medium text-muted-foreground mb-1">Card Number</label> 
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" /> 
                <input type="text" name="cardNumber" id="cardNumber" placeholder="•••• •••• •••• ••••" value={formData.cardNumber} onChange={handleInputChange} required className="w-full p-3 pl-10 border border-border rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 bg-input text-foreground placeholder:text-muted-foreground" /> 
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="expiryDate" className="block text-sm font-medium text-muted-foreground mb-1">Expiry Date</label> 
                <input type="text" name="expiryDate" id="expiryDate" placeholder="MM/YY" value={formData.expiryDate} onChange={handleInputChange} required className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 bg-input text-foreground placeholder:text-muted-foreground" /> 
              </div>
              <div>
                <label htmlFor="cvv" className="block text-sm font-medium text-muted-foreground mb-1">CVV</label> 
                <input type="text" name="cvv" id="cvv" placeholder="•••" value={formData.cvv} onChange={handleInputChange} required className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 bg-input text-foreground placeholder:text-muted-foreground" /> 
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-1 bg-card p-6 sm:p-8 rounded-xl shadow-lg h-fit sticky top-24" 
          >
            <h2 className="text-2xl font-semibold text-foreground mb-6 border-b border-border pb-4">Order Summary</h2> 
            <div className="max-h-60 overflow-y-auto mb-4 pr-2">
              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between items-center py-3 border-b border-border last:border-b-0"> 
                  <div>
                    <p className="font-medium text-foreground">{item.name} (x{item.quantity})</p> 
                    <p className="text-sm text-muted-foreground">₹{item.price.toLocaleString('en-IN')}</p> 
                  </div>
                  <p className="font-semibold text-foreground">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p> 
                </div>
              ))}
            </div>
            
            <div className="border-t border-border pt-4"> 
              <div className="flex justify-between text-muted-foreground mb-1"> 
                <span>Subtotal</span>
                <span>₹{calculateSubtotal().toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-muted-foreground mb-3"> 
                <span>Shipping</span>
                <span>₹{shippingCost.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-foreground font-bold text-xl mb-6"> 
                <span>Total</span>
                <span>₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-lime-500 hover:bg-lime-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300 shadow hover:shadow-md flex items-center justify-center disabled:opacity-50"
              >
                <Lock size={18} className="mr-2" /> {isSubmitting ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;
