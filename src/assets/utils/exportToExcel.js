import ExcelJS from 'exceljs';
import { statusInfo } from '../constants/cneConstants';

export const exportOfficesToExcel = async (offices) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Seguimiento CNE');

  // Configuración básica
  worksheet.pageSetup = {
    paperSize: 9,
    orientation: 'landscape',
    margins: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5 }
  };

  // Encabezados
  const statusColumns = Object.entries(statusInfo);
  const headers = [
    'Circunscripción', 'País', 'Oficina Consular', 'Zona Electoral',
    'Juntas', 'Hombres', 'Mujeres', 'Tipo',
    ...statusColumns.map(([, info]) => info.label),
  ];

  // Fila 1: Título
  worksheet.getCell('A1').value = 'CONSEJO NACIONAL ELECTORAL';
  worksheet.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  worksheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003366' } };
  worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 22;

  // Fila 2: Subtítulo
  worksheet.getCell('A2').value = 'Dirección de Procesos en el Exterior';
  worksheet.getCell('A2').font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
  worksheet.getCell('A2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF666666' } };
  worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 20;

  // Fila 3: Fecha
  worksheet.getCell('A3').value = `Reporte de ${new Date().toLocaleDateString('es-ES')}`;
  worksheet.getCell('A3').font = { italic: true, size: 10 };
  worksheet.getCell('A3').alignment = { horizontal: 'center' };
  worksheet.getRow(3).height = 15;

  // Fila 4: Headers
  const headerRow = worksheet.getRow(5);
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003366' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  });
  worksheet.getRow(5).height = 25;

  // Agrupar datos por circunscripción
  const groupedOffices = groupByCircunscripcion(offices);
  let currentRow = 6;

  // Recorrer cada circunscripción
  for (const [circunscripcion, circOffices] of Object.entries(groupedOffices)) {
    const startRow = currentRow;
    let statusCounters = statusColumns.map(() => 0);

    // Agregar datos de oficinas
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
        cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
        
        // Contar X en columnas de estado
        if (index >= 8 && value === 'X') {
          statusCounters[index - 8]++;
        }
      });
      currentRow++;
    });

    // Fila de subtotal
    const subtotalRow = worksheet.getRow(currentRow);
    subtotalRow.getCell(1).value = `Subtotal - ${circunscripcion}`;
    subtotalRow.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    subtotalRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF666666' } };
    subtotalRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };

    // Sumar números (columnas 5, 6, 7)
    [5, 6, 7].forEach((colNum) => {
      let sum = 0;
      for (let r = startRow; r < currentRow; r++) {
        const val = worksheet.getRow(r).getCell(colNum).value;
        sum += typeof val === 'number' ? val : 0;
      }
      const cell = subtotalRow.getCell(colNum);
      cell.value = sum;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF666666' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    });

    // Sumar X por cada estado
    statusColumns.forEach((_, index) => {
      const cell = subtotalRow.getCell(9 + index);
      cell.value = statusCounters[index];
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF666666' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    });

    subtotalRow.height = 18;
    currentRow++;
  }

  // Total General
  const totalRow = worksheet.getRow(currentRow);
  totalRow.getCell(1).value = 'TOTAL GENERAL';
  totalRow.getCell(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
  totalRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003366' } };
  totalRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

  // Totales generales
  [5, 6, 7].forEach((colNum) => {
    let sum = 0;
    for (let r = 6; r < currentRow; r++) {
      const val = worksheet.getRow(r).getCell(colNum).value;
      sum += typeof val === 'number' ? val : 0;
    }
    const cell = totalRow.getCell(colNum);
    cell.value = sum;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003366' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  });

  // Total X por estado
  statusColumns.forEach((_, index) => {
    let totalX = 0;
    for (let r = 6; r < currentRow; r++) {
      const val = worksheet.getRow(r).getCell(9 + index).value;
      totalX += typeof val === 'number' ? val : 0;
    }
    const cell = totalRow.getCell(9 + index);
    cell.value = totalX;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003366' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  });

  totalRow.height = 20;

  // Ajustar anchos de columnas
  worksheet.columns = [
    { width: 20 }, { width: 15 }, { width: 22 }, { width: 15 },
    { width: 10 }, { width: 10 }, { width: 10 }, { width: 12 },
    ...statusColumns.map(() => ({ width: 12 })),
  ];

  // Generar y descargar
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reporte-cne-${new Date().toISOString().slice(0, 10)}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
};

function groupByCircunscripcion(offices) {
  return offices.reduce((acc, office) => {
    const circunscripcion = office.circunscription || 'Sin Circunscripción';
    if (!acc[circunscripcion]) acc[circunscripcion] = [];
    acc[circunscripcion].push(office);
    return acc;
  }, {});
}

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

function getOfficeStatus(office) {
  const completed = Object.values(office.milestones || {}).filter(Boolean).length;
  if (completed >= 6) return 'finalizado';
  if (completed === 5) return 'digitalizacion';
  if (completed >= 3) return 'cierre';
  if (completed === 0) return 'sinEmpezar';
  return 'instalacion';
}
