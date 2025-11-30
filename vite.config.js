import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  // Base path: usar '/CUBIC-CRM/' solo para GitHub Pages, '/' para otros (Vercel, Netlify, etc.)
  base: process.env.VITE_BASE_PATH || (process.env.VERCEL ? '/' : '/CUBIC-CRM/'),
  build: {
    // Asegurar que los assets se generen correctamente
    assetsDir: 'assets',
    // No limitar el tamaño de los chunks para evitar problemas
    chunkSizeWarningLimit: 1000
  }
})

