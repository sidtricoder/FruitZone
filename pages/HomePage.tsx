import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLenis } from '@/hooks/useLenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import LazyImage from '@/components/ui/LazyImage';
import { supabase } from '@/lib/supabaseClient';

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
        className="relative overflow-hidden min-h-screen"
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
      </section>

      {/* REMOVED: Benefits Section JSX */}
      {/* REMOVED: Usage Section JSX */}
      {/* REMOVED: Call to Action - Shop Now JSX */}
    </div>
  );
};

export default HomePage;
