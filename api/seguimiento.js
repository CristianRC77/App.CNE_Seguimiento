import { MongoClient } from 'mongodb';

const mongoUri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DATABASE || 'db_exterior_cne';
const collectionName = process.env.MONGODB_COLLECTION || 'zona_electotal';

let clientPromise;

const getDatabase = async () => {
  if (!mongoUri) throw new Error('Falta la variable MONGODB_URI en el entorno de ejecución.');
  if (!clientPromise) clientPromise = new MongoClient(mongoUri).connect();
  const client = await clientPromise;
  return client.db(databaseName);
};

const getCollection = async () => (await getDatabase()).collection(collectionName);

const createReferenceMap = (documents, key) => new Map(
  documents
    .filter((document) => document[key])
    .map((document) => [document[key], document])
);

const loadReferences = async () => {
  const database = await getDatabase();
  const [circunscripciones, oficinas, paises] = await Promise.all([
    database.collection('circunscripciones').find({}).toArray(),
    database.collection('oficina_consular').find({}).toArray(),
    database.collection('pais').find({}).toArray(),
  ]);

  return {
    circunscripciones: createReferenceMap(circunscripciones, 'codigo'),
    oficinas: createReferenceMap(oficinas, 'codigo'),
    paises: createReferenceMap(paises, 'codigo'),
  };
};

const toOffice = (document, index, references = {}) => {
  const officeReference = references.oficinas?.get(document.oficina_codigo);
  const countryReference = references.paises?.get(document.pais_codigo || document.pais);
  const circunscriptionReference = references.circunscripciones
    ?.get(document.circunscripcion_codigo || document.circunscripcion);

  return {
  id: index + 1,
  zoneCode: document.zona_codigo,
  name: officeReference?.nombre || document.oficina_consular,
  country: countryReference?.nombre || document.pais,
  code: document.oficina_codigo || officeReference?.codigo,
  zone: document.zona_electoral,
  circunscription: circunscriptionReference?.nombre || document.circunscripcion,
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
  actasDigitalizadas: document.actasDigitalizadas || {},
  dataVersion: Number(document.dataVersion || 0),
  updated: document.updated || 'Sin actualizar',
  };
};

const getStatus = (office) => {
  const completed = Object.values(office.milestones || {}).filter(Boolean).length;
  if (completed >= 6) return 'Finalizado';
  if (completed === 5) return 'Digitalización';
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
      const total = await collection.countDocuments();
      const references = await loadReferences();
      const documents = await collection.find({}).sort({ zona_codigo: 1 }).toArray();

      console.log(`Seguimiento central: ${documents.length}/${total} zonas.`);
      response.status(200).json(documents.map((document, index) => (
        toOffice(document, index, references)
      )));
      return;
    }

    if (request.method === 'PUT') {
      const offices = Array.isArray(request.body?.offices) ? request.body.offices : null;
      if (!offices) {
        response.status(400).json({ error: 'El cuerpo debe contener offices como arreglo.' });
        return;
      }

      const changedZoneCodes = Array.isArray(request.body?.changedZoneCodes)
        ? new Set(request.body.changedZoneCodes.filter(Boolean))
        : null;
      const operations = offices
        .filter((office) => office.zoneCode
          && (!changedZoneCodes || changedZoneCodes.has(office.zoneCode)))
        .map((office) => ({
          updateOne: {
            filter: {
              zona_codigo: office.zoneCode,
              $or: [
                { dataVersion: Number(office.dataVersion || 0) },
                ...(Number(office.dataVersion || 0) === 0
                  ? [{ dataVersion: { $exists: false } }]
                  : []),
              ],
            },
            update: {
              $set: {
                progress: Number(office.progress || 0),
                milestones: office.milestones || {},
                actasDigitalizadas: office.actasDigitalizadas || {},
                estado_Avance: getStatus(office),
                updated: office.updated || 'Sin actualizar',
              },
              $inc: { dataVersion: 1 },
            },
          },
        }));

      if (operations.length === 0) {
        response.status(400).json({ error: 'No hay registros válidos para actualizar.' });
        return;
      }

      const result = await collection.bulkWrite(operations, { ordered: false });
      if (result.matchedCount !== operations.length) {
        response.status(409).json({
          error: 'Algunos registros fueron modificados por otro usuario. Se recargaron los datos centrales.',
          updated: result.modifiedCount,
        });
        return;
      }

      const references = await loadReferences();
      const updatedDocuments = await collection.find({}).sort({ zona_codigo: 1 }).toArray();
      response.status(200).json({
        ok: true,
        updated: operations.length,
        offices: updatedDocuments.map((document, index) => (
          toOffice(document, index, references)
        )),
      });
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