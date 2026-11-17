import { getAuthToken, refreshAuthToken } from './authService';

const apiUrl = import.meta.env.VITE_API_URL || '/api';
const cacheKey = 'cne-seguimiento-cache';

// La caché permite mostrar el último estado conocido mientras se consulta la API.
export const getCachedSeguimiento = () => {
  const cached = localStorage.getItem(cacheKey);
  if (!cached) return null;

  try {
    const offices = JSON.parse(cached);
    return Array.isArray(offices) ? offices : null;
  } catch (error) {
    console.warn('La caché local del seguimiento no es válida.', error);
    return null;
  }
};

const cacheSeguimiento = (offices) => {
  localStorage.setItem(cacheKey, JSON.stringify(offices));
};

const requestSeguimiento = async (options = {}) => {
  const token = getAuthToken();
  const response = await fetch(`${apiUrl}/seguimiento`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  // Si obtiene 401, intenta refrescar el token una sola vez
  if (response.status === 401 && !options._refreshAttempted) {
    try {
      const refreshed = await refreshAuthToken();
      if (refreshed) {
        console.log('Token refrescado exitosamente, reintentando solicitud...');
        return requestSeguimiento({ ...options, _refreshAttempted: true });
      }
    } catch (refreshError) {
      console.error('No se pudo refrescar el token durante la solicitud de seguimiento.', refreshError);
    }
  }

  if (!response.ok) {
    const details = await response.text();
    const error = new Error(`API de seguimiento (${response.status}): ${details}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
};

export const loadSeguimiento = async () => {
  const offices = await requestSeguimiento();
  if (!Array.isArray(offices) || offices.length === 0) {
    throw new Error('La API devolvió una lista de oficinas vacía o inválida.');
  }
  cacheSeguimiento(offices);
  return offices;
};

export const saveSeguimiento = async (offices, changedIds = null) => {
  // Se envían códigos de zona porque son la clave estable en MongoDB.
  const changedZoneCodes = changedIds
    ? offices
      .filter((office) => changedIds.includes(office.id))
      .map((office) => office.zoneCode)
      .filter(Boolean)
    : undefined;
  const result = await requestSeguimiento({
    method: 'PUT',
    body: JSON.stringify({ offices, changedZoneCodes }),
  });
  if (!Array.isArray(result.offices) || result.offices.length === 0) {
    throw new Error('La API no devolvió el snapshot central después de guardar.');
  }
  cacheSeguimiento(result.offices);
  return result;
};

export const subscribeToSeguimiento = (onChange, onStatus, onError) => {
  let lastSnapshot = '';
  let pollingTimer;
  onStatus('CONNECTING');

  const poll = async () => {
    try {
      const offices = await loadSeguimiento();
      const snapshot = JSON.stringify(offices);
      // Evita actualizar React si el snapshot recibido no cambió.
      if (snapshot !== lastSnapshot) {
        lastSnapshot = snapshot;
        onChange(offices);
      }
      onStatus('SUBSCRIBED');
    } catch (error) {
      onError(error);
      onStatus('CHANNEL_ERROR');
    }
  };

  void poll();
  pollingTimer = window.setInterval(() => void poll(), 5000);

  return () => {
    window.clearInterval(pollingTimer);
  };
};
