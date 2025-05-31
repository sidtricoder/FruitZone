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
  product_name: string;
  image_url: string | string[] | null;
}

const HomePage: React.FC = () => {
  useLenis();

  const heroSectionRef = useRef<HTMLElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroTextContainerRef = useRef<HTMLDivElement>(null);
  const heroParaRef = useRef<HTMLParagraphElement>(null);
  const heroButtonRef = useRef<HTMLDivElement>(null);
  const benefitsSectionRef = useRef<HTMLElement>(null);
  const usageSectionRef = useRef<HTMLElement>(null);
  const ctaSectionRef = useRef<HTMLElement>(null);
  // REMOVED: const vantaRef = useRef<HTMLDivElement>(null);
  // REMOVED: const [vantaEffect, setVantaEffect] = useState<any>(null);

  // ADDED: Refs and state for horizontal scroll
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
          .select('id, product_name, image_url')
          .order('created_at', { ascending: true })
          .limit(10); // Fetch 10 products

        if (error) {
          console.error('Error fetching products for scroll:', error);
          return;
        }
        if (data) {
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
      // REMOVED: Vanta-specific logic for reduced motion
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
      const items = gsap.utils.toArray<HTMLElement>('.product-scroll-item', track);

      if (items.length === 0) return; // Should not happen if productsForScroll.length > 0

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
      
      gsap.set(track, { display: 'flex'}); 
      
      setTimeout(() => {
        const scrollableWidth = track.scrollWidth - hero.offsetWidth;

        gsap.to(track, { 
          x: () => (scrollableWidth > 0 ? -scrollableWidth : 0),
          ease: 'none',
          scrollTrigger: {
            trigger: hero,
            pin: hero,
            scrub: 1,
            snap: (items.length > 1 && scrollableWidth > 0) ? (1 / (items.length - 1)) : undefined,
            end: () => `+=${hero.offsetWidth}`,
            invalidateOnRefresh: true,
            // markers: true, // Uncomment for debugging
          },
        });
      }, 100); 

    } else if (prefersReducedMotionQuery.matches && horizontalScrollTrackRef.current) {
      gsap.set(horizontalScrollTrackRef.current, { x: 0 });
      // If hero was pinned by a ScrollTrigger, ensure it's unpinned or handled for reduced motion
      // For simplicity, existing ScrollTriggers are killed in cleanup. If one was created for pinning hero,
      // it would be killed. If reduced motion is on, the ST above isn't created.
    }

    // Benefits Section - Staggered card reveal
    if (benefitsSectionRef.current && !prefersReducedMotionQuery.matches) {
      gsap.fromTo(
        benefitsSectionRef.current.querySelectorAll('.benefit-card'),
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: benefitsSectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );
    } else if (benefitsSectionRef.current) {
        gsap.set(benefitsSectionRef.current.querySelectorAll('.benefit-card'), {opacity: 1, y: 0});
    }

    // Usage Section - Image and text reveal
    if (usageSectionRef.current && !prefersReducedMotionQuery.matches) {
      const usageImage = usageSectionRef.current.querySelector('.usage-image');
      const usageTextItems = usageSectionRef.current.querySelectorAll('.usage-text-item');
      if (usageImage) {
        gsap.fromTo(usageImage, { opacity: 0, x: -50 }, { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: usageSectionRef.current, start: 'top 75%', toggleActions: 'play none none none' } });
      }
      if (usageTextItems.length > 0) {
        gsap.fromTo(usageTextItems, { opacity: 0, x: 50 }, { opacity: 1, x: 0, duration: 0.7, stagger: 0.15, ease: 'power3.out', scrollTrigger: { trigger: usageSectionRef.current, start: 'top 70%', toggleActions: 'play none none none' } });
      }
    } else if (usageSectionRef.current) {
        const usageImage = usageSectionRef.current.querySelector('.usage-image');
        const usageTextItems = usageSectionRef.current.querySelectorAll('.usage-text-item');
        if (usageImage) gsap.set(usageImage, {opacity: 1, x: 0});
        if (usageTextItems.length > 0) gsap.set(usageTextItems, {opacity: 1, x: 0});
    }


    // CTA Section - Reveal
    if (ctaSectionRef.current && !prefersReducedMotionQuery.matches) {
      gsap.fromTo(
        ctaSectionRef.current.children,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: ctaSectionRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    } else if (ctaSectionRef.current) {
        gsap.set(ctaSectionRef.current.children, {opacity: 1, y: 0});
    }

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      prefersReducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      // REMOVED: vantaEffect.destroy() and observer.disconnect()
      // Keep specific GSAP cleanups if still relevant, though ScrollTrigger.killAll() is broad.
      if (heroParaRef.current) gsap.killTweensOf(heroParaRef.current);
      if (heroButtonRef.current) gsap.killTweensOf(heroButtonRef.current);
      const benefitCards = benefitsSectionRef.current?.querySelectorAll('.benefit-card');
      if (benefitCards) gsap.killTweensOf(benefitCards);
      const usageImage = usageSectionRef.current?.querySelector('.usage-image');
      if (usageImage) gsap.killTweensOf(usageImage);
      const usageTextItems = usageSectionRef.current?.querySelectorAll('.usage-text-item');
      if (usageTextItems) gsap.killTweensOf(usageTextItems);
      if (ctaSectionRef.current?.children) gsap.killTweensOf(ctaSectionRef.current.children);
    };
  }, [productsForScroll]); // Added productsForScroll to dependency array

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 text-gray-800 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900 dark:text-gray-200">
      <section
        ref={heroSectionRef}
        className="text-center relative overflow-hidden min-h-screen" // Ensure enough height for pinning
      >
        {/* REMOVED: Vanta.js container */}
        {/* <div ref={vantaRef} className="absolute inset-0 z-0 hero-vanta-canvas"></div> */}

        {/* ADDED: Horizontal Scrolling Background */}
        <div ref={horizontalScrollContainerRef} className="absolute inset-0 z-0 overflow-hidden">
          <div ref={horizontalScrollTrackRef} className="flex h-full" style={{ display: 'none' }}> {/* Initially hidden until GSAP positions it */}
            {productsForScroll.map(product => (
              <div key={product.id} className="product-scroll-item h-full flex-shrink-0 w-[60vw] sm:w-[40vw] md:w-[30vw] lg:w-[25vw] p-2">
                <LazyImage
                  src={getFirstImageUrl(product.image_url, '/static/images/Dry_Daddy.png')} // Using Dry_Daddy.png as a placeholder
                  alt={product.product_name}
                  className="w-full h-full object-cover rounded-lg shadow-lg"
                  width={400} // Example width, adjust as needed
                  height={600} // Example height, adjust for aspect ratio
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* REMOVED: Animated background shapes - can be re-added if styled appropriately */}
        {/* <div className="absolute inset-0 z-1 opacity-40"> ... </div> */}

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

      {/* Benefits Section */}
      <section ref={benefitsSectionRef} className="py-16 md:py-24 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-orange-700 dark:text-orange-400 mb-12 md:mb-16">The Art of Dehydration</h2>
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[{
              title: "Peak Flavor & Aroma",
              description: "Our gentle, slow dehydration process locks in the natural sugars and aromatic compounds, delivering an unparalleled taste experience.",
              icon: "🍓"
            }, {
              title: "Nutrient Powerhouses",
              description: "Concentrated vitamins, minerals, and antioxidants in every morsel, supporting your vibrant well-being from the inside out.",
              icon: "✨"
            }, {
              title: "Sustainable Indulgence",
              description: "Reduce food waste and savor seasonal flavors year-round with our eco-conscious preservation. Good for you, good for the planet.",
              icon: "🌿"
            }].map((benefit, index) => (
              <div // Changed from motion.div
                key={index}
                // Removed Framer Motion props, GSAP handles this via scrollTrigger
                className="benefit-card bg-orange-50 dark:bg-slate-700 p-8 rounded-xl shadow-lg hover:shadow-2xl dark:shadow-orange-500/30 transition-shadow duration-300 flex flex-col items-center text-center"
              >
                <div className="text-5xl mb-5 p-4 bg-white dark:bg-slate-600 rounded-full shadow-md inline-block">{benefit.icon}</div>
                <h3 className="text-2xl font-semibold text-orange-600 dark:text-orange-400 mb-3">{benefit.title}</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Usage Section */}
      <section ref={usageSectionRef} className="py-16 md:py-24 bg-red-50 dark:bg-gray-800">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-red-700 dark:text-red-400 mb-12 md:mb-16">Unleash Culinary Creativity</h2>
          <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div // Changed from motion.div
              // GSAP will handle animation via .usage-image class
              className="usage-image overflow-hidden rounded-xl shadow-2xl dark:shadow-red-500/30"
            >
              <LazyImage 
                src="/static/images/home-usage-image.jpg" 
                alt="Artistic display of various dehydrated fruit and vegetable pieces in a bowl"
                className="rounded-xl object-cover w-full h-auto max-h-[450px] md:max-h-[500px] transform hover:scale-110 transition-transform duration-500 ease-out"
                loading="lazy"
                width={800}
                height={500}
              />
            </div>
            <div
              // GSAP will handle animation
              className="space-y-6"
            >
              {[{
                title: "Elevated Snacking",
                description: "Transform your snack time from mundane to magical with wholesome, intensely flavorful crisps and chews."
              }, {
                title: "Culinary Alchemy",
                description: "Unleash concentrated flavors in your signature dishes, baked goods, or as sophisticated gourmet garnishes."
              }, {
                title: "Artisanal Infusions",
                description: "Craft bespoke infused oils, vinegars, spirits, or teas with vibrant, pure fruit and herb notes."
              }, {
                title: "Wellness Boosters",
                description: "Effortlessly add a potent dose of natural vitamins and fiber to smoothies, trail mixes, or homemade energy bars."
              }].map((use, index) => (
                <div // Changed from motion.div
                  key={index} 
                  className="usage-text-item bg-white dark:bg-slate-700 p-6 rounded-lg shadow-md hover:shadow-lg dark:shadow-red-500/30 transition-shadow duration-300"
                  // GSAP will handle animation
                >
                  <h3 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">{use.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{use.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action - Shop Now */}
      <section ref={ctaSectionRef} className="py-20 md:py-28 bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 dark:from-amber-600 dark:via-orange-600 dark:to-red-700">
        <div className="container mx-auto px-6 text-center">
          <h2 // Changed from motion.h2
            // GSAP will handle animation
            className="text-3xl md:text-4xl font-bold text-white dark:text-gray-100 mb-6"
          >
            Ready to Taste the Difference?
          </h2>
          <p // Changed from motion.p
            // GSAP will handle animation
            className="text-lg md:text-xl text-red-100 dark:text-red-200 mb-10 max-w-2xl mx-auto"
          >
            Explore our curated selection of premium dehydrated fruits and vegetables. Uncompromising quality and extraordinary flavor, delivered.
          </p>
          <div // Changed from motion.div
            // GSAP will handle animation
          >
            <Link
              to="/shop"
              className="bg-white hover:bg-gray-100 text-orange-600 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-orange-500 font-bold py-3 px-8 md:py-4 md:px-10 rounded-full text-base md:text-lg transition-all duration-300 ease-in-out transform hover:scale-105 inline-flex items-center shadow-xl hover:shadow-2xl dark:shadow-orange-400/50"
            >
              Discover Our Products <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
