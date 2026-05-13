import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
	  allowedHosts: 'all'
  },
	preview: {
    host: true,
    port: 5173,
    allowedHosts: 'all'
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
