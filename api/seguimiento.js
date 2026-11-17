const collectionName = process.env.MONGODB_COLLECTION || 'zona_electotal';
import { getCollection, getDatabase } from './mongodb.js';

const createReferenceMap = (documents, key) => new Map(
  documents
    .filter((document) => document[key])
    .map((document) => [document[key], document])
);

const loadReferences = async () => {
  const database = await getDatabase();
  // Estas colecciones contienen los nombres descriptivos relacionados por código.
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

  // Se transforma el documento de MongoDB al modelo que consume la interfaz.
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
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.setHeader('Access-Control-Allow-Methods', 'GET, PUT, PATCH, OPTIONS');

  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  try {
    const collection = await getCollection(collectionName);

    if (request.method === 'GET') {
      const total = await collection.countDocuments();
      const references = await loadReferences();
      // El orden por código mantiene estable la lista y sus identificadores visuales.
      const documents = await collection.find({}).sort({ zona_codigo: 1 }).toArray();

      console.log(`Seguimiento central: ${documents.length}/${total} zonas.`);
      response.status(200).json(documents.map((document, index) => (
        toOffice(document, index, references)
      )));
      return;
    }

    if (request.method === 'PUT' || request.method === 'PATCH') {
      const offices = Array.isArray(request.body?.offices) ? request.body.offices : null;
      if (!offices) {
        response.status(400).json({ error: 'El cuerpo debe contener offices como arreglo.' });
        return;
      }

      const changedZoneCodes = Array.isArray(request.body?.changedZoneCodes)
        ? new Set(request.body.changedZoneCodes.filter(Boolean))
        : null;
      
      console.log(`📥 Recibido PUT: ${offices.length} oficinas, changedZoneCodes: ${changedZoneCodes ? Array.from(changedZoneCodes).join(',') : 'ninguno (actualizar todas)'}`);
      
      // Solo se actualizan las zonas modificadas; el filtro también evita sobrescribir
      // cambios hechos por otro usuario gracias a dataVersion.
      const operations = offices
        .filter((office) => office.zoneCode
          && (!changedZoneCodes || changedZoneCodes.has(office.zoneCode)))
        .map((office) => {
          const status = getStatus(office);
          console.log(`📝 Preparando actualización - Zona: ${office.zoneCode}, Milestones: ${Object.values(office.milestones || {}).filter(Boolean).length}, Status: ${status}`);
          
          // Log detallado para zona_01
          if (office.zoneCode === 'zona_01') {
            console.log(`  - actasDigitalizadas recibidas: ${JSON.stringify(office.actasDigitalizadas)}`);
            console.log(
              `  - escrutinio: hombres=${JSON.stringify(office.actasDigitalizadas?.escrutinio?.hombres)}, `
              + `mujeres=${JSON.stringify(office.actasDigitalizadas?.escrutinio?.mujeres)}`
            );
            console.log(
              `  - instalacion: hombres=${JSON.stringify(office.actasDigitalizadas?.instalacion?.hombres)}, `
              + `mujeres=${JSON.stringify(office.actasDigitalizadas?.instalacion?.mujeres)}`
            );
          }
          
          return {
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
                  estado_Avance: status,
                  updated: office.updated || 'Sin actualizar',
                },
                $inc: { dataVersion: 1 },
              },
            },
          };
        });

      if (operations.length === 0) {
        console.error('⚠️ No hay registros válidos para actualizar. Detalles:');
        offices.forEach((office) => {
          console.error(`- Zona: ${office.zoneCode}, changedZoneCodes: ${changedZoneCodes ? Array.from(changedZoneCodes).join(',') : 'ninguno'}`);
        });
        response.status(400).json({ error: 'No hay registros válidos para actualizar.' });
        return;
      }

      console.log(`📊 Ejecutando ${operations.length} operaciones de actualización...`);
      const result = await collection.bulkWrite(operations, { ordered: false });
      console.log(`✅ BulkWrite resultado: matched=${result.matchedCount}, modified=${result.modifiedCount}`);
      
      if (result.matchedCount !== operations.length) {
        console.error(`❌ CONFLICTO: Se esperaba actualizar ${operations.length} pero solo se coincidieron ${result.matchedCount}`);
        response.status(409).json({
          error: 'Algunos registros fueron modificados por otro usuario. Se recargaron los datos centrales.',
          updated: result.modifiedCount,
        });
        return;
      }

      const references = await loadReferences();
      const updatedDocuments = await collection.find({}).sort({ zona_codigo: 1 }).toArray();
      
      // Log detallado para zona_01
      const zona01Doc = updatedDocuments.find(doc => doc.zona_codigo === 'zona_01');
      if (zona01Doc) {
        console.log(`📤 Leyendo zona_01 del BD después de actualización:`);
        console.log(`  - actasDigitalizadas: ${JSON.stringify(zona01Doc.actasDigitalizadas)}`);
        console.log(
          `  - escrutinio: hombres=${JSON.stringify(zona01Doc.actasDigitalizadas?.escrutinio?.hombres)}, `
          + `mujeres=${JSON.stringify(zona01Doc.actasDigitalizadas?.escrutinio?.mujeres)}`
        );
        console.log(
          `  - instalacion: hombres=${JSON.stringify(zona01Doc.actasDigitalizadas?.instalacion?.hombres)}, `
          + `mujeres=${JSON.stringify(zona01Doc.actasDigitalizadas?.instalacion?.mujeres)}`
        );
      }
      
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