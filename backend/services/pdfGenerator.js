const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generarFichaCaracterizacion = async (oferta) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 12, bottom: 12, left: 28, right: 28 }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

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
      // CONSTANTES
      // =====================================================================
      const ROW_H  = 17;
      const PE_H   = 14;
      const HDR_H  = 54;
      const TIPO_H = 16;
      const LBL_W  = 108;
      const VAL_X  = LEFT + LBL_W;
      const VAL_W  = W - LBL_W;

      let y = 12;

      const row = (label, value, extraFn) => {
        hLine(y); hLine(y + ROW_H);
        vLine(LEFT, y, y + ROW_H);
        vLine(RIGHT, y, y + ROW_H);
        vLine(VAL_X, y, y + ROW_H);
        txt(label, LEFT + 2,  y + 4, 6.5, 'Helvetica', '#333',  { width: LBL_W - 4 });
        txt(value, VAL_X + 3, y + 4, 8,   'Helvetica', 'black', { width: VAL_W - 6  });
        if (extraFn) extraFn();
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
      txt('SERVICIO NACIONAL DE APRENDIZAJE', MID_X, y + 12, 10,  'Helvetica-Bold', 'black', { width: MID_W, align: 'center' });
      txt('SISTEMA INTEGRADO DE GESTIÓN',     MID_X, y + 26,  8,  'Helvetica',      'black', { width: MID_W, align: 'center' });

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
      chk(LEFT + 16, y + 4, esComp, 8);
      txt('COMPLEMENTARIA', LEFT + 28, y + 4, 8.5, 'Helvetica-Bold', 'black', { width: W / 2 - 32 });
      chk(LEFT + W / 2 + 16, y + 4, !esComp, 8);
      txt('TITULADA', LEFT + W / 2 + 28, y + 4, 8.5, 'Helvetica-Bold', 'black', { width: W / 2 - 32 });

      y += TIPO_H;

      // =====================================================================
      // DATOS DEL PROGRAMA
      // =====================================================================
      row('Código programa*',     oferta.programa_formacion?.codigo);
      row('Nombre del Programa*', oferta.programa_formacion?.nombre_programa);
      row('Versión*',             oferta.programa_formacion?.version);
      row('Duración (Horas)*',    oferta.programa_formacion?.duracion_maxima?.toString());

      const fInicio = oferta.fechas?.inicio ? new Date(oferta.fechas.inicio).toLocaleDateString('es-CO') : '';
      const fFin    = oferta.fechas?.fin    ? new Date(oferta.fechas.fin).toLocaleDateString('es-CO')    : '';
      row('Fecha Inicio*', fInicio);
      row('Fecha Fin*',    fFin);
      row('Cupo*',         oferta.cupo_maximo?.toString());

      // ─── MODALIDAD ─────────────────────────────────────────────────────
      hLine(y); hLine(y + ROW_H);
      vLine(LEFT, y, y + ROW_H); vLine(RIGHT, y, y + ROW_H); vLine(VAL_X, y, y + ROW_H);
      txt('Modalidad*', LEFT + 2, y + 4, 6.5, 'Helvetica', '#333', { width: LBL_W - 4 });
      const modalidad = (oferta.modalidad?.nombre || '').toLowerCase();
      const modSlot   = VAL_W / 3;
      [['PRESENCIAL','presencial'],['VIRTUAL','virtual'],['COMBINADA','combinada']].forEach(([lbl, key], i) => {
        const mx = VAL_X + i * modSlot + 5;
        chk(mx, y + 5, modalidad.includes(key), 8);
        txt(lbl, mx + 12, y + 4, 7.5, 'Helvetica-Bold', 'black', { width: modSlot - 16 });
      });
      y += ROW_H;

      // ─── UBICACIÓN ─────────────────────────────────────────────────────
      row('Departamento*', oferta.ubicacion?.departamento);
      row('Municipio*',    oferta.ubicacion?.municipio?.nombre);
      row('Dirección*', oferta.ubicacion?.direccion || '');

      // =====================================================================
      // INSTRUCTOR (creado_por)
      // =====================================================================
      const instructorRaw = oferta.creado_por || {};
      const instructor = typeof instructorRaw === 'object' && !Array.isArray(instructorRaw)
        ? instructorRaw
        : {};

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

      // ─── CORREO DEL INSTRUCTOR ────────────────────────────────────────
      hLine(y); hLine(y + ROW_H);
      vLine(LEFT, y, y + ROW_H); vLine(RIGHT, y, y + ROW_H); vLine(VAL_X, y, y + ROW_H);
      txt('Correo*', LEFT + 2, y + 4, 6.5, 'Helvetica', '#333', { width: LBL_W - 4 });
      txt(instructor.correoElectronico || '', VAL_X + 3, y + 4, 8, 'Helvetica', 'black', { width: VAL_W - 6 });
      
      y += ROW_H;

      // ─── EMPRESA SOLICITANTE ─────────────────────────────────────────────
      hLine(y); hLine(y + ROW_H);
      vLine(LEFT, y, y + ROW_H); vLine(RIGHT, y, y + ROW_H); vLine(VAL_X, y, y + ROW_H);
      txt('Empresa solicitante*', LEFT + 2, y + 4, 6.5, 'Helvetica', '#333', { width: LBL_W - 4 });
      
      const empresaRaw = oferta.empresa_solicitante || {};
      const nombreEmpresa = typeof empresaRaw === 'object' && empresaRaw.nombre
        ? empresaRaw.nombre
        : '';
      
      txt(nombreEmpresa, VAL_X + 3, y + 4, 8, 'Helvetica', 'black', { width: VAL_W - 6 });
      
      y += ROW_H;

      // ─── SUBSECTOR ECONÓMICO ───────────────────────────────────────────
      row('Subsector económico*', oferta.subsector_economico?.nombre);

      // =====================================================================
      // PROGRAMA ESPECIAL
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

      const programaEspecialRaw = oferta.programa_especial;
      const programaSeleccionado = typeof programaEspecialRaw === 'object' && programaEspecialRaw !== null
        ? (programaEspecialRaw.nombre || '')
        : '';
      
      const programaSeleccionadoLower = programaSeleccionado.toLowerCase().trim();
      
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
        
        const progLower = prog.toLowerCase().trim();
        const isChecked = programaSeleccionadoLower.length > 0 && 
          (programaSeleccionadoLower === progLower || 
           progLower.includes(programaSeleccionadoLower) ||
           programaSeleccionadoLower.includes(progLower));
        
        chk(VAL_X + 5, py + (PE_H - 8) / 2, isChecked, 8);
        txt(prog, VAL_X + PE_CHK_W + 2, py + (PE_H - 7) / 2, 7, 'Helvetica', 'black',
          { width: VAL_W - PE_CHK_W - 4 });
      });

      y += PE_TOTAL_H;

      // ─── CONVENIO ──────────────────────────────────────────────────────
      row('Convenio', oferta.convenio?.nombre || '');
      
      // ─── AMBIENTE ──────────────────────────────────────────────────────
      row('Ambiente', oferta.ambiente?.nombre || '');

      // =====================================================================
      // OBTENER MODO (REGULAR O CAMPESENA)
      // =====================================================================
      const esCampesena = oferta.es_campesena || false;

      // =====================================================================
      // DÍAS DE LA SEMANA - SOLO PARA REGULAR
      // FIX: comparación directa con el nombre completo del día (insensible
      //      a mayúsculas/tildes) en lugar de comparar sólo los 3 primeros
      //      caracteres, lo que fallaba con 'Miércoles' y acentos.
      // =====================================================================
      if (!esCampesena) {
        hLine(y); hLine(y + ROW_H);
        vLine(LEFT, y, y + ROW_H); vLine(RIGHT, y, y + ROW_H); vLine(VAL_X, y, y + ROW_H);
        txt('Días semana*', LEFT + 2, y + 4, 6.5, 'Helvetica', '#333', { width: LBL_W - 4 });

        const diasLetras  = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
        const diasNombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

        // Normalizar los días de la oferta: quitar tildes y pasar a minúsculas
        // para que la comparación sea robusta sin importar cómo se guardaron.
        const normalizar = (str) =>
          (str || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

        const diasOfertaNorm = (oferta.horario?.dias || []).map(normalizar);
        const diasSlot = VAL_W / 7;

        diasLetras.forEach((letra, i) => {
          const dx = VAL_X + i * diasSlot;
          vLine(dx, y, y + ROW_H);

          // Comparación directa nombre completo normalizado
          const checked = diasOfertaNorm.includes(normalizar(diasNombres[i]));

          chk(dx + 4, y + 5, checked, 8);
          txt(letra, dx + 15, y + 4, 7.5, 'Helvetica-Bold', 'black', { width: diasSlot - 18 });
        });
        y += ROW_H;
      }

      // =====================================================================
      // CÁLCULO DE FECHAS POR MES (SEGÚN MODO)
      // =====================================================================
      const calcularFechasPorMes = (fechaInicio, fechaFin) => {
        if (!fechaInicio || !fechaFin) return { 
          mes1: '', mes2: '', mes3: '', mes4: '', mes5: '' 
        };
        
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        
        const diasPorMes = {};
        let currentDate = new Date(inicio);
        
        while (currentDate <= fin) {
          const mesKey = currentDate.getMonth() + 1;
          const añoKey = currentDate.getFullYear();
          const key = `${añoKey}-${mesKey}`;
          
          if (!diasPorMes[key]) {
            diasPorMes[key] = [];
          }
          diasPorMes[key].push(currentDate.getDate());
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        const meses = Object.keys(diasPorMes);
        
        const resultados = {
          mes1: meses[0] ? diasPorMes[meses[0]].join(', ') : '',
          mes2: meses[1] ? diasPorMes[meses[1]].join(', ') : '',
          mes3: meses[2] ? diasPorMes[meses[2]].join(', ') : '',
          mes4: meses[3] ? diasPorMes[meses[3]].join(', ') : '',
          mes5: meses[4] ? diasPorMes[meses[4]].join(', ') : ''
        };
        
        return resultados;
      };

      // Calcular fechas
      const { mes1, mes2, mes3, mes4, mes5 } = calcularFechasPorMes(
        oferta.fechas?.inicio, 
        oferta.fechas?.fin
      );

      // ─── HORARIO / FECHAS ─────────────────────────────────────────────
      const horaInicio = oferta.horario?.hora_inicio || '';
      const horaFin    = oferta.horario?.hora_fin    || '';
      
      if (!esCampesena) {
        row('Horario*', horaInicio && horaFin ? `${horaInicio} a ${horaFin}` : horaInicio || horaFin);
      }
      
      row('Fechas mes 1', mes1);
      
      if (esCampesena) {
        if (mes2) row('Fechas mes 2', mes2);
        if (mes3) row('Fechas mes 3', mes3);
        if (mes4) row('Fechas mes 4', mes4);
        if (mes5) row('Fechas mes 5', mes5);
      } else {
        if (mes2) row('Fechas mes 2', mes2);
      }
      
      // ─── CÓDIGOS ──────────────────────────────────────────────────────
      const codigoPrograma = oferta.programa_formacion?.codigo || '';
      row('Código solicitud', oferta.codigo_solicitud || '');
      row('Código ficha', codigoPrograma);

      const fInscripcion = oferta.createdAt
        ? new Date(oferta.createdAt).toLocaleDateString('es-CO') : '';
      row('Fecha inscripción', fInscripcion);

      hLine(y);

      // ─── OBSERVACIONES ─────────────────────────────────────────────────
      if (oferta.observaciones) {
        const OBS_H = ROW_H;
        hLine(y + OBS_H);
        vLine(LEFT, y, y + OBS_H); vLine(RIGHT, y, y + OBS_H); vLine(VAL_X, y, y + OBS_H);
        txt('Observaciones', LEFT + 2, y + 4, 6.5, 'Helvetica', '#333', { width: LBL_W - 4 });
        doc.save().fontSize(7).font('Helvetica').fillColor('black')
          .text(oferta.observaciones, VAL_X + 3, y + 4,
            { width: VAL_W - 6, lineBreak: false }).restore();
        y += OBS_H;
        hLine(y);
      }

      // =====================================================================
      // FIRMAS
      // =====================================================================
      y += 16;

      const sigMid = LEFT + W / 2;
      const lineY  = y + 20;

      const nombreInstructorCompleto = instructor.nombre && instructor.apellido 
        ? `${instructor.nombre} ${instructor.apellido}`
        : instructor.nombreUsuario || '';

      txt(`Instructor: ${nombreInstructorCompleto}`,
        LEFT + 10, y, 8, 'Helvetica', 'black', { width: W / 2 - 20 });

      doc.save().lineWidth(0.5)
        .moveTo(LEFT + 15, lineY).lineTo(sigMid - 15, lineY).stroke().restore();
      doc.save().lineWidth(0.5)
        .moveTo(sigMid + 15, lineY).lineTo(RIGHT - 15, lineY).stroke().restore();

      txt('Firma Instructor',
        LEFT, lineY + 4, 7.5, 'Helvetica', '#444', { width: W / 2, align: 'center' });
      txt('Vo.Bo. Coordinador Académico',
        sigMid, lineY + 4, 7.5, 'Helvetica', '#444', { width: W / 2, align: 'center' });

      txt(`GFO-F-027 v04  |  ${new Date().toLocaleString('es-CO')}`,
        LEFT, lineY + 18, 5.5, 'Helvetica', '#bbb', { width: W, align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generarFichaCaracterizacion };