/**
 * Configuración de marca y branding de la aplicación
 * Modifica estos valores para cambiar el logo y nombre en toda la app
 */

// Configuración por defecto (fallback)
const defaultConfig = {
  organizationName: 'Consejo Nacional Electoral',
  subtitle: 'Oficinas Consulares',
  logoPath: '/images/logo-cne.png',
  logoAlt: 'Logo CNE',
  reportTitle: 'Reporte de Seguimiento CNE',
  version: '1.0.0',
};

let cachedConfig = null;
let cacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Obtiene la configuración de marca (con caché)
 * Intenta cargar desde API, si falla usa valores por defecto
 */
export const getBrandConfig = async () => {
  const now = Date.now();
  
  // Retornar del caché si es reciente
  if (cachedConfig && cacheTime && now - cacheTime < CACHE_DURATION) {
    return cachedConfig;
  }

  try {
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    const response = await fetch(`${apiUrl}/config`);
    
    if (response.ok) {
      cachedConfig = await response.json();
      cacheTime = now;
      return cachedConfig;
    }
  } catch (error) {
    console.warn('No se pudo cargar configuración de marca, usando valores por defecto:', error);
  }

  // Fallback a valores por defecto
  cachedConfig = defaultConfig;
  cacheTime = now;
  return cachedConfig;
};

/**
 * Actualiza la configuración de marca (requiere autenticación de admin)
 */
export const updateBrandConfig = async (newConfig, token) => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    const response = await fetch(`${apiUrl}/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(newConfig),
    });

    if (response.ok) {
      // Limpiar caché para cargar la nueva configuración
      cachedConfig = null;
      cacheTime = null;
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error al actualizar configuración de marca:', error);
    return false;
  }
};

// Exportar también la configuración por defecto
export const brandConfig = defaultConfig;
