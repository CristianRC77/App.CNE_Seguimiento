import { jsPDF } from 'jspdf';
import { statusInfo } from '../constants/cneConstants';

export const exportOfficesToPDF = (offices) => {
  try {
    console.log('Iniciando exportación PDF...');
    
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let currentY = 10;

    // ============================================================
    // ENCABEZADO PROFESIONAL
    // ============================================================
    
    // Fondo azul marino
    doc.setFillColor(31, 78, 120);
    doc.rect(0, currentY, pageWidth, 30, 'F');
    
    // Logo placeholder (lado izquierdo)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('[LOGO]', 15, currentY + 15, { align: 'center' });
    
    // Títulos (centro-derecha)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('CONSEJO NACIONAL ELECTORAL', pageWidth / 2, currentY + 10, { align: 'center' });
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Dirección de Procesos en el Exterior', pageWidth / 2, currentY + 20, { align: 'center' });
    
    currentY += 32;

    // Fecha y hora
    const now = new Date();
    const dateTimeStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} - ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text(`Reporte de ${dateTimeStr}`, 15, currentY);
    
    currentY += 8;

    // ============================================================
    // TABLA DE DATOS - MEJOR ESPACIADA
    // ============================================================
    
    // Posiciones de columnas (ajustadas a A4 landscape)
    const colX = [12, 32, 50, 68, 85, 95, 105, 115, 125, 135, 145, 155, 165, 175, 185, 195];
    const colWidths = [18, 16, 16, 15, 12, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8];
    
    const headers = ['Circunscripción', 'País', 'Oficina', 'Zona', 'Juntas', 'H', 'M', 'Tipo', 'S.E', 'Inst', 'Cierre', 'Digit', 'Final'];
    
    // Encabezados de tabla
    doc.setFillColor(31, 78, 120);
    doc.rect(12, currentY, pageWidth - 24, 7, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    
    headers.forEach((header, idx) => {
      doc.text(header, colX[idx], currentY + 4.5, { maxWidth: colWidths[idx] - 1, align: 'center' });
    });
    
    currentY += 8;

    // Datos
    const groupedOffices = groupByCircunscripcion(offices);
    let rowNum = 0;
    const pageMargin = pageHeight - 15;

    for (const [circunscripcion, circOffices] of Object.entries(groupedOffices)) {
      let juntas = 0, hombres = 0, mujeres = 0;

      circOffices.forEach((office) => {
        juntas += office.juntas || 0;
        hombres += office.juntasMen || 0;
        mujeres += office.juntasWomen || 0;

        // Fila de oficina
        const bgColor = rowNum % 2 === 0 ? [245, 245, 245] : [255, 255, 255];
        doc.setFillColor(...bgColor);
        doc.rect(12, currentY, pageWidth - 24, 5, 'F');
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(30, 30, 30);
        
        // Texto - mejor proporcionado
        const circ = circunscripcion.substring(0, 15);
        const country = (office.country || '').substring(0, 12);
        const name = (office.name || '').substring(0, 12);
        const zone = (office.zone || '').substring(0, 10);
        const type = (office.type || '').substring(0, 6);
        
        doc.text(circ, colX[0], currentY + 3.2, { maxWidth: colWidths[0] - 1, align: 'left' });
        doc.text(country, colX[1], currentY + 3.2, { maxWidth: colWidths[1] - 1, align: 'left' });
        doc.text(name, colX[2], currentY + 3.2, { maxWidth: colWidths[2] - 1, align: 'left' });
        doc.text(zone, colX[3], currentY + 3.2, { maxWidth: colWidths[3] - 1, align: 'left' });
        doc.text(String(office.juntas || 0), colX[4], currentY + 3.2, { align: 'center' });
        doc.text(String(office.juntasMen || 0), colX[5], currentY + 3.2, { align: 'center' });
        doc.text(String(office.juntasWomen || 0), colX[6], currentY + 3.2, { align: 'center' });
        doc.text(type, colX[7], currentY + 3.2, { maxWidth: colWidths[7] - 1, align: 'center' });
        
        currentY += 5.5;
        rowNum++;

        // Salto de página si es necesario
        if (currentY > pageMargin - 10) {
          doc.addPage();
          
          // Repetir encabezado en nueva página
          doc.setFillColor(31, 78, 120);
          doc.rect(12, 10, pageWidth - 24, 7, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(255, 255, 255);
          headers.forEach((header, idx) => {
            doc.text(header, colX[idx], 13.5, { maxWidth: colWidths[idx] - 1, align: 'center' });
          });
          
          currentY = 18;
        }
      });

      // Fila de subtotal
      doc.setFillColor(220, 220, 220);
      doc.rect(12, currentY, pageWidth - 24, 5.5, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(0, 0, 0);
      
      doc.text(`Subtotal: ${circunscripcion}`, colX[0], currentY + 3.2, { maxWidth: 50 });
      doc.text(String(juntas), colX[4], currentY + 3.2, { align: 'center' });
      doc.text(String(hombres), colX[5], currentY + 3.2, { align: 'center' });
      doc.text(String(mujeres), colX[6], currentY + 3.2, { align: 'center' });
      
      currentY += 6;
      rowNum++;

      if (currentY > pageMargin - 10) {
        doc.addPage();
        
        // Repetir encabezado en nueva página
        doc.setFillColor(31, 78, 120);
        doc.rect(12, 10, pageWidth - 24, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        headers.forEach((header, idx) => {
          doc.text(header, colX[idx], 13.5, { maxWidth: colWidths[idx] - 1, align: 'center' });
        });
        
        currentY = 18;
      }
    }

    // Total General
    currentY += 2;
    doc.setFillColor(31, 78, 120);
    doc.rect(12, currentY, pageWidth - 24, 6, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    
    let totalJuntas = offices.reduce((sum, o) => sum + (o.juntas || 0), 0);
    let totalHombres = offices.reduce((sum, o) => sum + (o.juntasMen || 0), 0);
    let totalMujeres = offices.reduce((sum, o) => sum + (o.juntasWomen || 0), 0);
    
    doc.text('TOTAL GENERAL', colX[0], currentY + 3.5);
    doc.text(String(totalJuntas), colX[4], currentY + 3.5, { align: 'center' });
    doc.text(String(totalHombres), colX[5], currentY + 3.5, { align: 'center' });
    doc.text(String(totalMujeres), colX[6], currentY + 3.5, { align: 'center' });

    // Descargar
    const filename = `reporte-cne-${new Date().toISOString().slice(0, 10)}.pdf`;
    console.log('Guardando PDF como:', filename);
    doc.save(filename);
    console.log('PDF generado exitosamente');

  } catch (error) {
    console.error('Error al generar PDF:', error);
    alert('Error al generar PDF: ' + error.message);
  }
};

function groupByCircunscripcion(offices) {
  return offices.reduce((acc, office) => {
    const circunscripcion = office.circunscription || 'Sin Circunscripción';
    if (!acc[circunscripcion]) acc[circunscripcion] = [];
    acc[circunscripcion].push(office);
    return acc;
  }, {});
}
