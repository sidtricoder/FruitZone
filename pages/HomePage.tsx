import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLenis } from '@/hooks/useLenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import LazyImage from '@/components/ui/LazyImage';

gsap.registerPlugin(ScrollTrigger);

// ADDED: Interface for product data
interface ProductImageInfo {
  id: string;
  name: string; // Changed from product_name to name
  image_url: string | string[] | null;
}

// Static products data using images from public/static/images
const staticProducts: ProductImageInfo[] = [
  { id: '2', name: 'Chickoo', image_url: '/static/images/chickoo-1.png' },
  { id: '3', name: 'Kiwi', image_url: '/static/images/kiwi-1.png' },
  { id: '4', name: 'Pineapple', image_url: '/static/images/pineapple-1.png' },
  { id: '5', name: 'Apple', image_url: '/static/images/product-apple.jpg' },
  { id: '6', name: 'Carrot', image_url: '/static/images/product-carrot.jpg' },
  { id: '7', name: 'Mango', image_url: '/static/images/product-mango.jpg' },
  { id: '8', name: 'Pepper', image_url: '/static/images/product-pepper.jpg' },
  { id: '9', name: 'Strawberry', image_url: '/static/images/product-strawberry.jpg' },
  { id: '10', name: 'Tomato', image_url: '/static/images/product-tomato.jpg' },
];

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

  // ADDED: useEffect for setting static products
  useEffect(() => {
    setProductsForScroll(staticProducts);
  }, []);

  useEffect(() => {
    const prefersReducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleReducedMotionChange = () => {
      gsap.globalTimeline.timeScale(prefersReducedMotionQuery.matches ? 0 : 1);
    };
    handleReducedMotionChange(); // Initial check
    prefersReducedMotionQuery.addEventListener('change', handleReducedMotionChange);

    // GSAP Horizontal Scroll Animation - Scroll-triggered with infinite effect
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

        // Scroll through the tripled items for infinite effect
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

  // Create a list of products to display - no duplicates
  const displayProducts = productsForScroll;

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
