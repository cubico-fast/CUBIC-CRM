# 🔧 Guía: Configuración de URI de Redireccionamiento OAuth

## ⚠️ Problema Común

Facebook es **MUY ESTRICTO** con las URIs de redireccionamiento. Si la URI que usas en tu código **NO coincide EXACTAMENTE** con la que tienes configurada en Facebook, obtendrás el error:

```
redirect_uri_mismatch
```

## 🔍 ¿Qué URI está usando tu aplicación?

### Para Frontend (GitHub Pages / Producción)

Tu aplicación frontend construye la URI automáticamente basándose en la URL actual:

```51:51:src/utils/metaApi.js
const REDIRECT_URI = `${window.location.origin}${window.location.pathname.includes('/CUBIC-CRM') ? '/CUBIC-CRM' : ''}/marketing/callback`
```

**Esto significa:**
- En GitHub Pages: `https://cubico-fast.github.io/CUBIC-CRM/marketing/callback`
- En localhost: `http://localhost:5173/marketing/callback` (o con `/CUBIC-CRM` si está configurado)

### Para Backend (Solo Desarrollo Local)

El backend busca la URI en este orden:

1. Variable de entorno `VITE_META_REDIRECT_URI`
2. Variable de entorno `META_REDIRECT_URI`
3. Valor por defecto: `http://localhost:3000/api/marketing/callback`

**Ubicación del código:**
```13:13:backend/routes/marketing.js
  const REDIRECT_URI = process.env.VITE_META_REDIRECT_URI || process.env.META_REDIRECT_URI || 'http://localhost:3000/api/marketing/callback';
```

**⚠️ IMPORTANTE:** El backend solo se usa en desarrollo local. En producción (GitHub Pages), el frontend maneja el callback directamente.

## ✅ Solución: Configurar Facebook Correctamente

### Paso 1: Identificar tu entorno

**¿Estás en desarrollo local?**
- Backend corriendo en: `http://localhost:3000`
- URI necesaria: `http://localhost:3000/api/marketing/callback`

**¿Estás en producción?**
- Backend hosteado en: `https://tu-dominio.com` o `https://tu-backend.vercel.app`
- URI necesaria: `https://tu-dominio.com/api/marketing/callback`

### Paso 2: Agregar URIs en Facebook

Facebook **permite múltiples URIs**, así que puedes agregar todas las que necesites:

1. Ve a [Facebook Developers](https://developers.facebook.com)
2. Selecciona tu app
3. Ve a **Configuración** → **Inicio de sesión con Facebook** → **Configurar**
4. En la sección **"URI de redireccionamiento de OAuth válidos"**:

   **✅ Para producción en GitHub Pages (OBLIGATORIO):**
   ```
   https://cubico-fast.github.io/CUBIC-CRM/marketing/callback
   ```
   ⚠️ Esta es la URI que usa tu sitio en producción. **DEBE estar configurada.**

   **Para desarrollo local (opcional, solo si pruebas con backend):**
   ```
   http://localhost:5173/marketing/callback
   ```
   ⚠️ Nota: Si usas el frontend directamente sin backend, esta es la URI que necesitas.

   **Para desarrollo con backend local (opcional):**
   ```
   http://localhost:3000/api/marketing/callback
   ```
   ⚠️ Solo necesaria si estás probando el backend en local.

5. Haz clic en **"Guardar cambios"**

### Paso 3: Configurar Variables de Entorno

#### Producción en GitHub Pages

**No necesitas configurar `VITE_META_REDIRECT_URI`** porque el frontend la construye automáticamente.

Solo necesitas configurar en GitHub Secrets:

1. Ve a tu repositorio: `https://github.com/cubico-fast/CUBIC-CRM`
2. Settings → Secrets and variables → Actions
3. Agrega:
   ```
   VITE_META_APP_ID=tu_app_id_de_facebook
   ```
   ⚠️ Solo el número del App ID, sin comillas ni JSON.

4. Redespliega el sitio

#### Desarrollo Local (Solo si usas backend)

Crea o edita el archivo `backend/.env`:

```env
VITE_META_APP_ID=tu_app_id
VITE_META_APP_SECRET=tu_app_secret
VITE_META_REDIRECT_URI=http://localhost:3000/api/marketing/callback
FRONTEND_URL=http://localhost:5173
PORT=3000
```

**Nota:** En desarrollo local, si solo usas el frontend (sin backend), el frontend usará automáticamente `http://localhost:5173/marketing/callback`.

## 🎯 Reglas Importantes

### ✅ CORRECTO

- `http://localhost:3000/api/marketing/callback`
- `https://api.ejemplo.com/api/marketing/callback`
- `https://backend.vercel.app/api/marketing/callback`

### ❌ INCORRECTO

- `http://localhost:3000/api/marketing/callback/` (barra final extra)
- `http://localhost:3000/api/marketing/callback?param=value` (parámetros)
- `http://localhost:3000/api/marketing/Callback` (mayúsculas)
- `https://localhost:3000/api/marketing/callback` (https en localhost sin certificado)

## 🔍 Cómo Verificar qué URI está usando tu app

### Opción 1: Revisar logs del backend

Cuando inicies el flujo OAuth, revisa los logs del servidor. Deberías ver la URI que se está usando.

### Opción 2: Agregar log temporal

Agrega esto temporalmente en `backend/routes/marketing.js`:

```javascript
router.get('/auth/:platform', (req, res) => {
  const { platform } = req.params;
  const APP_ID = process.env.VITE_META_APP_ID || process.env.META_APP_ID;
  const REDIRECT_URI = process.env.VITE_META_REDIRECT_URI || process.env.META_REDIRECT_URI || 'http://localhost:3000/api/marketing/callback';
  
  // ⚠️ LOG TEMPORAL - Elimina después de verificar
  console.log('🔍 URI de redireccionamiento que se está usando:', REDIRECT_URI);
  
  // ... resto del código
});
```

Luego, cuando hagas clic en "Conectar Facebook", revisa la consola del backend y verás exactamente qué URI está usando.

## 🐛 Solución de Problemas

### Error: "redirect_uri_mismatch"

**Causa:** La URI en tu código no coincide con la de Facebook.

**Solución:**
1. Verifica qué URI está usando tu código (ver sección anterior)
2. Asegúrate de que esa URI EXACTA esté en Facebook
3. Verifica que no haya espacios, barras finales, o diferencias de mayúsculas/minúsculas

### Error: "Invalid redirect URI"

**Causa:** La URI no está en la lista de Facebook.

**Solución:**
1. Ve a Facebook Developers
2. Agrega la URI exacta que estás usando
3. Guarda los cambios
4. Espera 1-2 minutos para que se propague

### Funciona en local pero no en producción

**Causa:** Tienes configurada solo la URI de localhost en Facebook.

**Solución:**
1. Agrega también la URI de producción en Facebook
2. Configura la variable de entorno `VITE_META_REDIRECT_URI` en tu plataforma de hosting
3. Redespliega la aplicación

## 📝 Checklist

Antes de probar, verifica:

- [ ] La URI en Facebook coincide EXACTAMENTE con la que usa tu código
- [ ] No hay barras finales (`/`) extra
- [ ] No hay espacios al inicio o final
- [ ] El protocolo es correcto (`http://` para localhost, `https://` para producción)
- [ ] El puerto es correcto (3000 para desarrollo)
- [ ] La ruta es correcta (`/api/marketing/callback`)
- [ ] Si estás en producción, la variable de entorno está configurada
- [ ] Has guardado los cambios en Facebook
- [ ] Has esperado 1-2 minutos después de guardar en Facebook

## 💡 Tip Pro

Si trabajas en múltiples entornos (desarrollo, staging, producción), agrega TODAS las URIs en Facebook:

```
http://localhost:3000/api/marketing/callback
https://staging.tu-dominio.com/api/marketing/callback
https://tu-dominio.com/api/marketing/callback
```

Así no tendrás que cambiar la configuración cada vez que cambies de entorno.

