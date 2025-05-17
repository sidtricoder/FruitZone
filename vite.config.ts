import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./frontend"), // Changed from ./src to ./frontend
    },
  },  server: {
    proxy: {
      // Forward all requests starting with /api to the backend server
      '/api': {
        target: 'https://fruit-zone-backend.vercel.app/', // Updated to match the new backend port
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
