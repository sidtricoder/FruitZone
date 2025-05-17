// This is a special entry point for the render build
// It allows us to bypass TypeScript compilation issues with vite.config.ts

// Import from the regular config
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },    
  server: {
    proxy: {
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
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
})
