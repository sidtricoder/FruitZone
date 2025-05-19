import React, { useRef, useEffect, useState } from 'react'; // Added useState
import { Link } from 'react-router-dom';
import { animate } from 'motion'; // Import animate from Motion One
import { ArrowRight } from 'lucide-react';
import { useLenis } from '@/hooks/useLenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three'; // Import THREE
import VANTA from 'vanta/dist/vanta.net.min'; // Import VANTA
import LazyImage from '@/components/ui/LazyImage';

gsap.registerPlugin(ScrollTrigger);

// Define Vanta type if @types/vanta is not available
declare global {
  interface Window {
    VANTA: any;
  }
}

const HomePage: React.FC = () => {
  useLenis();

  const heroSectionRef = useRef<HTMLElement>(null); // Ref for the entire hero section for context
  const heroTitleRef = useRef<HTMLHeadingElement>(null); // Added ref for H1
  const heroTextContainerRef = useRef<HTMLDivElement>(null); // Ref for the text container div
  const heroParaRef = useRef<HTMLParagraphElement>(null);
  const heroButtonRef = useRef<HTMLDivElement>(null);
  const benefitsSectionRef = useRef<HTMLElement>(null);
  const usageSectionRef = useRef<HTMLElement>(null);
  const ctaSectionRef = useRef<HTMLElement>(null);
  // const particleContainerRef = useRef<HTMLElement>(null); // No longer needed for GSAP particles
  const vantaRef = useRef<HTMLDivElement>(null); // Ref for Vanta.js container
  const [vantaEffect, setVantaEffect] = useState<any>(null); // Changed React.useState to useState

  useEffect(() => {
    const prefersReducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Hero Section Text Animation
    // Removed: gsap.fromTo(heroTextContainerRef.current.children, ...)

    if (!prefersReducedMotionQuery.matches) {
      // Animate H1 with Motion One
      if (heroTitleRef.current) {
        animate(
          heroTitleRef.current,
          { opacity: [0, 1], y: [30, 0] },
          { duration: 0.8, delay: 0.5, ease: "easeOut" } // Changed "ease-out" to "easeOut"
        );
      }

      // Animate paragraph with GSAP
      if (heroParaRef.current) {
        gsap.fromTo(
          heroParaRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.7 } // Adjusted delay
        );
      }

      // Animate button with GSAP
      if (heroButtonRef.current) {
        gsap.fromTo(
          heroButtonRef.current,
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.7)', delay: 0.9 } // Adjusted delay
        );
      }
    } else {
      // Set initial state directly if reduced motion is preferred
      if (heroTitleRef.current) {
        gsap.set(heroTitleRef.current, { opacity: 1, y: 0 });
      }
      if (heroParaRef.current) {
        gsap.set(heroParaRef.current, { opacity: 1, y: 0 });
      }
      if (heroButtonRef.current) {
        gsap.set(heroButtonRef.current, { opacity: 1, scale: 1 });
      }
    }

    // Parallax for animated background shapes
    if (heroSectionRef.current) {
      gsap.utils.toArray<HTMLElement>('.animated-bg-shape').forEach((shape) => { // Removed unused 'index'
        gsap.to(shape, {
          y: (_, target) => ScrollTrigger.maxScroll(window) * 0.1 * parseFloat(target.dataset.parallaxSpeed || '1'), // Replaced 'index' with '_'
          ease: 'none',
          scrollTrigger: {
            trigger: heroSectionRef.current, // Use hero section as trigger
            start: 'top top',
            end: 'bottom top',
            scrub: 1.5,
          },
        });
      });
    }

    // Benefits Section - Staggered card reveal
    if (benefitsSectionRef.current) {
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
    }

    // Usage Section - Image and text reveal
    if (usageSectionRef.current) {
      const usageImage = usageSectionRef.current.querySelector('.usage-image');
      const usageTextItems = usageSectionRef.current.querySelectorAll('.usage-text-item');

      if (usageImage) {
        gsap.fromTo(
          usageImage,
          { opacity: 0, x: -50 },
          {
            opacity: 1,
            x: 0,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: usageSectionRef.current,
              start: 'top 75%',
              toggleActions: 'play none none none',
            },
          }
        );
      }
      if (usageTextItems.length > 0) {
        gsap.fromTo(
          usageTextItems,
          { opacity: 0, x: 50 },
          {
            opacity: 1,
            x: 0,
            duration: 0.7,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: usageSectionRef.current,
              start: 'top 70%',
              toggleActions: 'play none none none',
            },
          }
        );
      }
    }

    // CTA Section - Reveal
    if (ctaSectionRef.current) {
      gsap.fromTo(
        ctaSectionRef.current.children, // Animate direct children of the CTA section
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
    }

    // Vanta.js NET effect initialization - Optimized for performance
    if (vantaRef.current && !vantaEffect) {
      if (!prefersReducedMotionQuery.matches) { // Only init Vanta if no reduced motion
        // Use setTimeout to delay the initialization of Vanta.js effect after critical content has loaded
        setTimeout(() => {
          const effect = VANTA({
            el: vantaRef.current,
            THREE: THREE, // Pass THREE object to Vanta
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            color: 0xffa500, // Orange color, adjust as needed
            backgroundColor: 0x0, // Transparent or match hero background
            points: 8.00, // Reduced from 10 for better performance
            maxDistance: 18.00, // Slightly reduced for better performance  
            spacing: 18.00, // Increased spacing for better performance
            showDots: true
          });
          setVantaEffect(effect);
        }, 300); // Short delay to allow critical content to load first
      }
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleReducedMotionChange = () => {
      gsap.globalTimeline.timeScale(prefersReducedMotion.matches ? 0 : 1);
      if (vantaEffect) {
        if (prefersReducedMotion.matches) {
          vantaEffect.destroy(); // Or vantaEffect.pause() if you want to resume
          setVantaEffect(null); // Clear effect if destroyed
        } else if (vantaRef.current && !vantaEffect && !prefersReducedMotionQuery.matches) { // Check if it needs reinitialization and reduced motion is off
          const effect = VANTA({
            el: vantaRef.current,
            THREE: THREE,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            color: 0xffa500,
            backgroundColor: 0x0,
            points: 10.00,
            maxDistance: 20.00,
            spacing: 15.00,
            showDots: true
          });
          setVantaEffect(effect);
        }
      }
    };
    handleReducedMotionChange(); // Initial check
    prefersReducedMotion.addEventListener('change', handleReducedMotionChange);

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());

      // Updated cleanup: Remove old target, add new specific ones if GSAP was used.
      // Motion One animations typically don't need manual cleanup like GSAP tweens for simple fire-and-forget.
      // gsap.killTweensOf(heroTextContainerRef.current?.children); // Removed

      if (heroParaRef.current) { // GSAP target
        gsap.killTweensOf(heroParaRef.current);
      }
      if (heroButtonRef.current) { // GSAP target
        gsap.killTweensOf(heroButtonRef.current);
      }
      
      const benefitCards = benefitsSectionRef.current?.querySelectorAll('.benefit-card');
      if (benefitCards) {
        gsap.killTweensOf(benefitCards);
      }
      
      const usageImage = usageSectionRef.current?.querySelector('.usage-image');
      if (usageImage) {
        gsap.killTweensOf(usageImage);
      }
      
      const usageTextItems = usageSectionRef.current?.querySelectorAll('.usage-text-item');
      if (usageTextItems) {
        gsap.killTweensOf(usageTextItems);
      }
      
      if (ctaSectionRef.current?.children) {
        gsap.killTweensOf(ctaSectionRef.current.children);
      }
      
      if (vantaEffect) {
        vantaEffect.destroy();
      }
      prefersReducedMotion.removeEventListener('change', handleReducedMotionChange);
    };
  // Add vantaEffect to dependency array to re-run if it changes (e.g., on destroy/recreate)
  }, [vantaEffect]); 

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 text-gray-800 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900 dark:text-gray-200">
      <section
        ref={heroSectionRef} // Add ref to the parent section for parallax trigger context
        className="py-24 md:py-32 text-center relative overflow-hidden"
      >
        {/* Vanta.js container - ensure it's behind other content */}
        <div ref={vantaRef} className="absolute inset-0 z-0 hero-vanta-canvas"></div>
        
        {/* Removed GSAP particle container */}
        {/* <div ref={particleContainerRef as React.RefObject<HTMLDivElement>} className="absolute inset-0 z-0 opacity-40 hero-particles"></div> */}
        
        {/* Animated background shapes - adjust z-index if needed with Vanta */}
        <div className="absolute inset-0 z-1 opacity-40"> {/* Ensure this is above Vanta if desired, or integrate shapes differently */}
          <div 
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-300 rounded-full filter blur-2xl animate-pulse-slow animated-bg-shape" 
            data-parallax-speed="0.5"
            // Framer motion animate and transition props can be removed if GSAP handles all motion
          />
          <div 
            className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-red-300 rounded-full filter blur-2xl animate-pulse-medium animated-bg-shape" 
            data-parallax-speed="0.8"
          />
           <div 
            className="absolute top-1/3 right-1/3 w-56 h-56 bg-orange-300 rounded-full filter blur-xl animate-pulse-fast animated-bg-shape" 
            data-parallax-speed="1.2"
          />
        </div>

        <div ref={heroTextContainerRef} className="relative z-10 container mx-auto px-6 py-12 md:py-20 bg-white/60 backdrop-blur-lg rounded-xl shadow-2xl max-w-4xl dark:bg-slate-800/60 dark:shadow-slate-700/50">
          <h1 // Changed from motion.h1
            ref={heroTitleRef} // Added ref
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-red-700 mb-6 leading-tight tracking-tight dark:from-amber-400 dark:via-orange-400 dark:to-red-500"
          >
            Unlock Nature's <span className="block md:inline">Concentrated Essence</span>
          </h1>
          <p // Changed from motion.p
            ref={heroParaRef}
            className="text-lg md:text-xl lg:text-2xl text-gray-700 dark:text-gray-300 mb-10 max-w-2xl mx-auto font-medium"
          >
            Experience the vibrant taste and potent nutrition of meticulously dehydrated fruits & vegetables – nature's goodness, intensified.
          </p>
          <div // Changed from motion.div
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
