import ExcelJS from 'exceljs';
import { statusInfo } from '../constants/cneConstants';

/**
 * Exporta datos a Excel con formato institucional CNE
 * Incluye logo, encabezados, datos agrupados por circunscripción,
 * subtotales y total general con fórmulas dinámicas
 */
export const exportOfficesToExcel = async (offices) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Seguimiento CNE');

  // ============================================================
  // 1. CONFIGURACIÓN INICIAL
  // ============================================================
  worksheet.pageSetup = {
    paperSize: ExcelJS.Worksheet.paperSize.a4,
    orientation: 'landscape',
    margins: { left: 0.5, right: 0.5, top: 1, bottom: 1 }
  };

  // ============================================================
  // 2. INSERTAR LOGO (ROW 1-3)
  // ============================================================
  try {
    // Intentar cargar el logo desde URL pública
    const logoPath = '/images/logo-cne.png';
    const response = await fetch(logoPath);
    if (response.ok) {
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const imageId = workbook.addImage({
        buffer: arrayBuffer,
        extension: 'png',
      });
      worksheet.addImage(imageId, 'A1:B3');
    }
  } catch (error) {
    console.warn('No se pudo cargar el logo, continuando sin imagen');
  }

  // ============================================================
  // 3. ENCABEZADOS (ROW 1-3, COL C-H)
  // ============================================================
  // Combinar celdas para el título principal
  worksheet.mergeCells('C1:H1');
  const titleCell = worksheet.getCell('C1');
  titleCell.value = 'CONSEJO NACIONAL ELECTORAL';
  titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003366' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  worksheet.getRow(1).height = 25;

  // Subtítulo
  worksheet.mergeCells('C2:H2');
  const subtitleCell = worksheet.getCell('C2');
  subtitleCell.value = 'Dirección de Procesos en el Exterior';
  subtitleCell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
  subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF666666' } };
  subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 20;

  // Fecha del reporte
  worksheet.mergeCells('C3:H3');
  const dateCell = worksheet.getCell('C3');
  dateCell.value = `Reporte de Seguimiento - ${new Date().toLocaleDateString('es-ES')}`;
  dateCell.font = { italic: true, size: 10 };
  dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(3).height = 15;

  // ============================================================
  // 4. ENCABEZADOS DE COLUMNA (ROW 4)
  // ============================================================
  const statusColumns = Object.entries(statusInfo);
  const headers = [
    'Circunscripción', 'País', 'Oficina Consular', 'Zona Electoral',
    'Juntas', 'Hombres', 'Mujeres', 'Tipo',
    ...statusColumns.map(([, info]) => info.label),
  ];

  const headerRow = worksheet.getRow(5);
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003366' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });
  worksheet.getRow(5).height = 25;

  // ============================================================
  // 5. DATOS AGRUPADOS POR CIRCUNSCRIPCIÓN
  // ============================================================
  const groupedOffices = groupByCircunscripcion(offices);
  let currentRow = 6;
  let grandTotalRow = null;
  const totalsMap = new Map(); // Para almacenar filas de subtotal

  // Columnas numéricas para sumar
  const numericColumns = [5, 6, 7]; // Juntas, Hombres, Mujeres

  for (const [circunscripcion, circOffices] of Object.entries(groupedOffices)) {
    const startRow = currentRow;

    // Agregar oficinas
    circOffices.forEach((office) => {
      const statusMarks = generateStatusMarks(office, statusColumns);
      const rowData = [
        circunscripcion,
        office.country || '',
        office.name || '',
        office.zone || '',
        office.juntas || 0,
        office.juntasMen || 0,
        office.juntasWomen || 0,
        office.type || '',
        ...statusMarks,
      ];

      const row = worksheet.getRow(currentRow);
      rowData.forEach((value, index) => {
        const cell = row.getCell(index + 1);
        cell.value = value;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
      currentRow++;
    });

    // ============================================================
    // FILA DE SUBTOTAL POR CIRCUNSCRIPCIÓN
    // ============================================================
    const subtotalRow = currentRow;
    const row = worksheet.getRow(subtotalRow);

    // Etiqueta de subtotal
    const labelCell = row.getCell(1);
    labelCell.value = `Subtotal - ${circunscripcion}`;
    labelCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF666666' } };
    labelCell.alignment = { horizontal: 'left', vertical: 'middle' };

    // Combinar celdas para subtotal (A a D)
    worksheet.mergeCells(`A${subtotalRow}:D${subtotalRow}`);

    // Fórmulas de subtotal para columnas numéricas
    numericColumns.forEach((colNum) => {
      const cell = row.getCell(colNum);
      const colLetter = ExcelJS.utils.getExcelCellAddress(subtotalRow, colNum).replace(/\d+/, '');
      cell.value = {
        formula: `=SUM(${colLetter}${startRow}:${colLetter}${subtotalRow - 1})`,
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF666666' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Aplicar estilo a celdas de estado en subtotal
    for (let col = 9; col <= headers.length; col++) {
      const cell = row.getCell(col);
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF666666' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    }

    totalsMap.set(circunscripcion, subtotalRow);
    currentRow++;
  }

  // ============================================================
  // 6. FILA DE TOTAL GENERAL
  // ============================================================
  grandTotalRow = currentRow;
  const totalRow = worksheet.getRow(grandTotalRow);

  const totalLabelCell = totalRow.getCell(1);
  totalLabelCell.value = 'TOTAL GENERAL';
  totalLabelCell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
  totalLabelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003366' } };
  totalLabelCell.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells(`A${grandTotalRow}:D${grandTotalRow}`);

  // Fórmulas de total general
  numericColumns.forEach((colNum) => {
    const cell = totalRow.getCell(colNum);
    const colLetter = ExcelJS.utils.getExcelCellAddress(grandTotalRow, colNum).replace(/\d+/, '');
    
    // Sumar solo las filas de subtotal
    const subtotalRows = Array.from(totalsMap.values()).map(r => `${colLetter}${r}`).join('+');
    cell.value = { formula: subtotalRows ? `=${subtotalRows}` : 0 };
    cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003366' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Aplicar estilo a celdas de estado en total
  for (let col = 9; col <= headers.length; col++) {
    const cell = totalRow.getCell(col);
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003366' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  // ============================================================
  // 7. AJUSTAR ANCHO DE COLUMNAS
  // ============================================================
  worksheet.columns = [
    { width: 20 },
    { width: 15 },
    { width: 20 },
    { width: 15 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 12 },
    ...statusColumns.map(() => ({ width: 12 })),
  ];

  // ============================================================
  // 8. GENERAR Y DESCARGAR ARCHIVO
  // ============================================================
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reporte-seguimiento-cne-${new Date().toISOString().slice(0, 10)}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
};

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

/**
 * Agrupa las oficinas por circunscripción
 */
function groupByCircunscripcion(offices) {
  return offices.reduce((acc, office) => {
    const circunscripcion = office.circunscription || 'Sin Circunscripción';
    if (!acc[circunscripcion]) {
      acc[circunscripcion] = [];
    }
    acc[circunscripcion].push(office);
    return acc;
  }, {});
}

/**
 * Genera marcas de estado (X o -) para cada columna de estado
 */
function generateStatusMarks(office, statusColumns) {
  const currentStatus = getOfficeStatus(office);
  const currentStatusIndex = statusColumns.findIndex(([status]) => status === currentStatus);

  return statusColumns.map(([status], index) => {
    if (status === 'sinEmpezar') {
      return currentStatus === 'sinEmpezar' ? 'X' : '-';
    }
    if (currentStatus === 'finalizado' || index <= currentStatusIndex) return 'X';
    return '-';
  });
}

/**
 * Determina el estado actual de una oficina basado en hitos completados
 */
function getOfficeStatus(office) {
  const completed = Object.values(office.milestones || {}).filter(Boolean).length;
  if (completed >= 6) return 'finalizado';
  if (completed === 5) return 'digitalizacion';
  if (completed >= 3) return 'cierre';
  if (completed === 0) return 'sinEmpezar';
  return 'instalacion';
}
