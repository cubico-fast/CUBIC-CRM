# 🔐 Solución: Error "Missing Permission" en Graph API Explorer

## ❌ Problema

Estás obteniendo el error:
```
(#100) Missing Permission
OAuthException
```

Al intentar acceder a:
```
/me?fields=id,name,businesses{instagram_business_accounts{id,ig_id,name}}
```

## 🔍 Causa

El token de acceso que estás usando en el Graph API Explorer **no tiene los permisos necesarios** para acceder a la información de negocios (`businesses`) e Instagram.

## ✅ Solución: Generar Token con Permisos Correctos

### Paso 1: En el Graph API Explorer

1. **Ve al panel derecho** donde dice "Generate Access Token"
2. **Haz clic en "Generate Access Token"**
3. **Selecciona tu App** en el dropdown "App de Meta"
4. **En "Usuario o página"**, selecciona tu usuario o página
5. **En la pestaña "Permissions"**, agrega TODOS estos permisos:

#### Permisos Requeridos:

**Para Facebook Pages:**
- ✅ `pages_show_list` - Ver lista de páginas
- ✅ `pages_read_engagement` - Leer métricas de páginas
- ✅ `pages_read_user_content` - Leer contenido de páginas
- ✅ `pages_manage_metadata` - Gestionar metadatos (opcional pero recomendado)

**Para Instagram Business:**
- ✅ `instagram_basic` - Acceso básico a Instagram
- ✅ `instagram_manage_insights` - Ver métricas de Instagram
- ✅ `business_management` - **IMPORTANTE**: Necesario para acceder a `businesses`

**Para acceder a businesses:**
- ✅ `business_management` - **CRÍTICO** para acceder a la información de negocios

### Paso 2: Generar el Token

1. **Marca todos los permisos** mencionados arriba
2. **Haz clic en "Generate Access Token"**
3. **Autoriza la aplicación** cuando Facebook te lo solicite
4. **Copia el token generado**

### Paso 3: Probar la Consulta

1. **Pega el token** en el campo "Access Token"
2. **Prueba la consulta nuevamente:**
   ```
   /me?fields=id,name,businesses{instagram_business_accounts{id,ig_id,name}}
   ```

## 🔧 Verificar Permisos en tu Aplicación

Tu aplicación debe solicitar estos permisos. Verifica que estén configurados:

### En `src/utils/metaApi.js`:

```javascript
const scopes = platform === 'instagram' 
  ? 'instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement,pages_manage_metadata,business_management'
  : 'pages_show_list,pages_read_engagement,pages_manage_metadata,business_management'
```

### En `backend/routes/marketing.js`:

```javascript
const scopes = platform === 'instagram'
  ? 'instagram_basic,instagram_manage_insights,pages_read_engagement,pages_read_user_content,business_management'
  : 'pages_read_engagement,pages_read_user_content,pages_show_list,business_management';
```

## ⚠️ Permisos Especiales

Algunos permisos como `business_management` pueden requerir:

1. **Revisión de Facebook**: La app debe estar en modo "Live" o tener permisos aprobados
2. **Verificación de negocio**: Tu cuenta debe estar verificada como negocio
3. **Página de Facebook vinculada**: La cuenta de Instagram debe estar vinculada a una página de Facebook

## 🐛 Si Aún No Funciona

### 1. Verificar que la App esté en Modo Desarrollo

Si tu app está en modo "Desarrollo", algunos permisos avanzados pueden no estar disponibles.

**Solución:**
- Ve a Facebook Developers → Tu App → Settings → Basic
- Cambia "App Mode" a "Live" (requiere revisión de Facebook)
- O solicita permisos específicos en "App Review"

### 2. Verificar Vinculación de Instagram

Para acceder a `instagram_business_accounts`, necesitas:

- ✅ Una cuenta de Instagram **Business** o **Creator**
- ✅ La cuenta debe estar **vinculada a una página de Facebook**
- ✅ Debes ser **Administrador** de la página

**Verificar:**
1. Ve a tu página de Facebook
2. Settings → Instagram
3. Verifica que haya una cuenta de Instagram vinculada

### 3. Usar Consulta Alternativa

Si no puedes acceder a `businesses`, prueba esta consulta alternativa:

```
/me/accounts?fields=id,name,instagram_business_account{id,ig_id,username}
```

Esta consulta accede directamente a las páginas del usuario y sus cuentas de Instagram vinculadas.

## 📝 Consulta Recomendada para tu App

En lugar de usar `businesses`, usa esta consulta que es más directa:

```javascript
// Obtener páginas del usuario
const pagesResponse = await fetch(
  `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,instagram_business_account{id,ig_id,username}&access_token=${token}`
)

// Obtener información de Instagram directamente
const instagramResponse = await fetch(
  `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account{id,ig_id,username}&access_token=${pageToken}`
)
```

## ✅ Checklist de Verificación

- [ ] Token generado con todos los permisos necesarios
- [ ] `business_management` está incluido en los permisos
- [ ] App está en modo "Live" o tiene permisos aprobados
- [ ] Cuenta de Instagram es Business/Creator
- [ ] Instagram está vinculado a una página de Facebook
- [ ] Eres Administrador de la página
- [ ] La consulta usa el token correcto

## 🔗 Recursos Útiles

- [Facebook Permissions Reference](https://developers.facebook.com/docs/permissions/reference)
- [Instagram Graph API Permissions](https://developers.facebook.com/docs/instagram-api/reference)
- [Business Management API](https://developers.facebook.com/docs/marketing-api/business-management-api)

