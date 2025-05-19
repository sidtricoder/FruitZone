import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { imagetools } from 'vite-imagetools'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    imagetools({
      defaultDirectives: new URLSearchParams([
        ['format', 'webp'],
        ['quality', '80'],
        ['w', '800'],
        ['as', 'picture']
      ])
    })
  ],  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"), // Using ./ since we're already in the frontend directory
    },
  },
  server: {    proxy: {
      // Use the deployed backend URL for all API requests
      '/api': {
        target: 'https://fruit-zone-backend.vercel.app',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Reduce chunk size warnings
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          gsap: ['gsap'],
          three: ['three'],
        },
      },
    },
  },
})