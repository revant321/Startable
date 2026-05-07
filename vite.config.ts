import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Startable',
        short_name: 'Startable',
        description: 'Local-first goals, focus, and execution app',
        theme_color: '#0A0A0A',
        background_color: '#0A0A0A',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        icons: [
          {
            src: '/icons/App logo.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/App logo.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/App logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
