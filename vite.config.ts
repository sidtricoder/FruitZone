import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },  server: {
    proxy: {
      // Forward all requests starting with /api to the backend server
      '/api': {
        target: 'http://localhost:5002', // Updated to match the new backend port
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
