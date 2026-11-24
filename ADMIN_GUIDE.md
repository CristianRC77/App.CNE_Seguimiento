# 👨‍💼 GUÍA DE ADMINISTRACIÓN

## 🎯 Descripción General

Se ha creado un **sistema de administración** con:

1. **Rol de Administrador (ADMIN)** - Acceso exclusivo a funciones de administración
2. **Pestaña de Administración** - Interfaz para administradores
3. **Función de Reseteo de BD** - Vaciar base de datos con múltiples confirmaciones
4. **Medidas de Seguridad** - Autenticación JWT, códigos de confirmación, advertencias

---

## 👨‍💻 Crear un Usuario Administrador

### Opción 1: Usar el Script (Recomendado)

```bash
node create-admin-user.js
```

Este script:
- ✅ Crea un usuario con rol `ADMIN`
- ✅ Usuario: `admin`
- ✅ Contraseña: `admin123`
- ✅ Muestra las credenciales al finalizar

**Resultado:**
```
✓ Usuario administrador creado exitosamente

📌 Credenciales de Admin:
   Usuario: admin
   Contraseña: admin123
```

### Opción 2: Crear Manualmente en MongoDB

Conectate a tu base de datos MongoDB y ejecuta:

```javascript
db.users.insertOne({
  username: "admin",
  password_hash: "$2a$12$...", // Hash bcrypt de tu contraseña
  rol: "ADMIN",
  circunscripcion: null,
  nombreCompleto: "Administrador del Sistema",
  activo: true,
  createdAt: new Date()
})
```

---

## 🔑 Iniciando Sesión como Admin

1. Abre la aplicación
2. Haz clic en "Iniciar Sesión"
3. Ingresa:
   - **Usuario:** `admin`
   - **Contraseña:** `admin123`
4. Haz clic en "Iniciar sesión"

---

## 🔧 Panel de Administración

Una vez autenticado como admin, verás una **pestaña "Administración"** con opciones:

### Base de Datos

#### Botón: 🗑️ Vaciar Base de Datos

Limpia TODOS los registros de seguimiento.

**¿Qué se elimina?**
- ✓ Todos los registros de zonas electorales
- ✓ Todos los datos de seguimiento
- ✓ Todos los hitos completados

**¿Qué NO se elimina?**
- ✗ Los usuarios (siguen disponibles)
- ✗ La configuración de marca
- ✗ Datos de administración

---

## ⚠️ Proceso de Seguridad para Resetear BD

El proceso tiene **múltiples capas de seguridad**:

### Paso 1: Modal de Advertencia
- Se muestra un modal rojo con advertencia
- Explica qué datos se eliminarán
- Muestra qué datos se conservarán

### Paso 2: Código de Confirmación
Debes copiar y pegar exactamente:
```
ELIMINAR_TODOS_LOS_DATOS_PERMANENTEMENTE
```

### Paso 3: Validación
El botón "Eliminar" solo se activa cuando:
- El código es correcto
- No hay otra operación en progreso

### Paso 4: Ejecución
Se ejecuta una llamada API con autenticación JWT que verifica:
- Token válido
- Usuario es ADMIN
- Código de confirmación correcto

---

## 📊 Cambios Realizados

### Archivo: `api/userModel.js`
```javascript
export const USER_ROLES = Object.freeze({
  ADMIN: 'ADMIN',              // ← Nuevo rol
  GENERAL: 'OPERARIO_GENERAL',
  CIRCUNSCRIPTION: 'OPERARIO_CIRC',
});
```

### Nuevos Archivos Creados:

1. **`api/admin/reset-database.js`** - API endpoint para resetear BD
2. **`src/assets/components/AdminSection.jsx`** - Componente UI del panel
3. **`src/assets/components/AdminSection.css`** - Estilos del panel
4. **`create-admin-user.js`** - Script para crear usuario admin

---

## 🚀 Próximos Pasos

### 1. Crear Usuario Admin
```bash
node create-admin-user.js
```

### 2. Iniciar Sesión
- Usuario: `admin`
- Contraseña: `admin123`

### 3. Cambiar Contraseña
⚠️ **IMPORTANTE:** Cambia la contraseña por defecto en producción

Para cambiar contraseña en MongoDB:
```javascript
const newHash = await bcrypt.hash('tu-nueva-contraseña', 12);
db.users.updateOne(
  { username: 'admin' },
  { $set: { password_hash: newHash } }
);
```

### 4. Integrar AdminSection en la App
Agrega el componente en tu página principal:
```jsx
import AdminSection from './components/AdminSection';

// En tu componente
<AdminSection authSession={authSession} />
```

---

## 🔐 Mejores Prácticas de Seguridad

### ✅ Haz:
- ✓ Cambia la contraseña por defecto
- ✓ Usa una contraseña fuerte (12+ caracteres)
- ✓ Mantén seguro el token JWT
- ✓ Solo comparte acceso admin con personas de confianza
- ✓ Revisa logs de administración regularmente

### ❌ No hagas:
- ✗ Compartas la contraseña de admin
- ✗ Dejes la contraseña por defecto en producción
- ✗ Resetees la BD sin antes hacer un backup
- ✗ Dejes a múltiples personas con acceso admin

---

## 🧪 Pruebas

### Probar Reseteo de BD (Con Datos de Prueba)

1. Crea algunos registros de seguimiento
2. Inicia sesión como admin
3. Ve a "Administración"
4. Haz clic en "Vaciar Base de Datos"
5. Sigue el proceso de confirmación
6. Verifica que los datos fueron eliminados

---

## 🆘 Solución de Problemas

### "El usuario admin no tiene acceso a Administración"
- Verifica que el rol sea exactamente `'ADMIN'` (mayúsculas)
- Recrea el usuario con `node create-admin-user.js`

### "El botón de Reseteo no aparece"
- Asegúrate de estar autenticado como admin
- Recarga la página (Ctrl+F5)

### "Error al resetear: 'Acceso denegado'"
- Verifica que tu token JWT sea válido
- Intenta cerrar sesión y volver a iniciar

### "El endpoint `/api/admin/reset-database` no existe"
- Verifica que el archivo `api/admin/reset-database.js` esté en su lugar
- Redeploy la aplicación en Vercel

---

## 📋 Checklist de Implementación

- [ ] Ejecuté `node create-admin-user.js`
- [ ] Creé un usuario administrador
- [ ] Iniciee sesión con la cuenta admin
- [ ] Veo la pestaña "Administración"
- [ ] El botón "Vaciar Base de Datos" es visible
- [ ] Cambié la contraseña por defecto
- [ ] Probé el reseteo con datos de prueba
- [ ] Hice backup de datos importantes

---

## 📞 API Endpoint

**Endpoint:** `POST /api/admin/reset-database`

**Headers Requeridos:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "confirmationPhrase": "ELIMINAR_TODOS_LOS_DATOS_PERMANENTEMENTE"
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Base de datos limpiada correctamente. Se eliminaron X registros.",
  "deletedCount": 123,
  "timestamp": "2024-11-21T08:30:00.000Z",
  "admin": "admin"
}
```

**Errores Posibles:**
- `401` - No autenticado o token inválido
- `403` - Usuario no es administrador
- `400` - Código de confirmación inválido
- `500` - Error interno del servidor

---

**¡Sistema de Administración completamente implementado!** 🎉
