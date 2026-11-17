import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getCollection } from './mongodb.js';
import { isValidUserDocument, toPublicUser } from './userModel.js';

const usersCollectionName = process.env.MONGODB_USERS_COLLECTION || 'users';

export default async function loginHandler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Método no permitido.' });
    return;
  }

  const secret = process.env.JWT_SECRET;
  const username = String(request.body?.username || '').trim().toLowerCase();
  const password = String(request.body?.password || '');

  if (!secret) {
    response.status(500).json({ error: 'La autenticación no está configurada en el servidor.' });
    return;
  }
  if (!username || !password) {
    response.status(400).json({ error: 'Usuario y contraseña son obligatorios.' });
    return;
  }

  try {
    const collection = await getCollection(usersCollectionName);
    const user = await collection.findOne({ username, activo: true });

    // No se revela si el usuario existe para evitar enumeración de cuentas.
    const storedHash = user?.password_hash;
    const isLegacyPassword = !storedHash && typeof user?.password === 'string';
    const passwordMatches = storedHash
      ? await bcrypt.compare(password, storedHash)
      : isLegacyPassword && user.password === password;

    if (!user || !isValidUserDocument(user) || !passwordMatches) {
      response.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
      return;
    }

    // Migra automáticamente registros antiguos que todavía guardan password plano.
    if (isLegacyPassword) {
      await collection.updateOne(
        { _id: user._id, password: user.password },
        {
          $set: { password_hash: await bcrypt.hash(password, 12) },
          $unset: { password: '' },
        }
      );
    }

    const publicUser = toPublicUser(user);
    const token = jwt.sign(
      {
        sub: publicUser.id,
        username: publicUser.username,
        rol: publicUser.rol,
        circunscripcion: publicUser.circunscripcion,
      },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    response.status(200).json({ token, user: publicUser });
  } catch (error) {
    console.error('Error al autenticar usuario.', error);
    response.status(500).json({ error: 'No se pudo iniciar sesión.' });
  }
}
