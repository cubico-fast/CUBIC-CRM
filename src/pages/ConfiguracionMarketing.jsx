import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Settings,
  Facebook,
  Instagram,
  CheckCircle,
  XCircle,
  Loader,
  ExternalLink,
  AlertCircle,
  Key,
  Link as LinkIcon
} from 'lucide-react'
import {
  iniciarAutenticacionMeta,
  obtenerPaginasFacebook,
  obtenerCuentaInstagram,
  guardarConfiguracionMeta,
  obtenerConfiguracionMeta,
  intercambiarCodigoPorToken
} from '../utils/metaApi'

const ConfiguracionMarketing = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState(null)
  const [cuentaInstagram, setCuentaInstagram] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Cargar configuración existente
  useEffect(() => {
    const cargarConfiguracion = async () => {
      try {
        const configData = await obtenerConfiguracionMeta()
        if (configData) {
          setConfig(configData)
          if (configData.paginaId) {
            // Si hay una página conectada pero no hay Instagram, intentar obtenerlo
            if (!configData.instagramAccountId && configData.paginaAccessToken) {
              try {
                const instagramAccount = await obtenerCuentaInstagram(
                  configData.paginaId,
                  configData.paginaAccessToken
                )
                if (instagramAccount) {
                  setCuentaInstagram(instagramAccount)
                  // Actualizar configuración con Instagram
                  const configActualizada = {
                    ...configData,
                    instagramAccountId: instagramAccount.id,
                    instagramUsername: instagramAccount.username,
                    updatedAt: new Date().toISOString()
                  }
                  await guardarConfiguracionMeta(configActualizada)
                  setConfig(configActualizada)
                }
              } catch (igError) {
                console.warn('No se pudo obtener cuenta de Instagram automáticamente:', igError)
                // No es crítico, continuar sin Instagram
              }
            }
          }
          if (configData.instagramAccountId) {
            setCuentaInstagram({
              id: configData.instagramAccountId,
              username: configData.instagramUsername
            })
          }
        }
      } catch (error) {
        console.error('Error al cargar configuración:', error)
      }
    }
    cargarConfiguracion()
  }, [])

  // Verificar si hay código o token en la URL (callback de OAuth - para compatibilidad con método anterior)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const token = urlParams.get('token')
    const platform = urlParams.get('platform') || urlParams.get('state') || localStorage.getItem('meta_auth_state') || 'facebook'
    const errorParam = urlParams.get('error')
    const errorDescription = urlParams.get('error_description')

    if (errorParam) {
      setError(`Error de autorización: ${errorDescription || errorParam}`)
      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname)
      localStorage.removeItem('meta_auth_state')
      return
    }

    // Si hay código (método anterior con redirección), intentar procesarlo
    if (code) {
      procesarCodigo(code, platform)
    } else if (token && platform) {
      // Si ya hay token (del backend), procesarlo directamente
      procesarToken(token, platform)
    }
  }, [])

  const procesarCodigo = async (code, platform) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Intercambiar código por token
      const accessToken = await intercambiarCodigoPorToken(code)
      
      // Procesar el token
      await procesarToken(accessToken, platform)
    } catch (error) {
      console.error('Error al procesar código:', error)
      const errorMessage = error.message || 'Error desconocido'
      
      // Mensaje más detallado según el tipo de error
      let mensajeError = `Error al procesar autorización: ${errorMessage}`
      
      if (errorMessage.includes('App Secret') || errorMessage.includes('backend')) {
        mensajeError += '\n\n💡 Solución: Necesitas configurar un backend para intercambiar el código por token de forma segura. Opciones:\n' +
          '1. Usar Vercel Functions o Netlify Functions\n' +
          '2. Usar el JavaScript SDK de Facebook (FB.login)\n' +
          '3. Configurar un servidor Node.js simple'
      } else if (errorMessage.includes('Failed to fetch')) {
        mensajeError += '\n\n💡 Esto puede deberse a restricciones de CORS o que Facebook requiere un backend para el intercambio de tokens.'
      }
      
      setError(mensajeError)
      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname)
      localStorage.removeItem('meta_auth_state')
    } finally {
      setLoading(false)
    }
  }

  const procesarToken = async (token, platform) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    console.log('🚀 Iniciando procesamiento de token...', { platform, tokenLength: token?.length })

    try {
      // Verificar el token primero
      if (!token) {
        throw new Error('No se recibió un token válido')
      }

      console.log('📝 Token recibido, longitud:', token.length, 'Primeros caracteres:', token.substring(0, 20) + '...')

      // Obtener páginas de Facebook
      // NOTA: obtenerPaginasFacebook ahora verifica permisos ANTES de intentar obtener páginas
      // Si no tiene pages_show_list, lanzará un error claro explicando el problema
      let paginas = await obtenerPaginasFacebook(token)

      if (paginas.length === 0) {
        // Si no se encontraron páginas automáticamente, intentar usar el ID conocido
        const PAGE_ID_KNOWN = '1393965578740952' // ID de página conocido del usuario
        
        console.log(`⚠️ No se encontraron páginas automáticamente, intentando usar ID conocido: ${PAGE_ID_KNOWN}`)
        
        try {
          // Intentar obtener información de la página directamente
          const pageInfoResponse = await fetch(
            `https://graph.facebook.com/v18.0/${PAGE_ID_KNOWN}?fields=id,name,category,access_token&access_token=${token}`
          )
          
          if (pageInfoResponse.ok) {
            const pageInfo = await pageInfoResponse.json()
            
            // Intentar obtener el access_token de la página desde /me/accounts
            let pageAccessToken = token // Por defecto usar el token del usuario
            
            try {
              const accountsResponse = await fetch(
                `https://graph.facebook.com/v18.0/me/accounts?access_token=${token}&fields=id,access_token`
              )
              
              if (accountsResponse.ok) {
                const accountsData = await accountsResponse.json()
                const paginaEncontrada = accountsData.data?.find(p => p.id === PAGE_ID_KNOWN)
                if (paginaEncontrada?.access_token) {
                  pageAccessToken = paginaEncontrada.access_token
                  console.log(`✅ Token de página obtenido desde /me/accounts`)
                }
              }
            } catch (e) {
              console.warn('⚠️ No se pudo obtener token desde /me/accounts, usando token del usuario')
            }
            
            // Si pageInfo tiene access_token, usarlo
            if (pageInfo.access_token) {
              pageAccessToken = pageInfo.access_token
              console.log(`✅ Token de página obtenido directamente`)
            }
            
            console.log(`✅ Página obtenida por ID: ${pageInfo.name} (${pageInfo.id})`)
            
            // Crear objeto de página compatible
            paginas.push({
              id: pageInfo.id,
              name: pageInfo.name,
              access_token: pageAccessToken,
              category: pageInfo.category
            })
          } else {
            const errorData = await pageInfoResponse.json()
            throw new Error(errorData.error?.message || 'No se pudo obtener información de la página')
          }
        } catch (idError) {
          console.error('❌ Error al obtener página por ID:', idError)
          
          // Si falla, mostrar mensaje de error
          const mensajeError = 'No se encontraron páginas de Facebook vinculadas a tu cuenta.\n\n' +
            'Esto significa que:\n' +
            '✅ Los permisos están correctos\n' +
            '❌ Pero no se pudo acceder a tus páginas\n\n' +
            'SOLUCIÓN:\n' +
            '1. Ve a https://www.facebook.com/pages/manage y verifica tus páginas\n' +
            '2. Asegúrate de que seas "Administrador" o "Editor" de la página\n' +
            '3. Verifica que la página esté asociada a tu cuenta personal de Facebook\n\n' +
            `Error al intentar usar ID conocido (${PAGE_ID_KNOWN}): ${idError.message}`
          throw new Error(mensajeError)
        }
      }

      console.log(`📋 Página encontrada: ${paginas[0]?.name || 'Ninguna'}`)

      // Obtener la primera página (Geampier Acuña)
      const pagina = paginas[0]
      
      if (!pagina) {
        throw new Error('No se encontró ninguna página de Facebook')
      }

      console.log(`✅ Página encontrada: ${pagina.name} (${pagina.id})`)

      // Intentar obtener cuenta de Instagram vinculada
      let instagramAccount = null
      try {
        instagramAccount = await obtenerCuentaInstagram(pagina.id, pagina.access_token)
        if (instagramAccount) {
          console.log(`✅ Instagram vinculado: @${instagramAccount.username}`)
        }
      } catch (e) {
        console.log(`ℹ️ No hay Instagram vinculado a esta página`)
      }

      // Guardar configuración directamente
      const configCompleta = {
        userAccessToken: token,
        platform: platform,
        paginaId: pagina.id,
        paginaNombre: pagina.name,
        paginaAccessToken: pagina.access_token,
        instagramAccountId: instagramAccount?.id || null,
        instagramUsername: instagramAccount?.username || null,
        connectedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await guardarConfiguracionMeta(configCompleta)
      setConfig(configCompleta)
      
      if (instagramAccount) {
        setCuentaInstagram(instagramAccount)
        setSuccess(`✅ ${pagina.name} y Instagram (@${instagramAccount.username}) conectados exitosamente.`)
      } else {
        setSuccess(`✅ ${pagina.name} conectada exitosamente.`)
      }
      
      // Limpiar URL y localStorage
      window.history.replaceState({}, document.title, window.location.pathname)
      localStorage.removeItem('meta_auth_state')
    } catch (error) {
      console.error('Error al procesar token:', error)
      setError(`Error al procesar autorización: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const conectarFacebook = async () => {
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      console.log('🔵 Iniciando conexión de Facebook...')
      
      // Mostrar mensaje informativo sobre permisos
      const confirmar = window.confirm(
        'IMPORTANTE: Para conectar Facebook correctamente, necesitas autorizar los siguientes permisos:\n\n' +
        '✅ pages_show_list (VER páginas)\n' +
        '✅ pages_read_engagement (LEER métricas)\n' +
        '✅ pages_manage_metadata (GESTIONAR metadatos)\n\n' +
        'Si ya autorizaste antes pero no funcionó, puedes:\n' +
        '1. Revocar permisos en: https://www.facebook.com/settings?tab=business_tools\n' +
        '2. Luego volver aquí y autorizar de nuevo\n\n' +
        '¿Continuar con la conexión?'
      )
      
      if (!confirmar) {
        setLoading(false)
        return
      }
      
      // Usar el SDK de Facebook para obtener el token directamente
      const accessToken = await iniciarAutenticacionMeta('facebook')
      console.log('✅ Token obtenido de iniciarAutenticacionMeta, longitud:', accessToken?.length)
      
      // Procesar el token obtenido
      await procesarToken(accessToken, 'facebook')
    } catch (error) {
      console.error('❌ Error al conectar Facebook:', error)
      console.error('❌ Stack trace:', error.stack)
      
      // Mensaje de error más detallado
      let mensajeError = error.message || 'Error desconocido'
      
      if (mensajeError.includes('pages_show_list')) {
        mensajeError += '\n\n💡 SOLUCIÓN:\n' +
          '1. Ve a https://www.facebook.com/settings?tab=business_tools\n' +
          '2. Busca tu app y haz clic en "Eliminar"\n' +
          '3. Vuelve aquí y haz clic en "Conectar Facebook" de nuevo\n' +
          '4. Asegúrate de autorizar TODOS los permisos'
      }
      
      setError(`Error al conectar Facebook: ${mensajeError}`)
    } finally {
      setLoading(false)
    }
  }

  const conectarInstagram = async () => {
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      // Usar el SDK de Facebook para obtener el token directamente
      const accessToken = await iniciarAutenticacionMeta('instagram')
      
      // Procesar el token obtenido
      await procesarToken(accessToken, 'instagram')
    } catch (error) {
      console.error('Error al conectar Instagram:', error)
      setError(`Error al conectar Instagram: ${error.message || 'Error desconocido'}`)
    } finally {
      setLoading(false)
    }
  }


  const desconectar = async () => {
    if (window.confirm('¿Estás seguro de que deseas desconectar las cuentas de Meta?')) {
      try {
        // Limpiar configuración
        await guardarConfiguracionMeta({})
        setConfig(null)
        setCuentaInstagram(null)
        setSuccess('✅ Cuentas desconectadas exitosamente.')
      } catch (error) {
        console.error('Error al desconectar:', error)
        setError('Error al desconectar cuentas')
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="text-primary-600" size={32} />
            Configuración de Marketing
          </h1>
          <p className="text-gray-600 mt-1">Conecta tus cuentas de redes sociales para ver métricas reales</p>
        </div>
        <button
          onClick={() => navigate('/marketing')}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Volver a Marketing
        </button>
      </div>

      {/* Alertas */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-lg flex items-start gap-3">
          <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Éxito</p>
            <p className="text-sm">{success}</p>
          </div>
        </div>
      )}

      {/* Instrucciones */}
      <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-2">Antes de comenzar:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Crea una app en <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="underline">Facebook for Developers</a></li>
              <li>Agrega los productos "Instagram Graph API" y "Facebook Login"</li>
              <li>Agrega el dominio en "App Domains": <code className="bg-blue-100 px-1 rounded">cubico-fast.github.io</code></li>
              <li>En "Facebook Login" → "Settings", agrega la URL de redirección: <code className="bg-blue-100 px-1 rounded">{window.location.origin}{window.location.pathname.includes('/CUBIC-CRM') ? '/CUBIC-CRM' : ''}/marketing/callback</code></li>
              <li>Agrega la variable de entorno <code className="bg-blue-100 px-1 rounded">VITE_META_APP_ID</code> en GitHub Secrets (solo el número del App ID)</li>
              <li className="text-green-600 font-semibold">✅ Ahora usamos el JavaScript SDK de Facebook, que maneja el OAuth de forma segura sin necesidad de backend.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Estado de conexión */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Facebook */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Facebook className="text-blue-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">Facebook</h3>
            </div>
            {config?.paginaId ? (
              <span className="flex items-center gap-2 text-green-600">
                <CheckCircle size={18} />
                Conectado
              </span>
            ) : (
              <span className="flex items-center gap-2 text-gray-400">
                <XCircle size={18} />
                No conectado
              </span>
            )}
          </div>

          {config?.paginaId ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Página conectada:</p>
                <p className="font-semibold text-gray-900">{config.paginaNombre}</p>
              </div>
              <button
                onClick={desconectar}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Desconectar
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Conecta tu cuenta de Facebook para ver métricas de tu página.
              </p>
              <button
                onClick={conectarFacebook}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin" size={18} />
                    Conectando...
                  </>
                ) : (
                  <>
                    <LinkIcon size={18} />
                    Conectar Facebook
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Instagram */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Instagram className="text-pink-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">Instagram</h3>
            </div>
            {cuentaInstagram ? (
              <span className="flex items-center gap-2 text-green-600">
                <CheckCircle size={18} />
                Conectado
              </span>
            ) : (
              <span className="flex items-center gap-2 text-gray-400">
                <XCircle size={18} />
                No conectado
              </span>
            )}
          </div>

          {cuentaInstagram ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Cuenta conectada:</p>
                <p className="font-semibold text-gray-900">@{cuentaInstagram.username || cuentaInstagram.id}</p>
              </div>
              <button
                onClick={desconectar}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Desconectar
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Conecta tu cuenta de Instagram Business para ver métricas.
              </p>
              {config?.paginaId && config?.paginaAccessToken ? (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 mb-2">
                    Tu página de Facebook "{config.paginaNombre}" ya está conectada. 
                    {config.paginaAccessToken ? ' Intentando obtener Instagram vinculado...' : ' Haz clic para buscar Instagram vinculado.'}
                  </p>
                  <button
                    onClick={async () => {
                      setLoading(true)
                      try {
                        const instagramAccount = await obtenerCuentaInstagram(
                          config.paginaId,
                          config.paginaAccessToken
                        )
                        if (instagramAccount) {
                          setCuentaInstagram(instagramAccount)
                          const configActualizada = {
                            ...config,
                            instagramAccountId: instagramAccount.id,
                            instagramUsername: instagramAccount.username,
                            updatedAt: new Date().toISOString()
                          }
                          await guardarConfiguracionMeta(configActualizada)
                          setConfig(configActualizada)
                          setSuccess('✅ Instagram conectado exitosamente.')
                        } else {
                          setError('No se encontró una cuenta de Instagram Business vinculada a esta página de Facebook. Asegúrate de que tu cuenta de Instagram sea Business o Creator y esté vinculada a la página.')
                        }
                      } catch (error) {
                        console.error('Error al obtener Instagram:', error)
                        setError(`Error al obtener Instagram: ${error.message || 'Asegúrate de que tu cuenta de Instagram sea Business o Creator y esté vinculada a la página de Facebook.'}`)
                      } finally {
                        setLoading(false)
                      }
                    }}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader className="animate-spin" size={18} />
                        Buscando Instagram...
                      </>
                    ) : (
                      <>
                        <LinkIcon size={18} />
                        Buscar Instagram Vinculado
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-400 mt-2">
                    O reconecta con permisos de Instagram:
                  </p>
                  <button
                    onClick={conectarInstagram}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                  >
                    {loading ? (
                      <>
                        <Loader className="animate-spin" size={18} />
                        Conectando...
                      </>
                    ) : (
                      <>
                        <LinkIcon size={18} />
                        Reconectar con Instagram
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={conectarInstagram}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader className="animate-spin" size={18} />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <LinkIcon size={18} />
                      Conectar Instagram
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>


      {/* Información de tokens (solo desarrollo) */}
      {import.meta.env.DEV && config?.userAccessToken && (
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <Key className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-semibold text-yellow-900 mb-2">Información de desarrollo</p>
            <div className="text-sm text-yellow-800 space-y-1">
              <p>Token de usuario: {config.userAccessToken.substring(0, 20)}...</p>
              {config.paginaAccessToken && (
                <p>Token de página: {config.paginaAccessToken.substring(0, 20)}...</p>
              )}
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConfiguracionMarketing

