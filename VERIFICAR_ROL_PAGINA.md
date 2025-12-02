# 🔍 Verificar Rol en Página de Facebook

## ❌ Si "Roles de la página" No Aparece

Si no ves la opción "Roles de la página" en Configuración, significa que **NO eres Administrador** de la página.

## ✅ Formas de Verificar tu Rol

### Método 1: Verificar desde la URL de la Página

1. Ve a tu página: `https://www.facebook.com/Geampier0` (o el nombre de tu página)
2. Mira la barra lateral izquierda
3. Si ves "Configuración" y puedes entrar → Eres Administrador o Editor
4. Si NO ves "Configuración" o no puedes entrar → No eres Administrador

### Método 2: Verificar desde Graph API

Prueba esta consulta en Graph API Explorer:

```
/me/accounts?fields=id,name,roles
```

Si aparece tu página en los resultados, eres Administrador o Editor.

### Método 3: Verificar Permisos Directamente

Prueba esta consulta:

```
/{page-id}?fields=id,name,roles
```

Reemplaza `{page-id}` con el ID de tu página (puedes verlo en la URL cuando estás en la página).

## 🔧 Soluciones

### Opción 1: Pedir que te Agreguen como Administrador

1. Contacta al Administrador actual de la página
2. Pídele que:
   - Vaya a Configuración → Roles de la página
   - Haga clic en "Agregar persona"
   - Te agregue como **Administrador** o **Editor**
3. Acepta la invitación cuando llegue

### Opción 2: Usar la Cuenta que es Administradora

Si tienes acceso a la cuenta que creó la página:

1. Inicia sesión con esa cuenta
2. Genera un nuevo token en Graph API Explorer
3. Prueba la consulta `/me/accounts` de nuevo

### Opción 3: Crear una Nueva Página

Si no puedes obtener acceso a la página existente:

1. Ve a: https://www.facebook.com/pages/create
2. Crea una nueva página
3. Asegúrate de ser Administrador (lo serás automáticamente al crearla)
4. Vincula Instagram a esta nueva página si quieres conectar Instagram

## 🎯 Verificación Rápida con Graph API

Prueba esta consulta en Graph API Explorer:

```
/me/accounts?fields=id,name
```

**Resultados posibles:**

- ✅ **Si aparece tu página**: Eres Administrador o Editor → Todo está bien
- ❌ **Si está vacío `{"data": []}`**: No eres Administrador de ninguna página

## 📋 Checklist

- [ ] ¿Puedes ver "Configuración" en la barra lateral de la página?
- [ ] ¿Puedes entrar a "Configuración"?
- [ ] ¿Ves "Roles de la página" dentro de Configuración?
- [ ] ¿Aparece tu nombre en la lista de roles?
- [ ] ¿La consulta `/me/accounts` devuelve tu página?

## 💡 Importante

**Para conectar Instagram a tu CRM, necesitas:**
- ✅ Ser Administrador o Editor de una página de Facebook
- ✅ Tener una cuenta de Instagram Business vinculada a esa página
- ✅ Tener los permisos correctos en el token

Si no eres Administrador, **no podrás conectar la página** al CRM porque el API de Facebook solo devuelve páginas donde eres Administrador o Editor.

## 🔗 Próximos Pasos

1. **Verifica** si eres Administrador usando `/me/accounts`
2. **Si no eres Administrador:**
   - Pide que te agreguen como Administrador, O
   - Crea una nueva página donde seas Administrador
3. **Una vez que seas Administrador:**
   - Prueba `/me/accounts` de nuevo
   - Debería aparecer tu página
   - Luego podrás conectar Instagram

