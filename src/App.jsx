import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { CurrencyProvider } from './contexts/CurrencyContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Productos from './pages/Productos'
import Clientes from './pages/Clientes'
import Contactos from './pages/Contactos'
import Ventas from './pages/Ventas'
import RealizarVenta from './pages/RealizarVenta'
import AnularDevolverVenta from './pages/AnularDevolverVenta'
import Correo from './pages/Correo'
import ConfiguracionCorreo from './pages/ConfiguracionCorreo'
import Tareas from './pages/Tareas'
import Reportes from './pages/Reportes'
import Marketing from './pages/Marketing'
import ConfiguracionMarketing from './pages/ConfiguracionMarketing'

function App() {
  // Obtener el base path desde la variable de entorno o usar el pathname actual
  const getBasePath = () => {
    // Si estamos en GitHub Pages, usar el pathname base
    if (import.meta.env.VITE_BASE_PATH) {
      return import.meta.env.VITE_BASE_PATH
    }
    // Detectar si estamos en GitHub Pages por la URL
    if (window.location.hostname.includes('github.io')) {
      const pathParts = window.location.pathname.split('/').filter(p => p)
      if (pathParts.length > 0 && pathParts[0] !== '') {
        return `/${pathParts[0]}/`
      }
    }
    return '/'
  }

  const basePath = getBasePath()

  // Asegurar que el viewport se aplique correctamente en móvil
  useEffect(() => {
    const setViewport = () => {
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover')
      }
      
      // Forzar ancho en móvil
      if (window.innerWidth <= 768) {
        document.documentElement.style.width = '100%'
        document.documentElement.style.maxWidth = '100%'
        document.body.style.width = '100%'
        document.body.style.maxWidth = '100vw'
        const root = document.getElementById('root')
        if (root) {
          root.style.width = '100%'
          root.style.maxWidth = '100vw'
        }
      }
    }
    
    setViewport()
    window.addEventListener('resize', setViewport)
    window.addEventListener('orientationchange', () => {
      setTimeout(setViewport, 100)
    })
    
    return () => {
      window.removeEventListener('resize', setViewport)
      window.removeEventListener('orientationchange', setViewport)
    }
  }, [])

  return (
    <ThemeProvider>
      <CurrencyProvider>
        <Router basename={basePath}>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/productos" element={<Productos />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/contactos" element={<Contactos />} />
              <Route path="/correo" element={<Correo />} />
              <Route path="/correo/configuracion" element={<ConfiguracionCorreo />} />
              <Route path="/ventas" element={<Ventas />} />
              <Route path="/ventas/realizar" element={<RealizarVenta />} />
              <Route path="/ventas/anular-devolver" element={<AnularDevolverVenta />} />
              <Route path="/tareas" element={<Tareas />} />
              <Route path="/reportes" element={<Reportes />} />
              <Route path="/marketing" element={<Marketing />} />
              <Route path="/marketing/configuracion" element={<ConfiguracionMarketing />} />
              <Route path="/marketing/callback" element={<ConfiguracionMarketing />} />
            </Routes>
          </Layout>
        </Router>
      </CurrencyProvider>
    </ThemeProvider>
  )
}

export default App

