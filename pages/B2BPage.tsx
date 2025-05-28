import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Search, Filter } from 'lucide-react';
import VanillaTilt from 'vanilla-tilt';
import { gsap } from 'gsap';
import LazyImage from '@/components/ui/LazyImage';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

// Export Product interface for CartContext to use
export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number | null;
  image_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  b2b_price: number | null;
  b2b_minimum_quantity: number | null;
  is_b2b: boolean;
  type?: string | null;
}

// No mock products anymore, we'll fetch from Supabase

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
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

  const handleEnquiryClick = () => {
    // Open a simple contact form or email dialog for B2B inquiries
    alert(`Thank you for your interest in ${product.name} for B2B purchase. Our team will contact you shortly to discuss your requirements.`);
    
    // GSAP animation for button
    if (buttonRef.current) {
      gsap.timeline()
        .to(buttonRef.current, { scale: 0.9, duration: 0.1, ease: 'power1.inOut' })
        .to(buttonRef.current, { textContent: 'Sent!', duration: 0, delay: 0.1})
        .to(buttonRef.current, { scale: 1, duration: 0.1, ease: 'power1.inOut' })
        .to(buttonRef.current, { textContent: 'Enquire Now', duration: 0, delay: 1.5});
    }
  };

  return (
    <motion.div 
      ref={cardRef}
      className="bg-card rounded-lg shadow-lg overflow-hidden group product-card-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}    >
      <div className="overflow-hidden">
        <LazyImage 
          src={product.image_url || '/static/images/product-placeholder.png'} 
          alt={product.name} 
          className="w-full h-64 object-contain bg-white group-hover:scale-105 transition-transform duration-500 ease-in-out" 
          loading="lazy" 
          width={400} 
          height={256} 
        />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold text-primary mb-2 truncate" title={product.name}>{product.name}</h3>
        <p className="text-sm text-muted-foreground mb-1 capitalize">{product.type || 'General'}</p>
        <p className="text-foreground font-bold text-2xl mb-3">₹{(product.b2b_price || product.price).toLocaleString('en-IN')}</p>
        <p className="text-muted-foreground text-sm mb-2 h-12 overflow-hidden text-ellipsis">{product.description || 'No description available'}</p>
        <p className="text-amber-600 text-xs mb-4 font-medium">Minimum order quantity: {product.b2b_minimum_quantity || 25}kg</p>
        <button 
          ref={buttonRef}
          onClick={handleEnquiryClick}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center shadow hover:shadow-md add-to-cart-button"
        >
          <MessageSquare size={18} className="mr-2" /> Enquire Now
        </button>
      </div>
    </motion.div>
  );
};

const B2BPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>(['All']);
  const shopTitleRef = useRef<HTMLHeadingElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Fetch B2B products from Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // Fetch B2B products from Supabase - only those with is_b2b = true
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_b2b', true)
          .order('name', { ascending: true });

        if (error) {
          throw error;
        }

        if (data) {
          setProducts(data);
          
          // Extract unique product types (categories)
          const productTypes = new Set<string>();
          data.forEach(product => {
            if (product.type) {
              productTypes.add(product.type);
            }
          });
          
          setCategories(['All', ...Array.from(productTypes)]);
        }
      } catch (error) {
        console.error('Error fetching B2B products:', error);
        toast({
          title: "Error loading products",
          description: "There was an error loading B2B products. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();

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
    const setUpProductCardAnimations = () => {
      if (prefersReducedMotion) return;
      
      const productCards = document.querySelectorAll('.product-card-container');
      if (productCards.length > 0) {
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
    };

    // Call after products are fetched and rendered
    if (!loading && products.length > 0) {
      setTimeout(setUpProductCardAnimations, 100);
    }

    return () => {
      // Cleanup GSAP animations
      if (shopTitleRef.current) gsap.killTweensOf(shopTitleRef.current);
      if (filtersRef.current) gsap.killTweensOf(filtersRef.current);
    };
  }, [toast]);

  const filteredProducts = products
    .filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(product => 
      filterCategory === 'All' || product.type === filterCategory
    );

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
          Bulk Wholesale Orders
        </motion.h1>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="max-w-2xl mx-auto mb-8 text-center"
        >
          <p className="text-muted-foreground">
            Our B2B program offers premium dehydrated fruits and vegetables for your business needs. 
            Minimum order quantity applies. Enjoy bulk pricing and customized packaging options.
          </p>
        </motion.div>
        
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
              className="w-full p-3 pl-10 border border-border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-shadow bg-input text-foreground placeholder:text-muted-foreground"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
          <div className="relative flex-grow w-full md:w-auto">
            <select 
              className="w-full p-3 pl-10 border border-border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none appearance-none bg-input text-foreground transition-shadow"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category} className="bg-input text-foreground">{category}</option>
              ))}
            </select>
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
        </motion.div>        {/* Product Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredProducts.length > 0 ? (
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
            No B2B products found matching your criteria. Try adjusting your search or filters.
          </motion.p>
        )}
        
        {/* B2B Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 p-8 bg-card rounded-xl shadow-md text-center"
        >
          <h2 className="text-2xl font-bold mb-4 text-primary">Need Custom Quantities or Packaging?</h2>
          <p className="mb-6 text-muted-foreground">
            Contact our B2B team directly for custom orders, special pricing, or any other inquiries.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4 items-center">
            <a href="mailto:b2b@drydaddy.com" className="bg-amber-600 hover:bg-amber-700 text-white py-2 px-6 rounded-lg transition-colors">
              Email Our B2B Team
            </a>
            <a href="tel:+911234567890" className="bg-transparent border border-amber-600 text-amber-600 py-2 px-6 rounded-lg hover:bg-amber-50 transition-colors">
              Call: +91 1234-567-890
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default B2BPage;
