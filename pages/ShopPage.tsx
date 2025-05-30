// filepath: /home/siddharth/Desktop/FruitZone/pages/ShopPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Search, Filter } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import LazyImage from '@/components/ui/LazyImage';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

gsap.registerPlugin(ScrollTrigger);

export interface NutrientInfo {
  energy_kcal?: string;
  carbohydrates_g?: string;
  dietary_fiber_g?: string;
  saturated_fat_g?: string;
  protein_g?: string;
  total_fat_g?: string;
  [key: string]: string | undefined; // Allows for additional nutrient fields
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number; // This is 'x', the discounted price set by admin
  image_url: string | string[];
  type?: string;
  // stock?: number; // Consolidate with stock_quantity
  // New fields for ProductPage UI and Admin management
  brand?: string;
  origin?: string;
  bbe?: string; // Best Before End, e.g., "3 months"
  delivery_info?: string; // e.g., "3 to 5 days"
  discount_percentage?: number | null; // 'z', e.g., 20 for 20% - Updated to allow null
  discount_reason?: string | null; // Reason for the discount - Updated to allow null
  nutrient_info?: NutrientInfo; // Nested object for nutrient details
  // Fields from AdminPage.tsx that should be consolidated
  stock_quantity?: number; // Use this as the primary stock field
  created_at?: string;
  updated_at?: string;
  b2b_price?: number | null;
  b2b_minimum_quantity?: number | null;
  is_b2b?: boolean;
}

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
    if (buttonRef.current) {
      gsap.timeline()
        .to(buttonRef.current, { scale: 0.9, duration: 0.1, ease: 'power1.inOut' })
        .to(buttonRef.current, { textContent: 'Added!', duration: 0, delay: 0.1})
        .to(buttonRef.current, { scale: 1, duration: 0.1, ease: 'power1.inOut' })
        .to(buttonRef.current, { textContent: 'Add to Cart', duration: 0, delay: 1.5});
    }
  };

  const navigateToProductPage = () => {
    navigate(`/products/${product.id}`);
  };

  return (
    <motion.div 
      ref={cardRef}
      className="bg-card rounded-lg shadow-lg overflow-hidden group product-card-container cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onClick={navigateToProductPage}
    >
      <div className="overflow-hidden">
        <LazyImage 
          src={(() => {
            const defaultPlaceholder = `/static/images/${product.type?.toLowerCase() || 'product'}-placeholder.jpg`;
            const imgUrl = product.image_url;
            if (Array.isArray(imgUrl) && imgUrl.length > 0 && typeof imgUrl[0] === 'string') return imgUrl[0];
            if (typeof imgUrl === 'string') {
              if (imgUrl.startsWith('[') && imgUrl.endsWith(']')) {
                try {
                  const parsedUrls = JSON.parse(imgUrl);
                  if (Array.isArray(parsedUrls) && parsedUrls.length > 0 && typeof parsedUrls[0] === 'string') return parsedUrls[0];
                } catch (e) { console.warn('ShopPage: Failed to parse image_url JSON string', imgUrl, e); }
              } else if (imgUrl.trim() !== "") return imgUrl;
            }
            return defaultPlaceholder;
          })()} 
          alt={product.name} 
          className="w-full h-64 object-contain bg-white group-hover:scale-105 transition-transform duration-500 ease-in-out" 
          loading="lazy" 
          width={400} 
          height={256}
          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
            (e.target as HTMLImageElement).src = `/static/images/${product.type?.toLowerCase() || 'product'}-placeholder.jpg`;
          }} 
        />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold text-primary mb-2 truncate" title={product.name}>{product.name}</h3>
        <p className="text-sm text-muted-foreground mb-1 capitalize">{product.type || 'General'}</p>
        <p className="text-foreground font-bold text-2xl mb-3">₹{product.price.toLocaleString('en-IN')}</p>
        <p className="text-muted-foreground text-sm mb-4 h-16 overflow-hidden text-ellipsis">{product.description || 'No description available'}</p>
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
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>(['All']);
  const shopTitleRef = useRef<HTMLHeadingElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Effect for fetching products and static GSAP animations (title, filters)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        if (data) {
          setProducts(data as Product[]);
          const productTypes = new Set<string>();
          (data as Product[]).forEach(p => { if (p.type) productTypes.add(p.type); });
          setCategories(['All', ...Array.from(productTypes)]);
        }
      } catch (error: any) {
        console.error('Error fetching products:', error);
        toast({ title: "Error loading products", description: "Could not load products.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();

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
    return () => {
      if (shopTitleRef.current) gsap.killTweensOf(shopTitleRef.current);
      if (filtersRef.current) gsap.killTweensOf(filtersRef.current);
    };
  }, [toast]);

  // Effect for GSAP animations on product cards, dependent on products and loading state
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || loading || products.length === 0) {
      const productCards = document.querySelectorAll('.product-card-container');
      if (productCards.length > 0) gsap.killTweensOf(productCards);
      return;
    }

    const setUpProductCardAnimations = () => {
      const productCards = document.querySelectorAll('.product-card-container');
      if (productCards.length > 0) {
        gsap.killTweensOf(productCards); 
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
    const timerId = setTimeout(setUpProductCardAnimations, 100);
    return () => {
      clearTimeout(timerId);
      const productCards = document.querySelectorAll('.product-card-container');
      if (productCards.length > 0) gsap.killTweensOf(productCards);
    };
  }, [loading, products]);

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
            No products found matching your criteria. Try adjusting your search or filters.
          </motion.p>
        )}
      </div>
    </div>
  );
};

export default ShopPage;
