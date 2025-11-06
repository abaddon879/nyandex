import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // This is where the frontend runs
    proxy: {
      // This is the magic key.
      // Any request from your React app starting with '/api'
      // will be forwarded to your XAMPP server.
      '/api': {
        target: 'http://nyandex.test', // Your XAMPP virtual host
        changeOrigin: true, // Recommended for virtual hosts
        secure: false,      // Do not validate SSL certs
      }
    }
  }
})