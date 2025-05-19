import Lenis from 'lenis';
import { useEffect, useRef } from 'react';

export function useLenis() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const lenis = new Lenis({ // Try with minimal or no options first
        // duration: 1.2, 
        // easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
        // touchMultiplier: 2,
        // infinite: false,
      });

      function raf(time: number) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }

      requestAnimationFrame(raf);
      lenisRef.current = lenis;
    }

    return () => {
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, []);

  return lenisRef.current;
}
