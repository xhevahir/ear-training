/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    VitePWA({
      // A new version waits until every window is closed, so a running session is never
      // reloaded; it takes over on the next launch.
      registerType: 'prompt',
      injectRegister: 'script',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'Ear Training',
        short_name: 'Ear Training',
        description: 'Level-based ear training: scale degrees and intervals.',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#f7f5f0',
        theme_color: '#2f5d8a',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // app shell, sample manifests and the piano are available offline from the first load
        globPatterns: ['**/*.{js,css,html,svg,png,json}', 'samples/piano/*.mp3'],
        runtimeCaching: [
          {
            // other instruments are cached the first time they are used
            urlPattern: /\/samples\/.+\.mp3$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'instrument-samples',
              expiration: { maxEntries: 400 },
            },
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: { input: 'index.html' },
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
