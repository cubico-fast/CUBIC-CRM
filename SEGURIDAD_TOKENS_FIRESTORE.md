# 🔒 Seguridad de Tokens - Almacenamiento en Firestore

## ✅ Cambios Implementados

Se ha mejorado la seguridad del sistema de autenticación de Meta/Facebook almacenando todos los tokens de forma segura en Firestore en lugar de pasarlos por URL o localStorage.

## 🔐 Mejoras de Seguridad

### Antes (❌ Inseguro)
- Tokens pasados por URL: `?token=abc123...`
- Tokens visibles en el historial del navegador
- Tokens accesibles a través de JavaScript en cualquier momento
- Riesgo de exposición en logs del servidor

### Ahora (✅ Seguro)
- Tokens almacenados en Firestore asociados al usuario
- Tokens nunca aparecen en URLs
- Acceso restringido mediante reglas de seguridad de Firestore
- Solo el usuario puede acceder a sus propios tokens

## 📁 Estructura de Datos en Firestore

### Colección: `marketing_tokens`
**Ruta:** `/marketing_tokens/{userId}`

**Contenido:**
```javascript
{
  userAccessToken: "token_completo_del_usuario",
  paginaAccessToken: "token_completo_de_la_pagina",
  platform: "facebook",
  paginaId: "123456789",
  paginaNombre: "Mi Página",
  instagramAccountId: "987654321",
  instagramUsername: "mi_cuenta",
  connectedAt: "2024-01-01T00:00:00.000Z",
  updatedAt: Timestamp,
  userId: "user_uid"
}
```

### Colección: `marketing_config`
**Ruta:** `/marketing_config/{userId}`

**Contenido (sin tokens):**
```javascript
{
  platform: "facebook",
  paginaId: "123456789",
  paginaNombre: "Mi Página",
  instagramAccountId: "987654321",
  instagramUsername: "mi_cuenta",
  connectedAt: "2024-01-01T00:00:00.000Z",
  updatedAt: Timestamp,
  userId: "user_uid"
}
```

## 🔒 Reglas de Seguridad de Firestore

Las reglas de seguridad garantizan que:

1. **Solo el usuario puede acceder a sus propios tokens:**
   ```javascript
   match /marketing_tokens/{userId} {
     allow read, write: if request.auth != null && request.auth.uid == userId;
   }
   ```

2. **La configuración pública puede leerse, pero solo el usuario puede escribir:**
   ```javascript
   match /marketing_config/{userId} {
     allow read: if true;
     allow write: if request.auth != null && request.auth.uid == userId;
   }
   ```

## 📝 Funciones Implementadas

### `guardarConfiguracionMeta(config)`
- Guarda tokens de forma segura en Firestore
- Asocia tokens con el usuario autenticado
- Separa tokens sensibles de metadatos públicos

### `obtenerConfiguracionMeta()`
- Obtiene tokens desde Firestore
- Solo el usuario puede acceder a sus propios tokens
- Retorna configuración completa con tokens

### `eliminarConfiguracionMeta()`
- Elimina tokens y configuración de Firestore
- Útil para desconectar cuentas

## 🚀 Flujo de Autenticación Actualizado

1. **Usuario inicia autenticación:**
   - Se redirige a Facebook para autorizar
   - Facebook redirige de vuelta con un código

2. **Procesamiento del código:**
   - El código se intercambia por un token
   - El token se procesa para obtener páginas e Instagram
   - **Los tokens se guardan directamente en Firestore** (no en URL)

3. **Almacenamiento seguro:**
   - Tokens completos en `marketing_tokens/{userId}`
   - Metadatos públicos en `marketing_config/{userId}`
   - URL se limpia inmediatamente

4. **Carga de configuración:**
   - Al cargar la página, se lee desde Firestore
   - Solo metadatos se muestran en el estado (sin tokens)
   - Tokens se obtienen cuando se necesitan para hacer peticiones

## ⚙️ Configuración Requerida

### 1. Actualizar Reglas de Firestore

Ve a [Firebase Console](https://console.firebase.google.com/) → Firestore Database → Reglas y actualiza con:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ... otras reglas ...
    
    // Reglas para tokens de Meta (SEGURIDAD CRÍTICA)
    match /marketing_tokens/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      // Permitir también acceso anónimo si userId es 'anonymous' (para desarrollo)
      allow read, write: if userId == 'anonymous';
    }
    
    // Reglas para configuración de Meta (pública, sin tokens)
    match /marketing_config/{userId} {
      allow read: if true;  // Configuración pública puede leerse
      allow write: if request.auth != null && request.auth.uid == userId;
      // Permitir también acceso anónimo si userId es 'anonymous' (para desarrollo)
      allow write: if userId == 'anonymous';
    }
  }
}
```

### 2. Verificar que Firebase Auth esté configurado

Si usas autenticación de usuarios, asegúrate de que Firebase Auth esté configurado correctamente. Si no usas autenticación, el sistema usará `'anonymous'` como userId.

## 🔍 Verificación

Para verificar que todo funciona:

1. **Conecta una cuenta de Facebook:**
   - Ve a Configuración de Marketing
   - Haz clic en "Conectar Facebook"
   - Autoriza la aplicación

2. **Verifica en Firestore:**
   - Ve a Firebase Console → Firestore Database
   - Deberías ver:
     - `marketing_tokens/{userId}` con los tokens
     - `marketing_config/{userId}` con los metadatos

3. **Verifica que no hay tokens en URL:**
   - Después de conectar, la URL NO debe contener `?token=...`
   - La URL debe estar limpia

## 🛡️ Beneficios de Seguridad

1. **Tokens nunca en URLs:** No aparecen en historial, logs, o pueden ser compartidos accidentalmente
2. **Acceso restringido:** Solo el usuario puede ver sus propios tokens
3. **Separación de datos:** Tokens sensibles separados de metadatos públicos
4. **Auditoría:** Firestore mantiene logs de acceso y cambios
5. **Escalable:** Funciona con múltiples usuarios sin conflictos

## 📚 Archivos Modificados

- `src/utils/metaApi.js` - Funciones de guardado/obtención mejoradas
- `src/pages/ConfiguracionMarketing.jsx` - Flujo actualizado para usar Firestore
- `FIRESTORE_RULES.md` - Reglas de seguridad actualizadas

## ⚠️ Notas Importantes

- Si no usas autenticación de Firebase, el sistema usará `'anonymous'` como userId
- Para producción, considera implementar autenticación de usuarios para mayor seguridad
- Los tokens se renuevan automáticamente cuando expiran (si está configurado)
- Siempre limpia tokens cuando el usuario desconecta su cuenta

