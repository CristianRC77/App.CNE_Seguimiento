/**
 * Endpoint para resetear/encerar la base de datos
 * POST /api/admin/reset-database
 * 
 * Solo accessible por usuarios con rol ADMIN
 * Requiere token JWT válido
 * 
 * El reset elimina los documentos de seguimiento pero mantiene:
 * - La estructura de collections
 * - Los usuarios (especialmente el ADMIN)
 * - Las configuraciones
 */

import { getCollection } from '../mongodb.js';

export default async function resetDatabaseHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  try {
    // El middleware de autenticación ya debe haber verificado el JWT
    const user = req.user;
    
    if (!user || user.rol !== 'ADMIN') {
      return res.status(403).json({ error: 'Acceso denegado. Solo ADMIN puede resetear la BD.' });
    }

    // Validar confirmación de seguridad
    const { confirmationPhrase } = req.body;
    if (confirmationPhrase !== 'ELIMINAR_TODOS_LOS_DATOS_PERMANENTEMENTE') {
      return res.status(400).json({ error: 'Código de confirmación inválido.' });
    }

    console.log(`⚠️ RESETEO DE BD INICIADO por ${user.username}`);

    // Eliminar documentos de la colección de seguimiento (zona_electotal)
    const seguimientoCollection = await getCollection('zona_electotal');
    const deleteResult = await seguimientoCollection.deleteMany({});

    console.log(`✅ Documentos de seguimiento eliminados: ${deleteResult.deletedCount}`);

    return res.status(200).json({
      success: true,
      message: 'Base de datos reseteada correctamente',
      deletedCount: deleteResult.deletedCount,
      timestamp: new Date(),
      resetBy: user.username,
    });

  } catch (error) {
    console.error('❌ Error al resetear BD:', error);
    return res.status(500).json({ 
      error: 'Error al resetear la base de datos',
      details: error.message 
    });
  }
}
