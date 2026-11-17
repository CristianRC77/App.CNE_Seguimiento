import { statusInfo } from '../constants/cneConstants';

// Construye y descarga un CSV con el estado de las oficinas seleccionadas.
export const exportOfficesToCSV = (offices) => {
  // Las columnas de estados se generan desde la configuración para evitar duplicación.
  const statusColumns = Object.entries(statusInfo);
  const header = [
    'Circunscripción', 'País', 'Oficina consular', 'Zona electoral',
    'Juntas', 'Juntas hombres', 'Juntas mujeres', 'Tipo de junta',
       ...statusColumns.map(([, info]) => info.label),
  ];
  
  // Cada oficina se convierte en una fila con sus datos y marcas de avance.
  const rows = offices.map((office) => {
    const currentStatus = getOfficeStatus(office);
    const currentStatusIndex = statusColumns.findIndex(([status]) => status === currentStatus);
    const statusMarks = statusColumns.map(([status], index) => {
      if (status === 'sinEmpezar') {
        return currentStatus === 'sinEmpezar' ? 'X' : '-';
      }
      if (currentStatus === 'finalizado' || index <= currentStatusIndex) return 'X';
      return '-';
    });

    return [
      office.circunscription, office.country, office.name, office.zone,
      office.juntas, office.juntasMen, office.juntasWomen, office.type,
      
      ...statusMarks,
    ];
  });

  // Escapa comillas para que los nombres con caracteres especiales no rompan el CSV.
  const escapeCell = (value) => `"${String(value).replaceAll('"', '""')}"`;
  const csvContent = [header, ...rows]
    .map((row) => row.map(escapeCell).join(';'))
    .join('\r\n');
  const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reporte-seguimiento-cne-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

// Traduce la cantidad de hitos completados al estado usado en el reporte.
const getOfficeStatus = (office) => {
  const completed = Object.values(office.milestones || {}).filter(Boolean).length;
  if (completed >= 6) return 'finalizado';
  if (completed === 5) return 'digitalizacion';
  if (completed >= 3) return 'cierre';
  if (completed === 0) return 'sinEmpezar';
  return 'instalacion';
};