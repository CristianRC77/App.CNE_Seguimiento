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
    throw new Error(`API de seguimiento (${response.status}): ${details}`);
  }

  return response.json();
};

export const loadSeguimiento = async () => {
  const offices = await requestSeguimiento();
  if (!Array.isArray(offices)) throw new Error('La API no devolvió una lista de oficinas.');
  cacheSeguimiento(offices);
  return offices;
};

export const saveSeguimiento = async (offices) => {
  cacheSeguimiento(offices);
  await requestSeguimiento({
    method: 'PUT',
    body: JSON.stringify({ offices }),
  });
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
