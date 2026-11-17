import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getCollection } from './mongodb.js';
import {
  CIRCUNSCRIPTIONS,
  isValidUserDocument,
  normalizeUserRole,
  USER_ROLES,
} from './userModel.js';

const usersCollectionName = process.env.MONGODB_USERS_COLLECTION || 'users';
const zonesCollectionName = process.env.MONGODB_COLLECTION || 'zona_electotal';

const normalizeCircunscription = (value) => {
  const normalized = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  const aliases = {
    EUROPA_OCEANIA_ASIA: CIRCUNSCRIPTIONS.EUROPE_OCEANIA_ASIA,
    EUROPA_OCEANIA_Y_ASIA: CIRCUNSCRIPTIONS.EUROPE_OCEANIA_ASIA,
    CANADA_EEUU: CIRCUNSCRIPTIONS.CANADA_UNITED_STATES,
    CANADA_Y_ESTADOS_UNIDOS: CIRCUNSCRIPTIONS.CANADA_UNITED_STATES,
    LATAM_CARIBE_AFRICA: CIRCUNSCRIPTIONS.LATAM_CARIBBEAN_AFRICA,
    LATINOAMERICA_EL_CARIBE_Y_AFRICA: CIRCUNSCRIPTIONS.LATAM_CARIBBEAN_AFRICA,
  };

  return aliases[normalized] || normalized;
};

const getBearerToken = (request) => {
  const authorization = request.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');
  return scheme === 'Bearer' ? token : null;
};

export const authenticateRequest = async (request, response, next) => {
  const secret = process.env.JWT_SECRET;
  const token = getBearerToken(request);

  if (!secret) {
    console.error('❌ JWT_SECRET no configurado');
    response.status(500).json({ error: 'La autenticación no está configurada en el servidor.' });
    return;
  }
  
  if (!token) {
    console.error('❌ No hay token en Authorization header');
    console.error(`   Headers recibidos: ${JSON.stringify(request.headers)}`);
    response.status(401).json({ error: 'Se requiere una sesión autenticada.' });
    return;
  }

  console.log(`🔐 Token encontrado, verificando validez... (primeros 20 chars: ${token.substring(0, 20)}...)`);

  let payload;
  try {
    payload = jwt.verify(token, secret);
    console.log(`✅ Token válido para usuario: ${payload.sub}`);
  } catch (err) {
    console.error(`❌ Token inválido: ${err.message}`);
    response.status(401).json({ error: 'La sesión no es válida o expiró.' });
    return;
  }
  
  if (!payload || typeof payload !== 'object' || !payload.sub) {
    console.error('❌ Token no contiene identidad válida');
    response.status(401).json({ error: 'El token no contiene una identidad válida.' });
    return;
  }

  try {
    const users = await getCollection(usersCollectionName);
    
    console.log(`🔍 Buscando usuario con _id: "${payload.sub}" (tipo: ${typeof payload.sub}, length: ${String(payload.sub).length})`);
    
    // Intenta primero con string (en caso de que _id sea string en la BD)
    let user = await users.findOne({ _id: payload.sub, activo: true });
    console.log(`   Búsqueda 1 (string): ${user ? '✅ ENCONTRADO' : '❌ No encontrado'}`);
    
    if (!user && ObjectId.isValid(payload.sub)) {
      console.log(`   Búsqueda 2 (ObjectId): intentando...`);
      user = await users.findOne({ _id: new ObjectId(payload.sub), activo: true });
      console.log(`   Búsqueda 2 (ObjectId): ${user ? '✅ ENCONTRADO' : '❌ No encontrado'}`);
    }

    if (!user) {
      console.error(`❌ Usuario no encontrado o no activo: ${payload.sub}`);
      // Debug: Intenta sin el filtro activo: true
      const userAnyStatus = await users.findOne({ _id: payload.sub });
      if (userAnyStatus) {
        console.error(`   ⚠️ Usuario EXISTS pero con activo=${userAnyStatus.activo}`);
      } else {
        console.error(`   ⚠️ Usuario NO EXISTE en la BD`);
      }
      response.status(401).json({ error: 'La cuenta ya no está activa.' });
      return;
    }
    
    if (!isValidUserDocument(user)) {
      console.error(`❌ Documento de usuario inválido: ${payload.sub}`);
      console.error(`   Rol: ${user.rol}, Circunscripción: ${user.circunscripcion}`);
      response.status(401).json({ error: 'La cuenta ya no está activa.' });
      return;
    }

    console.log(`✅ Usuario autenticado: ${user.username || user._id}`);
    request.user = {
      ...payload,
      rol: normalizeUserRole(user.rol),
      circunscripcion: user.circunscripcion || null,
    };
    next();
  } catch (error) {
    console.error('❌ Error validando usuario autenticado.', error);
    response.status(500).json({ error: 'No se pudo validar la sesión.' });
  }
};

const getZoneCircunscription = async (documents) => {
  const references = await getCollection('circunscripciones');
  const referenceDocuments = await references.find({}).toArray();
  const referenceMap = new Map(
    referenceDocuments
      .filter((document) => document.codigo)
      .map((document) => [String(document.codigo), document.nombre || document.codigo])
  );

  return documents.map((document) => (
    referenceMap.get(String(document.circunscripcion_codigo))
      || document.circunscripcion
      || document.circunscripcion_codigo
  ));
};

export const authorizeZoneUpdates = async (request, response, next) => {
  if (request.user?.rol === USER_ROLES.GENERAL) {
    next();
    return;
  }

  if (request.user?.rol !== USER_ROLES.CIRCUNSCRIPTION || !request.user.circunscripcion) {
    response.status(403).json({ error: 'El usuario no tiene permisos de actualización.' });
    return;
  }

  const changedZoneCodes = Array.isArray(request.body?.changedZoneCodes)
    ? request.body.changedZoneCodes.filter(Boolean)
    : [];
  const submittedZoneCodes = Array.isArray(request.body?.offices)
    ? request.body.offices.map((office) => office.zoneCode).filter(Boolean)
    : [];
  const zoneCodes = [...new Set(changedZoneCodes.length ? changedZoneCodes : submittedZoneCodes)];

  if (!zoneCodes.length) {
    response.status(403).json({ error: 'No se identificaron zonas para autorizar.' });
    return;
  }

  try {
    const zones = await getCollection(zonesCollectionName);
    const documents = await zones.find(
      { zona_codigo: { $in: zoneCodes } },
      { projection: { zona_codigo: 1, circunscripcion_codigo: 1, circunscripcion: 1 } }
    ).toArray();

    if (documents.length !== zoneCodes.length) {
      response.status(403).json({ error: 'Una o más zonas no existen o no pueden ser autorizadas.' });
      return;
    }

    const zoneCircunscriptions = await getZoneCircunscription(documents);
    const userCircunscription = normalizeCircunscription(request.user.circunscripcion);
    const hasPermission = zoneCircunscriptions.every((circunscription) => (
      normalizeCircunscription(circunscription) === userCircunscription
    ));

    if (!hasPermission) {
      response.status(403).json({
        error: 'No tiene permiso para actualizar zonas de otra circunscripción.',
      });
      return;
    }

    next();
  } catch (error) {
    console.error('No se pudieron validar los permisos de circunscripción.', error);
    response.status(500).json({ error: 'No se pudieron validar los permisos.' });
  }
};
