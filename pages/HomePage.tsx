import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

    // GSAP Horizontal Scroll Animation
    if (horizontalScrollTrackRef.current && heroSectionRef.current && productsForScroll.length > 0 && !prefersReducedMotionQuery.matches) {
      const track = horizontalScrollTrackRef.current;
      const hero = heroSectionRef.current;
      
      ScrollTrigger.getAll().forEach(trigger => {
        let isAssociated = false;
        if (trigger.animation) {
          const targets = (trigger.animation as any).targets ? (trigger.animation as any).targets() : [];
          if (Array.isArray(targets)) {
            isAssociated = targets.includes(track);
          }
        }
        if (trigger.trigger === hero || isAssociated) {
          trigger.kill();
        }
      });
      
      gsap.set(track, { display: 'flex', x: 0 });

      setTimeout(() => {
        const numOriginalProducts = productsForScroll.length;
        if (numOriginalProducts === 0) return;

        const allDomItems = gsap.utils.toArray<HTMLElement>('.product-scroll-item', track);
        
        if (allDomItems.length < numOriginalProducts * 2) {
            console.error(
              `Infinite scroll setup: Not all DOM items rendered. Expected: ${numOriginalProducts * 2}, Found: ${allDomItems.length}. Aborting GSAP setup for this attempt. Increase timeout or ensure images load faster.`
            );
            return; 
        }
        
        let oneSetWidth = 0;
        for (let i = 0; i < numOriginalProducts; i++) {
          if (allDomItems[i]) {
            const itemStyle = window.getComputedStyle(allDomItems[i]);
            const marginLeft = parseFloat(itemStyle.marginLeft);
            const marginRight = parseFloat(itemStyle.marginRight);
            oneSetWidth += allDomItems[i].offsetWidth + marginLeft + marginRight;
          } else {
            console.error(`Scroll item at index ${i} not found for width calculation. This should not happen if allDomItems.length check passed.`);
            return; 
          }
        }
        
        if (oneSetWidth === 0 || hero.offsetWidth === 0) {
            console.warn("oneSetWidth or hero.offsetWidth is 0, aborting ScrollTrigger setup. Check item visibility and dimensions.");
            return;
        }

        const loopingTl = gsap.timeline({ repeat: -1 });
        loopingTl.to(track, {
          x: -oneSetWidth,
          ease: "none",
          duration: numOriginalProducts * 2, // Adjusted duration slightly (e.g., 2s per item on average for 10 items = 20s)
        });

        ScrollTrigger.create({
          animation: loopingTl,
          trigger: hero,
          pin: hero,
          scrub: 1,
          // snap: { // Temporarily disabled for debugging glitch
          //   snapTo: 1 / numOriginalProducts, 
          //   duration: { min: 0.2, max: 0.6 },
          //   delay: 0,
          //   ease: "power1.inOut"
          // },
          end: () => `+=${oneSetWidth}`, // End scroll after one full set width has been scrolled
          invalidateOnRefresh: true,
          // markers: true,
        });
      }, 1500); // Increased timeout significantly to 1.5 seconds

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

  const displayProducts = productsForScroll.length > 0 
    ? [...productsForScroll, ...productsForScroll.map(p => ({...p, id: `${p.id}_clone_${Math.random().toString(36).substr(2, 9)}`}))] 
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
              <div key={`${product.id}-${index}`} className="product-scroll-item h-full flex-shrink-0 w-[60vw] sm:w-[40vw] md:w-[30vw] lg:w-[25vw] p-2">
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
        
        <div ref={heroTextContainerRef} className="relative z-10 container mx-auto px-6 py-12 md:py-20 bg-white/60 backdrop-blur-lg rounded-xl shadow-2xl max-w-4xl mt-[20vh] sm:mt-[25vh]"> {/* Added margin-top to push text down a bit */}
          <h1
            ref={heroTitleRef}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-red-700 mb-6 leading-tight tracking-tight dark:from-amber-400 dark:via-orange-400 dark:to-red-500"
          >
            Unlock Nature's <span className="block md:inline">Concentrated Essence</span>
          </h1>
          <p
            ref={heroParaRef}
            className="text-lg md:text-xl lg:text-2xl text-gray-700 dark:text-gray-300 mb-10 max-w-2xl mx-auto font-medium"
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
