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
          
          // Ajustar las rutas de los assets para que funcionen desde cualquier ruta
          // Reemplazar rutas absolutas que empiezan con /assets/ para que sean relativas o con basePath
          const repoName = '/CUBIC-CRM'
          indexContent = indexContent.replace(
            /(src|href)="\/(assets\/[^"]+)"/g,
            (match, attr, path) => {
              // Si el basePath incluye el repo, mantener la ruta absoluta con el prefijo
              if (basePath.includes('CUBIC-CRM')) {
                return `${attr}="${basePath}${path.substring(1)}"`
              }
              // Si no, usar ruta relativa desde la raíz
              return `${attr}="${path}"`
            }
          )
          
          // Agregar el script de ajuste de URL INMEDIATAMENTE después de <head> para que se ejecute primero
          // Este script debe ejecutarse de forma síncrona antes de cualquier otro script
          const urlFixScript = `
    <script>
      // Ajustar la URL INMEDIATAMENTE antes de que se cargue cualquier cosa
      // Este script debe ejecutarse de forma síncrona y bloqueante
      (function() {
        var path = window.location.pathname;
        var search = window.location.search;
        var hash = window.location.hash;
        var originalPath = path;
        
        // Detectar si estamos en GitHub Pages
        var isGitHubPages = window.location.hostname.includes('github.io');
        var repoName = '/CUBIC-CRM';
        var basePath = isGitHubPages ? repoName + '/' : '/';
        
        // Si estamos en una página 404, intentar restaurar la ruta desde sessionStorage
        // o usar el referrer como fallback
        if (path.includes('404.html')) {
          // Intentar obtener la ruta guardada en sessionStorage
          var savedPath = sessionStorage.getItem('ghp_404_redirect');
          if (savedPath) {
            path = savedPath;
            sessionStorage.removeItem('ghp_404_redirect');
          } else {
            // Si no hay ruta guardada, intentar usar el referrer
            var referrer = document.referrer;
            if (referrer && referrer.includes(window.location.origin)) {
              try {
                var referrerUrl = new URL(referrer);
                var referrerPath = referrerUrl.pathname;
                // Si el referrer tiene una ruta válida y no es 404.html, usarla
                if (referrerPath && referrerPath !== path && !referrerPath.includes('404.html') && !referrerPath.includes('index.html')) {
                  path = referrerPath;
                } else {
                  // Si no hay referrer válido, usar la raíz
                  path = basePath;
                }
              } catch (e) {
                // Si falla, usar la raíz
                path = basePath;
              }
            } else {
              // Si no hay referrer, usar la raíz
              path = basePath;
            }
          }
        } else {
          // Si no estamos en 404.html, guardar la ruta actual en sessionStorage
          // para que esté disponible si se carga un 404
          if (isGitHubPages && path && !path.includes('index.html') && !path.includes('404.html')) {
            sessionStorage.setItem('ghp_404_redirect', path);
          }
          
          // Asegurarnos de que la ruta tenga el prefijo correcto
          if (isGitHubPages) {
            if (!path.startsWith(repoName)) {
              if (path === '/') {
                path = basePath;
              } else {
                path = repoName + (path.startsWith('/') ? path : '/' + path);
              }
            }
          }
        }
        
        // Construir la nueva URL completa
        var newPath = path + search + hash;
        
        // Usar history.replaceState para cambiar la URL sin recargar
        // Esto permite que React Router maneje la ruta correctamente
        if (window.history && window.history.replaceState) {
          try {
            // Solo ajustar si la ruta es diferente
            if (originalPath !== newPath) {
              window.history.replaceState(null, '', newPath);
            }
          } catch (e) {
            console.warn('Error al ajustar URL:', e);
          }
        }
      })();
    </script>`
          
          // Insertar el script INMEDIATAMENTE después de <head> para máxima prioridad
          indexContent = indexContent.replace(
            /(<head[^>]*>)/,
            '$1' + urlFixScript
          )
          
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

