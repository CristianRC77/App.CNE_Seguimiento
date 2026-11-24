# 🚀 Implementación Completada: Admin Dashboard y Exportación a Excel

## ✅ Funcionalidades Implementadas

### 1️⃣ **Rol de Administrador y Reinicio de Base de Datos**

#### Características:
- ✅ Usuario **ADMIN** con acceso exclusivo a pestaña "Administración"
- ✅ Botón **🗑️ Vaciar Base de Datos** con protecciones de seguridad
- ✅ **Confirmación doble** antes de ejecutar el borrado:
  - Advertencia clara indicando que es irreversible
  - Código de confirmación que el usuario debe copiar y pegar
  - Validación en el backend

#### Medidas de Seguridad:
- 🔐 Solo usuarios con rol **ADMIN** pueden acceder
- 🔐 Requiere autenticación JWT válida
- 🔐 Código de confirmación: `ELIMINAR_TODOS_LOS_DATOS_PERMANENTEMENTE`
- 🔐 Mantiene intactos:
  - Estructura de tablas (collections)
  - Usuarios (especialmente el ADMIN)
  - Configuraciones de marca

#### Acceder a la Sección de Administración:
1. Inicia sesión como usuario **admin**
2. En el sidebar, verás el botón 🔧 **Administración** (en rojo)
3. Haz clic para abrir la vista exclusiva
4. Busca el botón **🗑️ Vaciar Base de Datos**

---

### 2️⃣ **Exportación a Excel Institucional**

#### Reemplaza CSV por Excel Profesional:
- ✅ Librería **exceljs** para control total sobre el formato
- ✅ Encabezado institucional elegante con:
  - 🏛️ Logo del CNE (desde `/public/images/logo-cne.png`)
  - **CONSEJO NACIONAL ELECTORAL** (negrita, tamaño 16, fondo azul)
  - **Dirección de Procesos en el Exterior** (tamaño 12, fondo gris)
  - Fecha del reporte

#### Estructura de Datos:
- 📊 Tabla con todas las columnas operativas
- 📍 Datos **agrupados por circunscripción**
- ✨ **Subtotal por circunscripción** con:
  - Fórmulas dinámicas `=SUM(...)`
  - Resaltado visual (negrita, fondo gris)
  - Conteo de juntas y estados

#### Total General:
- 📈 Fila final con **TOTAL GENERAL**
- 📊 Fórmulas dinámicas que suman todos los subtotales
- 🎨 Formato destacado (negrita, fondo azul)

#### Características Técnicas:
- 📄 Formato: `.xlsx` (Excel moderno)
- 🎨 Orientación: Paisaje (landscape) para mejor legibilidad
- 📏 Ancho de columnas automáticamente ajustado
- 🧮 Todas las fórmulas son dinámicas (recalculan si cambias datos)

---

## 🎯 Cómo Usar

### Crear Usuario Admin (Primera vez)

Ejecuta en PowerShell desde la carpeta del proyecto:

```powershell
node create-admin-user.js
```

Credenciales creadas:
- **Usuario**: `admin`
- **Contraseña**: `admin123`
- **Rol**: `ADMIN`

### Usar la Exportación a Excel

1. Ve a la vista **📄 Reportes**
2. Selecciona filtros si es necesario
3. Haz clic en **📊 Exportar reporte a Excel**
4. Se descarga un archivo `.xlsx` con la fecha actual

El archivo incluye:
- Logo y títulos institucionales
- Todos los datos de las oficinas filtradas
- Subtotales por circunscripción (con fórmulas)
- Total general (con fórmulas)
- Formateo profesional

### Usar la Función de Reset

⚠️ **ADVERTENCIA: Esta operación es IRREVERSIBLE**

1. Inicia sesión como **admin**
2. Ve a la pestaña 🔧 **Administración**
3. Haz clic en 🗑️ **Vaciar Base de Datos**
4. Leerás una advertencia sobre qué se eliminará
5. Copia el código de confirmación
6. Pégalo en el input
7. Haz clic en **🗑️ Eliminar Todos los Datos**

El reset eliminará:
- ✓ Todos los registros de zonas electorales
- ✓ Todos los datos de seguimiento
- ✓ Todos los hitos completados

Pero **NO** eliminará:
- ✗ Usuarios (el admin se mantiene)
- ✗ Estructura de tablas
- ✗ Configuraciones

---

## 🔧 Detalles Técnicos

### Endpoints API Nuevos

#### `POST /api/admin/setup` (ya existía)
Crear usuario admin inicialmente
- Parámetro: `setupToken`
- Protegido por variable de entorno

#### `POST /api/admin/reset-database` (NUEVO)
Resetear base de datos
- Protegido por: JWT + rol ADMIN
- Parámetro: `confirmationPhrase` = `'ELIMINAR_TODOS_LOS_DATOS_PERMANENTEMENTE'`
- Respuesta: Número de documentos eliminados

### Componentes Frontend

#### `AdminSection.jsx` (NUEVO)
- Modal de confirmación doble
- Validación de código
- Integración con API de reset

#### `exportToExcel.js` (NUEVO)
- Generación de archivos Excel
- Agrupación por circunscripción
- Fórmulas dinámicas
- Formateo institucional

### Dependencias Agregadas

```json
{
  "exceljs": "^4.4.0"
}
```

Instalar con:
```bash
npm install
```

---

## 📋 Checklist de Verificación

- [ ] Usuario admin creado con credenciales `admin:admin123`
- [ ] Botón 🔧 **Administración** aparece en sidebar cuando estás logueado como admin
- [ ] Modal de reset muestra advertencia clara
- [ ] Código de confirmación es validado correctamente
- [ ] Botón **📊 Exportar reporte a Excel** funciona
- [ ] Excel generado tiene:
  - [ ] Logo del CNE
  - [ ] Encabezados institucionales
  - [ ] Datos agrupados por circunscripción
  - [ ] Subtotales con fórmulas
  - [ ] Total general con fórmulas
  - [ ] Formateo visual (colores, negrita, etc.)

---

## 🚨 Notas Importantes

1. **Reset es irreversible**: Una vez ejecutado, todos los datos de seguimiento se pierden permanentemente
2. **Solo admin puede hacer reset**: El endpoint valida el rol en el backend
3. **Excel es profesional**: Compatible con todas las versiones modernas de Excel
4. **Fórmulas dinámicas**: Si abres el Excel y cambias valores, los totales se recalculan automáticamente

---

## 📞 Soporte

Si hay problemas:
1. Verifica que el usuario admin existe: `node create-admin-user.js`
2. Verifica que el JWT token es válido
3. Revisa la consola de desarrollador (F12) para mensajes de error
4. Verifica que MongoDB está conectado

---

**Estado: ✅ COMPLETADO**
Fecha: 2026-11-23
