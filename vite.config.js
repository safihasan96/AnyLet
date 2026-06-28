import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5174,
    proxy: {
      // In dev, forward /api/* to the local Express API server.
      // In production (Vercel), serverless functions handle these routes natively.
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Any-Let',
        short_name: 'Any-Let',
        description: 'Find your perfect rental home.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      }
    }),
  ],
  build: {
    // Raise the warning threshold slightly — we handle it via manualChunks below
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — loaded first, cached longest by the browser
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Framer Motion — shared animation library across all pages
          'vendor-motion': ['framer-motion'],
          // Firebase — split by SDK so unused ones don't block initial load
          'vendor-firebase-app': ['firebase/app'],
          'vendor-firebase-auth': ['firebase/auth'],
          'vendor-firebase-firestore': ['firebase/firestore'],
          // Icons — large but highly cacheable after first load
          'vendor-icons': ['lucide-react'],
          // Leaflet map — only needed on the Map page (lazy-loads separately)
          'vendor-leaflet': ['leaflet'],
        }
      }
    }
  }
})
