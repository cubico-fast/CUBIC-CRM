# 📱 Conectar Instagram a tu CRM - Guía Completa

## ✅ Sí, esto te sirve para conectar Instagram

El Graph API Explorer es una herramienta de **prueba** para verificar que los permisos funcionen correctamente. Una vez que funcione aquí, funcionará en tu CRM.

## 🔍 Problema Actual

En tu captura veo que:
- ❌ Todos los permisos tienen **X roja** (no están concedidos)
- ❌ La respuesta solo muestra `id` y `name_format`, pero **NO** muestra `accounts` ni `instagram_accounts`
- ❌ Esto significa que el token **no tiene los permisos necesarios**

## 🚀 Solución Paso a Paso

### Paso 1: Generar Token con Permisos Correctos

1. **En el panel derecho**, haz clic en **"Generate Access Token"** (botón azul)

2. **Selecciona tu App** en el dropdown "App de Meta"

3. **En "Usuario o página"**, selecciona tu usuario

4. **En la pestaña "Permissions"**, marca TODOS estos permisos:

   **Permisos OBLIGATORIOS:**
   - ✅ `pages_show_list` - Ver tus páginas de Facebook
   - ✅ `pages_read_engagement` - Leer métricas de páginas
   - ✅ `pages_read_user_content` - Leer contenido de páginas
   - ✅ `instagram_basic` - Acceso básico a Instagram
   - ✅ `instagram_manage_insights` - Ver métricas de Instagram
   - ✅ `business_management` - Acceder a información de negocios

5. **Haz clic en "Generate Access Token"**

6. **Autoriza la aplicación** cuando Facebook te lo solicite

7. **Copia el nuevo token** generado

### Paso 2: Probar la Consulta

1. **Pega el nuevo token** en el campo "Access Token"

2. **Prueba esta consulta más simple primero:**
   ```
   /me/accounts?fields=id,name,instagram_business_account{id,ig_id,username}
   ```

3. **Si funciona**, deberías ver algo como:
   ```json
   {
     "data": [
       {
         "id": "123456789",
         "name": "Mi Página",
         "instagram_business_account": {
           "id": "987654321",
           "ig_id": "123456789",
           "username": "mi_cuenta_instagram"
         }
       }
     ]
   }
   ```

### Paso 3: Verificar en tu CRM

Una vez que funcione en el Graph API Explorer:

1. **Ve a tu CRM**: `https://cubico-fast.github.io/CUBIC-CRM/marketing/configuracion`

2. **Haz clic en "Conectar Facebook"**

3. **Autoriza los permisos** (deberían aparecer los mismos que marcaste en el Explorer)

4. **Tu Instagram se conectará automáticamente** si está vinculado a una página de Facebook

## ⚠️ Requisitos Importantes

Para que Instagram se conecte a tu CRM, necesitas:

### 1. Cuenta de Instagram Business o Creator
- ❌ Las cuentas personales NO funcionan
- ✅ Debe ser cuenta **Business** o **Creator**

**Verificar:**
- Ve a Instagram → Settings → Account → Switch to Professional Account

### 2. Instagram Vinculado a una Página de Facebook
- La cuenta de Instagram debe estar **vinculada a una página de Facebook**
- Debes ser **Administrador** de esa página

**Verificar:**
1. Ve a tu página de Facebook
2. Settings → Instagram
3. Debe aparecer tu cuenta de Instagram vinculada

### 3. Permisos Aprobados en Facebook
- Si tu app está en modo "Desarrollo", algunos permisos pueden no estar disponibles
- Para producción, necesitas que Facebook apruebe los permisos en "App Review"

## 🔧 Consulta Recomendada para tu CRM

En lugar de usar la consulta compleja que estás probando, tu CRM usa esta consulta más simple y confiable:

```javascript
// 1. Obtener páginas del usuario
GET /me/accounts?fields=id,name,access_token

// 2. Para cada página, obtener Instagram vinculado
GET /{pageId}?fields=instagram_business_account{id,ig_id,username}

// 3. Obtener métricas de Instagram
GET /{instagramAccountId}/insights?metric=impressions,reach&period=day
```

## 📋 Checklist de Verificación

Antes de conectar en tu CRM, verifica:

- [ ] Token generado con todos los permisos necesarios
- [ ] La consulta `/me/accounts` funciona en Graph API Explorer
- [ ] Aparece tu página de Facebook en los resultados
- [ ] Aparece `instagram_business_account` en los resultados
- [ ] Tu cuenta de Instagram es Business/Creator
- [ ] Instagram está vinculado a una página de Facebook
- [ ] Eres Administrador de la página

## 🎯 Una Vez que Funcione en el Explorer

Cuando veas los datos de Instagram en el Graph API Explorer:

1. **Los mismos permisos funcionarán en tu CRM**
2. **Haz clic en "Conectar Facebook" en tu CRM**
3. **Autoriza los permisos** (deberían ser los mismos)
4. **¡Instagram se conectará automáticamente!**

## 🐛 Si Aún No Funciona

### Error: "No se encontraron páginas"
- Verifica que tengas páginas de Facebook
- Ve a https://www.facebook.com/pages/manage

### Error: "No hay Instagram vinculado"
- Verifica que Instagram esté vinculado a la página
- Ve a la página → Settings → Instagram

### Error: "Missing Permission" en el CRM
- Asegúrate de autorizar TODOS los permisos cuando conectes
- Si ya conectaste antes, desconecta y vuelve a conectar

## 💡 Tip Pro

**El Graph API Explorer es tu herramienta de prueba:**
- Si funciona aquí → Funcionará en tu CRM
- Si no funciona aquí → No funcionará en tu CRM
- Úsalo para probar consultas antes de implementarlas

## 🔗 Próximos Pasos

1. ✅ Genera token con permisos correctos en Graph API Explorer
2. ✅ Verifica que la consulta funcione
3. ✅ Ve a tu CRM y haz clic en "Conectar Facebook"
4. ✅ Autoriza los permisos
5. ✅ ¡Instagram conectado! 🎉

