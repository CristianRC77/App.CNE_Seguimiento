import jwt from 'jsonwebtoken';

export default async function refreshHandler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Método no permitido.' });
    return;
  }

  const secret = process.env.JWT_SECRET;
  const authHeader = request.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!secret) {
    response.status(500).json({ error: 'La autenticación no está configurada en el servidor.' });
    return;
  }

  if (!token) {
    response.status(401).json({ error: 'Token no proporcionado.' });
    return;
  }

  try {
    // Verifica el token actual incluso si está cerca de expirar (con tolerancia de 60 segundos).
    const payload = jwt.verify(token, secret, { ignoreExpiration: true });

    // Rechaza tokens que ya están completamente expirados (más de 1 minuto).
    const expirationTime = payload.exp * 1000;
    if (expirationTime < Date.now() - 60000) {
      response.status(401).json({ error: 'El token está expirado.' });
      return;
    }

    const newToken = jwt.sign(
      {
        sub: payload.sub,
        username: payload.username,
        rol: payload.rol,
        circunscripcion: payload.circunscripcion,
      },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    response.status(200).json({ token: newToken });
  } catch (error) {
    console.error('Error al refrescar el token.', error);
    response.status(401).json({ error: 'No se pudo refrescar el token.' });
  }
}
