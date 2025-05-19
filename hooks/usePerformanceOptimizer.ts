// A utility for optimizing performance in React components
import { useEffect, useState, useCallback } from 'react';

type PerformanceConfig = {
  debounceMs?: number;
  throttleMs?: number;
  rafThrottleOptions?: {
    leading?: boolean;
    trailing?: boolean;
  };
};

// Detect if the browser supports the Intersection Observer API
export const supportsIntersectionObserver = typeof IntersectionObserver !== 'undefined';

// Custom hook for determining if an element is in view
export const useInView = (options = {}) => {
  const [ref, setRef] = useState(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref || !supportsIntersectionObserver) return;

    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
    }, options);

    observer.observe(ref);

    return () => {
      if (ref) observer.unobserve(ref);
    };
  }, [ref, options]);

  return [setRef, inView];
};

// Debounce function to limit how often a function is called
export const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

// Throttle function to limit execution to once per specified interval
export const throttle = (fn: Function, ms = 300) => {
  let lastCall = 0;
  return function (this: any, ...args: any[]) {
    const now = Date.now();
    if (now - lastCall < ms) return;
    lastCall = now;
    return fn.apply(this, args);
  };
};

// RAF-based throttle for animation-related callbacks
export const rafThrottle = (
  fn: Function, 
  { leading = true, trailing = true } = {}
) => {
  let rafId: number | null = null;
  let lastArgs: any[] | null = null;
  let leadingCall = false;

  return function (this: any, ...args: any[]) {
    lastArgs = args;
    
    if (rafId === null) {
      if (leading && !leadingCall) {
        leadingCall = true;
        fn.apply(this, lastArgs);
      }
      
      rafId = window.requestAnimationFrame(() => {
        if (trailing && lastArgs) {
          fn.apply(this, lastArgs);
        }
        rafId = null;
        leadingCall = false;
        lastArgs = null;
      });
    }
  };
};

// Bundle all performance utilities into a hook
export const usePerformanceOptimizer = ({
  debounceMs = 300,
  throttleMs = 300,
  rafThrottleOptions = { leading: true, trailing: true }
}: PerformanceConfig = {}) => {
  const debounceFn = useCallback(
    (fn: Function) => debounce(fn, debounceMs),
    [debounceMs]
  );

  const throttleFn = useCallback(
    (fn: Function) => throttle(fn, throttleMs),
    [throttleMs]
  );

  const rafThrottleFn = useCallback(
    (fn: Function) => rafThrottle(fn, rafThrottleOptions),
    [rafThrottleOptions]
  );

  return {
    debounce: debounceFn,
    throttle: throttleFn,
    rafThrottle: rafThrottleFn,
    useInView
  };
};

// Detect if device is low-end based on device memory and CPU cores
export const isLowEndDevice = () => {
  // @ts-ignore - navigator.deviceMemory is not in standard TypeScript types
  const lowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;
  const lowCPU = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
  return lowMemory || lowCPU;
};

// Get performance-appropriate settings based on device capabilities
export const getPerformanceSettings = () => {
  const lowEnd = isLowEndDevice();
  
  return {
    animations: {
      enableHeavy: !lowEnd, // Disable heavy animations on low-end devices
      enableParallax: !lowEnd, // Disable parallax effects on low-end devices
      throttleEvents: lowEnd ? 50 : 10, // More aggressive throttling on low-end devices
    },
    images: {
      quality: lowEnd ? 60 : 80, // Lower quality on low-end devices
      lazyLoadDistance: lowEnd ? 0.1 : 0.2, // Load images when closer on low-end devices
    }
  };
};

export default usePerformanceOptimizer;
