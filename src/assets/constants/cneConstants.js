export const statusInfo = {
  sinEmpezar: { label: 'Sin instalar', color: '#94a3b8', icon: '○' },
  instalacion: { label: 'Instalación e inicio del sufragio', color: '#f59e0b', icon: '🛠' },
  cierre: { label: 'Fin del sufragio e inicio del escrutinio', color: '#e11d48', icon: '▣' },
  digitalizacion: { label: 'Digitalización de actas', color: '#8b5cf6', icon: '▤' },
  finalizado: { label: 'Proceso finalizado', color: '#10b981', icon: '✓' },
};

export const milestones = [
  { id: 'instalacionMjrv', label: 'Instalación de MJRV', icon: '1' },
  { id: 'inicioVotacion', label: 'Inicio de votación', icon: '2' },
  { id: 'finVotacion', label: 'Fin de votación', icon: '3' },
  { id: 'inicioEscrutinio', label: 'Inicio de escrutinio', icon: '4' },
  { id: 'digitalizacionEscrutinio', label: 'Digitalización de actas de escrutinio', icon: '5' },
  { id: 'digitalizacionInstalacion', label: 'Digitalización de actas de instalación', icon: '6' },
];