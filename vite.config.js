import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

// Detectar el entorno - Vercel siempre tiene VERCEL=1
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV
const isNetlify = process.env.NETLIFY === 'true'
const isGitHubPages = process.env.GITHUB_PAGES === 'true' || process.env.GITHUB_ACTIONS

// Determinar el base path
let basePath = '/'
if (process.env.VITE_BASE_PATH) {
  basePath = process.env.VITE_BASE_PATH
} else if (isVercel || isNetlify) {
  // Vercel y Netlify usan raíz
  basePath = '/'
} else if (isGitHubPages) {
  // GitHub Pages usa el nombre del repositorio
  basePath = '/CUBIC-CRM/'
} else {
  // Por defecto para desarrollo local
  basePath = '/'
}

console.log('🔧 Build config:', {
  isVercel,
  isNetlify,
  isGitHubPages,
  basePath,
  VERCEL: process.env.VERCEL,
  VERCEL_ENV: process.env.VERCEL_ENV
})

export default defineConfig({
  plugins: [
    react(),
    // Plugin para crear 404.html desde index.html después del build
    {
      name: 'copy-404',
      closeBundle() {
        const distPath = join(process.cwd(), 'dist')
        const indexPath = join(distPath, 'index.html')
        const notFoundPath = join(distPath, '404.html')
        
        try {
          let indexContent = readFileSync(indexPath, 'utf-8')
          
          // Agregar el script de ajuste de URL antes del cierre de </head>
          const urlFixScript = `
    <script>
      // Ajustar la URL antes de que React Router la maneje
      (function() {
        var path = window.location.pathname;
        var search = window.location.search;
        var hash = window.location.hash;
        
        // Detectar si estamos en GitHub Pages
        var isGitHubPages = window.location.hostname.includes('github.io');
        var repoName = '/CUBIC-CRM';
        
        // Remover '/404.html' si está presente
        path = path.replace('/404.html', '');
        
        // Si estamos en GitHub Pages y la ruta incluye el nombre del repo, removerlo
        if (isGitHubPages && path.startsWith(repoName)) {
          path = path.substring(repoName.length);
        }
        
        // Si la ruta está vacía o es solo '/', usar '/'
        if (!path || path === '/' || path === repoName || path === repoName + '/') {
          path = '/';
        }
        
        // Construir la nueva URL sin recargar la página
        var newPath = path + search + hash;
        
        // Usar history.replaceState para cambiar la URL sin recargar
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, '', newPath);
        }
      })();
    </script>`
          
          // Insertar el script antes del cierre de </head>
          indexContent = indexContent.replace('</head>', urlFixScript + '\n  </head>')
          
          // Escribir el archivo 404.html
          writeFileSync(notFoundPath, indexContent, 'utf-8')
          console.log('✅ 404.html creado exitosamente')
        } catch (error) {
          console.error('❌ Error al crear 404.html:', error)
        }
      }
    }
  ],
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

