import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/mo/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '墨水',
        short_name: '墨水',
        start_url: '/mo/#/',
        scope: '/mo/',
        display: 'standalone',
        background_color: '#fafafa',
        theme_color: '#ff6d5a',
      },
      workbox: {
        navigateFallback: '/mo/index.html',
        globPatterns: ['**/*.{js,css,html,webp,png,jpg}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  server: { port: 5173 },
  build: {
    target: 'es2022',
    sourcemap: true,
    chunkSizeWarningLimit: 900,
  },
});
