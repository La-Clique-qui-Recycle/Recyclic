import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    proxy: {
      '/api': {
        target: 'http://api:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Chunk pour les bibliothèques externes
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Chunk pour les composants UI
          ui: ['styled-components'],
          // Chunk pour l'API et les services
          api: ['./src/generated/api.ts', './src/generated/types.ts'],
          // Chunk pour les stores
          stores: ['./src/stores/authStore.ts'],
          // Chunk pour les pages admin (chargées moins fréquemment)
          admin: [
            './src/pages/Admin/Users.tsx',
            './src/pages/Admin/PendingUsers.tsx'
          ],
          // Chunk pour les pages de caisse
          cashier: [
            './src/pages/CashRegister.jsx'
          ]
        }
      }
    },
    // Augmenter la limite d'avertissement pour les chunks
    chunkSizeWarningLimit: 1000
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  define: {
    'process.env': {},
    'process': '{}'
  }
});
