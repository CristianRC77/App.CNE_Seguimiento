# 🎨 Configuración de Marca - Logo y Nombre

Esta guía explica cómo cambiar el logo y nombre de la aplicación CNE para que aparezcan en toda la interfaz y en los reportes de Excel.

## 📁 Archivo de Configuración

La configuración de marca está centralizada en:

```
src/assets/constants/brandConfig.js
```

## 🔧 Cómo Cambiar el Logo y Nombre

### 1. Editar el archivo de configuración

Abre `src/assets/constants/brandConfig.js` y modifica estos valores:

```javascript
export const brandConfig = {
  // Nombre de la organización
  organizationName: 'TU NUEVO NOMBRE AQUÍ',
  
  // Subtítulo o descripción
  subtitle: 'TU SUBTÍTULO AQUÍ',
  
  // Ruta del logo (relativa a public/)
  logoPath: '/images/tu-nuevo-logo.png',
  
  // Texto alternativo del logo
  logoAlt: 'Logo Personalizado',
  
  // Nombre para reportes y documentos
  reportTitle: 'Reporte Personalizado',
  
  // Versión de la app
  version: '1.0.0',
};
```

### 2. Cambiar el Logo

#### Opción A: Reemplazar el logo existente
1. Coloca tu archivo de logo en: `public/images/logo-cne.png`
2. Reemplaza el archivo existente
3. No es necesario cambiar la configuración

#### Opción B: Usar un nuevo nombre de archivo
1. Coloca tu logo en: `public/images/mi-nuevo-logo.png`
2. En `brandConfig.js`, cambiar:
   ```javascript
   logoPath: '/images/mi-nuevo-logo.png',
   ```

### 3. Dónde aparecen estos cambios

Una vez configurado, el logo y nombre aparecerán en:

✅ **Barra lateral (Sidebar)** - Nombre y logo principal
✅ **Reportes en Excel** - Nombre en el encabezado
✅ **Reportes en CSV** - Nombre en el archivo descargado
✅ **Titulo de documentos** - En el nombre del archivo exportado

## 📊 Exportar a Excel con Branding

Para usar la nueva función de exportación a Excel con marca personalizada:

```javascript
import { exportOfficesToExcel } from '@/assets/utils/exportWithBranding.js';

// En tu componente o función
await exportOfficesToExcel(offices);
```

**Requisito:** Se debe tener instalada la librería `xlsx`:
```bash
npm install xlsx
```

## 💾 Cambios Realizados

Los siguientes archivos fueron creados/modificados:

1. **Creado:** `src/assets/constants/brandConfig.js`
   - Configuración centralizada de marca

2. **Creado:** `src/assets/utils/exportWithBranding.js`
   - Nueva función de exportación a Excel con branding
   - Función mejorada de exportación a CSV

3. **Modificado:** `src/assets/components/Sidebar.jsx`
   - Ahora usa `brandConfig` para logo y nombre
   - Se actualiza automáticamente cuando cambias la configuración

## 🚀 Próximos Pasos

Para hacer esto aún más flexible, podrías:

1. **Cargar desde base de datos:** Crear un endpoint API que devuelva la configuración de marca
2. **Admin dashboard:** Crear una página donde administradores puedan cambiar logo y nombre
3. **Múltiples organizaciones:** Soportar diferentes marcas según el usuario logueado

## ❓ Preguntas Frecuentes

**P: ¿Cómo cambio el logo desde una base de datos?**
A: Modifica `getBrandConfig()` en `brandConfig.js` para hacer una llamada API en lugar de retornar valores estáticos.

**P: ¿El logo aparece en PDF?**
A: Por ahora solo en Excel y CSV. Para PDF necesitarías una librería como `jspdf` o `html2pdf`.

**P: ¿Puedo tener diferentes logos por circunscripción?**
A: Sí, modifica `getBrandConfig()` para recibir un parámetro y retornar diferentes configuraciones.
