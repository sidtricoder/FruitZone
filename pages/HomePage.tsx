import React, { useRef, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { animate } from 'motion';
import { ArrowRight } from 'lucide-react';
import { useLenis } from '@/hooks/useLenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import LazyImage from '@/components/ui/LazyImage';
import { supabase } from '@/lib/supabaseClient'; // ADDED: Supabase client

gsap.registerPlugin(ScrollTrigger);

// ADDED: Interface for product data
interface ProductImageInfo {
  id: string;
  name: string; // Changed from product_name to name
  image_url: string | string[] | null;
}

const HomePage: React.FC = () => {
  useLenis();
  const navigate = useNavigate();

  const heroSectionRef = useRef<HTMLElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroTextContainerRef = useRef<HTMLDivElement>(null);
  const heroParaRef = useRef<HTMLParagraphElement>(null);
  const heroButtonRef = useRef<HTMLDivElement>(null);

  const horizontalScrollContainerRef = useRef<HTMLDivElement>(null);
  const horizontalScrollTrackRef = useRef<HTMLDivElement>(null);
  const [productsForScroll, setProductsForScroll] = useState<ProductImageInfo[]>([]);

  // ADDED: Helper function to get the first image URL
  const getFirstImageUrl = (imageUrl: string | string[] | null, placeholder: string): string => {
    if (!imageUrl) return placeholder;
    try {
      if (typeof imageUrl === 'string') {
        if (imageUrl.startsWith('[') && imageUrl.endsWith(']')) {
          const parsedArray = JSON.parse(imageUrl);
          if (Array.isArray(parsedArray) && parsedArray.length > 0 && typeof parsedArray[0] === 'string') {
            return parsedArray[0];
          }
        }
        return imageUrl;
      }
      if (Array.isArray(imageUrl) && imageUrl.length > 0 && typeof imageUrl[0] === 'string') {
        return imageUrl[0];
      }
    } catch (error) {
      console.error("Error parsing image URL:", error);
    }
    return placeholder;
  };

  // ADDED: useEffect for fetching products
  useEffect(() => {
    const fetchProductsForScroll = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, image_url')
          .order('created_at', { ascending: true })
          .limit(10); // Fetch 10 products

        if (error) {
          console.error('Error fetching products for scroll:', error);
          return;
        }
        if (data) {
          // Ensure we have enough items for a good visual loop, duplicate if necessary
          // For true infinite feel with 10 items, duplicating once is good.
          // If less than 5, maybe duplicate more, but 10 is a good base.
          setProductsForScroll(data as ProductImageInfo[]);
        }
      } catch (err) {
        console.error('Unexpected error fetching products:', err);
      }
    };
    fetchProductsForScroll();
  }, []);

  useEffect(() => {
    const prefersReducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleReducedMotionChange = () => {
      gsap.globalTimeline.timeScale(prefersReducedMotionQuery.matches ? 0 : 1);
    };
    handleReducedMotionChange(); // Initial check
    prefersReducedMotionQuery.addEventListener('change', handleReducedMotionChange);

    // Hero Section Text Animation (H1 with Motion One, Para/Button with GSAP)
    if (!prefersReducedMotionQuery.matches) {
      if (heroTitleRef.current) {
        animate(
          heroTitleRef.current,
          { opacity: [0, 1], y: [30, 0] },
          { duration: 0.8, delay: 0.5, ease: "easeOut" }
        );
      }
      if (heroParaRef.current) {
        gsap.fromTo(
          heroParaRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.7 }
        );
      }
      if (heroButtonRef.current) {
        gsap.fromTo(
          heroButtonRef.current,
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.7)', delay: 0.9 }
        );
      }
    } else {
      if (heroTitleRef.current) gsap.set(heroTitleRef.current, { opacity: 1, y: 0 });
      if (heroParaRef.current) gsap.set(heroParaRef.current, { opacity: 1, y: 0 });
      if (heroButtonRef.current) gsap.set(heroButtonRef.current, { opacity: 1, scale: 1 });
    }

    // GSAP Horizontal Scroll Animation - Simple and reliable
    if (horizontalScrollTrackRef.current && heroSectionRef.current && productsForScroll.length > 0 && !prefersReducedMotionQuery.matches) {
      const track = horizontalScrollTrackRef.current;
      const hero = heroSectionRef.current;
      
      // Kill any existing ScrollTriggers for this hero section
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.trigger === hero) {
          trigger.kill();
        }
      });
      
      gsap.set(track, { display: 'flex', x: 0 });

      setTimeout(() => {
        const items = gsap.utils.toArray<HTMLElement>('.product-scroll-item', track);
        
        if (items.length === 0) {
          console.warn("No scroll items found");
          return;
        }

        // Simple approach: scroll through all items
        const trackWidth = track.scrollWidth;
        const containerWidth = hero.offsetWidth;
        const scrollDistance = trackWidth - containerWidth;

        if (scrollDistance <= 0) {
          console.warn("Not enough content to scroll");
          return;
        }

        gsap.to(track, {
          x: -scrollDistance,
          ease: "none",
          scrollTrigger: {
            trigger: hero,
            pin: hero,
            scrub: 1,
            start: "top top",
            end: () => `+=${scrollDistance}`,
            invalidateOnRefresh: true,
            // markers: true, // Uncomment for debugging
          }
        });

      }, 300);

    } else if (prefersReducedMotionQuery.matches && horizontalScrollTrackRef.current) {
      gsap.set(horizontalScrollTrackRef.current, { x: 0 });
    }

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      prefersReducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      if (heroParaRef.current) gsap.killTweensOf(heroParaRef.current);
      if (heroButtonRef.current) gsap.killTweensOf(heroButtonRef.current);
    };
  }, [productsForScroll]);

  // Create a list of products to display - just double for simple infinite effect
  const displayProducts = productsForScroll.length > 0 
    ? [...productsForScroll, ...productsForScroll]
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 text-gray-800 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900 dark:text-gray-200">
      <section
        ref={heroSectionRef}
        className="text-center relative overflow-hidden min-h-screen"
      >
        <div ref={horizontalScrollContainerRef} className="absolute inset-0 z-0 overflow-hidden">
          {/* Render the duplicated list of products */}
          <div ref={horizontalScrollTrackRef} className="flex h-full" style={{ display: 'none' }}>
            {displayProducts.map((product, index) => (
              <div 
                key={`${product.id}-${index}`} 
                className="product-scroll-item h-full flex-shrink-0 w-[60vw] sm:w-[40vw] md:w-[30vw] lg:w-[25vw] p-2 cursor-pointer transition-transform duration-300 hover:scale-105"
                onClick={() => navigate(`/products/${product.id}`)}
              >
                <LazyImage
                  src={getFirstImageUrl(product.image_url, '/static/images/Dry_Daddy.png')}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-lg shadow-lg"
                  width={400}
                  height={600}
                />
              </div>
            ))}
          </div>
        </div>
        
        <div ref={heroTextContainerRef} className="relative z-10 px-6 py-12 md:py-20 bg-white/60 backdrop-blur-lg rounded-xl shadow-2xl max-w-2xl ml-6 md:ml-12 lg:ml-16 mt-[20vh] sm:mt-[25vh]"> {/* Positioned to left with left margin */}
          <h1
            ref={heroTitleRef}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-red-700 mb-6 leading-tight tracking-tight dark:from-amber-400 dark:via-orange-400 dark:to-red-500"
          >
            Unlock Nature's <span className="block md:inline">Concentrated Essence</span>
          </h1>
          <p
            ref={heroParaRef}
            className="text-base md:text-lg lg:text-xl text-gray-700 dark:text-gray-300 mb-10 font-medium"
          >
            Experience the vibrant taste and potent nutrition of meticulously dehydrated fruits & vegetables – nature's goodness, intensified.
          </p>
          <div
            ref={heroButtonRef}
          >
            <Link
              to="/shop"
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3 px-8 md:py-4 md:px-10 rounded-full text-base md:text-lg transition-all duration-300 ease-in-out transform hover:scale-105 inline-flex items-center shadow-lg hover:shadow-xl dark:shadow-red-500/50"
            >
              Explore the Collection <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* REMOVED: Benefits Section JSX */}
      {/* REMOVED: Usage Section JSX */}
      {/* REMOVED: Call to Action - Shop Now JSX */}
    </div>
  );
};

export default HomePage;
