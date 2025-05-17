import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"), // Using ./ since we're already in the frontend directory
    },
  },
  server: {
    proxy: {
      // Use the deployed backend URL for all API requests
      '/api': {
        target: 'https://server-orcin-beta.vercel.app',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path
      },
    },
  },
})