import { defineConfig, loadEnv } from 'vite' // Import loadEnv
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          // Use the env var or default to your local test domain
          target: env.VITE_PROXY_TARGET || 'http://nyandex.test',
          changeOrigin: true,
          secure: false,
        }
      }
    }
  }
})