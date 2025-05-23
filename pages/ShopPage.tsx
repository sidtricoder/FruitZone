import React, { useState, useEffect, useRef } from 'react'; // Added useRef
import { motion } from 'framer-motion';
import { ShoppingBag, Search, Filter, X, Plus, Minus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VanillaTilt from 'vanilla-tilt'; // Import VanillaTilt
import { gsap } from 'gsap'; // Import GSAP
import LazyImage from '@/components/ui/LazyImage'; // Import LazyImage

// Mock product data - replace with actual data fetching
interface Product {
  id: string;
  name: string;
  category: string;
  price: number; // Price in INR
  imageUrl: string;
  description: string;
}

interface CartItem extends Product {
  quantity: number;
}

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Dehydrated Apple Slices',
    category: 'Fruits',
    price: 499, // Approx. 5.99 USD to INR (1 USD ~ 83.5 INR)
    imageUrl: '/static/images/product-apple.jpg',
    description: 'Crisp, sweet, and intensely apple-y. Perfect for healthy snacking or elevating your morning oatmeal.'
  },
  {
    id: '2',
    name: 'Sun-Kissed Tomato Halves',
    category: 'Vegetables',
    price: 625, // Approx. 7.49 USD to INR
    imageUrl: '/static/images/product-tomato.jpg',
    description: 'Rich, umami-packed flavor bombs. Ideal for artisanal pasta, vibrant salads, and gourmet sauces.'
  },
  {
    id: '3',
    name: 'Velvet Mango Cheeks',
    category: 'Fruits',
    price: 750, // Approx. 8.99 USD to INR
    imageUrl: '/static/images/product-mango.jpg',
    description: 'Sweet, chewy, and bursting with tropical sunshine. A delightful and guilt-free healthy indulgence.'
  },
  {
    id: '4',
    name: 'Sweet Carrot Ribbons',
    category: 'Vegetables',
    price: 415, // Approx. 4.99 USD to INR
    imageUrl: '/static/images/product-carrot.jpg',
    description: 'Naturally sweet with a satisfying crunch. A vibrant, nutrient-dense alternative to potato chips.'
  },
  {
    id: '5',
    name: 'Ruby Red Strawberry Slices',
    category: 'Fruits',
    price: 835, // Approx. 9.99 USD to INR
    imageUrl: '/static/images/product-strawberry.jpg',
    description: 'Intensely flavorful and aromatic. Perfect for cereals, desserts, or as a standalone gourmet snack.'
  },
  {
    id: '6',
    name: 'Rainbow Bell Pepper Confetti',
    category: 'Vegetables',
    price: 525, // Approx. 6.29 USD to INR
    imageUrl: '/static/images/product-pepper.jpg',
    description: 'A vibrant mix of sweet and colorful dehydrated peppers. Adds a pop of flavor and color to any dish.'
  }
];

const ProductCard: React.FC<{ product: Product; onAddToCart: (product: Product) => void }> = ({ product, onAddToCart }) => {
  const cardRef = useRef<HTMLDivElement>(null); // Ref for the card
  const buttonRef = useRef<HTMLButtonElement>(null); // Ref for the button

  useEffect(() => {
    // Initialize VanillaTilt
    if (cardRef.current) {
      VanillaTilt.init(cardRef.current, {
        max: 15, // Max tilt rotation (degrees)
        speed: 400, // Speed of the enter/exit transition
        glare: true, // If it should have a "glare" effect
        "max-glare": 0.2, // Glare opacity (0 = no glare, 1 = full glare)
        perspective: 1000, // Transform perspective, the lower the more extreme the tilt gets.
      });
    }
    // Cleanup VanillaTilt on component unmount
    return () => {
      if (cardRef.current && (cardRef.current as any).vanillaTilt) {
        (cardRef.current as any).vanillaTilt.destroy();
      }
    };
  }, []);

  const handleAddToCartClick = () => {
    onAddToCart(product);
    // GSAP animation for button
    if (buttonRef.current) {
      gsap.timeline()
        .to(buttonRef.current, { scale: 0.9, duration: 0.1, ease: 'power1.inOut' })
        .to(buttonRef.current, { textContent: 'Added!', duration: 0, delay: 0.1}) // Change text
        .to(buttonRef.current, { scale: 1, duration: 0.1, ease: 'power1.inOut' })
        .to(buttonRef.current, { textContent: 'Add to Cart', duration: 0, delay: 1.5}); // Revert text
    }
  };

  return (
    <motion.div 
      ref={cardRef} // Attach ref to the card
      className="bg-card rounded-lg shadow-lg overflow-hidden group product-card-container" // Removed transform hover:scale-105, VanillaTilt handles this. Added product-card-container for potential GSAP scroll triggers.
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="overflow-hidden">
        <LazyImage src={product.imageUrl} alt={product.name} className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500 ease-in-out" loading="lazy" width={400} height={224} />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold text-primary mb-2 truncate" title={product.name}>{product.name}</h3> {/* Changed text-green-700 to text-primary */}
        <p className="text-sm text-muted-foreground mb-1 capitalize">{product.category}</p> {/* Changed text-gray-500 to text-muted-foreground */}
        <p className="text-foreground font-bold text-2xl mb-3">₹{product.price.toLocaleString('en-IN')}</p> {/* Changed text-gray-800 to text-foreground */}
        <p className="text-muted-foreground text-sm mb-4 h-16 overflow-hidden text-ellipsis">{product.description}</p> {/* Changed text-gray-700 to text-muted-foreground */}
        <button 
          ref={buttonRef} // Attach ref to the button
          onClick={handleAddToCartClick} // Use the new handler
          className="w-full bg-lime-500 hover:bg-lime-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center shadow hover:shadow-md add-to-cart-button"
          // Assuming lime is a brand color, keeping it for now. Dark mode variants for this button might be needed.
        >
          <ShoppingBag size={18} className="mr-2" /> Add to Cart
        </button>
      </div>
    </motion.div>
  );
};

const ShopPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate
  const shopTitleRef = useRef<HTMLHeadingElement>(null); // Ref for the shop title
  const filtersRef = useRef<HTMLDivElement>(null); // Ref for the filters bar

  // Simulate fetching products
  useEffect(() => {
    setProducts(mockProducts);

    // GSAP Animations for Shop Page Title and Filters
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      if (shopTitleRef.current) {
        gsap.fromTo(shopTitleRef.current, 
          { opacity: 0, y: -30, filter: 'blur(5px)' }, 
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: 'power3.out', delay: 0.2 }
        );
      }
      if (filtersRef.current) {
        gsap.fromTo(filtersRef.current, 
          { opacity: 0, y: 30 }, 
          { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: 0.4 }
        );
      }
    }

    // Scroll-into-view for product cards (can be enhanced with ScrollTrigger)
    // This is a basic version. For more complex stagger or individual control, use ScrollTrigger.
    const productCards = document.querySelectorAll('.product-card-container');
    if (productCards.length > 0 && !prefersReducedMotion) {
      gsap.fromTo(productCards, 
        { opacity: 0, y: 50 }, 
        {
          opacity: 1, 
          y: 0, 
          duration: 0.6, 
          stagger: 0.15, 
          ease: 'power3.out',
          scrollTrigger: {
            trigger: ".product-grid-container", // A parent container for the grid
            start: "top 80%",
            toggleActions: "play none none none",
            // markers: true, // for debugging
          }
        }
      );
    }

    return () => {
      // Cleanup GSAP animations
      if (shopTitleRef.current) gsap.killTweensOf(shopTitleRef.current);
      if (filtersRef.current) gsap.killTweensOf(filtersRef.current);
      gsap.killTweensOf(productCards);
    };

  }, []); // Run once on mount

  const handleAddToCart = (product: Product) => {
    setCartItems(prevItems => {
      const itemInCart = prevItems.find(item => item.id === product.id);
      if (itemInCart) {
        return prevItems.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { ...product, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const calculateCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };
  
  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty. Please add items to proceed.");
      return;
    }
    setIsCartOpen(false); // Close cart modal if open
    navigate('/checkout', { state: { cartItems: cartItems } });
  };

  const toggleCart = () => setIsCartOpen(!isCartOpen);

  const filteredProducts = products
    .filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(product => 
      filterCategory === 'All' || product.category === filterCategory
    );

  const categories = ['All', ...new Set(mockProducts.map(p => p.category))];

  return (
    <div className="min-h-screen bg-background pt-24 pb-12"> {/* Changed bg-gray-50 to bg-background */}
      <div className="container mx-auto px-6">
        <motion.h1 
          ref={shopTitleRef} // Attach ref
          initial={{ opacity: 0, y: -20 }} // GSAP will override this if not reduced motion
          animate={{ opacity: 1, y: 0 }} // GSAP will override this if not reduced motion
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold text-center text-primary mb-4" // Changed text-green-700 to text-primary
        >
          Our Dehydrated Treasures
        </motion.h1>
        
        {/* Cart Icon Button */}
        <div className="flex justify-end mb-6">
          <button 
            onClick={toggleCart} 
            className="relative p-2 bg-lime-500 hover:bg-lime-600 text-white rounded-full shadow-md transition-colors" // Assuming lime is brand color
            aria-label="Open cart"
          >
            <ShoppingBag size={24} />
            {totalCartItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {totalCartItems}
              </span>
            )}
          </button>
        </div>

        {/* Search and Filter Bar */}
        <motion.div 
          ref={filtersRef} // Attach ref
          initial={{ opacity: 0, y: 20 }} // GSAP will override this if not reduced motion
          animate={{ opacity: 1, y: 0 }} // GSAP will override this if not reduced motion
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-10 p-6 bg-card rounded-xl shadow-md flex flex-col md:flex-row gap-4 items-center filters-bar" // Changed bg-white to bg-card
        >
          <div className="relative flex-grow w-full md:w-auto">
            <input 
              type="text"
              placeholder="Search products..."
              className="w-full p-3 pl-10 border border-border rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 outline-none transition-shadow bg-input text-foreground placeholder:text-muted-foreground" // Added bg-input, text-foreground, placeholder:text-muted-foreground, border-border
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" /> {/* Changed text-gray-400 to text-muted-foreground */}
          </div>
          <div className="relative flex-grow w-full md:w-auto">
            <select 
              className="w-full p-3 pl-10 border border-border rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 outline-none appearance-none bg-input text-foreground transition-shadow" // Added bg-input, text-foreground, border-border
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category} className="bg-input text-foreground">{category}</option> // Added classes for options
              ))}
            </select>
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" /> {/* Changed text-gray-400 to text-muted-foreground */}
          </div>
        </motion.div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 product-grid-container"> {/* Added product-grid-container for ScrollTrigger */}
            {filteredProducts.map((product) => ( // Removed unused 'index'
              <motion.div
                key={product.id}
                // Removed initial/animate/transition for individual cards, GSAP ScrollTrigger will handle this via .product-card-container
                className="product-card-wrapper" // Added a wrapper if needed, or apply class directly to ProductCard parent
              >
                <ProductCard product={product} onAddToCart={handleAddToCart} />
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center text-xl text-muted-foreground py-10" // Changed text-gray-600 to text-muted-foreground
          >
            No products found matching your criteria. Try adjusting your search or filters.
          </motion.p>
        )}
      </div>

      {/* Cart Modal */}
      {isCartOpen && (
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
            className="bg-card rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" // Changed bg-white to bg-card
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            <div className="flex justify-between items-center p-6 border-b border-border"> {/* Added border-border */}
              <h2 className="text-2xl font-semibold text-primary">Your Cart</h2> {/* Changed text-green-700 to text-primary */} 
              <button onClick={toggleCart} className="text-muted-foreground hover:text-foreground"> {/* Added hover:text-foreground */}
                <X size={24} />
              </button>
            </div>

            {cartItems.length === 0 ? (
              <p className="p-8 text-center text-muted-foreground">Your cart is empty.</p> 
            ) : (
              <div className="p-6 overflow-y-auto flex-grow">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between py-4 border-b border-border last:border-b-0">
                    <div className="flex items-center">
                      <LazyImage src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-md mr-4" loading="lazy" width={64} height={64} />
                      <div>
                        <h3 className="font-semibold text-foreground">{item.name}</h3> 
                        <p className="text-sm text-muted-foreground">₹{item.price.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        className="p-1.5 bg-muted hover:bg-accent rounded-full text-muted-foreground hover:text-accent-foreground transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center font-medium text-foreground">{item.quantity}</span>
                      <button 
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        className="p-1.5 bg-muted hover:bg-accent rounded-full text-muted-foreground hover:text-accent-foreground transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus size={16} />
                      </button>
                      <button 
                        onClick={() => handleRemoveFromCart(item.id)}
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
                  <p className="text-xl font-bold text-primary">₹{calculateCartTotal().toLocaleString('en-IN')}</p>
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
      )}
    </div>
  );
};

export default ShopPage;
