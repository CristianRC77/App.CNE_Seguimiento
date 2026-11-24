import jwt from 'jsonwebtoken';
import { getCollection } from '../mongodb.js';

/**
 * API para reiniciar el seguimiento: pone todos los hitos y actas en false/vacío.
 * No elimina ningún documento. Solo accessible para usuarios con rol ADMIN.
 */
export default async function resetDatabaseHandler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Método no permitido' });
  }

  try {
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

    if (decoded.rol !== 'ADMIN') {
      return response.status(403).json({ error: 'Acceso denegado. Solo administradores pueden reiniciar el seguimiento' });
    }

    const { confirmationPhrase } = request.body;
    if (confirmationPhrase !== 'REINICIAR') {
      return response.status(400).json({
        error: 'Código de confirmación inválido',
        required: 'REINICIAR',
      });
    }

    const collectionName = process.env.MONGODB_COLLECTION || 'zona_electotal';
    const collection = await getCollection(collectionName);

    // Reinicia hitos, actas y progreso. No toca ningún otro campo del documento.
    const result = await collection.updateMany({}, {
      $set: {
        milestones: {
          instalacionMjrv:              false,
          inicioVotacion:               false,
          finVotacion:                  false,
          inicioEscrutinio:             false,
          digitalizacionEscrutinio:     false,
          digitalizacionInstalacion:    false,
        },
        actasDigitalizadas: {
          escrutinio:  { hombres: [], mujeres: [] },
          instalacion: { hombres: [], mujeres: [] },
        },
        progress:      0,
        estado_Avance: 'Sin empezar',
        updated:       new Date().toISOString(),
      },
      $inc: { dataVersion: 1 },
    });

    console.log(`[ADMIN] Seguimiento reiniciado por ${decoded.username}. Zonas actualizadas: ${result.modifiedCount}`);

    return response.status(200).json({
      success: true,
      message: `Seguimiento reiniciado correctamente. ${result.modifiedCount} zonas restablecidas a cero.`,
      modifiedCount: result.modifiedCount,
      timestamp: new Date().toISOString(),
      admin: decoded.username,
    });
  } catch (error) {
    console.error('Error al reiniciar seguimiento:', error);
    return response.status(500).json({ error: 'Error al reiniciar el seguimiento' });
  }
}
