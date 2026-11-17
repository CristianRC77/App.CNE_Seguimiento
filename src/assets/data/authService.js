const apiUrl = import.meta.env.VITE_API_URL || '/api';
const authStorageKey = 'cne-auth-session';

const isTokenUsable = (token) => {
  try {
    const encodedPayload = token.split('.')[1]
      .replaceAll('-', '+')
      .replaceAll('_', '/');
    const paddedPayload = encodedPayload.padEnd(
      encodedPayload.length + ((4 - (encodedPayload.length % 4)) % 4),
      '='
    );
    const payload = JSON.parse(atob(paddedPayload));
    return !payload.exp || payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

// Extrae el tiempo de expiración (exp) del JWT en milisegundos
export const getTokenExpirationTime = (token) => {
  try {
    if (!token) return null;
    const encodedPayload = token.split('.')[1]
      .replaceAll('-', '+')
      .replaceAll('_', '/');
    const paddedPayload = encodedPayload.padEnd(
      encodedPayload.length + ((4 - (encodedPayload.length % 4)) % 4),
      '='
    );
    const payload = JSON.parse(atob(paddedPayload));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

export const getStoredAuthSession = () => {
  const stored = localStorage.getItem(authStorageKey);
  if (!stored) {
    console.warn('⚠️ No hay sesión almacenada en localStorage');
    return null;
  }

  try {
    const session = JSON.parse(stored);
    if (!session.token) {
      console.warn('⚠️ Sesión almacenada pero no tiene token');
      localStorage.removeItem(authStorageKey);
      return null;
    }
    if (!session.user) {
      console.warn('⚠️ Sesión almacenada pero no tiene usuario');
      localStorage.removeItem(authStorageKey);
      return null;
    }
    if (!isTokenUsable(session.token)) {
      console.warn('⚠️ Token almacenado expiró o no es válido');
      localStorage.removeItem(authStorageKey);
      return null;
    }
    console.log(`✅ Sesión válida para usuario: ${session.user.username}`);
    return session;
  } catch (err) {
    console.error('❌ Error parseando sesión almacenada:', err);
    localStorage.removeItem(authStorageKey);
    return null;
  }
};

export const login = async (username, password) => {
  console.log(`📝 Intentando login para usuario: ${username}`);
  const response = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.error || 'No se pudo iniciar sesión.');
    error.status = response.status;
    console.error(`❌ Login falló: ${error.message}`);
    throw error;
  }

  const session = { token: result.token, user: result.user };
  console.log(`✅ Login exitoso para ${result.user.username}, guardando token...`);
  localStorage.setItem(authStorageKey, JSON.stringify(session));
  console.log(`✅ Sesión guardada en localStorage`);
  return session;
};

export const logout = () => {
  localStorage.removeItem(authStorageKey);
};

export const getAuthToken = () => {
  const session = getStoredAuthSession();
  const token = session?.token || null;
  if (!token) {
    console.warn('⚠️ getAuthToken: No token found in session');
  }
  return token;
};

// Verifica si el token está cercano a expirar (menos de 5 minutos)
export const isTokenExpiringsoon = (token) => {
  const expirationTime = getTokenExpirationTime(token);
  if (!expirationTime) return false;
  const msUntilExpiration = expirationTime - Date.now();
  return msUntilExpiration < (5 * 60 * 1000); // Menos de 5 minutos
};

export const refreshAuthToken = async (onTokenRefreshed) => {
  try {
    const currentToken = getAuthToken();
    if (!currentToken) {
      console.error('❌ No hay token actual para refrescar');
      return false;
    }

    console.log('🔄 Intentando refrescar token...');
    const response = await fetch(`${apiUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentToken}`,
      },
    });

    if (!response.ok) {
      console.error(`❌ Refresh rechazado: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`   Detalles: ${errorText}`);
      return false;
    }

    const result = await response.json();
    if (result.token) {
      // Obtén la sesión actual para preservar el user
      let session = JSON.parse(localStorage.getItem(authStorageKey) || 'null');
      if (!session || !session.user) {
        // Si no hay sesión válida, retorna false
        console.error('❌ No hay sesión válida para refrescar');
        return false;
      }
      // Solo actualiza el token, preserva el user
      session.token = result.token;
      localStorage.setItem(authStorageKey, JSON.stringify(session));
      
      // Dispara un evento personalizado para sincronizar el estado en React
      window.dispatchEvent(new CustomEvent('tokenRefreshed', { detail: session }));
      
      // Si hay callback, llámalo
      if (onTokenRefreshed) {
        onTokenRefreshed(session);
      }
      
      console.log('✅ Token refrescado exitosamente');
      return true;
    }
    console.error('❌ Respuesta sin token:', result);
    return false;
  } catch (error) {
    console.error('Error al refrescar token:', error);
    return false;
  }
};
