import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Detectar el entorno
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV
const isNetlify = process.env.NETLIFY === 'true'
const isGitHubPages = process.env.GITHUB_PAGES === 'true'

// Determinar el base path
let basePath = '/'
if (process.env.VITE_BASE_PATH) {
  basePath = process.env.VITE_BASE_PATH
} else if (isVercel || isNetlify) {
  basePath = '/'
} else if (isGitHubPages) {
  basePath = '/CUBIC-CRM/'
} else {
  // Por defecto para desarrollo local
  basePath = '/'
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  base: basePath,
  build: {
    // Asegurar que los assets se generen correctamente
    assetsDir: 'assets',
    // No limitar el tamaño de los chunks para evitar problemas
    chunkSizeWarningLimit: 1000,
    // Asegurar que los assets se sirvan correctamente
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[ext]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    }
  }
})

