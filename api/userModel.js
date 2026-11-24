export const USER_ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  GENERAL: 'OPERARIO_GENERAL',
  CIRCUNSCRIPTION: 'OPERARIO_CIRC',
});

const generalRoleId = process.env.MONGODB_GENERAL_ROLE_ID || 'ID_DEL_ROL_OPERARIO_GENERAL';
const circunscriptionRoleId = process.env.MONGODB_CIRC_ROLE_ID || 'ID_DEL_ROL_OPERARIO_CIRC';

export const CIRCUNSCRIPTIONS = Object.freeze({
  EUROPE_OCEANIA_ASIA: 'EUROPA_OCEANIA_ASIA',
  CANADA_UNITED_STATES: 'CANADA_EEUU',
  LATAM_CARIBBEAN_AFRICA: 'LATAM_CARIBE_AFRICA',
});

// Validador MongoDB recomendado para la colección de usuarios.
export const USER_DOCUMENT_SCHEMA = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['username', 'rol', 'circunscripcion', 'activo'],
    properties: {
      username: { bsonType: 'string', minLength: 3 },
      password_hash: { bsonType: 'string', minLength: 20 },
      password: { bsonType: 'string', minLength: 1 },
      rol: { enum: [...Object.values(USER_ROLES), generalRoleId, circunscriptionRoleId] },
      circunscripcion: {
        bsonType: ['string', 'null'],
        enum: [null, ...Object.values(CIRCUNSCRIPTIONS)],
      },
      activo: { bsonType: 'bool' },
    },
  },
};

export const normalizeUserRole = (role) => {
  if (role === USER_ROLES.ADMIN) return USER_ROLES.ADMIN;
  if (role === USER_ROLES.GENERAL || role === generalRoleId) return USER_ROLES.GENERAL;
  if (role === USER_ROLES.CIRCUNSCRIPTION || role === circunscriptionRoleId) {
    return USER_ROLES.CIRCUNSCRIPTION;
  }
  return null;
};

export const normalizeCircunscriptionValue = (value) => {
  if (!value) return null;
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

export const isValidUserDocument = (user) => {
  const normalizedRole = normalizeUserRole(user?.rol);
  const hasPassword = typeof user?.password_hash === 'string'
    || typeof user?.password === 'string';

  if (!user || !normalizedRole || !hasPassword || typeof user.activo !== 'boolean') {
    return false;
  }

  // Admin no necesita circunscripción
  if (normalizedRole === USER_ROLES.ADMIN) return user.circunscripcion == null;
  if (normalizedRole === USER_ROLES.GENERAL) return user.circunscripcion == null;

  const normalizedCircunscription = normalizeCircunscriptionValue(user.circunscripcion);
  return typeof normalizedCircunscription === 'string'
    && Object.values(CIRCUNSCRIPTIONS).includes(normalizedCircunscription);
};

export const toPublicUser = (user) => ({
  id: String(user._id),
  username: user.username,
  nombreCompleto: user.nombreCompleto || user.username,
  rol: normalizeUserRole(user.rol),
  circunscripcion: normalizeCircunscriptionValue(user.circunscripcion) || null,
});
