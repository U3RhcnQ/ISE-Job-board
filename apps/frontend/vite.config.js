import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { // Add the 'server' configuration block
    proxy: {
      // String shorthand: /api -> http://localhost:8080/api
      // This will proxy any request starting with /api to your Spring Boot backend
      '/api': {
        target: 'http://localhost:8080', // Your Spring Boot backend address
        changeOrigin: true, // Needed for virtual hosted sites
        // Optional: rewrite path
        // rewrite: (path) => path.replace(/^\/api/, '') // if your backend doesn't expect /api prefix
      }
      // You can add more proxy rules here if needed
      // For example, for a different API context:
      // '/another-api': {
      //   target: 'http://localhost:8081',
      //   changeOrigin: true,
      // }
    }
  }
})
