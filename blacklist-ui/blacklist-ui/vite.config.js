import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '::1',
      'risk-lens.net',
      'api.risk-lens.net'
    ]
  },
  preview: {
    host: true,
    port: 5173,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '::1',
      'risk-lens.net',
      'api.risk-lens.net'
    ]
  },

  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("react-dom") || id.includes("react-router-dom")) {
            return "vendor";
          }
          if (id.includes("lucide-react")) {
            return "lucide";
          }
          if (id.includes("LandingPage")) {
            return "landing";
          }
        }
      }
    }
  }
})
