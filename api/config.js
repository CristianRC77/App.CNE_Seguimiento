import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DATABASE;

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  if (!uri) {
    throw new Error('MONGODB_URI no está definido en variables de entorno');
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export default async function handler(request, response) {
  if (!['GET', 'POST', 'PUT'].includes(request.method)) {
    return response.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { db } = await connectToDatabase();
    const configCollection = db.collection('brand_config');

    if (request.method === 'GET') {
      // Obtener configuración actual
      const config = await configCollection.findOne({ _id: 'default' });
      if (!config) {
        return response.status(200).json({
          organizationName: 'Consejo Nacional Electoral',
          subtitle: 'Oficinas Consulares',
          logoPath: '/images/logo-cne.png',
          logoAlt: 'Logo CNE',
          reportTitle: 'Reporte de Seguimiento CNE',
          version: '1.0.0',
        });
      }
      return response.status(200).json(config);
    }

    if (request.method === 'POST' || request.method === 'PUT') {
      // Guardar configuración (solo admin)
      const { organizationName, subtitle, logoPath, logoAlt, reportTitle, version } = request.body;

      if (!organizationName || !subtitle) {
        return response.status(400).json({ error: 'organizationName y subtitle son obligatorios' });
      }

      await configCollection.updateOne(
        { _id: 'default' },
        {
          $set: {
            organizationName,
            subtitle,
            logoPath: logoPath || '/images/logo-cne.png',
            logoAlt: logoAlt || 'Logo',
            reportTitle: reportTitle || 'Reporte',
            version: version || '1.0.0',
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );

      return response.status(200).json({
        success: true,
        message: 'Configuración actualizada correctamente',
      });
    }
  } catch (error) {
    console.error('Error en config API:', error);
    return response.status(500).json({ error: 'Error interno del servidor' });
  }
}
