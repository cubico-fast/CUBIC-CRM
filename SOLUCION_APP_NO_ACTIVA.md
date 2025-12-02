# 🔧 Solución: "La app no está activa"

## ❌ Problema

Cuando intentas conectar Facebook en tu CRM, aparece el error:
> "La app no está activa"
> "No se puede acceder a esta app en este momento..."

## 🔍 Causa

Tu aplicación de Facebook está en **modo "Desarrollo"** y solo los usuarios agregados como **Testers** o **Desarrolladores** pueden usarla.

## ✅ Soluciones

### Opción 1: Agregarte como Tester (RÁPIDO) ⭐ RECOMENDADO

**Pasos:**

1. Ve a [Facebook Developers](https://developers.facebook.com)
2. Selecciona tu app: **Métricas** (ID: 3275561219308954)
3. En el menú lateral, ve a **"Roles de la app"** → **"Usuarios de prueba"**
4. Haz clic en **"Agregar"** o **"+ Agregar"**
5. Busca tu cuenta de Facebook (Pierre Acuña)
6. Agrégalo como **"Evaluador"** (Tester)
7. Acepta la invitación cuando llegue a tu Facebook

**Ventajas:**
- ✅ Funciona inmediatamente
- ✅ No necesitas pasar por App Review
- ✅ Ideal para desarrollo y pruebas

### Opción 2: Cambiar a Modo "Live" (Para Producción)

Si quieres que cualquier usuario pueda usar la app:

1. Ve a [Facebook Developers](https://developers.facebook.com)
2. Selecciona tu app
3. Ve a **"Configuración"** → **"Básico"**
4. Cambia **"Modo de la app"** de **"Desarrollo"** a **"Live"**
5. **⚠️ IMPORTANTE:** Para modo Live necesitas:
   - Pasar por **App Review** de Facebook
   - Que Facebook apruebe los permisos que solicitas
   - Completar verificaciones de negocio

**Ventajas:**
- ✅ Cualquier usuario puede usar la app
- ✅ Ideal para producción

**Desventajas:**
- ❌ Requiere pasar por App Review
- ❌ Puede tardar días o semanas
- ❌ Necesitas justificar por qué necesitas cada permiso

## 🚀 Solución Rápida (Recomendada)

**Para desarrollo y pruebas, usa la Opción 1:**

1. Ve a: https://developers.facebook.com/apps/3275561219308954/roles/test-users/
2. Haz clic en **"Agregar"** o **"+ Agregar"**
3. Busca **"Pierre Acuña"** o tu email
4. Agrégalo como **"Evaluador"**
5. Acepta la invitación en Facebook
6. Vuelve a intentar conectar en tu CRM

## 📋 Pasos Detallados

### Paso 1: Ir a Roles de la App

1. Ve a: https://developers.facebook.com/apps/3275561219308954
2. En el menú lateral izquierdo, busca **"Roles de la app"**
3. Haz clic en **"Usuarios de prueba"** o **"Evaluadores"**

### Paso 2: Agregar Tester

1. Haz clic en **"Agregar"** o **"+ Agregar"**
2. Selecciona **"Agregar evaluadores"**
3. Busca tu cuenta de Facebook:
   - Puedes buscar por nombre: "Pierre Acuña"
   - O por email asociado a tu cuenta
4. Selecciona tu cuenta
5. Haz clic en **"Agregar"**

### Paso 3: Aceptar Invitación

1. Ve a tu Facebook
2. Busca la notificación de invitación
3. O ve a: https://www.facebook.com/settings?tab=business_tools
4. Acepta la invitación para ser tester de la app

### Paso 4: Probar de Nuevo

1. Vuelve a tu CRM
2. Ve a Configuración de Marketing
3. Haz clic en **"Conectar Facebook"**
4. Debería funcionar ahora

## ⚠️ Nota Importante

**Si agregas a otros usuarios:**
- También necesitarán ser agregados como Testers
- O la app debe estar en modo "Live"

## 🔍 Verificar que Funcionó

Después de agregarte como Tester:

1. Ve a: https://www.facebook.com/settings?tab=business_tools
2. Deberías ver tu app "Métricas" listada
3. Debería decir que eres "Evaluador" o "Tester"

## 📝 Checklist

- [ ] Agregado como Tester en Facebook Developers
- [ ] Invitación aceptada en Facebook
- [ ] App aparece en business_tools
- [ ] Puedes conectar desde el CRM sin error

## 🔗 Enlaces Útiles

- [Agregar Testers](https://developers.facebook.com/apps/3275561219308954/roles/test-users/)
- [Configuración de la App](https://developers.facebook.com/apps/3275561219308954/settings/basic/)
- [Business Tools](https://www.facebook.com/settings?tab=business_tools)

