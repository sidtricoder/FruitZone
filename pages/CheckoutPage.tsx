import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, CreditCard, User, Home, Mail, Phone } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  description: string;
}

interface CartItem extends Product {
  quantity: number;
}

const CheckoutPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { user } = useAuth(); // Example: Get user from AuthContext

  const [formData, setFormData] = useState({
    fullName: user?.full_name || '',
    email: '', // Email is not in the User interface, consider adding or fetching separately
    phone: user?.mobile_number || '',
    address: user?.default_street_address_line_1 || '',
    city: user?.default_city || '',
    stateProvince: user?.default_state_province_region || '', 
    postalCode: user?.default_postal_code || '',
    country: user?.default_country || 'India', 
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (location.state && location.state.cartItems) {
      setCartItems(location.state.cartItems as CartItem[]);
    } else {
      // If no cart items are passed, redirect to shop or show an error
      // For now, just log and potentially redirect
      console.warn('No cart items found in location state. Redirecting to shop.');
      // navigate('/shop'); // Or your shop page route
    }

    // Populate form with user data if available
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
        // Email is not part of the user object in AuthContext, handle accordingly
        // If user.email exists on your SupabaseUser and you add it to your User interface:
        // email: user.email || prev.email 
      }));
    }
  }, [location.state, navigate, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // --- Get User ID ---
    // This is a placeholder. Replace with your actual user ID retrieval logic.
    // For example, if using Supabase Auth:
    // const { data: { user } } = await supabase.auth.getUser(); // Removed direct Supabase call
    if (!user) {
      alert('You must be logged in to place an order.');
      setIsSubmitting(false);
      navigate('/login'); // Or your login page route
      return;
    }
    const userId = user.id;
    // --- End User ID ---


    if (cartItems.length === 0) {
      alert('Your cart is empty. Please add items before checking out.');
      navigate('/shop'); // Navigate to shop page
      setIsSubmitting(false);
      return;
    }

    const orderData = {
      user_id: userId,
      // order_date: new Date().toISOString(), // DB default is now()
      status: 'pending',
      total_amount: totalAmount,
      shipping_full_name: formData.fullName,
      shipping_street_address_line_1: formData.address,
      // shipping_street_address_line_2: null, // Add if you have this field in form
      shipping_city: formData.city,
      shipping_state_province_region: formData.stateProvince,
      shipping_postal_code: formData.postalCode,
      shipping_country: formData.country,
      shipping_phone_number: formData.phone,
    };

    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select();

      if (error) {
        console.error('Error inserting order:', error);
        alert(`Error placing order: ${error.message}`);
        setIsSubmitting(false);
        return;
      }

      console.log('Order submitted successfully:', data);
      alert('Order placed successfully!');
      // TODO: Optionally, insert order items into an 'order_items' table here if you have one.
      // TODO: Clear the cart (e.g., if cart is in global state or local storage)
      navigate('/'); // Navigate to home page or an order confirmation page
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

  const shippingCost = cartItems.length > 0 ? 50 : 0; // Example shipping cost
  const totalAmount = calculateSubtotal() + shippingCost;

  if (cartItems.length === 0 && !(location.state && location.state.cartItems)) {
    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12 flex flex-col items-center justify-center">
            <p className="text-xl text-gray-600 mb-4">Your cart is empty or items not loaded.</p>
            <button
                onClick={() => navigate('/shop')} // Ensure this route matches your shop page
                className="bg-lime-500 hover:bg-lime-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
                Go to Shop
            </button>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-4xl font-bold text-center text-green-700 mb-8 sm:mb-12"
        >
          Checkout
        </motion.h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipping & Contact Details */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-xl shadow-lg"
          >
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Shipping & Contact Information</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input type="text" name="fullName" id="fullName" value={formData.fullName} onChange={handleInputChange} required className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500" />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input type="email" name="email" id="email" value={formData.email} onChange={handleInputChange} required className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500" />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleInputChange} required className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500" />
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
              <div className="relative">
                <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="text" name="address" id="address" value={formData.address} onChange={handleInputChange} required className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input type="text" name="city" id="city" value={formData.city} onChange={handleInputChange} required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500" />
              </div>
              <div>
                <label htmlFor="stateProvince" className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                <input type="text" name="stateProvince" id="stateProvince" value={formData.stateProvince} onChange={handleInputChange} required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500" />
              </div>
              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                <input type="text" name="postalCode" id="postalCode" value={formData.postalCode} onChange={handleInputChange} required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500" />
              </div>
            </div>
            <div className="mb-6"> {/* Moved Country to its own row for better layout if needed, or keep in 3-col grid */}
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select name="country" id="country" value={formData.country} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 bg-white">
                  <option value="India">India</option>
                  {/* Add other countries as needed */}
                </select>
            </div>


            <h2 className="text-2xl font-semibold text-gray-800 mb-6 mt-8">Payment Details</h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md mb-6">
              <p className="text-sm text-yellow-700">This is a demo. Please do not enter real card details.</p>
            </div>
            <div className="mb-6">
              <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="text" name="cardNumber" id="cardNumber" placeholder="•••• •••• •••• ••••" value={formData.cardNumber} onChange={handleInputChange} required className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input type="text" name="expiryDate" id="expiryDate" placeholder="MM/YY" value={formData.expiryDate} onChange={handleInputChange} required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500" />
              </div>
              <div>
                <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                <input type="text" name="cvv" id="cvv" placeholder="•••" value={formData.cvv} onChange={handleInputChange} required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500" />
              </div>
            </div>
          </motion.div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-1 bg-white p-6 sm:p-8 rounded-xl shadow-lg h-fit sticky top-24" // Added h-fit and sticky
          >
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-4">Order Summary</h2>
            <div className="max-h-60 overflow-y-auto mb-4 pr-2">
              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between items-center py-3 border-b last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-700">{item.name} (x{item.quantity})</p>
                    <p className="text-sm text-gray-500">₹{item.price.toLocaleString('en-IN')}</p>
                  </div>
                  <p className="font-semibold text-gray-800">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between text-gray-600 mb-1">
                <span>Subtotal</span>
                <span>₹{calculateSubtotal().toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-600 mb-3">
                <span>Shipping</span>
                <span>₹{shippingCost.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-800 font-bold text-xl mb-6">
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
