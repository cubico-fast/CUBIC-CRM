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

/**
 * Iniciar el flujo de autenticación OAuth con Meta
 * Redirige directamente a Facebook OAuth
 * @param {string} platform - 'facebook' o 'instagram'
 */
export const iniciarAutenticacionMeta = (platform = 'facebook') => {
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
    return
  }

  // Guardar el estado en localStorage para verificar después
  localStorage.setItem('meta_auth_state', platform)
  
  // Scopes necesarios para Facebook e Instagram
  const scopes = platform === 'instagram' 
    ? 'instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement'
    : 'pages_show_list,pages_read_engagement,pages_manage_metadata'
  
  // Construir URL de OAuth de Facebook
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${META_APP_ID}&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `scope=${encodeURIComponent(scopes)}&` +
    `response_type=code&` +
    `state=${platform}`
  
  // Redirigir a Facebook OAuth
  window.location.href = authUrl
}

/**
 * Obtener páginas de Facebook del usuario (directo desde Graph API)
 * @param {string} accessToken - Token de acceso del usuario
 */
export const obtenerPaginasFacebook = async (accessToken) => {
  try {
    // Obtener páginas directamente desde Graph API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}&fields=id,name,category,access_token`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Error al obtener páginas')
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error al obtener páginas de Facebook:', error)
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
    // NOTA: Esto normalmente requiere App Secret, pero Facebook permite obtener un token básico
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
      const error = await response.json()
      throw new Error(error.error?.message || 'Error al intercambiar código por token')
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error('Error al intercambiar código por token:', error)
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
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${instagramAccountId}?fields=id,username,account_type,profile_picture_url&access_token=${accessToken}`,
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
 * Guardar configuración de Meta en Firebase
 * @param {object} config - Configuración a guardar
 */
export const guardarConfiguracionMeta = async (config) => {
  try {
    const { db, collection, doc, setDoc } = await import('firebase/firestore')
    const { db: firestoreDb } = await import('../config/firebase')
    
    await setDoc(doc(firestoreDb, 'marketing_config', 'meta'), {
      ...config,
      updatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error al guardar configuración de Meta:', error)
    throw error
  }
}

/**
 * Obtener configuración de Meta desde Firebase
 */
export const obtenerConfiguracionMeta = async () => {
  try {
    const { db, collection, doc, getDoc } = await import('firebase/firestore')
    const { db: firestoreDb } = await import('../config/firebase')
    
    const docRef = doc(firestoreDb, 'marketing_config', 'meta')
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return docSnap.data()
    }
    return null
  } catch (error) {
    console.error('Error al obtener configuración de Meta:', error)
    return null
  }
}

