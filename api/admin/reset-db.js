import { getCollection } from '../mongodb.js';

/**
 * Reinicia el seguimiento: pone todos los hitos y actas en false/vacío.
 * No elimina ningún documento.
 * El middleware authenticateRequest ya verificó el JWT y populó req.user.
 */
export default async function resetDatabaseHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  try {
    const user = req.user;

    if (!user || user.rol !== 'ADMIN') {
      console.error(`❌ Acceso denegado: rol="${user?.rol}"`);
      return res.status(403).json({ error: 'Acceso denegado. Solo ADMIN puede reiniciar el seguimiento.' });
    }

    const { confirmationPhrase } = req.body;
    console.log(`🔑 Frase recibida: "${confirmationPhrase}" (tipo: ${typeof confirmationPhrase})`);

    if (confirmationPhrase !== 'REINICIAR') {
      console.error(`❌ Frase inválida. Se esperaba "REINICIAR", se recibió "${confirmationPhrase}"`);
      return res.status(400).json({ error: 'Código de confirmación inválido.' });
    }

    console.log(`⚠️ REINICIO DE SEGUIMIENTO iniciado por ${user.username || user.sub}`);

    const collection = await getCollection(process.env.MONGODB_COLLECTION || 'zona_electotal');

    const result = await collection.updateMany({}, {
      $set: {
        milestones: {
          instalacionMjrv:           false,
          inicioVotacion:            false,
          finVotacion:               false,
          inicioEscrutinio:          false,
          digitalizacionEscrutinio:  false,
          digitalizacionInstalacion: false,
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

    console.log(`✅ Zonas reiniciadas: ${result.modifiedCount}`);

    return res.status(200).json({
      success: true,
      message: `Seguimiento reiniciado correctamente. ${result.modifiedCount} zonas restablecidas a cero.`,
      modifiedCount: result.modifiedCount,
      timestamp: new Date().toISOString(),
      resetBy: user.username || user.sub,
    });

  } catch (error) {
    console.error('❌ Error al reiniciar seguimiento:', error);
    return res.status(500).json({
      error: 'Error al reiniciar el seguimiento',
      details: error.message,
    });
  }
}
