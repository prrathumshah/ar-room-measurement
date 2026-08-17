import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const keyPath = path.resolve(__dirname, 'localhost-key.pem');
const certPath = path.resolve(__dirname, 'localhost.pem');
const hasLocalHttpsCert = fs.existsSync(keyPath) && fs.existsSync(certPath);

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'AICTE Digital Dimension Tracking',
        short_name: 'AICTE DIM',
        description: 'Physical facility inspection and room area verification',
        theme_color: '#0f172a',
        background_color: '#020817',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    https: hasLocalHttpsCert
      ? ({
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath)
        } as any)
      : undefined
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    https: hasLocalHttpsCert
      ? ({
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath)
        } as any)
      : undefined
  }
});
