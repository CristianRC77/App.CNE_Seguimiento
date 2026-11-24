import jwt from 'jsonwebtoken';
import { getCollection } from '../mongodb.js';

/**
 * API para resetear/vaciar la base de datos
 * Solo accessible para usuarios con rol ADMIN
 * Requiere múltiples confirmaciones de seguridad
 */
export default async function resetDatabaseHandler(request, response) {
  // Solo permitir POST
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Verificar autenticación JWT
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.status(401).json({ error: 'No autenticado' });
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return response.status(500).json({ error: 'Servidor no configurado correctamente' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return response.status(401).json({ error: 'Token inválido o expirado' });
    }

    // Verificar que el usuario sea ADMIN
    if (decoded.rol !== 'ADMIN') {
      return response.status(403).json({ error: 'Acceso denegado. Solo administradores pueden resetear la BD' });
    }

    // Requerir confirmación
    const { confirmationPhrase } = request.body;

    if (confirmationPhrase !== 'ELIMINAR_TODOS_LOS_DATOS_PERMANENTEMENTE') {
      return response.status(400).json({
        error: 'Código de confirmación inválido',
        required: 'ELIMINAR_TODOS_LOS_DATOS_PERMANENTEMENTE',
      });
    }

    // Obtener la colección de datos
    const collectionName = process.env.MONGODB_COLLECTION || 'zona_electotal';
    const collection = await getCollection(collectionName);

    // Eliminar TODOS los documentos
    const result = await collection.deleteMany({});

    console.log(`[ADMIN ACTION] Base de datos reseteada por ${decoded.username}. Documentos eliminados: ${result.deletedCount}`);

    return response.status(200).json({
      success: true,
      message: `Base de datos limpiada correctamente. Se eliminaron ${result.deletedCount} registros.`,
      deletedCount: result.deletedCount,
      timestamp: new Date().toISOString(),
      admin: decoded.username,
    });
  } catch (error) {
    console.error('Error al resetear base de datos:', error);
    return response.status(500).json({ error: 'Error al resetear la base de datos' });
  }
}
