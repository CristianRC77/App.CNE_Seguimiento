# 📋 Resumen - Configuración de Marca Personalizable

## ✅ Lo que se ha implementado

Hemos creado un sistema completo para que **el logo y nombre de la organización sean configurables** y aparezcan en:

### 1️⃣ **Interfaz de Usuario**
- ✅ Logo y nombre en la barra lateral (Sidebar)
- ✅ Se cargan dinámicamente desde la base de datos
- ✅ Se actualizan sin necesidad de recargar la app

### 2️⃣ **Reportes en Excel**
- ✅ Nombre de la organización en el encabezado
- ✅ Fecha de generación del reporte
- ✅ Formato profesional con colores
- ✅ Librería `xlsx` instalada para generación

### 3️⃣ **Reportes en CSV**
- ✅ Nombre en el nombre del archivo descargado
- ✅ Fecha automática en el nombre

### 4️⃣ **Panel de Administración**
- ✅ Componente `BrandingAdmin.jsx` para cambiar la configuración
- ✅ Solo accesible para usuarios con rol `admin`
- ✅ Validación y mensajes de éxito/error
- ✅ Vista previa del logo en tiempo real

## 📁 Archivos Creados/Modificados

### 📌 Nuevos Archivos:

1. **`src/assets/constants/brandConfig.js`**
   - Configuración centralizada de marca
   - Carga desde API con caché de 5 minutos
   - Fallback a valores por defecto

2. **`src/assets/utils/exportWithBranding.js`**
   - Funciones para exportar a Excel con branding
   - Funciones para exportar a CSV con nombre personalizado
   - Encabezados automáticos con fecha

3. **`src/assets/components/BrandingAdmin.jsx`**
   - Panel de administración de marca
   - Formulario para cambiar logo, nombre, etc.
   - Solo visible para admins
   - Vista previa de logo en tiempo real

4. **`src/assets/components/BrandingAdmin.css`**
   - Estilos profesionales para el panel de admin
   - Interfaz intuitiva y responsiva

5. **`api/config.js`**
   - Endpoint API para obtener/actualizar configuración
   - Almacena en colección `brand_config` de MongoDB
   - Métodos: GET (obtener), PUT (actualizar)

6. **`BRANDING_CONFIG.md`**
   - Documentación completa para usuarios
   - Guías paso a paso
   - Ejemplos y preguntas frecuentes

### 🔄 Archivos Modificados:

1. **`src/assets/components/Sidebar.jsx`**
   - Ahora carga la configuración de marca dinámicamente
   - Usa hooks de React para estado asincrónico
   - Displays logo y nombre personalizados

2. **`package.json`**
   - Instalado: `xlsx` para generación de Excel

## 🚀 Cómo Usar

### Opción 1: Cambiar en el código (Desarrollo)

1. Edita `src/assets/constants/brandConfig.js`
2. Modifica `defaultConfig` con tus valores
3. Reinicia la aplicación

### Opción 2: Usar el panel de administración (Producción)

1. Inicia sesión con una cuenta de **admin**
2. Ve a la sección "Configuración de Marca" (si existe)
3. Cambia:
   - Nombre de la organización
   - Subtítulo
   - Ruta del logo
   - Título para reportes
4. Haz clic en "Guardar"
5. Los cambios se aplicarán inmediatamente

### Opción 3: API directa

```bash
# Obtener configuración actual
curl https://app-cne-seguimiento.vercel.app/api/config

# Actualizar configuración
curl -X PUT https://app-cne-seguimiento.vercel.app/api/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "organizationName": "Mi Organización",
    "subtitle": "Mi Subtítulo",
    "logoPath": "/images/mi-logo.png",
    "logoAlt": "Logo",
    "reportTitle": "Mi Reporte"
  }'
```

## 📊 Exportar a Excel con Logo

En cualquier componente:

```javascript
import { exportOfficesToExcel } from '@/assets/utils/exportWithBranding.js';

// Usar en un botón o evento
await exportOfficesToExcel(offices);
```

El Excel generado incluirá:
- Logo en el encabezado
- Nombre de la organización
- Fecha de generación
- Datos tabulares formateados

## 🔒 Seguridad

- Solo **admins** pueden actualizar la configuración
- Se validan todos los campos
- Se usa caché para mejorar performance
- Fallback automático si la API falla

## 📱 Características Futuras

Podrías extender esto para:

1. **Múltiples marcas:**
   - Diferentes logos por circunscripción
   - Branding por usuario

2. **Carga de logos:**
   - Upload de imágenes a servidor
   - Almacenamiento en S3 o similar

3. **Temas:**
   - Colores personalizables
   - Diferentes estilos visuales

4. **Auditoría:**
   - Registrar quién cambió la configuración y cuándo
   - Historial de cambios

## ✅ Próximos Pasos

1. **Integra el componente BrandingAdmin** en tu interfaz de administración
2. **Prueba la exportación a Excel** con un usuario logueado
3. **Personaliza los valores** en `brandConfig.js` para tu organización
4. **Haz push** de los cambios a Vercel

## 📞 Soporte

Si necesitas:
- Cambiar el logo de la app: Edita `brandConfig.js`
- Generar Excel con marca: Usa `exportOfficesToExcel()`
- Permitir que admins cambien marca: Integra `BrandingAdmin.jsx`
- Cargar imagen desde servidor: Implementa upload en `api/config.js`

---

**¡Todo está listo para usar!** 🎉
