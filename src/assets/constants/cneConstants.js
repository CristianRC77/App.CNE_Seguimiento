// Configuración visual y textual reutilizada por tablas, métricas y reportes.
export const statusInfo = {
  sinEmpezar: { label: 'Sin instalar', color: '#94a3b8', icon: '○' },
  instalacion: { label: 'Instalación e inicio del sufragio', color: '#f59e0b', icon: '🛠' },
  cierre: { label: 'Fin del sufragio e inicio del escrutinio', color: '#e11d48', icon: '▣' },
  digitalizacion: { label: 'Digitalización de actas', color: '#1d5bd1', icon: '▤' },
  finalizado: { label: 'Proceso finalizado', color: '#10b981', icon: '✓' },
};

export const USER_ROLES = Object.freeze({
  GENERAL: 'OPERARIO_GENERAL',
  CIRCUNSCRIPTION: 'OPERARIO_CIRC',
});

export const CIRCUNSCRIPTIONS = Object.freeze({
  EUROPE_OCEANIA_ASIA: 'EUROPA_OCEANIA_ASIA',
  CANADA_UNITED_STATES: 'CANADA_EEUU',
  LATAM_CARIBBEAN_AFRICA: 'LATAM_CARIBE_AFRICA',
});

// Convierte códigos y nombres de pantalla a un código común para comparar permisos.
export const normalizeCircunscription = (value) => {
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

// Evita mostrar 100% mientras exista al menos un elemento pendiente.
export const getCompletionPercentage = (completed, total) => {
  if (!total) return 0;
  if (completed >= total) return 100;
  return Math.min(99, Math.floor((completed / total) * 100));
};

// Orden oficial de los hitos que debe cumplir cada zona electoral.
export const milestones = [
  { id: 'instalacionMjrv', label: 'Instalación de MJRV', icon: '1' },
  { id: 'inicioVotacion', label: 'Inicio de votación', icon: '2' },
  { id: 'finVotacion', label: 'Fin de votación', icon: '3' },
  { id: 'inicioEscrutinio', label: 'Inicio de escrutinio', icon: '4' },
  { id: 'digitalizacionEscrutinio', label: 'Digitalización de actas de escrutinio', icon: '5' },
  { id: 'digitalizacionInstalacion', label: 'Digitalización de actas de instalación', icon: '6' },
];