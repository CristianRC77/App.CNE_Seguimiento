import { jsPDF } from 'jspdf';
import { statusInfo } from '../constants/cneConstants.js';

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
    const margin = 12;
    const contentWidth = pageWidth - margin * 2;
    let currentY = 10;

    const LOGO_BASE64 = '/public/images/logo-cne1.png'; 
    
    // ============================================================
    // 🚀 FUNCIÓN CLAVE: DETECTA CUALQUIER TIPO DE VALOR COMO "TRUE"
    // ============================================================
    const isTrue = (value) => {
      if (value === undefined || value === null) return false;
      if (typeof value === 'boolean') return value;
      if (typeof value === 'number') return value === 1;
      if (typeof value === 'string') {
        const v = value.trim().toUpperCase();
        return v === '1' || v === 'TRUE' || v === 'X' || v === 'SI' || v === 'SÍ';
      }
      return Boolean(value);
    };

    // Fases del proceso en el orden oficial (coincide con las columnas S.E, Inst, Cierre, Digit, Final).
    const statusColumns = Object.entries(statusInfo);

    // Traduce los hitos completados (office.milestones) a la fase actual de la oficina.
    const getOfficeStatus = (office) => {
      const completed = Object.values(office.milestones || {}).filter(Boolean).length;
      if (completed >= 6) return 'finalizado';
      if (completed === 5) return 'digitalizacion';
      if (completed >= 3) return 'cierre';
      if (completed === 0) return 'sinEmpezar';
      return 'instalacion';
    };

    // Devuelve las 5 marcas ['X'|'-'] en el orden de las columnas de estado del reporte.
    const getStatusMarks = (office) => {
      const currentStatus = getOfficeStatus(office);
      const currentIndex = statusColumns.findIndex(([status]) => status === currentStatus);
      return statusColumns.map(([status], index) => {
        if (status === 'sinEmpezar') {
          return currentStatus === 'sinEmpezar' ? 'X' : '-';
        }
        if (currentStatus === 'finalizado' || index <= currentIndex) return 'X';
        return '-';
      });
    };

    const drawHeader = (isFirstPage = true) => {
      if (isFirstPage) {
        doc.setFillColor(255, 255, 255);  /* Color de fondo del encabezado */
        doc.rect(0, 0, pageWidth, 30, 'F');
        
        doc.setFillColor(212, 175, 55); 
        doc.rect(0, 30, pageWidth, 1, 'F');

        try {
          doc.addImage(LOGO_BASE64, 'PNG', margin + 2, 4, 65, 27); /* Logo CNE ya  */
        } catch (e) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.setTextColor(0, 51, 102);
          doc.text('CNE', margin + 9, 14, { align: 'center' });
        }

        const textX = pageWidth / 2; 
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(0, 51, 102);
        doc.text('CONSEJO NACIONAL ELECTORAL', textX, 10, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);
        doc.text('Dirección de Procesos en el Exterior', textX, 15, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(0, 51, 102);
        doc.text('REPORTE DE ZONAS ELECTORALES', textX, 21, { align: 'center' });

        currentY = 35; 
      } else {
        currentY = 15;
      }
    };

    drawHeader(true);

    // BARRA DE INFO
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const dateTimeStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    doc.setFillColor(240, 244, 250);
    doc.rect(margin, currentY, contentWidth, 7, 'F');
    doc.setDrawColor(200, 210, 225);
    doc.setLineWidth(0.2);
    doc.rect(margin, currentY, contentWidth, 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 51, 102);
    doc.text(`Fecha de generación: ${dateTimeStr}`, margin + 3, currentY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(`Total de oficinas: ${offices.length}`, pageWidth - margin - 3, currentY + 4.5, { align: 'right' });

    currentY += 11;

    // COLUMNAS
    const columns = [
      { key: 'circ',     label: 'Circunscripción', width: 38, align: 'left'   },
      { key: 'country',  label: 'País',            width: 28, align: 'left'   },
      { key: 'name',     label: 'Oficina',         width: 32, align: 'left'   },
      { key: 'zone',     label: 'Zona',            width: 20, align: 'left'   },
      { key: 'juntas',   label: 'Juntas',          width: 14, align: 'center' },
      { key: 'men',      label: 'H',               width: 9,  align: 'center' },
      { key: 'women',    label: 'M',               width: 9,  align: 'center' },
      { key: 'type',     label: 'Tipo',            width: 16, align: 'center' },
      { key: 'se',       label: 'S. I.',             width: 10, align: 'center' },
      { key: 'inst',     label: 'Inst',            width: 10, align: 'center' },
      { key: 'cierre',   label: 'Escrut',          width: 12, align: 'center' },
      { key: 'digit',    label: 'Digital',           width: 12, align: 'center' },
      { key: 'final',    label: 'Compl',           width: 12, align: 'center' },
    ];

    const totalColWidth = columns.reduce((s, c) => s + c.width, 0);
    const scale = contentWidth / totalColWidth;
    let accX = margin;
    columns.forEach((c) => {
      c.width = c.width * scale;
      c.x = accX;
      accX += c.width;
    });

    const rowHeight = 5.5;
    const headerRowHeight = 7.5;
    const footerMargin = pageHeight - 12;

    const drawTableHeader = () => {
      doc.setFillColor(0, 51, 102); 
      doc.rect(margin, currentY, contentWidth, headerRowHeight, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.8);
      doc.setTextColor(255, 255, 255);

      columns.forEach((c) => {
        const txt = c.label;
        if (c.align === 'center') {
          doc.text(txt, c.x + c.width / 2, currentY + headerRowHeight / 2 + 1.2, { align: 'center' });
        } else {
          doc.text(txt, c.x + 1.5, currentY + headerRowHeight / 2 + 1.2);
        }
      });

      currentY += headerRowHeight;
    };

    // 🚀 MODIFICACIÓN CLAVE EN drawRow: Forzamos la evaluación con isTrue()
    const drawRow = (values, bgColor, isBold = false, fontColor = [30, 30, 30], fontSize = 7.2) => {
      doc.setFillColor(...bgColor);
      doc.rect(margin, currentY, contentWidth, rowHeight, 'F');

      columns.forEach((c, i) => {
        const raw = values[i] ?? '';
        let txt = String(raw);
        
        // Si es una columna de estado, FORZAMOS la conversión a X o -
        if (['se', 'inst', 'cierre', 'digit', 'final'].includes(c.key)) {
          txt = isTrue(raw) ? 'X' : '-';
        }
        
        const isMark = txt === 'X' || txt === '-';

        if (isMark) {
          doc.setFont('helvetica', txt === 'X' ? 'bold' : 'normal');
          doc.setTextColor(...(txt === 'X' ? [0, 120, 60] : [160, 160, 160]));
        } else {
          doc.setFont('helvetica', isBold ? 'bold' : 'normal');
          doc.setTextColor(...fontColor);
        }
        doc.setFontSize(fontSize);

        if (c.align === 'center') {
          doc.text(txt, c.x + c.width / 2, currentY + rowHeight / 2 + 0.9, { align: 'center' });
        } else {
          const maxChars = Math.floor(c.width / 1.6);
          const display = txt.length > maxChars ? txt.substring(0, maxChars - 1) + '…' : txt;
          doc.text(display, c.x + 1.5, currentY + rowHeight / 2 + 0.9);
        }
      });

      currentY += rowHeight;
    };

    const checkPageBreak = (needed = rowHeight) => {
      if (currentY + needed > footerMargin) {
        doc.addPage();
        drawHeader(false);
        drawTableHeader();
      }
    };

    drawTableHeader();

    const groupedOffices = groupByCircunscripcion(offices);
    let rowNum = 0;

    let grandTotalJuntas = 0, grandTotalH = 0, grandTotalM = 0;
    let grandCountSE = 0, grandCountInst = 0, grandCountCierre = 0, grandCountDigit = 0, grandCountFinal = 0;

    for (const [circunscripcion, circOffices] of Object.entries(groupedOffices)) {
      let juntas = 0, hombres = 0, mujeres = 0;
      let countSE = 0, countInst = 0, countCierre = 0, countDigit = 0, countFinal = 0;
      
      const groupedByZone = circOffices.reduce((acc, office) => {
        const zone = office.zone || 'Sin Zona';
        if (!acc[zone]) acc[zone] = [];
        acc[zone].push(office);
        return acc;
      }, {});

      for (const [zone, zoneOffices] of Object.entries(groupedByZone)) {
        zoneOffices.forEach((office) => {
          juntas   += Number(office.juntas) || 0;
          hombres  += Number(office.juntasMen || office.hombres) || 0;
          mujeres  += Number(office.juntasWomen || office.mujeres) || 0;
          
          // 🚀 CONTEO DE ESTADOS USANDO LA FUNCIÓN ROBUSTA
          const marks = getStatusMarks(office);
          if (marks[0] === 'X') countSE++;
          if (marks[1] === 'X') countInst++;
          if (marks[2] === 'X') countCierre++;
          if (marks[3] === 'X') countDigit++;
          if (marks[4] === 'X') countFinal++;

          checkPageBreak();

          const bgColor = rowNum % 2 === 0 ? [247, 249, 252] : [255, 255, 255];
          const zoneDisplay = zone;

          drawRow([
            circunscripcion,
            office.country || office.pais || '',
            office.name || office.oficina || '',
            zoneDisplay,
            office.juntas || 0,
            office.juntasMen || office.hombres || 0,
            office.juntasWomen || office.mujeres || 0,
            office.type || office.tipo || '',
            marks[0],
            marks[1],
            marks[2],
            marks[3],
            marks[4],
          ], bgColor);

          rowNum++;
        });
      }

      // SUBTOTAL
      checkPageBreak(6);

      doc.setFillColor(230, 235, 245); 
      doc.rect(margin, currentY, contentWidth, 6, 'F');
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.3);
      doc.rect(margin, currentY, contentWidth, 6);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(0, 0, 0);
      doc.text(`Subtotal ${circunscripcion}`, columns[0].x + 2, currentY + 3.8);
      doc.text(String(juntas),     columns[4].x + columns[4].width / 2, currentY + 3.8, { align: 'center' });
      doc.text(String(hombres),    columns[5].x + columns[5].width / 2, currentY + 3.8, { align: 'center' });
      doc.text(String(mujeres),    columns[6].x + columns[6].width / 2, currentY + 3.8, { align: 'center' });
      
      // SUBTOTAL: muestra el conteo numérico de oficinas que alcanzaron cada fase.
      const drawMark = (count, colIndex) => {
        const txt = String(count);
        doc.setTextColor(...(count > 0 ? [0, 120, 60] : [160, 160, 160]));
        doc.text(txt, columns[colIndex].x + columns[colIndex].width / 2, currentY + 3.8, { align: 'center' });
      };
      
      drawMark(countSE, 8);
      drawMark(countInst, 9);
      drawMark(countCierre, 10);
      drawMark(countDigit, 11);
      drawMark(countFinal, 12);

      currentY += 6;
      rowNum++;

      grandTotalJuntas += juntas;
      grandTotalH += hombres;
      grandTotalM += mujeres;
      grandCountSE += countSE;
      grandCountInst += countInst;
      grandCountCierre += countCierre;
      grandCountDigit += countDigit;
      grandCountFinal += countFinal;
    }

    // TOTAL GENERAL
    checkPageBreak(10);
    currentY += 2;

    doc.setFillColor(0, 51, 102);
    doc.rect(margin, currentY, contentWidth, 7, 'F');
    doc.setFillColor(212, 175, 55);
    doc.rect(margin, currentY + 7, contentWidth, 0.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);

    doc.text('TOTAL GENERAL', columns[0].x + 2, currentY + 4.6);
    doc.text(String(grandTotalJuntas),   columns[4].x + columns[4].width / 2, currentY + 4.6, { align: 'center' });
    doc.text(String(grandTotalH),        columns[5].x + columns[5].width / 2, currentY + 4.6, { align: 'center' });
    doc.text(String(grandTotalM),        columns[6].x + columns[6].width / 2, currentY + 4.6, { align: 'center' });
    
    // TOTAL GENERAL: muestra el conteo numérico de oficinas que alcanzaron cada fase.
    const drawTotalMark = (count, colIndex) => {
      const txt = String(count);
      doc.text(txt, columns[colIndex].x + columns[colIndex].width / 2, currentY + 4.6, { align: 'center' });
    };

    drawTotalMark(grandCountSE, 8);
    drawTotalMark(grandCountInst, 9);
    drawTotalMark(grandCountCierre, 10);
    drawTotalMark(grandCountDigit, 11);
    drawTotalMark(grandCountFinal, 12);

    currentY += 12;

    // PIE DE PÁGINA
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      doc.setDrawColor(200, 210, 225);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 9, pageWidth - margin, pageHeight - 9);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(120, 120, 120);
      doc.text('Consejo Nacional Electoral - Documento generado automáticamente', margin, pageHeight - 5);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
    }

    // DESCARGA
    const filename = `reporte-cne-${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);

  } catch (error) {
    console.error('Error al generar PDF:', error);
    alert('Error al generar PDF: ' + error.message);
  }
};

function groupByCircunscripcion(offices) {
  return offices.reduce((acc, office) => {
    const circunscripcion = office.circunscription || office.circunscripcion || 'Sin Circunscripción';
    if (!acc[circunscripcion]) acc[circunscripcion] = [];
    acc[circunscripcion].push(office);
    return acc;
  }, {});
}