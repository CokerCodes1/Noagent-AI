import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    cssCodeSplit: true,
    minify: "esbuild",
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        assetFileNames: "assets/[name]-[hash][extname]",
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        manualChunks(id) {
          if (id.includes('node_modules/@react-oauth/google')) return 'vendor-google';
          if (id.includes('node_modules/react-router-dom')) return 'vendor-router';
          if (id.includes('node_modules/framer-motion')) return 'vendor-motion';
          if (id.includes('node_modules/react-slick') || id.includes('node_modules/slick-carousel')) return 'vendor-slick';
          if (id.includes('node_modules/socket.io-client')) return 'vendor-io';
          if (id.includes('node_modules/react-toastify')) return 'vendor-toast';
          return undefined;
        }
      }
    }
  },
  server: {
    middlewareMode: false,
    cors: true
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'framer-motion'
    ]
  }
})
