import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  server: {
    allowedHosts: ['qr.pouchen.online', '.pouchen.online'],
    host: true,
    port: 5173
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 8192,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})
