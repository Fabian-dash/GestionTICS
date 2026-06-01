const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generarFichaCaracterizacion = async (oferta) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 12, bottom: 12, left: 28, right: 28 },
        autoFirstPage: true,
        bufferPages: true   // ← permite controlar páginas al final
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        // ── Eliminar páginas en blanco al final ──────────────────────────
        const range = doc.bufferedPageRange();
        // Quitar páginas que no tienen contenido (solo existe página 0 con datos)
        // bufferPages+flushPages nos da control; simplemente hacemos flush de la 1ra
        doc.flushPages();
        resolve(Buffer.concat(buffers));
      });

      const LEFT  = 28;
      const RIGHT = 584;
      const W     = RIGHT - LEFT;

      // ─── Helpers ───────────────────────────────────────────────────────
      const hLine = (y, x1 = LEFT, x2 = RIGHT) =>
        doc.save().lineWidth(0.4).moveTo(x1, y).lineTo(x2, y).stroke().restore();

      const vLine = (x, y1, y2) =>
        doc.save().lineWidth(0.4).moveTo(x, y1).lineTo(x, y2).stroke().restore();

      const boxStroke = (x, y, w, h, lw = 0.5) =>
        doc.save().lineWidth(lw).rect(x, y, w, h).stroke().restore();

      const chk = (x, y, checked = false, size = 8) => {
        doc.save().lineWidth(0.4).rect(x, y, size, size).stroke().restore();
        if (checked) {
          doc.save().fontSize(size - 1).font('Helvetica-Bold').fillColor('black')
            .text('X', x + 1.5, y + 0.5, { lineBreak: false }).restore();
        }
      };

      const txt = (text, x, y, size, font, color, opts = {}) =>
        doc.save().fontSize(size).font(font).fillColor(color)
          .text(text || '', x, y, { lineBreak: false, ...opts })
          .restore();

      // =====================================================================
      // CONSTANTES — reducidas para caber en 1 hoja
      // =====================================================================
      const ROW_H  = 16;
      const PE_H   = 13;
      const HDR_H  = 50;
      const TIPO_H = 15;
      const LBL_W  = 108;
      const VAL_X  = LEFT + LBL_W;
      const VAL_W  = W - LBL_W;

      let y = 12;

      const row = (label, value) => {
        hLine(y); hLine(y + ROW_H);
        vLine(LEFT, y, y + ROW_H);
        vLine(RIGHT, y, y + ROW_H);
        vLine(VAL_X, y, y + ROW_H);
        txt(label, LEFT + 2,  y + 4, 6.5, 'Helvetica', '#333',  { width: LBL_W - 4 });
        txt(value, VAL_X + 3, y + 4, 8,   'Helvetica', 'black', { width: VAL_W - 6  });
        y += ROW_H;
      };

      // =====================================================================
      // ENCABEZADO
      // =====================================================================
      const LOGO_W = 68;
      const INFO_W = 92;

      boxStroke(LEFT, y, W, HDR_H, 0.8);
      vLine(LEFT + LOGO_W, y, y + HDR_H);
      vLine(RIGHT - INFO_W, y, y + HDR_H);

      try {
        const logoPath = path.join(__dirname, '../public/logosena.png');
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, LEFT + 3, y + 4, { width: LOGO_W - 8, height: HDR_H - 8 });
        }
      } catch (_) {}

      const MID_X = LEFT + LOGO_W;
      const MID_W = W - LOGO_W - INFO_W;
      txt('SERVICIO NACIONAL DE APRENDIZAJE', MID_X, y + 11, 10,  'Helvetica-Bold', 'black', { width: MID_W, align: 'center' });
      txt('SISTEMA INTEGRADO DE GESTIÓN',     MID_X, y + 25,  8,  'Helvetica',      'black', { width: MID_W, align: 'center' });

      const radicadoTxt =
        `La presente formación se programa en atención a la solicitud con Radicado\n` +
        `No Fecha de asignación desde Coordinación Académica / / ${new Date().getFullYear()}`;
      txt(oferta.radicado_texto || radicadoTxt,
        RIGHT - INFO_W + 3, y + 5, 5.8, 'Helvetica', 'black',
        { width: INFO_W - 6, lineBreak: true });

      y += HDR_H;

      // =====================================================================
      // TIPO DE FORMACIÓN
      // =====================================================================
      boxStroke(LEFT, y, W, TIPO_H, 0.5);
      vLine(LEFT + W / 2, y, y + TIPO_H);

      const esComp = (oferta.tipo_formacion || '').toLowerCase() === 'complementaria';
      chk(LEFT + 16, y + 3, esComp, 8);
      txt('COMPLEMENTARIA', LEFT + 28, y + 3, 8.5, 'Helvetica-Bold', 'black', { width: W / 2 - 32 });
      chk(LEFT + W / 2 + 16, y + 3, !esComp, 8);
      txt('TITULADA', LEFT + W / 2 + 28, y + 3, 8.5, 'Helvetica-Bold', 'black', { width: W / 2 - 32 });

      y += TIPO_H;

      // =====================================================================
      // DATOS DEL PROGRAMA
      // =====================================================================
      row('Código programa*',     oferta.programa_formacion?.codigo || '');
      row('Nombre del Programa*', oferta.programa_formacion?.nombre_programa || '');
      row('Versión*',             oferta.programa_formacion?.version || '');
      row('Duración (Horas)*',    oferta.programa_formacion?.duracion_maxima?.toString() || '');

      const fInicio = oferta.fechas?.inicio ? new Date(oferta.fechas.inicio).toLocaleDateString('es-CO') : '';
      const fFin    = oferta.fechas?.fin    ? new Date(oferta.fechas.fin).toLocaleDateString('es-CO')    : '';
      row('Fecha Inicio*', fInicio);
      row('Fecha Fin*',    fFin);
      row('Cupo*',         oferta.cupo_maximo?.toString() || '');

      // ─── MODALIDAD ─────────────────────────────────────────────────────
      hLine(y); hLine(y + ROW_H);
      vLine(LEFT, y, y + ROW_H); vLine(RIGHT, y, y + ROW_H); vLine(VAL_X, y, y + ROW_H);
      txt('Modalidad*', LEFT + 2, y + 4, 6.5, 'Helvetica', '#333', { width: LBL_W - 4 });
      const modalidad = (oferta.modalidad?.nombre || '').toLowerCase();
      const modSlot   = VAL_W / 3;
      [['PRESENCIAL','presencial'],['VIRTUAL','virtual'],['COMBINADA','combinada']].forEach(([lbl, key], i) => {
        const mx = VAL_X + i * modSlot + 5;
        chk(mx, y + 4, modalidad.includes(key), 8);
        txt(lbl, mx + 12, y + 4, 7.5, 'Helvetica-Bold', 'black', { width: modSlot - 16 });
      });
      y += ROW_H;

      // ─── UBICACIÓN ─────────────────────────────────────────────────────
      row('Departamento*', oferta.ubicacion?.departamento || '');
      row('Municipio*',    oferta.ubicacion?.municipio?.nombre || '');
      row('Dirección*',    oferta.ubicacion?.direccion || '');

      // =====================================================================
      // INSTRUCTOR (creado_por)
      // =====================================================================
      const instructorRaw = oferta.creado_por || {};
      const instructor = typeof instructorRaw === 'object' && !Array.isArray(instructorRaw)
        ? instructorRaw : {};

      hLine(y); hLine(y + ROW_H);
      vLine(LEFT, y, y + ROW_H); vLine(RIGHT, y, y + ROW_H); vLine(VAL_X, y, y + ROW_H);
      txt('Instructor*', LEFT + 2, y + 4, 6.5, 'Helvetica', '#333', { width: LBL_W - 4 });

      const CC_W  = 90;
      const NOM_W = VAL_W - CC_W;
      vLine(VAL_X + NOM_W, y, y + ROW_H);

      const nombreInstructor = instructor.nombre && instructor.apellido
        ? `${instructor.nombre} ${instructor.apellido}`
        : instructor.nombreUsuario || '';
      txt(nombreInstructor, VAL_X + 3, y + 4, 8, 'Helvetica', 'black', { width: NOM_W - 6 });
      txt('CC #', VAL_X + NOM_W + 3, y + 5, 6, 'Helvetica', '#333', { width: 22 });
      txt(instructor.numeroIdentificacion || '', VAL_X + NOM_W + 25, y + 4, 8, 'Helvetica', 'black', { width: CC_W - 28 });
      y += ROW_H;

      // ─── CORREO ────────────────────────────────────────────────────────
      hLine(y); hLine(y + ROW_H);
      vLine(LEFT, y, y + ROW_H); vLine(RIGHT, y, y + ROW_H); vLine(VAL_X, y, y + ROW_H);
      txt('Correo*', LEFT + 2, y + 4, 6.5, 'Helvetica', '#333', { width: LBL_W - 4 });
      txt(instructor.correoElectronico || '', VAL_X + 3, y + 4, 8, 'Helvetica', 'black', { width: VAL_W - 6 });
      y += ROW_H;

      // ─── EMPRESA ───────────────────────────────────────────────────────
      hLine(y); hLine(y + ROW_H);
      vLine(LEFT, y, y + ROW_H); vLine(RIGHT, y, y + ROW_H); vLine(VAL_X, y, y + ROW_H);
      txt('Empresa solicitante*', LEFT + 2, y + 4, 6.5, 'Helvetica', '#333', { width: LBL_W - 4 });
      const empresaRaw = oferta.empresa_solicitante || {};
      const nombreEmpresa = typeof empresaRaw === 'object' && empresaRaw.nombre ? empresaRaw.nombre : '';
      txt(nombreEmpresa, VAL_X + 3, y + 4, 8, 'Helvetica', 'black', { width: VAL_W - 6 });
      y += ROW_H;

      // ─── SUBSECTOR ─────────────────────────────────────────────────────
      row('Subsector económico*', oferta.subsector_economico?.nombre || '');

      // =====================================================================
      // PROGRAMA ESPECIAL — CORRECCIÓN PRINCIPAL
      // =====================================================================
      const programasEspeciales = [
        'SENA emprende Rural',
        'Aulas Abiertas',
        'Programa de Emprendimiento',
        'SENA emprende Rural POST-CONFLICTO',
        'Cátedra Virtual de Productividad',
        'Programa de Bilingüismo',
        'Jóvenes Rurales sin alianzas',
        'Capacidad de Gestión de Exportaciones',
        'LEOS - Laboratorios Experimentales',
        'Aula Móvil',
        'Ambientes Virtuales de Aprendizaje',
        'Cátedra Virtual de Pensamiento Empresarial',
        'Programa Jóvenes en Acción',
        'Alianzas Estratégicas',
        'Altas Gerencia'
      ];

      // ── Obtener el nombre del programa especial de forma robusta ──────
      let programaSeleccionadoNombre = '';
      const pe = oferta.programa_especial;
      if (pe) {
        if (typeof pe === 'object' && pe !== null) {
          programaSeleccionadoNombre = pe.nombre || '';
        } else if (typeof pe === 'string') {
          // Si llegó como string (ID o nombre), intentar comparar directamente
          programaSeleccionadoNombre = pe;
        }
      }

      // Normalizar: quitar tildes, minúsculas, espacios extra
      const normalizar = (str) =>
        (str || '')
          .toLowerCase()
          .trim()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');

      const peNorm = normalizar(programaSeleccionadoNombre);

      const PE_CHK_W   = 20;
      const PE_TOTAL_H = programasEspeciales.length * PE_H;

      hLine(y); hLine(y + PE_TOTAL_H);
      vLine(LEFT,  y, y + PE_TOTAL_H);
      vLine(RIGHT, y, y + PE_TOTAL_H);
      vLine(VAL_X, y, y + PE_TOTAL_H);
      vLine(VAL_X + PE_CHK_W, y, y + PE_TOTAL_H);

      txt('Programa Especial*', LEFT + 2, y + PE_TOTAL_H / 2 - 7, 6.5, 'Helvetica', '#333',
        { width: LBL_W - 4, lineBreak: true });

      programasEspeciales.forEach((prog, i) => {
        const py = y + i * PE_H;
        if (i > 0) hLine(py, VAL_X, RIGHT);

        // Comparación normalizada para evitar fallos por tildes o mayúsculas
        const progNorm = normalizar(prog);
        const isChecked = peNorm.length > 0 && (
          peNorm === progNorm ||
          progNorm.includes(peNorm) ||
          peNorm.includes(progNorm)
        );

        chk(VAL_X + 5, py + (PE_H - 8) / 2, isChecked, 8);
        txt(prog, VAL_X + PE_CHK_W + 2, py + (PE_H - 7) / 2, 7, 'Helvetica', 'black',
          { width: VAL_W - PE_CHK_W - 4 });
      });

      y += PE_TOTAL_H;

      // ─── CONVENIO / AMBIENTE ────────────────────────────────────────────
      row('Convenio', oferta.convenio?.nombre || '');
      row('Ambiente', oferta.ambiente?.nombre || '');

      // =====================================================================
      // MODO REGULAR: días y horario
      // =====================================================================
      const esCampesena = oferta.es_campesena || false;

      if (!esCampesena) {
        hLine(y); hLine(y + ROW_H);
        vLine(LEFT, y, y + ROW_H); vLine(RIGHT, y, y + ROW_H); vLine(VAL_X, y, y + ROW_H);
        txt('Días semana*', LEFT + 2, y + 4, 6.5, 'Helvetica', '#333', { width: LBL_W - 4 });

        const diasLetras  = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
        const diasNombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        const diasOfertaNorm = (oferta.horario?.dias || []).map(normalizar);
        const diasSlot = VAL_W / 7;

        diasLetras.forEach((letra, i) => {
          const dx = VAL_X + i * diasSlot;
          vLine(dx, y, y + ROW_H);
          const checked = diasOfertaNorm.includes(normalizar(diasNombres[i]));
          chk(dx + 4, y + 4, checked, 8);
          txt(letra, dx + 15, y + 4, 7.5, 'Helvetica-Bold', 'black', { width: diasSlot - 18 });
        });
        y += ROW_H;

        const horaInicio = oferta.horario?.hora_inicio || '';
        const horaFin    = oferta.horario?.hora_fin    || '';
        row('Horario*', horaInicio && horaFin ? `${horaInicio} a ${horaFin}` : horaInicio || horaFin);
      }

      // =====================================================================
      // FECHAS POR MES
      // =====================================================================
      const calcularFechasPorMes = (fechaInicio, fechaFin) => {
        if (!fechaInicio || !fechaFin) return {};
        const inicio = new Date(fechaInicio);
        const fin    = new Date(fechaFin);
        const diasPorMes = {};
        let cur = new Date(inicio);
        while (cur <= fin) {
          const key = `${cur.getFullYear()}-${cur.getMonth() + 1}`;
          if (!diasPorMes[key]) diasPorMes[key] = [];
          diasPorMes[key].push(cur.getDate());
          cur.setDate(cur.getDate() + 1);
        }
        return diasPorMes;
      };

      const diasPorMes = calcularFechasPorMes(oferta.fechas?.inicio, oferta.fechas?.fin);
      const meses      = Object.keys(diasPorMes);

      meses.forEach((mes, i) => {
        row(`Fechas mes ${i + 1}`, diasPorMes[mes].join(', '));
      });

      // ─── CÓDIGOS ──────────────────────────────────────────────────────
      row('Código solicitud', oferta.codigo_solicitud || '');
      row('Código ficha',     oferta.ficha_sofia?.codigo || oferta.programa_formacion?.codigo || '');

      const fInscripcion = oferta.createdAt
        ? new Date(oferta.createdAt).toLocaleDateString('es-CO') : '';
      row('Fecha inscripción', fInscripcion);

      hLine(y);

      // ─── OBSERVACIONES (opcional) ──────────────────────────────────────
      if (oferta.observaciones) {
        const OBS_H = ROW_H;
        hLine(y + OBS_H);
        vLine(LEFT, y, y + OBS_H); vLine(RIGHT, y, y + OBS_H); vLine(VAL_X, y, y + OBS_H);
        txt('Observaciones', LEFT + 2, y + 4, 6.5, 'Helvetica', '#333', { width: LBL_W - 4 });
        doc.save().fontSize(7).font('Helvetica').fillColor('black')
          .text(oferta.observaciones, VAL_X + 3, y + 4, { width: VAL_W - 6, lineBreak: false }).restore();
        y += OBS_H;
        hLine(y);
      }

      // =====================================================================
      // FIRMAS — siempre en la misma página, justo debajo del contenido
      // =====================================================================
      y += 14;

      const sigMid = LEFT + W / 2;
      const SIG_H  = 70;   // ← más alto para que la firma se vea grande
      const lineY  = y + SIG_H;

      // ─── IMAGEN DE FIRMA DIGITAL (más grande, centrada en lado izquierdo) ──
      const firmaPath = oferta.firma_digital_pdf || oferta.firma_digital_path || null;

      if (firmaPath && fs.existsSync(firmaPath)) {
        const ext = path.extname(firmaPath).toLowerCase();
        if (['.png', '.jpg', '.jpeg'].includes(ext)) {
          try {
            // Ocupa casi todo el ancho del lado izquierdo y toda la altura SIG_H
            doc.image(firmaPath, LEFT + 10, y, {
              fit: [W / 2 - 20, SIG_H],
              align: 'center',
              valign: 'center'
            });
          } catch (imgErr) {
            console.warn('No se pudo renderizar la firma digital:', imgErr.message);
          }
        }
      }

      // ─── LÍNEAS DE FIRMA ──────────────────────────────────────────────
      doc.save().lineWidth(0.5)
        .moveTo(LEFT + 15, lineY).lineTo(sigMid - 15, lineY).stroke().restore();
      doc.save().lineWidth(0.5)
        .moveTo(sigMid + 15, lineY).lineTo(RIGHT - 15, lineY).stroke().restore();

      txt('Firma Instructor',
        LEFT, lineY + 4, 7.5, 'Helvetica', '#444', { width: W / 2, align: 'center' });
      txt('Vo.Bo. Coordinador Académico',
        sigMid, lineY + 4, 7.5, 'Helvetica', '#444', { width: W / 2, align: 'center' });

      txt(`GFO-F-027 v04  |  ${new Date().toLocaleString('es-CO')}`,
        LEFT, lineY + 16, 5.5, 'Helvetica', '#bbb', { width: W, align: 'center' });

      // ── FIN: cerrar sin agregar páginas extra ─────────────────────────
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generarFichaCaracterizacion };