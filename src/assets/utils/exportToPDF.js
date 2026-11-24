import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { statusInfo } from '../constants/cneConstants';

export const exportOfficesToPDF = (offices) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let currentY = 10;

  // ============================================================
  // ENCABEZADO
  // ============================================================
  
  // Fondo azul marino para título
  doc.setFillColor(31, 78, 120); // Azul marino
  doc.rect(0, currentY, pageWidth, 15, 'F');
  
  // Logo placeholder (lado izquierdo)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('[LOGO CNE]', 15, currentY + 7, { align: 'center' });
  
  // Título (lado derecho - en el rectángulo azul)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('CONSEJO NACIONAL ELECTORAL', pageWidth / 2, currentY + 8, { align: 'center' });
  
  currentY += 18;

  // Fondo gris para subtítulo
  doc.setFillColor(200, 200, 200);
  doc.rect(0, currentY, pageWidth, 10, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('Dirección de Procesos en el Exterior', 15, currentY + 6);
  
  currentY += 12;

  // Fecha y hora
  const now = new Date();
  const dateTimeStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} - ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Reporte de ${dateTimeStr}`, 15, currentY);
  
  currentY += 8;

  // ============================================================
  // TABLA DE DATOS
  // ============================================================
  
  const statusColumns = Object.entries(statusInfo);
  const headers = [
    'Circunscripción', 'País', 'Oficina Consular', 'Zona Electoral',
    'Juntas', 'Hombres', 'Mujeres', 'Tipo',
    ...statusColumns.map(([, info]) => info.label),
  ];

  // Preparar datos para la tabla
  const groupedOffices = groupByCircunscripcion(offices);
  const tableData = [];

  for (const [circunscripcion, circOffices] of Object.entries(groupedOffices)) {
    let statusCounters = statusColumns.map(() => 0);
    let circJuntas = 0, circHombres = 0, circMujeres = 0;

    // Agregar filas de oficinas
    circOffices.forEach((office) => {
      const statusMarks = generateStatusMarks(office, statusColumns);
      
      circJuntas += office.juntas || 0;
      circHombres += office.juntasMen || 0;
      circMujeres += office.juntasWomen || 0;

      statusMarks.forEach((mark, idx) => {
        if (mark === 'X') statusCounters[idx]++;
      });

      tableData.push([
        circunscripcion,
        office.country || '',
        office.name || '',
        office.zone || '',
        office.juntas || 0,
        office.juntasMen || 0,
        office.juntasWomen || 0,
        office.type || '',
        ...statusMarks,
      ]);
    });

    // Fila de subtotal
    tableData.push([
      `Subtotal - ${circunscripcion}`,
      '', '', '',
      circJuntas, circHombres, circMujeres, '',
      ...statusCounters,
    ]);
  }

  // Fila de total general
  let totalJuntas = 0, totalHombres = 0, totalMujeres = 0;
  const totalStatus = statusColumns.map(() => 0);

  offices.forEach((office) => {
    totalJuntas += office.juntas || 0;
    totalHombres += office.juntasMen || 0;
    totalMujeres += office.juntasWomen || 0;

    const currentStatus = getOfficeStatus(office);
    const currentStatusIndex = statusColumns.findIndex(([status]) => status === currentStatus);

    statusColumns.forEach((_, index) => {
      let isX = false;
      if (statusColumns[index][0] === 'sinEmpezar') {
        isX = currentStatus === 'sinEmpezar';
      } else if (currentStatus === 'finalizado' || index <= currentStatusIndex) {
        isX = true;
      }
      if (isX) totalStatus[index]++;
    });
  });

  tableData.push([
    'TOTAL GENERAL',
    '', '', '',
    totalJuntas, totalHombres, totalMujeres, '',
    ...totalStatus,
  ]);

  // Generar tabla con autoTable
  doc.autoTable({
    head: [headers],
    body: tableData,
    startY: currentY,
    headStyles: {
      fillColor: [31, 78, 120],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
      valign: 'middle',
    },
    bodyStyles: {
      fontSize: 8,
      halign: 'center',
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
    rowPageBreak: 'avoid',
    margin: { top: 10, right: 10, bottom: 10, left: 10 },
    didDrawPage: (data) => {
      // Encabezado en cada página
      if (data.pageNumber > 1) {
        doc.setFillColor(31, 78, 120);
        doc.rect(0, 10, pageWidth, 12, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.text('CONSEJO NACIONAL ELECTORAL', pageWidth / 2, 18, { align: 'center' });
      }
    },
  });

  // Descargar PDF
  doc.save(`reporte-cne-${new Date().toISOString().slice(0, 10)}.pdf`);
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
