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
    let currentY = 15;

    // ============================================================
    // ENCABEZADO
    // ============================================================
    
    // Fondo azul marino para título
    doc.setFillColor(31, 78, 120);
    doc.rect(0, currentY - 5, pageWidth, 15, 'F');
    
    // Logo placeholder
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('[LOGO]', 15, currentY + 3);
    
    // Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('CONSEJO NACIONAL ELECTORAL', pageWidth / 2, currentY + 3, { align: 'center' });
    
    currentY += 18;

    // Fondo gris para subtítulo
    doc.setFillColor(200, 200, 200);
    doc.rect(0, currentY - 3, pageWidth, 8, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Dirección de Procesos en el Exterior', 15, currentY + 1);
    
    currentY += 10;

    // Fecha y hora
    const now = new Date();
    const dateTimeStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} - ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(`Reporte de ${dateTimeStr}`, 15, currentY);
    
    currentY += 8;

    // ============================================================
    // TABLA SIMPLIFICADA
    // ============================================================
    
    const statusColumns = Object.entries(statusInfo);
    
    // Generar tabla simple de texto
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(31, 78, 120);
    
    // Encabezados
    const colX = [10, 25, 42, 62, 77, 87, 97, 107];
    const headers = ['Circunscripción', 'País', 'Oficina', 'Zona', 'Juntas', 'Hombres', 'Mujeres', 'Tipo'];
    
    doc.rect(10, currentY, pageWidth - 20, 6, 'F');
    headers.forEach((header, idx) => {
      doc.text(header, colX[idx], currentY + 4, { maxWidth: 12 });
    });
    
    currentY += 7;

    // Datos
    const groupedOffices = groupByCircunscripcion(offices);
    let rowNum = 0;

    for (const [circunscripcion, circOffices] of Object.entries(groupedOffices)) {
      let juntas = 0, hombres = 0, mujeres = 0;

      circOffices.forEach((office) => {
        juntas += office.juntas || 0;
        hombres += office.juntasMen || 0;
        mujeres += office.juntasWomen || 0;

        // Fila de oficina
        const bgColor = rowNum % 2 === 0 ? [255, 255, 255] : [240, 240, 240];
        doc.setFillColor(...bgColor);
        doc.rect(10, currentY, pageWidth - 20, 4, 'F');
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(0, 0, 0);
        
        doc.text(circunscripcion.substring(0, 15), colX[0], currentY + 2.5);
        doc.text((office.country || '').substring(0, 10), colX[1], currentY + 2.5);
        doc.text((office.name || '').substring(0, 15), colX[2], currentY + 2.5);
        doc.text((office.zone || '').substring(0, 10), colX[3], currentY + 2.5);
        doc.text(String(office.juntas || 0), colX[4], currentY + 2.5, { align: 'center' });
        doc.text(String(office.juntasMen || 0), colX[5], currentY + 2.5, { align: 'center' });
        doc.text(String(office.juntasWomen || 0), colX[6], currentY + 2.5, { align: 'center' });
        doc.text((office.type || '').substring(0, 10), colX[7], currentY + 2.5);
        
        currentY += 4;
        rowNum++;

        if (currentY > pageHeight - 15) {
          doc.addPage();
          currentY = 15;
        }
      });

      // Subtotal
      doc.setFillColor(220, 220, 220);
      doc.rect(10, currentY, pageWidth - 20, 4, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(0, 0, 0);
      
      doc.text(`Subtotal - ${circunscripcion}`, colX[0], currentY + 2.5);
      doc.text(String(juntas), colX[4], currentY + 2.5, { align: 'center' });
      doc.text(String(hombres), colX[5], currentY + 2.5, { align: 'center' });
      doc.text(String(mujeres), colX[6], currentY + 2.5, { align: 'center' });
      
      currentY += 4;
      rowNum++;

      if (currentY > pageHeight - 15) {
        doc.addPage();
        currentY = 15;
      }
    }

    // Total General
    doc.setFillColor(31, 78, 120);
    doc.rect(10, currentY, pageWidth - 20, 5, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    
    let totalJuntas = offices.reduce((sum, o) => sum + (o.juntas || 0), 0);
    let totalHombres = offices.reduce((sum, o) => sum + (o.juntasMen || 0), 0);
    let totalMujeres = offices.reduce((sum, o) => sum + (o.juntasWomen || 0), 0);
    
    doc.text('TOTAL GENERAL', colX[0], currentY + 3);
    doc.text(String(totalJuntas), colX[4], currentY + 3, { align: 'center' });
    doc.text(String(totalHombres), colX[5], currentY + 3, { align: 'center' });
    doc.text(String(totalMujeres), colX[6], currentY + 3, { align: 'center' });

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
