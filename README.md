# DryDaddy E-Commerce

A modern, conversion-focused e-commerce site for premium dehydrated fruits and vegetables, built with Vite.js, React, TypeScript, and Tailwind CSS.

## ✨ Features

- **Modern UI/UX**: Responsive, mobile-first design using Tailwind CSS and ShadCN UI components.
- **Dark Mode**: Seamless theme switching with `next-themes` and custom toggle.
- **Expressive Animations**: GSAP, Motion One, Framer Motion, and Vanta.js for smooth, conversion-boosting micro-interactions and page transitions.
- **Performance Optimized**:
  - Lazy loading and image optimization (vite-imagetools, custom `LazyImage` component)
  - Minified, code-split bundles (Vite + Terser)
  - Prefers-reduced-motion respected throughout
- **SEO Ready**: Meta description and best practices for discoverability.
- **Authentication**: Mock authentication context (Supabase-ready for real backend).
- **Cart & Checkout**: Animated cart modal, checkout flow, and coupon logic.
- **Reusable Hooks**: Custom hooks for smooth scrolling (`useLenis`), performance (`usePerformanceOptimizer`), and more.
- **Accessible**: Keyboard navigation, focus states, and ARIA labels.

## 🏗️ Code Advantages

- **TypeScript**: Type-safe, maintainable codebase.
- **Component-Driven**: Modular, reusable UI components and hooks.
- **Animation Modularization**: Animation logic is separated into hooks/utilities for maintainability and performance.
- **Configurable**: Easily switch deployment between Netlify, Vercel, or other static hosts.
- **Environment Variables**: `.env` for API keys and secrets (Supabase-ready).
- **Easy Theming**: Tailwind and ShadCN for rapid UI customization.

## 🚀 Further Improvements

- **Advanced Animations**: Integrate Lottie, Rive, Spline, or Curtains.js for richer visuals.
- **Page Transitions**: Add GSAP Flip or Barba.js for seamless navigation.
- **Image CDN**: Use a CDN for even faster image delivery.
- **Accessibility Audits**: Further improve ARIA and keyboard support.
- **Testing**: Add unit/integration tests (Jest, React Testing Library).
- **Backend Integration**: Connect to Supabase or another backend for real user/auth/product data.
- **PWA**: Add service worker for offline support.
- **Analytics**: Integrate Google Analytics or similar.

---

**Quick Start:**

```bash
npm install
npm run dev
```

---

For more details, see the code and comments throughout the project.

## Development

To run the frontend in development mode:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Building for Production

To build the frontend for production:

```bash
# Install dependencies
npm install

# Build for production
npm run build
```

The build output will be in the `dist` directory.

