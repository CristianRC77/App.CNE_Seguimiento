const apiUrl = import.meta.env.VITE_API_URL || '/api';
const cacheKey = 'cne-seguimiento-cache';

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
  const response = await fetch(`${apiUrl}/seguimiento`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

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
