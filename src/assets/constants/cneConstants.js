export const statusInfo = {
  sinEmpezar: { label: 'Sin empezar', color: '#94a3b8', icon: '○' },
  instalacion: { label: 'Instalación de MJRV', color: '#f59e0b', icon: '🛠' },
  inicio: { label: 'Inicio de votación', color: '#3b82f6', icon: '◷' },
  cierre: { label: 'Fin de votación', color: '#e11d48', icon: '▣' },
  escrutinio: { label: 'Inicio de escrutinio', color: '#b3b46a', icon: '📊' }, // Estado intermedio crítico del flujo electoral
  digitalizacion: { label: 'Digitalización de actas', color: '#8b5cf6', icon: '▤' },
  finalizado: { label: 'Finalizado', color: '#10b981', icon: '✓' },
};

export const milestones = [
  { id: 'instalacionMjrv', label: 'Instalación de MJRV', icon: '1' },
  { id: 'inicioVotacion', label: 'Inicio de votación', icon: '2' },
  { id: 'finVotacion', label: 'Fin de votación', icon: '3' },
  { id: 'inicioEscrutinio', label: 'Inicio de escrutinio', icon: '4' },
  { id: 'digitalizacionEscrutinio', label: 'Digitalización de actas de escrutinio', icon: '5' },
  { id: 'digitalizacionInstalacion', label: 'Digitalización de actas de instalación', icon: '6' },
];