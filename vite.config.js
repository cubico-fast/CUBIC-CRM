import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  // Configuración para GitHub Pages (si se usa)
  base: process.env.NODE_ENV === 'production' ? '/CUBIC-CRM/' : '/'
})

