# 🔧 Solución: "La opción de JSSDK está desactivada"

## ❌ Problema

Cuando intentas conectar Facebook en tu CRM, aparece el error:
> "La opción de JSSDK está desactivada"
> "Para iniciar sesión con JSSDK, cambia la opción 'Inicio de sesión con el SDK para JavaScript' a 'Sí'"

## 🔍 Causa

Tu aplicación de Facebook tiene desactivada la opción **"Inicio de sesión con el SDK para JavaScript"**, que es necesaria para que tu CRM pueda usar el SDK de Facebook para autenticación.

## ✅ Solución Paso a Paso

### Paso 1: Ir a la Configuración de Login

1. Ve a [Facebook Developers](https://developers.facebook.com)
2. Selecciona tu app: **Métricas** (ID: 3275561219308954)
3. En el menú lateral izquierdo, busca **"Inicio de sesión con Facebook"**
4. Haz clic en **"Configurar"** o **"Configuraciones"**

### Paso 2: Activar JSSDK

1. En la página de configuración, busca la sección:
   **"Iniciar sesión con el SDK para JavaScript"**
2. Cambia el toggle de **"No"** a **"Sí"** (debe quedar activado/azul)
3. Si aparece la sección **"Dominios permitidos para el SDK para JavaScript"**, agrega:
   - `localhost` (para desarrollo local)
   - `cubico-fast.github.io` (para producción en GitHub Pages)
   - O tu dominio de producción si usas otro hosting
4. Haz clic en **"Guardar cambios"** (botón azul abajo a la derecha)

### Paso 3: Verificar Dominios Permitidos

Si aparece la sección **"Dominios permitidos para el SDK para JavaScript"**, agrega:

**Para desarrollo:**
```
localhost
```

**Para producción:**
```
cubico-fast.github.io
```

O tu dominio completo si usas otro hosting.

### Paso 4: Probar de Nuevo

1. Espera 1-2 minutos para que los cambios se propaguen
2. Vuelve a tu CRM
3. Ve a Configuración de Marketing
4. Haz clic en **"Conectar Facebook"**
5. Debería funcionar ahora

## 📋 Checklist de Configuración

Asegúrate de tener configurado:

- [ ] **"Iniciar sesión con el SDK para JavaScript"** = **"Sí"** (Activado)
- [ ] **"Dominios permitidos"** incluye:
  - [ ] `localhost` (para desarrollo)
  - [ ] `cubico-fast.github.io` (para producción)
- [ ] **"URI de redireccionamiento de OAuth válidos"** incluye:
  - [ ] `https://cubico-fast.github.io/CUBIC-CRM/marketing/callback`
  - [ ] `http://localhost:5173/marketing/callback` (si pruebas local)
- [ ] Cambios guardados

## 🔗 URL Directa

Puedes ir directamente a la configuración:
```
https://developers.facebook.com/apps/3275561219308954/business-login/settings/
```

## ⚠️ Nota Importante

**Si no ves la opción "Iniciar sesión con el SDK para JavaScript":**

1. Verifica que estés en la sección correcta:
   - **"Inicio de sesión con Facebook"** → **"Configurar"**
2. Si aún no aparece, puede que necesites:
   - Agregar el producto "Facebook Login" a tu app
   - O la opción puede estar en otra sección

## 🎯 Configuración Completa Recomendada

Para que todo funcione correctamente, asegúrate de tener:

1. ✅ **"Iniciar sesión con el SDK para JavaScript"** = **Sí**
2. ✅ **"Dominios permitidos"** configurados
3. ✅ **"URI de redireccionamiento OAuth válidos"** configurados
4. ✅ **"Usar modo estricto para URI de redireccionamiento"** = Activado (recomendado)

## 🔍 Verificar que Funcionó

Después de activar JSSDK:

1. Espera 1-2 minutos
2. Intenta conectar desde tu CRM
3. El error "JSSDK desactivado" no debería aparecer
4. Deberías ver el popup de autorización de Facebook

## 📝 Archivos Relacionados

- `GUIA_URI_REDIRECCIONAMIENTO.md` - Configuración de URIs
- `SOLUCION_APP_NO_ACTIVA.md` - Si la app no está activa
- `CONECTAR_INSTAGRAM_CRM.md` - Guía completa de conexión

