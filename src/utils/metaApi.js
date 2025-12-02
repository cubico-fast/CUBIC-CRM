/**
 * Utilidades para interactuar con Meta Graph API (Facebook/Instagram)
 * Autenticación OAuth directa desde el frontend
 */

// Función helper para obtener y validar el App ID
const getMetaAppId = () => {
  const appId = import.meta.env.VITE_META_APP_ID
  
  // Debug: mostrar qué valor está recibiendo (solo en desarrollo)
  if (import.meta.env.DEV) {
    console.log('🔍 VITE_META_APP_ID raw:', appId, 'Type:', typeof appId)
  }
  
  // Si es undefined o null, retornar null
  if (!appId) {
    if (import.meta.env.DEV) {
      console.warn('⚠️ VITE_META_APP_ID no está definido')
    }
    return null
  }
  
  // Si es un objeto (JSON stringificado), intentar parsearlo
  if (typeof appId === 'object') {
    try {
      const parsed = typeof appId === 'string' ? JSON.parse(appId) : appId
      // Si tiene una propiedad 'id', usar esa
      if (parsed && parsed.id) {
        return String(parsed.id)
      }
      // Si es un objeto con otros campos, intentar extraer el ID
      return null
    } catch (e) {
      console.error('Error al parsear META_APP_ID:', e)
      return null
    }
  }
  
  // Si es un string, limpiarlo y validarlo
  const cleanId = String(appId).trim()
  
  // Validar que sea un número (App IDs de Facebook son numéricos)
  if (!/^\d+$/.test(cleanId)) {
    console.error('META_APP_ID no es un número válido:', cleanId)
    return null
  }
  
  return cleanId
}

const REDIRECT_URI = `${window.location.origin}${window.location.pathname.includes('/CUBIC-CRM') ? '/CUBIC-CRM' : ''}/marketing/callback`

// Variable para almacenar el estado de inicialización
let fbSDKInitialized = false
let fbSDKInitPromise = null

/**
 * Inicializar el SDK de Facebook
 * @param {string} appId - App ID de Facebook
 * @returns {Promise} Promise que se resuelve cuando el SDK está listo
 */
const inicializarFacebookSDK = (appId) => {
  // Si ya está inicializado con el mismo App ID, retornar el SDK directamente
  if (fbSDKInitialized && window.FB) {
    return Promise.resolve(window.FB)
  }

  // Si ya hay una inicialización en progreso, retornar esa promesa
  if (fbSDKInitPromise) {
    return fbSDKInitPromise
  }

  // Crear nueva promesa de inicialización
  fbSDKInitPromise = new Promise((resolve, reject) => {
    // Función para inicializar el SDK
    const initSDK = () => {
      try {
        if (!window.FB) {
          throw new Error('window.FB no está disponible')
        }
        
        window.FB.init({
          appId: appId,
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        })
        fbSDKInitialized = true
        console.log('✅ Facebook SDK inicializado correctamente con App ID:', appId)
        resolve(window.FB)
      } catch (error) {
        console.error('❌ Error al inicializar Facebook SDK:', error)
        reject(error)
      }
    }

    // Si el SDK ya está disponible, inicializarlo inmediatamente
    if (window.FB) {
      initSDK()
      return
    }

    // Si fbAsyncInit ya está definido, esperar a que se ejecute
    if (window.fbAsyncInit) {
      const originalInit = window.fbAsyncInit
      window.fbAsyncInit = function() {
        if (originalInit) originalInit()
        initSDK()
      }
    } else {
      // Configurar fbAsyncInit para que inicialice cuando el SDK se cargue
      window.fbAsyncInit = function() {
        initSDK()
      }
    }

    // Esperar a que el SDK se cargue (verificar cada 100ms)
    const checkSDK = setInterval(() => {
      if (window.FB) {
        clearInterval(checkSDK)
        initSDK()
      }
    }, 100)

    // Timeout después de 15 segundos
    setTimeout(() => {
      clearInterval(checkSDK)
      if (!fbSDKInitialized) {
        const error = new Error('El SDK de Facebook no se cargó en el tiempo esperado (15 segundos). Verifica que el script del SDK esté incluido en index.html y que no haya errores de red.')
        console.error('❌', error.message)
        reject(error)
      }
    }, 15000)
  })

  return fbSDKInitPromise
}

/**
 * Iniciar el flujo de autenticación OAuth con Meta usando JavaScript SDK
 * @param {string} platform - 'facebook' o 'instagram'
 * @returns {Promise<string>} Promise que se resuelve con el access token
 */
export const iniciarAutenticacionMeta = async (platform = 'facebook') => {
  const META_APP_ID = getMetaAppId()
  
  if (!META_APP_ID) {
    alert('Error: VITE_META_APP_ID no está configurado o no es válido.\n\n' +
      'Para configurarlo:\n' +
      '1. Ve a tu repositorio en GitHub\n' +
      '2. Settings → Secrets and variables → Actions\n' +
      '3. Agrega un nuevo secret llamado: VITE_META_APP_ID\n' +
      '4. Ingresa SOLO el número del App ID (ejemplo: 2954507758068155)\n' +
      '5. NO incluyas comillas ni objetos JSON\n' +
      '6. Vuelve a ejecutar el workflow de GitHub Actions\n\n' +
      'Obtén tu App ID en: https://developers.facebook.com/apps/')
    throw new Error('VITE_META_APP_ID no está configurado')
  }

  try {
    // Inicializar el SDK de Facebook con el App ID
    const FB = await inicializarFacebookSDK(META_APP_ID)

    // Scopes necesarios para Facebook e Instagram
    // pages_show_list: Ver todas las páginas del usuario
    // pages_read_engagement: Leer métricas de páginas
    // pages_manage_metadata: Gestionar metadatos de páginas
    // business_management: Acceder a información de negocios (necesario para businesses)
    const scopes = platform === 'instagram' 
      ? 'instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement,pages_manage_metadata,business_management'
      : 'pages_show_list,pages_read_engagement,pages_manage_metadata,business_management'

    // Usar FB.login() directamente - más simple y confiable
    return new Promise((resolve, reject) => {
      console.log('🔐 Solicitando login de Facebook con permisos:', scopes)
      
      // Verificar que FB.login esté disponible
      if (typeof FB.login !== 'function') {
        const error = new Error('FB.login no está disponible. El SDK de Facebook no se inicializó correctamente.')
        console.error('❌', error.message)
        reject(error)
        return
      }
      
      // IMPORTANTE: Usar auth_type: 'rerequest' para forzar que Facebook muestre
      // la solicitud de permisos de nuevo, incluso si el usuario ya autorizó antes
      // Esto es necesario porque si el usuario canceló permisos antes, no se volverán a solicitar
      FB.login((response) => {
        console.log('📥 Respuesta completa de FB.login:', JSON.stringify(response, null, 2))
        
        if (response.authResponse) {
          // Usuario autorizado, obtener el access token
          const accessToken = response.authResponse.accessToken
          const grantedScopes = response.authResponse.grantedScopes || response.authResponse.granted_scopes || ''
          
          console.log('✅ Login exitoso')
          console.log('   - Token obtenido (longitud:', accessToken.length + ')')
          console.log('   - Permisos concedidos:', grantedScopes)
          
          // Verificar que tenga el permiso pages_show_list
          const scopesArray = grantedScopes.split(',').map(s => s.trim())
          const tienePagesShowList = scopesArray.includes('pages_show_list')
          
          if (!tienePagesShowList) {
            console.error('❌ ERROR CRÍTICO: El permiso "pages_show_list" NO fue concedido')
            console.error('   Permisos concedidos:', scopesArray)
            console.error('   Permisos solicitados:', scopes.split(',').map(s => s.trim()))
            
            // Si no tiene pages_show_list, intentar solicitar de nuevo con rerequest
            console.log('🔄 Intentando solicitar permisos de nuevo con rerequest...')
            
            FB.login((rerequestResponse) => {
              if (rerequestResponse.authResponse) {
                const newToken = rerequestResponse.authResponse.accessToken
                const newScopes = rerequestResponse.authResponse.grantedScopes || rerequestResponse.authResponse.granted_scopes || ''
                const newScopesArray = newScopes.split(',').map(s => s.trim())
                
                console.log('📥 Respuesta de rerequest:', newScopesArray)
                
                if (newScopesArray.includes('pages_show_list')) {
                  console.log('✅ Ahora SÍ tiene pages_show_list')
                  resolve(newToken)
                } else {
                  const error = new Error(
                    'El permiso "pages_show_list" es REQUERIDO pero no fue concedido.\n\n' +
                    'SOLUCIÓN:\n' +
                    '1. Ve a https://www.facebook.com/settings?tab=business_tools\n' +
                    '2. Busca la app "Métricas de mis redes" (o el nombre de tu app)\n' +
                    '3. Haz clic en "Eliminar" para revocar todos los permisos\n' +
                    '4. Vuelve a esta página y haz clic en "Conectar Facebook" de nuevo\n' +
                    '5. Asegúrate de autorizar TODOS los permisos, especialmente "pages_show_list"'
                  )
                  console.error('❌', error.message)
                  reject(error)
                }
              } else {
                const error = new Error(
                  'No se pudieron obtener los permisos necesarios. Por favor, intenta de nuevo y autoriza todos los permisos solicitados.'
                )
                console.error('❌', error.message)
                reject(error)
              }
            }, {
              scope: scopes,
              auth_type: 'rerequest', // Forzar solicitud de permisos de nuevo
              return_scopes: true
            })
            
            return // No resolver aquí, esperar la respuesta del rerequest
          }
          
          // Si tiene todos los permisos necesarios, resolver con el token
          resolve(accessToken)
        } else {
          // Usuario canceló o hubo un error
          const errorCode = response.error?.code
          const errorMessage = response.error?.message || 'El usuario canceló la autorización o hubo un error'
          
          console.error('❌ Error en login de Facebook:')
          console.error('   - Código:', errorCode)
          console.error('   - Mensaje:', errorMessage)
          console.error('   - Respuesta completa:', response)
          
          // Mensajes más específicos según el código de error
          let mensajeFinal = errorMessage
          if (errorCode === 200) {
            mensajeFinal = 'El usuario canceló la autorización. Por favor, intenta de nuevo y autoriza todos los permisos, especialmente "pages_show_list".'
          } else if (errorCode === 190) {
            mensajeFinal = 'El token de acceso ha expirado. Por favor, intenta conectar de nuevo.'
          } else if (errorCode === 10) {
            mensajeFinal = 'Error de permisos. Asegúrate de autorizar todos los permisos solicitados, especialmente "pages_show_list".'
          }
          
          reject(new Error(mensajeFinal))
        }
      }, { 
        scope: scopes,
        auth_type: 'rerequest', // CRÍTICO: Forzar que Facebook muestre la solicitud de permisos
        return_scopes: true // Para ver qué permisos fueron concedidos
      })
    })
  } catch (error) {
    console.error('Error al inicializar Facebook SDK:', error)
    throw error
  }
}

/**
 * Obtener páginas de Facebook del usuario (directo desde Graph API)
 * Incluye paginación para obtener todas las páginas disponibles
 * @param {string} accessToken - Token de acceso del usuario
 */
export const obtenerPaginasFacebook = async (accessToken) => {
  try {
    console.log('🔍 ===== INICIO DEBUG OBTENER PÁGINAS =====')
    console.log('🔑 Token recibido (primeros 30 caracteres):', accessToken?.substring(0, 30) + '...')
    
    // PRIMERO: Verificar los permisos del token ANTES de intentar obtener páginas
    let tienePagesShowList = false
    try {
      const debugResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/permissions?access_token=${accessToken}`
      )
      if (debugResponse.ok) {
        const debugData = await debugResponse.json()
        const permisosArray = debugData.data || []
        const permisos = permisosArray.map(p => `${p.permission} (${p.status})`)
        
        console.log('🔍 Permisos del token:', permisos.join(', ') || 'No se pudieron obtener permisos')
        
        // Verificar específicamente si tiene pages_show_list
        tienePagesShowList = permisosArray.some(p => p.permission === 'pages_show_list' && p.status === 'granted')
        console.log('🔍 ¿Tiene pages_show_list?:', tienePagesShowList ? '✅ SÍ' : '❌ NO')
        
        // Si NO tiene pages_show_list, lanzar error ANTES de intentar obtener páginas
        if (!tienePagesShowList) {
          const permisosConcedidos = permisosArray
            .filter(p => p.status === 'granted')
            .map(p => p.permission)
          
          console.error('❌ ERROR CRÍTICO: El token NO tiene el permiso "pages_show_list" concedido')
          console.error('   Permisos concedidos:', permisosConcedidos.join(', ') || 'NINGUNO')
          console.error('   Permisos necesarios: pages_show_list, pages_read_engagement, pages_manage_metadata')
          
          throw new Error(
            'El token de acceso NO tiene el permiso "pages_show_list" concedido.\n\n' +
            'Esto significa que cuando autorizaste la app, no concediste este permiso.\n\n' +
            'SOLUCIÓN:\n' +
            '1. Ve a https://www.facebook.com/settings?tab=business_tools\n' +
            '2. Busca tu app y haz clic en "Eliminar" para revocar todos los permisos\n' +
            '3. Vuelve a esta página y haz clic en "Conectar Facebook" de nuevo\n' +
            '4. Cuando aparezca el popup de Facebook, asegúrate de:\n' +
            '   - Autorizar TODOS los permisos solicitados\n' +
            '   - Especialmente el permiso "pages_show_list"\n' +
            '   - Si ves "Editar configuración", haz clic y autoriza todos los permisos\n\n' +
            'Permisos concedidos actualmente: ' + (permisosConcedidos.length > 0 ? permisosConcedidos.join(', ') : 'NINGUNO')
          )
        }
      } else {
        const errorData = await debugResponse.json()
        console.error('❌ Error al verificar permisos:', errorData)
        throw new Error('No se pudieron verificar los permisos del token. Error: ' + (errorData.error?.message || 'Desconocido'))
      }
    } catch (e) {
      // Si el error ya es sobre permisos, relanzarlo
      if (e.message && e.message.includes('pages_show_list')) {
        throw e
      }
      // Si es otro error, mostrar advertencia pero continuar
      console.warn('⚠️ No se pudieron verificar permisos:', e)
      console.warn('⚠️ Continuando de todas formas, pero puede fallar...')
    }

    // Obtener información del usuario para debug
    try {
      const userResponse = await fetch(
        `https://graph.facebook.com/v18.0/me?access_token=${accessToken}&fields=id,name`
      )
      if (userResponse.ok) {
        const userData = await userResponse.json()
        console.log('👤 Usuario autenticado:', userData.name, `(ID: ${userData.id})`)
      } else {
        const errorData = await userResponse.json()
        console.error('❌ Error al obtener info del usuario:', errorData)
      }
    } catch (e) {
      console.warn('⚠️ No se pudo obtener información del usuario:', e)
    }

    let allPages = []
    let nextUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}&fields=id,name,category,access_token,tasks&limit=100`
    
    console.log('🔍 Obteniendo páginas de Facebook desde:', nextUrl.split('?')[0])
    
    // Obtener todas las páginas usando paginación
    let pageCount = 0
    while (nextUrl) {
      pageCount++
      console.log(`📄 Página ${pageCount} de resultados...`)
      
      const response = await fetch(nextUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('❌ Error en la respuesta:', error)
        throw new Error(error.error?.message || 'Error al obtener páginas')
      }

      const data = await response.json()
      
      console.log(`📋 Respuesta completa de Facebook:`, JSON.stringify(data, null, 2))
      console.log(`📋 Respuesta recibida:`, {
        totalEnEstaPagina: data.data?.length || 0,
        tienePaginacion: !!data.paging?.next,
        tieneError: !!data.error,
        error: data.error
      })
      
      // Si hay un error en la respuesta, lanzarlo
      if (data.error) {
        console.error('❌ Error en respuesta de Facebook:', data.error)
        throw new Error(data.error.message || `Error de Facebook: ${JSON.stringify(data.error)}`)
      }
      
      if (data.data && data.data.length > 0) {
        allPages = allPages.concat(data.data)
        console.log(`✅ Páginas en esta página:`, data.data.map(p => `${p.name} (${p.id})`))
      } else {
        console.warn('⚠️ La respuesta no contiene páginas (data.data está vacío o no existe)')
      }
      
      // Verificar si hay más páginas (paginación)
      if (data.paging && data.paging.next) {
        nextUrl = data.paging.next
        console.log('➡️ Hay más páginas, continuando...')
      } else {
        nextUrl = null
        console.log('✅ No hay más páginas')
      }
    }

    console.log(`✅ Total: Se encontraron ${allPages.length} página(s) de Facebook:`, allPages.map(p => `${p.name} (${p.id})`))
    console.log('🔍 ===== FIN DEBUG OBTENER PÁGINAS =====')
    
    if (allPages.length === 0) {
      console.error('❌ ===== PROBLEMA DETECTADO =====')
      console.error('❌ No se encontraron páginas de Facebook')
      console.error('')
      console.error('🔍 Diagnóstico:')
      console.error('1. Verifica en https://www.facebook.com/pages que tengas páginas donde seas administrador')
      console.error('2. Verifica que el token tenga el permiso "pages_show_list" (debería aparecer arriba)')
      console.error('3. Si el token es de larga duración, puede que necesites reconectar para obtener los permisos correctos')
      console.error('4. Prueba acceder directamente a: https://graph.facebook.com/v18.0/me/accounts?access_token=TU_TOKEN')
      console.error('')
      console.error('💡 Solución recomendada:')
      console.error('- Desconecta completamente (haz clic en "Desconectar")')
      console.error('- Cierra todas las sesiones de Facebook en tu navegador')
      console.error('- Vuelve a conectar y asegúrate de autorizar TODOS los permisos, especialmente "pages_show_list"')
    }
    
    return allPages
  } catch (error) {
    console.error('❌ Error al obtener páginas de Facebook:', error)
    throw error
  }
}


/**
 * Intercambiar código de autorización por token de acceso
 * NOTA: Esto normalmente requiere App Secret, pero intentaremos con el código directamente
 * @param {string} code - Código de autorización de Facebook
 */
export const intercambiarCodigoPorToken = async (code) => {
  const META_APP_ID = getMetaAppId()
  const REDIRECT_URI = `${window.location.origin}${window.location.pathname.includes('/CUBIC-CRM') ? '/CUBIC-CRM' : ''}/marketing/callback`
  
  if (!META_APP_ID) {
    throw new Error('VITE_META_APP_ID no está configurado o no es válido')
  }

  try {
    // Intentar obtener token de corta duración
    // NOTA: Facebook requiere App Secret para intercambiar código por token de forma segura
    // Sin App Secret, esta petición fallará. Se necesita un backend para esto.
    const response = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${META_APP_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `code=${code}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Error desconocido' } }))
      const errorMessage = errorData.error?.message || 'Error al intercambiar código por token'
      
      // Si el error indica que se necesita App Secret, proporcionar mensaje más claro
      if (errorMessage.includes('secret') || errorMessage.includes('app_secret') || errorMessage.includes('client_secret')) {
        throw new Error('Se requiere App Secret para intercambiar el código por token. Esto debe hacerse en un backend por seguridad. Por favor, configura un backend (Vercel Functions, Netlify Functions, etc.) o usa el JavaScript SDK de Facebook.')
      }
      
      throw new Error(errorMessage)
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error('Error al intercambiar código por token:', error)
    
    // Si es un error de red (CORS, fetch failed), proporcionar mensaje más claro
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      throw new Error('No se pudo conectar con Facebook. Esto puede deberse a que se requiere un backend para intercambiar el código por token de forma segura. El App Secret no puede estar en el frontend.')
    }
    
    throw error
  }
}

/**
 * Obtener cuenta de Instagram vinculada a una página de Facebook (directo desde Graph API)
 * @param {string} pageId - ID de la página de Facebook
 * @param {string} pageAccessToken - Token de acceso de la página
 */
export const obtenerCuentaInstagram = async (pageId, pageAccessToken) => {
  try {
    // Obtener cuenta de Instagram vinculada directamente desde Graph API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account{id,username}&access_token=${pageAccessToken}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Error al obtener cuenta de Instagram')
    }

    const data = await response.json()
    return data.instagram_business_account || null
  } catch (error) {
    console.error('Error al obtener cuenta de Instagram:', error)
    throw error
  }
}

/**
 * Obtener métricas de Instagram (insights) directamente desde Graph API
 * @param {string} instagramAccountId - ID de la cuenta de Instagram Business
 * @param {string} accessToken - Token de acceso
 * @param {string} metric - Métrica a obtener (impressions, reach, profile_views, etc.)
 * @param {string} period - Período (day, week, days_28)
 */
export const obtenerMetricasInstagram = async (instagramAccountId, accessToken, metric = 'impressions', period = 'day') => {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${instagramAccountId}/insights?metric=${metric}&period=${period}&access_token=${accessToken}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || `Error al obtener métrica ${metric}`)
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error(`Error al obtener métricas de Instagram (${metric}):`, error)
    throw error
  }
}

/**
 * Obtener información básica de la cuenta de Instagram directamente desde Graph API
 * @param {string} instagramAccountId - ID de la cuenta de Instagram Business
 * @param {string} accessToken - Token de acceso
 */
export const obtenerInfoInstagram = async (instagramAccountId, accessToken) => {
  try {
    // Campos disponibles para Instagram Business Account:
    // id, username, name, profile_picture_url, website, biography, followers_count, follows_count, media_count
    // NOTA: account_type no está disponible directamente en IGUser, se obtiene de otra forma
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${instagramAccountId}?fields=id,username,name,profile_picture_url,website,biography,followers_count,follows_count,media_count&access_token=${accessToken}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Error al obtener información de Instagram')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error al obtener información de Instagram:', error)
    throw error
  }
}

/**
 * Obtener métricas de Facebook Page directamente desde Graph API
 * @param {string} pageId - ID de la página de Facebook
 * @param {string} accessToken - Token de acceso
 * @param {string} metric - Métrica a obtener
 * @param {string} period - Período (day, week, days_28)
 */
export const obtenerMetricasFacebook = async (pageId, accessToken, metric = 'page_impressions', period = 'day') => {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/insights?metric=${metric}&period=${period}&access_token=${accessToken}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || `Error al obtener métrica ${metric}`)
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error(`Error al obtener métricas de Facebook (${metric}):`, error)
    throw error
  }
}

/**
 * Obtener información de la página de Facebook directamente desde Graph API
 * @param {string} pageId - ID de la página
 * @param {string} accessToken - Token de acceso
 */
export const obtenerInfoFacebook = async (pageId, accessToken) => {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}?fields=id,name,category,fan_count,followers_count,phone,website&access_token=${accessToken}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Error al obtener información de Facebook')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error al obtener información de Facebook:', error)
    throw error
  }
}

/**
 * Guardar configuración de Meta en Firebase de forma segura
 * Asocia los tokens con el usuario autenticado
 * Soporta múltiples páginas de Facebook
 * @param {object} config - Configuración a guardar (puede ser una página o array de páginas)
 */
export const guardarConfiguracionMeta = async (config) => {
  try {
    const { doc, setDoc, serverTimestamp, getDoc } = await import('firebase/firestore')
    const { db, auth } = await import('../config/firebase')
    
    // Obtener el usuario actual (si está autenticado)
    const userId = auth.currentUser?.uid || 'anonymous'
    
    // Si config.paginas es un array, guardar todas las páginas
    // Si no, convertir a array para mantener consistencia
    const paginas = config.paginas || (config.paginaId ? [{
      id: config.paginaId,
      name: config.paginaNombre,
      access_token: config.paginaAccessToken,
      instagramAccountId: config.instagramAccountId,
      instagramUsername: config.instagramUsername
    }] : [])
    
    // Obtener configuración existente para mergear
    const tokensRef = doc(db, 'marketing_tokens', userId)
    const tokensSnap = await getDoc(tokensRef)
    const existingTokens = tokensSnap.exists() ? tokensSnap.data() : {}
    
    // Construir objeto de páginas con tokens
    const paginasConTokens = {}
    paginas.forEach(pagina => {
      if (pagina.id) {
        paginasConTokens[pagina.id] = {
          id: pagina.id,
          name: pagina.name || pagina.nombre,
          access_token: pagina.access_token || pagina.accessToken,
          instagramAccountId: pagina.instagramAccountId || null,
          instagramUsername: pagina.instagramUsername || null,
          category: pagina.category || null
        }
      }
    })
    
    // Guardar tokens completos de forma segura en colección separada
    await setDoc(tokensRef, {
      // Token del usuario (para obtener páginas)
      userAccessToken: config.userAccessToken || existingTokens.userAccessToken || null,
      // Páginas con sus tokens (objeto con pageId como key)
      paginas: paginasConTokens,
      // Metadatos
      platform: config.platform || 'facebook',
      connectedAt: config.connectedAt || existingTokens.connectedAt || new Date().toISOString(),
      updatedAt: serverTimestamp(),
      userId: userId
    }, { merge: true })
    
    // Guardar también configuración pública (sin tokens sensibles)
    const configRef = doc(db, 'marketing_config', userId)
    const configSnap = await getDoc(configRef)
    const existingConfig = configSnap.exists() ? configSnap.data() : {}
    
    // Construir array de páginas sin tokens
    const paginasPublicas = paginas.map(pagina => ({
      id: pagina.id,
      name: pagina.name || pagina.nombre,
      instagramAccountId: pagina.instagramAccountId || null,
      instagramUsername: pagina.instagramUsername || null,
      category: pagina.category || null
    }))
    
    await setDoc(configRef, {
      platform: config.platform || 'facebook',
      paginas: paginasPublicas, // Array de todas las páginas
      connectedAt: config.connectedAt || existingConfig.connectedAt || new Date().toISOString(),
      updatedAt: serverTimestamp(),
      userId: userId
    }, { merge: true })
    
    console.log(`✅ Configuración de Meta guardada: ${paginas.length} página(s)`)
  } catch (error) {
    console.error('Error al guardar configuración de Meta:', error)
    throw error
  }
}

/**
 * Obtener configuración de Meta desde Firebase de forma segura
 * Retorna todas las páginas conectadas
 */
export const obtenerConfiguracionMeta = async () => {
  try {
    const { doc, getDoc } = await import('firebase/firestore')
    const { db, auth } = await import('../config/firebase')
    
    // Obtener el usuario actual (si está autenticado)
    const userId = auth.currentUser?.uid || 'anonymous'
    
    // Obtener tokens (solo el usuario puede acceder a sus propios tokens)
    const tokensRef = doc(db, 'marketing_tokens', userId)
    const tokensSnap = await getDoc(tokensRef)
    
    if (tokensSnap.exists()) {
      const tokensData = tokensSnap.data()
      
      // Obtener también la configuración pública
      const configRef = doc(db, 'marketing_config', userId)
      const configSnap = await getDoc(configRef)
      const configData = configSnap.exists() ? configSnap.data() : {}
      
      // Si hay páginas guardadas, combinarlas con sus tokens
      const paginas = []
      if (tokensData.paginas && typeof tokensData.paginas === 'object') {
        // tokensData.paginas es un objeto con pageId como key
        Object.values(tokensData.paginas).forEach(pagina => {
          paginas.push({
            id: pagina.id,
            name: pagina.name,
            access_token: pagina.access_token,
            instagramAccountId: pagina.instagramAccountId,
            instagramUsername: pagina.instagramUsername,
            category: pagina.category
          })
        })
      } else if (configData.paginas && Array.isArray(configData.paginas)) {
        // Si no hay tokens pero hay páginas públicas, usar esas
        configData.paginas.forEach(pagina => {
          const paginaConToken = tokensData.paginas?.[pagina.id]
          paginas.push({
            id: pagina.id,
            name: pagina.name,
            access_token: paginaConToken?.access_token || null,
            instagramAccountId: pagina.instagramAccountId,
            instagramUsername: pagina.instagramUsername,
            category: pagina.category
          })
        })
      } else if (tokensData.paginaId) {
        // Compatibilidad con formato anterior (una sola página)
        paginas.push({
          id: tokensData.paginaId,
          name: tokensData.paginaNombre,
          access_token: tokensData.paginaAccessToken,
          instagramAccountId: tokensData.instagramAccountId,
          instagramUsername: tokensData.instagramUsername
        })
      }
      
      return {
        ...configData,
        userAccessToken: tokensData.userAccessToken || null,
        paginas: paginas, // Array de todas las páginas con sus tokens
        // Compatibilidad: mantener campos individuales para la primera página
        paginaId: paginas[0]?.id || null,
        paginaNombre: paginas[0]?.name || null,
        paginaAccessToken: paginas[0]?.access_token || null,
        instagramAccountId: paginas[0]?.instagramAccountId || null,
        instagramUsername: paginas[0]?.instagramUsername || null
      }
    }
    
    return null
  } catch (error) {
    console.error('Error al obtener configuración de Meta:', error)
    return null
  }
}

/**
 * Eliminar configuración de Meta (desconectar)
 */
export const eliminarConfiguracionMeta = async () => {
  try {
    const { doc, deleteDoc } = await import('firebase/firestore')
    const { db, auth } = await import('../config/firebase')
    
    const userId = auth.currentUser?.uid || 'anonymous'
    
    // Eliminar tokens
    const tokensRef = doc(db, 'marketing_tokens', userId)
    await deleteDoc(tokensRef)
    
    // Eliminar configuración
    const configRef = doc(db, 'marketing_config', userId)
    await deleteDoc(configRef)
    
    console.log('✅ Configuración de Meta eliminada de Firestore')
  } catch (error) {
    console.error('Error al eliminar configuración de Meta:', error)
    throw error
  }
}


