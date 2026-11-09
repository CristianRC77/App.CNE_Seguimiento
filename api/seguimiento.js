import { MongoClient } from 'mongodb';

const mongoUri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DATABASE || 'db_exterior_cne';
const collectionName = process.env.MONGODB_COLLECTION || 'zona_electotal';

let clientPromise;

// ✅ AQUÍ dentro de la función getCollection
const getCollection = async () => {
  console.log('🔍 MONGODB_URI existe:', !!mongoUri);
  console.log('🔍 Base de datos:', databaseName);
  console.log('🔍 Colección:', collectionName);

  if (!mongoUri) throw new Error('Falta la variable MONGODB_URI en el entorno de ejecución.');
  if (!clientPromise) clientPromise = new MongoClient(mongoUri).connect();
  const client = await clientPromise;
  return client.db(databaseName).collection(collectionName);
};

const toOffice = (document, index) => ({
  id: index + 1,
  zoneCode: document.zona_codigo,
  name: document.oficina_consular,
  country: document.pais,
  code: document.oficina_codigo,
  zone: document.zona_electoral,
  circunscription: document.circunscripcion,
  electors: document.numero_electores,
  men: document.electores_hombre,
  women: document.electores_mujer,
  juntas: document.numero_juntas_documentos,
  juntasMen: document.juntas_hombre,
  juntasWomen: document.juntas_mujer,
  type: document.tipo_junta,
  progress: Number(document.progress || 0),
  progressStatus: document.estado_Avance,
  milestones: document.milestones || {},
  updated: document.updated || 'Sin actualizar',
});

const getStatus = (office) => {
  const completed = Object.values(office.milestones || {}).filter(Boolean).length;
  if (completed >= 5) return 'Finalizado';
  if (completed === 4) return 'Escrutinio';
  if (completed >= 3) return 'Cierre';
  if (completed === 0) return 'Sin empezar';
  if (completed === 1) return 'Instalación';
  return 'Inicio';
};

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');

  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  try {
    const collection = await getCollection();

    if (request.method === 'GET') {
      // ✅ Agregamos también aquí para ver cuántos documentos trae
      const total = await collection.countDocuments();
      console.log('📊 Total documentos en colección:', total);
      
      const documents = await collection.find({}).sort({ zona_codigo: 1 }).toArray();
      console.log('📄 Documentos recuperados:', documents.length);
      
      response.status(200).json(documents.map(toOffice));
      return;
    }

    if (request.method === 'PUT') {
      const offices = Array.isArray(request.body?.offices) ? request.body.offices : null;
      if (!offices) {
        response.status(400).json({ error: 'El cuerpo debe contener offices como arreglo.' });
        return;
      }

      const operations = offices
        .filter((office) => office.zoneCode)
        .map((office) => ({
          updateOne: {
            filter: { zona_codigo: office.zoneCode },
            update: {
              $set: {
                progress: Number(office.progress || 0),
                milestones: office.milestones || {},
                estado_Avance: getStatus(office),
                updated: office.updated || 'Sin actualizar',
              },
            },
          },
        }));

      if (operations.length > 0) await collection.bulkWrite(operations);
      response.status(200).json({ ok: true, updated: operations.length });
      return;
    }

    response.status(405).json({ error: 'Método no permitido.' });
  } catch (error) {
    console.error('Error en API de seguimiento MongoDB.', error);
    response.status(500).json({
      error: error instanceof Error ? error.message : 'No se pudo acceder al seguimiento.',
    });
  }
}