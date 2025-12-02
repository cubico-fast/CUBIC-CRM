# 🔧 Configurar Facebook Login para tu CRM

## ⚠️ IMPORTANTE: Estás en la sección incorrecta

Estás viendo **"Configuración de la API con inicio de sesión de empresa de Instagram"**, pero necesitas configurar **"Facebook Login"** (no Instagram API).

## ✅ Pasos Correctos

### Paso 1: Ir a Facebook Login (NO Instagram API)

1. En el menú lateral izquierdo de tu app, busca:
   - **"Productos"** → **"Inicio de sesión con Facebook"**
   - **NO** uses "Instagram" → "Configuración de la API"

2. Haz clic en **"Inicio de sesión con Facebook"**

3. Luego haz clic en **"Configurar"** o **"Configuraciones"**

### Paso 2: Activar JSSDK

1. En la página de configuración, busca la sección:
   **"Iniciar sesión con el SDK para JavaScript"**

2. Cambia el toggle de **"No"** a **"Sí"** (debe quedar azul/activado)

### Paso 3: Configurar Dominios Permitidos

Si aparece la sección **"Dominios permitidos para el SDK para JavaScript"**, agrega:

**Para desarrollo:**
```
localhost
```

**Para producción:**
```
cubico-fast.github.io
```

### Paso 4: Configurar URIs de Redireccionamiento

En la sección **"URI de redireccionamiento de OAuth válidos"**, agrega:

**Para producción (OBLIGATORIO):**
```
https://cubico-fast.github.io/CUBIC-CRM/marketing/callback
```

**Para desarrollo (opcional):**
```
http://localhost:5173/marketing/callback
```

### Paso 5: Activar Modo Estricto (Recomendado)

- Marca la casilla **"Usar modo estricto para URI de redireccionamiento"**
- Esto hace que Facebook solo acepte las URIs exactas que configuraste

### Paso 6: Guardar Cambios

1. Haz clic en **"Guardar cambios"** (botón azul abajo a la derecha)
2. Espera 1-2 minutos para que los cambios se propaguen

## 🔗 URL Directa

Puedes ir directamente a la configuración correcta:
```
https://developers.facebook.com/apps/3275561219308954/business-login/settings/
```

## 📋 Checklist Completo

Para que tu CRM funcione, necesitas tener configurado:

### En "Inicio de sesión con Facebook" → "Configurar":

- [ ] **"Iniciar sesión con el SDK para JavaScript"** = **"Sí"** ✅
- [ ] **"Dominios permitidos"** incluye:
  - [ ] `localhost` (desarrollo)
  - [ ] `cubico-fast.github.io` (producción)
- [ ] **"URI de redireccionamiento OAuth válidos"** incluye:
  - [ ] `https://cubico-fast.github.io/CUBIC-CRM/marketing/callback`
  - [ ] `http://localhost:5173/marketing/callback` (opcional)
- [ ] **"Usar modo estricto"** = Activado ✅
- [ ] Cambios guardados ✅

### En "Settings" → "Basic":

- [ ] **"App Domains"** incluye: `cubico-fast.github.io`
- [ ] **"App ID"** copiado y configurado en GitHub Secrets como `VITE_META_APP_ID`

## 🎯 Diferencia entre Instagram API y Facebook Login

| Sección | Para qué sirve | ¿Necesitas configurarlo? |
|---------|---------------|-------------------------|
| **Instagram API** | Acceder a métricas de Instagram | ❌ NO (solo si quieres métricas de Instagram) |
| **Facebook Login** | Autenticación OAuth con Facebook | ✅ **SÍ** (necesario para tu CRM) |

## ⚠️ Errores Comunes

### Error: "La opción de JSSDK está desactivada"
- **Solución**: Activa "Iniciar sesión con el SDK para JavaScript" = "Sí"

### Error: "La app no está activa"
- **Solución**: Agrega tu cuenta como Tester en "Roles de la app" → "Usuarios de prueba"

### Error: "Invalid redirect URI"
- **Solución**: Verifica que la URI exacta esté en "URI de redireccionamiento OAuth válidos"

## 🚀 Después de Configurar

1. Espera 1-2 minutos
2. Vuelve a tu CRM: `https://cubico-fast.github.io/CUBIC-CRM/marketing/configuracion`
3. Haz clic en **"Conectar Facebook"**
4. Debería funcionar correctamente

## 📝 Notas

- **Instagram API** es solo para métricas de Instagram, NO para autenticación
- Tu CRM usa **Facebook Login** para autenticación OAuth
- Una vez autenticado con Facebook Login, puedes acceder a Instagram si está vinculado

