import { getBrandConfig } from '../constants/brandConfig.js';
import { statusInfo } from '../constants/cneConstants.js';

/**
 * Exporta a Excel con encabezado que incluye logo, nombre y fecha
 * Requiere instalar: npm install xlsx
 */
export const exportOfficesToExcel = async (offices) => {
  try {
    // Importa dinámicamente para no requerir en bundle si no se usa
    const XLSX = await import('xlsx').catch(() => null);
    if (!XLSX) {
      console.error('Se requiere instalar xlsx: npm install xlsx');
      return;
    }

    const brandConfig = getBrandConfig();
    const now = new Date().toLocaleString('es-ES');

    // Crear workbook
    const ws = XLSX.utils.aoa_to_sheet([]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');

    // Encabezado con marca y fecha
    let rowIndex = 0;
    ws['A1'] = { v: brandConfig.organizationName, t: 's' };
    ws['A2'] = { v: brandConfig.subtitle, t: 's' };
    ws['A3'] = { v: `Reporte generado: ${now}`, t: 's' };
    rowIndex = 4;

    // Encabezado de columnas
    const statusColumns = Object.entries(statusInfo);
    const headers = [
      'Circunscripción',
      'País',
      'Oficina consular',
      'Zona electoral',
      'Juntas',
      'Juntas hombres',
      'Juntas mujeres',
      'Tipo de junta',
      ...statusColumns.map(([, info]) => info.label),
    ];

    headers.forEach((header, colIndex) => {
      const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
      ws[cellRef] = { v: header, t: 's', s: { font: { bold: true }, fill: { fgColor: { rgb: 'FFC7CE' } } } };
    });

    rowIndex += 1;

    // Datos de oficinas
    offices.forEach((office) => {
      const currentStatus = getOfficeStatus(office);
      const currentStatusIndex = statusColumns.findIndex(([status]) => status === currentStatus);
      const statusMarks = statusColumns.map(([status], index) => {
        if (status === 'sinEmpezar') {
          return currentStatus === 'sinEmpezar' ? 'X' : '-';
        }
        if (currentStatus === 'finalizado' || index <= currentStatusIndex) return 'X';
        return '-';
      });

      const rowData = [
        office.circunscription,
        office.country,
        office.name,
        office.zone,
        office.juntas,
        office.juntasMen,
        office.juntasWomen,
        office.type,
        ...statusMarks,
      ];

      rowData.forEach((value, colIndex) => {
        const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
        ws[cellRef] = { v: value, t: 's' };
      });

      rowIndex += 1;
    });

    // Ajustar ancho de columnas
    ws['!cols'] = Array(headers.length).fill({ wch: 20 });

    // Descargar archivo
    const fileName = `${brandConfig.reportTitle}-${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    alert('Error al generar el Excel. Asegúrate de tener instalado "xlsx"');
  }
};

// Importar la función original de exportUtils
export const exportOfficesToCSV = (offices) => {
  const statusColumns = Object.entries(statusInfo);
  const header = [
    'Circunscripción',
    'País',
    'Oficina consular',
    'Zona electoral',
    'Juntas',
    'Juntas hombres',
    'Juntas mujeres',
    'Tipo de junta',
    ...statusColumns.map(([, info]) => info.label),
  ];

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
      office.circunscription,
      office.country,
      office.name,
      office.zone,
      office.juntas,
      office.juntasMen,
      office.juntasWomen,
      office.type,
      ...statusMarks,
    ];
  });

  const escapeCell = (value) => `"${String(value).replaceAll('"', '""')}"`;
  const csvContent = [header, ...rows]
    .map((row) => row.map(escapeCell).join(';'))
    .join('\r\n');
  const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const brandConfig = getBrandConfig();
  link.download = `${brandConfig.reportTitle}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const getOfficeStatus = (office) => {
  const completed = Object.values(office.milestones || {}).filter(Boolean).length;
  if (completed >= 6) return 'finalizado';
  if (completed === 5) return 'digitalizacion';
  if (completed >= 3) return 'cierre';
  if (completed === 0) return 'sinEmpezar';
  return 'instalacion';
};
