import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: '/index.html',
        // mp3 = the pre-rendered pronunciation clips + ambience. They MUST be
        // precached, otherwise 🔊 is silent exactly where it's needed — offline
        // on the water.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2,mp3}'],
        // The whole point of this app is to work offline on a boat. Raise the
        // precache cap so no bundled chunk (the inlined vocab data lives in the
        // JS) is ever silently dropped from the offline cache.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      manifest: {
        name: 'Sailing Vocab',
        short_name: 'SailVocab',
        description: 'Russian-English sailing vocabulary trainer',
        start_url: '/#search',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#0ea5e9',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
