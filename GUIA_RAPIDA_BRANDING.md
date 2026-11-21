# 🎨 GUÍA RÁPIDA - Cambiar Logo y Nombre

## 📌 Resumen Rápido

Ahora puedes cambiar el **logo y nombre de la organización** de 2 formas:

---

## 🔧 OPCIÓN 1: Cambio Rápido (Desarrollo)

**Archivo:** `src/assets/constants/brandConfig.js`

```javascript
export const brandConfig = {
  organizationName: 'TU NUEVO NOMBRE',           // ← Cambia esto
  subtitle: 'TU NUEVO SUBTÍTULO',               // ← Y esto
  logoPath: '/images/tu-logo.png',              // ← Y la ruta del logo
  logoAlt: 'Tu Logo',
  reportTitle: 'Mi Reporte Personalizado',      // ← Nombre para reportes
  version: '1.0.0',
};
```

**Después de cambiar:** Reinicia tu servidor local con `npm run dev`

---

## 👨‍💼 OPCIÓN 2: Panel de Administración (Producción)

**Componente:** `BrandingAdmin.jsx` (ya creado)

Pasos:
1. Inicia sesión con una cuenta **admin**
2. Accede a "Configuración de Marca"
3. Completa el formulario:
   - Nombre de la organización
   - Subtítulo
   - Ruta del logo
   - Título para reportes
4. Haz clic en "Guardar Configuración"
5. ✅ ¡Listo! Los cambios se aplican inmediatamente

---

## 📊 Dónde Aparecen los Cambios

| Ubicación | ✅ Implementado |
|-----------|---|
| Barra lateral (logo + nombre) | ✅ Sí |
| Reportes en Excel | ✅ Sí |
| Reportes en CSV | ✅ Sí |
| Nombre de archivos descargados | ✅ Sí |

---

## 🏞️ Cambiar el Logo

### Si reemplazas el archivo actual:
1. Coloca tu logo en: `public/images/logo-cne.png`
2. Reemplaza el archivo existente
3. ¡Listo! Se mostrará automáticamente

### Si usas un archivo nuevo:
1. Coloca tu logo en: `public/images/mi-nuevo-logo.png`
2. En `brandConfig.js` cambia:
   ```javascript
   logoPath: '/images/mi-nuevo-logo.png'
   ```
3. Reinicia la aplicación

---

## 📥 Exportar a Excel con Marca

```javascript
import { exportOfficesToExcel } from '@/assets/utils/exportWithBranding.js';

// En tu botón o evento
await exportOfficesToExcel(offices);
```

**Resultado:** Un Excel con:
- Logo y nombre en el encabezado
- Fecha de generación
- Datos tabulares formateados
- Archivo con nombre personalizado

---

## ✅ Checklist

- [ ] ¿Quieres cambiar logo y nombre?
- [ ] ¿Tienes una imagen del logo?
- [ ] ¿Sabes qué nombre usar?
- [ ] ¿Necesitas exportar a Excel?

**Si respondiste "sí" a todo, ya está todo listo para usar.** 🎉

---

## 📱 Ejemplo de Configuración Personalizada

```javascript
// ANTES
organizationName: 'Consejo Nacional Electoral'
subtitle: 'Oficinas Consulares'
logoPath: '/images/logo-cne.png'

// DESPUÉS (ejemplo para otra organización)
organizationName: 'Ministerio del Interior'
subtitle: 'Dirección Electoral'
logoPath: '/images/logo-ministerio.png'
reportTitle: 'Reporte Electoral Ministerial'
```

---

## 🆘 Preguntas Frecuentes

**P: ¿Dónde coloco mi logo?**
A: En la carpeta `public/images/` con la extensión `.png` o `.jpg`

**P: ¿El logo aparece en PDF?**
A: No, solo en Excel y CSV. Para PDF necesitarías una configuración adicional.

**P: ¿Puedo cambiar más cosas (colores, fuentes)?**
A: Sí, modifica `src/assets/constants/brandConfig.js` y agrega más propiedades.

**P: ¿Los cambios se guardan permanentemente?**
A: Sí, se guardan en la base de datos MongoDB cuando usas el panel de administración.

---

## 🚀 Próximo Paso

Ahora que ya tienes **logo y nombre configurables**, puedes:

1. ✅ Cambiar el logo a tu gusto
2. ✅ Cambiar el nombre de la organización  
3. ✅ Generar reportes en Excel con tu marca
4. ✅ Permitir que admins cambien la marca desde la app

**¿Necesitas ayuda con algo más?** 🤔
