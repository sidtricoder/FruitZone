// filepath: a:\New folder\FruitZone\pages\ShopPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VanillaTilt from 'vanilla-tilt';
import { gsap } from 'gsap';
import LazyImage from '@/components/ui/LazyImage';
import { useCart } from '@/contexts/CartContext';

// Export Product interface for CartContext to use
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  description: string;
}

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Dehydrated Apple Slices',
    category: 'Fruits',
    price: 499,
    imageUrl: '/static/images/product-apple.jpg',
    description: 'Crisp, sweet, and intensely apple-y. Perfect for healthy snacking or elevating your morning oatmeal.'
  },
  {
    id: '2',
    name: 'Sun-Kissed Tomato Halves',
    category: 'Vegetables',
    price: 625,
    imageUrl: '/static/images/product-tomato.jpg',
    description: 'Rich, umami-packed flavor bombs. Ideal for artisanal pasta, vibrant salads, and gourmet sauces.'
  },
  {
    id: '3',
    name: 'Velvet Mango Cheeks',
    category: 'Fruits',
    price: 750,
    imageUrl: '/static/images/product-mango.jpg',
    description: 'Sweet, chewy, and bursting with tropical sunshine. A delightful and guilt-free healthy indulgence.'
  },
  {
    id: '4',
    name: 'Sweet Carrot Ribbons',
    category: 'Vegetables',
    price: 415,
    imageUrl: '/static/images/product-carrot.jpg',
    description: 'Naturally sweet with a satisfying crunch. A vibrant, nutrient-dense alternative to potato chips.'
  },
  {
    id: '5',
    name: 'Ruby Red Strawberry Slices',
    category: 'Fruits',
    price: 835,
    imageUrl: '/static/images/product-strawberry.jpg',
    description: 'Intensely flavorful and aromatic. Perfect for cereals, desserts, or as a standalone gourmet snack.'
  },
  {
    id: '6',
    name: 'Rainbow Bell Pepper Confetti',
    category: 'Vegetables',
    price: 525,
    imageUrl: '/static/images/product-pepper.jpg',
    description: 'A vibrant mix of sweet and colorful dehydrated peppers. Adds a pop of flavor and color to any dish.'
  }
];

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const cardRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Initialize VanillaTilt
    if (cardRef.current) {
      VanillaTilt.init(cardRef.current, {
        max: 15,
        speed: 400,
        glare: true,
        "max-glare": 0.2,
        perspective: 1000,
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
    addToCart(product);
    
    // GSAP animation for button
    if (buttonRef.current) {
      gsap.timeline()
        .to(buttonRef.current, { scale: 0.9, duration: 0.1, ease: 'power1.inOut' })
        .to(buttonRef.current, { textContent: 'Added!', duration: 0, delay: 0.1})
        .to(buttonRef.current, { scale: 1, duration: 0.1, ease: 'power1.inOut' })
        .to(buttonRef.current, { textContent: 'Add to Cart', duration: 0, delay: 1.5});
    }
  };

  return (
    <motion.div 
      ref={cardRef}
      className="bg-card rounded-lg shadow-lg overflow-hidden group product-card-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="overflow-hidden">
        <LazyImage 
          src={product.imageUrl} 
          alt={product.name} 
          className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500 ease-in-out" 
          loading="lazy" 
          width={400} 
          height={224} 
        />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold text-primary mb-2 truncate" title={product.name}>{product.name}</h3>
        <p className="text-sm text-muted-foreground mb-1 capitalize">{product.category}</p>
        <p className="text-foreground font-bold text-2xl mb-3">₹{product.price.toLocaleString('en-IN')}</p>
        <p className="text-muted-foreground text-sm mb-4 h-16 overflow-hidden text-ellipsis">{product.description}</p>
        <button 
          ref={buttonRef}
          onClick={handleAddToCartClick}
          className="w-full bg-lime-500 hover:bg-lime-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center shadow hover:shadow-md add-to-cart-button"
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
  const navigate = useNavigate();
  const shopTitleRef = useRef<HTMLHeadingElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  
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

    // Setup GSAP animations for product cards
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
            trigger: ".product-grid-container",
            start: "top 80%",
            toggleActions: "play none none none",
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
  }, []);

  const filteredProducts = products
    .filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(product => 
      filterCategory === 'All' || product.category === filterCategory
    );

  const categories = ['All', ...new Set(mockProducts.map(p => p.category))];

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-6">
        <motion.h1 
          ref={shopTitleRef}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold text-center text-primary mb-4"
        >
          Our Dehydrated Treasures
        </motion.h1>
        
        {/* Search and Filter Bar */}
        <motion.div 
          ref={filtersRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-10 p-6 bg-card rounded-xl shadow-md flex flex-col md:flex-row gap-4 items-center filters-bar"
        >
          <div className="relative flex-grow w-full md:w-auto">
            <input 
              type="text"
              placeholder="Search products..."
              className="w-full p-3 pl-10 border border-border rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 outline-none transition-shadow bg-input text-foreground placeholder:text-muted-foreground"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
          <div className="relative flex-grow w-full md:w-auto">
            <select 
              className="w-full p-3 pl-10 border border-border rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 outline-none appearance-none bg-input text-foreground transition-shadow"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category} className="bg-input text-foreground">{category}</option>
              ))}
            </select>
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
        </motion.div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 product-grid-container">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                className="product-card-wrapper"
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center text-xl text-muted-foreground py-10"
          >
            No products found matching your criteria. Try adjusting your search or filters.
          </motion.p>
        )}
      </div>
    </div>
  );
};

export default ShopPage;
