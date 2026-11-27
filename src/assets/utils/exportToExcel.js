import { statusInfo } from '../constants/cneConstants.js';

const statusColumns = Object.entries(statusInfo);

const getOfficeStatus = (office) => {
  const completed = Object.values(office.milestones || {}).filter(Boolean).length;
  if (completed >= 6) return 'finalizado';
  if (completed === 5) return 'digitalizacion';
  if (completed >= 3) return 'cierre';
  if (completed === 0) return 'sinEmpezar';
  return 'instalacion';
};

const getStatusMarks = (office) => {
  const currentStatus = getOfficeStatus(office);
  const currentIndex = statusColumns.findIndex(([status]) => status === currentStatus);
  return statusColumns.map(([status], index) => {
    if (status === 'sinEmpezar') return currentStatus === 'sinEmpezar' ? 'X' : '-';
    if (currentStatus === 'finalizado' || index <= currentIndex) return 'X';
    return '-';
  });
};

const groupByCircunscripcion = (offices) =>
  offices.reduce((acc, office) => {
    const circ = office.circunscription || office.circunscripcion || 'Sin Circunscripción';
    if (!acc[circ]) acc[circ] = [];
    acc[circ].push(office);
    return acc;
  }, {});

const colLetter = (n) => {
  let s = '';
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};

export const exportOfficesToExcel = async (offices) => {
  try {
    const exceljsModule = await import('exceljs');
    const ExcelJS = exceljsModule.default ?? exceljsModule;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CNE - Seguimiento';
    workbook.created = new Date();

    // ── Colores ──────────────────────────────────────────────────
    const NAVY      = 'FF1B3A6B';
    const WHITE     = 'FFFFFFFF';
    const GRAY_BG   = 'FFF5F7FA';  // fondo suave subtítulo/fecha
    const INFO_BG   = 'FFF0F4FA';  // barra de info
    const GREEN     = 'FF00783C';
    const GRAY_X    = 'FFA0A0A0';
    const ROW_ALT   = 'FFF7F9FC';
    const SUBTOTAL  = 'FFE6EBF5';
    const GRID      = 'FFD0D8E4';
    const DARK_GRID = 'FF8899AA';
    const TEXT      = 'FF1E1E1E';
    const NAVY_TEXT = 'FF1B3A6B';
    const BLACK     = 'FF000000';

    // ── Definición de columnas y Encabezado de la fila y mostramos nomnbres ────────────────────────────────────
    const headers    = ['Circunscripción','País','Oficina','Zona','Juntas','H','M','Tipo',
                        ' Sin Iniciar','Instalación','Escrutinio','Digitización','Finalizado'];
    const colCount   = headers.length;        // 13
    const lastCol    = colLetter(colCount);   // M
    const logoEnd    = colLetter(3);          // C  — logo en A:C
    const titleStart = colLetter(4);          // D  — texto en D:M
    const colAligns  = ['left','left','left','left','center','center','center','center',
                        'center','center','center','center','center'];
    const widths     = [26, 16, 24, 16, 8, 5, 5, 12, 12, 12, 12, 12, 12]; // ancho de las columnas

    const worksheet = workbook.addWorksheet('Reporte', {
      views: [{ state: 'frozen', ySplit: 5 }],
      pageSetup: {
        paperSize: 9,
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
      },
      headerFooter: {
        oddFooter: '&LConsejo Nacional Electoral&R&P de &N',
      },
    });

    widths.forEach((w, i) => { worksheet.getColumn(i + 1).width = w; });

    const thinBorder = (color = GRID) => ({
      top:    { style: 'thin', color: { argb: color } },
      bottom: { style: 'thin', color: { argb: color } },
      left:   { style: 'thin', color: { argb: color } },
      right:  { style: 'thin', color: { argb: color } },
    });

    const fillRow = (rn, color) => {
      const r = worksheet.getRow(rn);
      for (let i = 1; i <= colCount; i++)
        r.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
    };

    // Alturas de filas del encabezado
    worksheet.getRow(1).height = 30;
    worksheet.getRow(2).height = 22;
    worksheet.getRow(3).height = 18;

    // Fondo blanco explícito en las 3 filas para todas las columnas
    [1, 2, 3].forEach((rn) => fillRow(rn, WHITE));

    // ── Logo: A1:A3 — columna A, filas 1-3 unidas ────────────
    worksheet.mergeCells('A1:A3');
    const logoAreaCell = worksheet.getCell('A1');
    logoAreaCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: WHITE } };
    logoAreaCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // ── Título: B1:M1 — negro, fondo blanco, centrado ────────
    worksheet.mergeCells(`B1:${lastCol}1`);
    const titleCell = worksheet.getCell('B1');
    titleCell.value     = 'CONSEJO NACIONAL ELECTORAL';
    titleCell.font      = { bold: true, size: 22, color: { argb: BLACK }, name: 'Calibri' };
    titleCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: WHITE } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // ── Subtítulo: B2:M2 — negrita azul, fondo gris suave ────
    worksheet.mergeCells(`B2:${lastCol}2`);
    const subCell = worksheet.getCell('B2');
    subCell.value     = 'Dirección de Procesos en el Exterior';
    subCell.font      = { bold: true, size: 14, color: { argb: NAVY_TEXT }, name: 'Calibri' };
    subCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: WHITE } };
    subCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // ── Texto seguimiento: B3:M3 — itálica gris, mismo fondo ─
    worksheet.mergeCells(`B3:${lastCol}3`);
    const trackCell = worksheet.getCell('B3');
    trackCell.value     = 'Reporte de seguimiento de zonas electorales';
    trackCell.font      = { italic: true, size: 10, color: { argb: 'FF666666' }, name: 'Calibri' };
    trackCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRAY_BG } };
    trackCell.alignment = { horizontal: 'center', vertical: 'middle'};

    // ── Fecha/hora ────────────────────────────────────────────
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const dateTimeStr =
      `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ` +
      `- ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    // ── Fila 4: barra de información — blanca con borde inferior
    worksheet.getRow(4).height = 18;
    fillRow(4, WHITE);

    const infoSplit = colLetter(8);
    const infoNext  = colLetter(9);
    worksheet.mergeCells(`A4:${infoSplit}4`);
    worksheet.mergeCells(`${infoNext}4:${lastCol}4`);

    const infoL = worksheet.getCell('A4');
    infoL.value     = `Fecha de generación: ${dateTimeStr}`;
    infoL.font      = { bold: true, size: 10, color: { argb: NAVY_TEXT } };
    infoL.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    infoL.border    = { bottom: { style: 'thin', color: { argb: GRID } } };

    const infoR = worksheet.getCell(`${infoNext}4`);
    infoR.value     = `Total de oficinas: ${offices.length}`;
    infoR.font      = { size: 10, color: { argb: TEXT } };
    infoR.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
    infoR.border    = { bottom: { style: 'thin', color: { argb: GRID } } };

    // ── Fila 5: cabecera de columnas (freeze aquí) ────────────
    worksheet.getRow(5).height = 22;
    headers.forEach((label, i) => {
      const cell = worksheet.getRow(5).getCell(i + 1);
      cell.value     = label;
      cell.font      = { bold: true, size: 10, color: { argb: WHITE } };
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
      cell.alignment = { horizontal: colAligns[i], vertical: 'middle',
                        indent: colAligns[i] === 'left' ? 1 : 0 };
      cell.border    = thinBorder(DARK_GRID);
    });

    // ── Logo: imagen dentro de A1:A3 ─────────────────────────
    // Original 1070×535 px (ratio 2:1). Columna A ≈ 65px ancho × 100px alto.
    // Usamos 110×55 px para que quepa proporcional en la columna A.
    try {
      const logoResp = await fetch('/images/logo-cne1.png');
      if (logoResp.ok) {
        const logoBuffer = await logoResp.arrayBuffer();
        const logoId = workbook.addImage({ buffer: logoBuffer, extension: 'png' });
        worksheet.addImage(logoId, {
          tl: { col: 0, row: 0, colOff: 20000, rowOff: 50000 },
          ext: { width:220, height: 100 },
          editAs: 'oneCell',
        });
      }
    } catch (e) {
      console.warn('No se pudo cargar el logo:', e.message);
    }

    // ================================================================
    // CUERPO DE LA TABLA (desde fila 6)
    // ================================================================
    const groupedOffices = groupByCircunscripcion(offices);
    let rowNum = 6;
    let alt    = 0;

    let grandJuntas = 0, grandH = 0, grandM = 0;
    let grandSE = 0, grandInst = 0, grandCierre = 0, grandDigit = 0, grandFinal = 0;

    const writeCell = (cell, value, ci, { isStatus = false, bg = null, bold = false } = {}) => {
      cell.value = value;
      if (isStatus) {
        const isX = value === 'X';
        cell.font = { bold: isX, size: 10, color: { argb: isX ? GREEN : GRAY_X } };
      } else {
        cell.font = { size: 10, bold, color: { argb: TEXT } };
      }
      const align = colAligns[ci];
      cell.alignment = { horizontal: align, vertical: 'middle', indent: align === 'left' ? 1 : 0 };
      if (bg) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.border = thinBorder();
    };

    for (const [circunscripcion, circOffices] of Object.entries(groupedOffices)) {
      let juntas = 0, hombres = 0, mujeres = 0;
      let countSE = 0, countInst = 0, countCierre = 0, countDigit = 0, countFinal = 0;

      circOffices.forEach((office) => {
        juntas  += Number(office.juntas)  || 0;
        hombres += Number(office.juntasMen   || office.hombres) || 0;
        mujeres += Number(office.juntasWomen || office.mujeres) || 0;

        const marks = getStatusMarks(office);
        if (marks[0] === 'X') countSE++;
        if (marks[1] === 'X') countInst++;
        if (marks[2] === 'X') countCierre++;
        if (marks[3] === 'X') countDigit++;
        if (marks[4] === 'X') countFinal++;

        const bg  = alt % 2 === 0 ? ROW_ALT : WHITE;
        const row = worksheet.getRow(rowNum);
        [
          circunscripcion,
          office.country || office.pais || '',
          office.name    || office.oficina || '',
          office.zone    || '',
          office.juntas  || 0,
          office.juntasMen   || office.hombres  || 0,
          office.juntasWomen || office.mujeres || 0,
          office.type    || office.tipo || '',
          marks[0], marks[1], marks[2], marks[3], marks[4],
        ].forEach((val, ci) => writeCell(row.getCell(ci + 1), val, ci, { isStatus: ci >= 8, bg }));

        worksheet.getRow(rowNum).height = 16;
        rowNum++;
        alt++;
      });

      // ── Subtotal circunscripción ──────────────────────────────
      const sub = worksheet.getRow(rowNum);
      [
        `Subtotal ${circunscripcion}`, '', '', '',
        juntas, hombres, mujeres, '',
        countSE, countInst, countCierre, countDigit, countFinal,
      ].forEach((val, ci) => writeCell(sub.getCell(ci + 1), val, ci, { bg: SUBTOTAL, bold: true }));
      worksheet.getRow(rowNum).height = 18;
      rowNum++;

      grandJuntas += juntas;   grandH += hombres;   grandM += mujeres;
      grandSE     += countSE;  grandInst  += countInst;  grandCierre += countCierre;
      grandDigit  += countDigit; grandFinal += countFinal;
    }

    // ── Total general ─────────────────────────────────────────
    rowNum++;
    const total = worksheet.getRow(rowNum);
    ['TOTAL GENERAL', '', '', '',
     grandJuntas, grandH, grandM, '',
     grandSE, grandInst, grandCierre, grandDigit, grandFinal,
    ].forEach((val, ci) => {
      const cell = total.getCell(ci + 1);
      cell.value     = val;
      cell.font      = { bold: true, size: 11, color: { argb: WHITE } };
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
      cell.alignment = { horizontal: colAligns[ci], vertical: 'middle',
                         indent: colAligns[ci] === 'left' ? 1 : 0 };
      cell.border    = thinBorder(DARK_GRID);
    });
    worksheet.getRow(rowNum).height = 22;

    // Franja dorada de cierre
    fillRow(rowNum + 1, 'FFD4AF37');
    worksheet.getRow(rowNum + 1).height = 3;

    // ================================================================
    // DESCARGA
    // ================================================================
    const buffer = await workbook.xlsx.writeBuffer();
    const blob   = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href  = url;
    link.download = `reporte-cne-${new Date().toISOString().slice(0, 10)}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error al generar Excel:', error);
    alert('Error al generar Excel: ' + error.message);
  }
};
