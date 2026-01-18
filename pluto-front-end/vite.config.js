import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  define: {
    'global': 'window',
  },
  // Add this section to fix the Framer Motion build error
  build: {
    rollupOptions: {
      // Ensures that framer-motion is bundled correctly
      external: [], 
    },
  },
  optimizeDeps: {
    // Forces Vite to pre-bundle framer-motion for stability
    include: ['framer-motion'],
  },
})