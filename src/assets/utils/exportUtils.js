import { statusInfo, milestones } from '../constants/cneConstants';

export const exportOfficesToCSV = (offices) => {
  const header = [
    'Circunscripción', 'País', 'Oficina consular', 'Zona electoral', 'Electores',
    'Hombres', 'Mujeres', 'Juntas', 'Juntas hombres', 'Juntas mujeres', 'Tipo de junta',
    'Estado', 'Avance (%)', ...milestones.map((m) => m.label), 'Última actualización'
  ];
  
  const rows = offices.map((office) => [
    office.circunscription, office.country, office.name, office.zone, office.electors,
    office.men, office.women, office.juntas, office.juntasMen, office.juntasWomen, office.type,
    statusInfo[getOfficeStatus(office)].label, office.progress,
    ...milestones.map((m) => (office.milestones[m.id] ? 'Completado' : 'Pendiente')),
    office.updated,
  ]);

  const escapeCell = (val) => `"${String(val).replaceAll('"', '""')}"`;
  const csvContent = [header, ...rows].map((row) => row.map(escapeCell).join(';')).join('\r\n');
  const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reporte-seguimiento-cne-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const getOfficeStatus = (office) => {
  const completed = Object.values(office.milestones || {}).filter(Boolean).length;
  if (completed >= 5) return 'finalizado';
  if (completed === 4) return 'escrutinio';
  if (completed >= 3) return 'cierre';
  if (completed === 0) return 'sinEmpezar';
  if (completed === 1) return 'instalacion';
  return 'inicio';
};