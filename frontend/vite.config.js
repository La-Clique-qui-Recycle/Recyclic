import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Lire la version depuis package.json
const packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));

export default defineConfig({
  plugins: [react()],
  define: {
    // Exposer la version depuis package.json
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageJson.version),
    // Le commit SHA sera fourni par Docker via les variables d'environnement
    'import.meta.env.VITE_APP_COMMIT_SHA': JSON.stringify(process.env.VITE_APP_COMMIT_SHA || 'dev'),
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    cors: true,
    hmr: {
      host: 'localhost',
      protocol: 'ws',
    },
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    proxy: {
      '/api': {
        target: 'http://api:8000',
        changeOrigin: false,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        // Configuration explicite pour les requêtes POST et autres méthodes
        configure: (proxy, _options) => {
          // Logging configurable via variable d'environnement
          const enableProxyLogging = process.env.VITE_PROXY_LOGGING === 'true';
          
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          
          if (enableProxyLogging) {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          }
        },
        // Headers pour éviter les problèmes CORS
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Accept, Authorization, Cache-Control',
        },
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
          cash: [
            './src/pages/CashRegister.jsx'
          ]
        }
      }
    },
    // Augmenter la limite d'avertissement pour les chunks
    chunkSizeWarningLimit: 1000,
    // Configuration Terser pour supprimer les console.log en production
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging',
        drop_debugger: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging',
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },

});
