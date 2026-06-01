const Inscripcion = require('../models/Inscripcion');
const CreacionOferta = require('../models/CreacionOferta');
const { generarExcelInscripcion, generarExcelCedulas } = require('../services/excelGenerator');
const fs = require('fs');
const path = require('path');
const { fusionarPDFs } = require('../services/pdfMerger');
const ExcelJS = require('exceljs');

// ── Helper: garantiza ruta absoluta ─────────────────────────────────────────
const toAbsolute = (ruta) => {
  if (!ruta) return null;
  if (path.isAbsolute(ruta)) return path.normalize(ruta);
  return path.resolve(process.cwd(), ruta);
};

// ── Crear inscripción ────────────────────────────────────────────────────────
const crearInscripcion = async (req, res) => {
  try {
    const { codigo } = req.params;

    const oferta = await CreacionOferta.findOne({ link_inscripciones: `/inscribirse/${codigo}` })
      .populate('programa_formacion')
      .populate('tipo_oferta')
      .populate('empresa_solicitante');

    if (!oferta) {
      return res.status(404).json({ success: false, message: 'Link de inscripción no válido' });
    }

    if (oferta.cupos_disponibles <= 0) {
      return res.status(400).json({ success: false, message: 'No hay cupos disponibles para esta oferta' });
    }

    // Procesar PDF subido
    let pdfPath = null;
    if (req.file) {
      try {
        const rutaAbsoluta = toAbsolute(req.file.path);
        const pdfBytes     = fs.readFileSync(rutaAbsoluta);
        const header       = pdfBytes.slice(0, 4).toString('ascii');

        if (header !== '%PDF') {
          console.error(`❌ Archivo no es PDF. Header: "${header}"`);
          fs.unlinkSync(rutaAbsoluta);
          return res.status(400).json({ success: false, message: 'El archivo no es un PDF válido' });
        }

        pdfPath = rutaAbsoluta; // siempre absoluta
        console.log(`✅ PDF guardado: ${pdfPath} (${pdfBytes.length} bytes)`);

      } catch (err) {
        console.error(`❌ Error validando PDF: ${err.message}`);
        return res.status(400).json({ success: false, message: 'Error al procesar el archivo PDF' });
      }
    }

    // Guardar inscripción — pdf_cedula siempre queda como ruta absoluta
    const nuevaInscripcion = new Inscripcion({
      oferta_id:        oferta._id,
      nombres:          req.body.nombres,
      apellidos:        req.body.apellidos,
      tipo_documento:   req.body.tipo_documento,
      numero_documento: req.body.numero_documento,
      caracterizacion:  req.body.caracterizacion,
      telefono:         req.body.telefono,
      correo:           req.body.correo,
      pdf_cedula:       pdfPath,
    });

    await nuevaInscripcion.save();
    console.log(`✅ Inscripción guardada. ID: ${nuevaInscripcion._id}`);

    // Descontar cupo
    oferta.cupos_disponibles -= 1;
    await oferta.save();

    res.status(201).json({
      success: true,
      message: 'Inscripción creada exitosamente',
      data: nuevaInscripcion,
    });

  } catch (error) {
    console.error('Error en crearInscripcion:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una inscripción con este número de documento',
      });
    }

    res.status(500).json({ success: false, message: 'Error al crear la inscripción', error: error.message });
  }
};

// ── Obtener inscritos por oferta ─────────────────────────────────────────────
const getInscritosPorOferta = async (req, res) => {
  try {
    const { ofertaId } = req.params;
    const inscritos = await Inscripcion.find({ oferta_id: ofertaId })
      .populate('tipo_documento')
      .populate('caracterizacion');
    res.json({ success: true, data: inscritos });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ── Fusionar PDFs manualmente ────────────────────────────────────────────────
const fusionarPDFsManual = async (req, res) => {
  try {
    console.log('\n🔍 ===== FUSIONAR PDFs MANUAL =====');
    const { ofertaId } = req.params;

    if (!ofertaId) {
      return res.status(400).json({ success: false, message: 'Se requiere el ID de la oferta' });
    }

    const inscripciones = await Inscripcion.find({ oferta_id: ofertaId });
    console.log(`Inscripciones encontradas: ${inscripciones.length}`);

    const pdfs = inscripciones
      .filter(ins => ins.pdf_cedula)
      .map(ins => ({
        path:          toAbsolute(ins.pdf_cedula), // cubre registros viejos con ruta relativa
        inscripcionId: ins._id,
        documento:     ins.numero_documento,
      }));

    console.log(`PDFs a procesar: ${pdfs.length}`);
    pdfs.slice(0, 3).forEach(p => console.log(' -', p.path));

    if (pdfs.length === 0) {
      return res.status(400).json({ success: false, message: 'No hay PDFs para fusionar' });
    }

    const resultado = await fusionarPDFs(pdfs, ofertaId);

    // ── Borrar individuales SOLO si la fusión fue 100% exitosa ───────────
    if (resultado.fallidos.length === 0) {
      for (const pdf of pdfs) {
        try {
          if (fs.existsSync(pdf.path)) {
            fs.unlinkSync(pdf.path);
            console.log(`🗑️  Eliminado: ${pdf.path}`);
          }
        } catch (e) {
          console.warn(`⚠️  No se pudo eliminar ${pdf.path}: ${e.message}`);
        }
      }
    } else {
      console.log(`⚠️  Hubo ${resultado.fallidos.length} fallo(s) — PDFs individuales NO eliminados`);
    }

    res.json({
      success: true,
      message: resultado.fallidos.length
        ? `PDFs fusionados con ${resultado.fallidos.length} archivo(s) omitido(s)`
        : 'PDFs fusionados exitosamente',
      data: resultado,
    });

  } catch (error) {
    console.error('❌ Error en fusionarPDFsManual:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Obtener inscripciones por oferta ─────────────────────────────────────────
const getInscripcionesPorOferta = async (req, res) => {
  try {
    const { ofertaId } = req.params;
    const inscripciones = await Inscripcion.find({ oferta_id: ofertaId })
      .populate('tipo_documento', 'nombre')
      .populate('caracterizacion', 'tipo_caracterizacion')
      .sort({ fecha_inscripcion: -1 });
    res.json({ success: true, count: inscripciones.length, data: inscripciones });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener inscripciones', error: error.message });
  }
};

// ── Obtener inscripción por link ──────────────────────────────────────────────
const getInscripcionPorLink = async (req, res) => {
  try {
    const { link } = req.params;
    const inscripcion = await Inscripcion.findOne({ link_inscripcion: `/inscripcion/${link}` })
      .populate('tipo_documento', 'nombre')
      .populate('caracterizacion', 'tipo_caracterizacion')
      .populate('oferta_id');
    if (!inscripcion) {
      return res.status(404).json({ success: false, message: 'Inscripción no encontrada' });
    }
    res.json({ success: true, data: inscripcion });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener la inscripción', error: error.message });
  }
};

// ── Actualizar estado ─────────────────────────────────────────────────────────
const actualizarEstado = async (req, res) => {
  try {
    const { id }     = req.params;
    const { estado } = req.body;
    const inscripcion = await Inscripcion.findByIdAndUpdate(id, { estado }, { new: true, runValidators: true });
    if (!inscripcion) {
      return res.status(404).json({ success: false, message: 'Inscripción no encontrada' });
    }
    res.json({ success: true, message: 'Estado actualizado correctamente', data: inscripcion });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar estado', error: error.message });
  }
};

// ── Exportar Excel completo ───────────────────────────────────────────────────
const exportarExcelCompleto = async (req, res) => {
  try {
    const { ofertaId } = req.params;
    console.log('📥 Exportando Excel completo para oferta:', ofertaId);

    const inscritos = await Inscripcion.find({ oferta_id: ofertaId })
      .populate('tipo_documento')
      .populate('caracterizacion');

    const workbook  = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inscritos');

    worksheet.columns = [
      { header: 'Tipo Documento',      key: 'tipo_documento',   width: 20 },
      { header: 'Número de Documento', key: 'numero_documento', width: 20 },
      { header: 'Nombres',             key: 'nombres',          width: 25 },
      { header: 'Apellidos',           key: 'apellidos',        width: 25 },
      { header: 'Teléfono',            key: 'telefono',         width: 15 },
      { header: 'Email',               key: 'correo',           width: 30 },
      { header: 'Caracterización',     key: 'caracterizacion',  width: 25 },
    ];
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00643C' } };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    inscritos.forEach(ins => worksheet.addRow({
      tipo_documento:   ins.tipo_documento?.nombre || '',
      numero_documento: ins.numero_documento || '',
      nombres:          ins.nombres || '',
      apellidos:        ins.apellidos || '',
      telefono:         ins.telefono || '',
      correo:           ins.correo || '',
      caracterizacion:  ins.caracterizacion?.tipo_caracterizacion || '',
    }));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=inscritos_${ofertaId}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('❌ Error exportando Excel:', error);
    res.status(500).json({ message: error.message });
  }
};

// ── Exportar Excel de cédulas ─────────────────────────────────────────────────
const exportarExcelCedulas = async (req, res) => {
  try {
    const { ofertaId } = req.params;
    const oferta = await CreacionOferta.findById(ofertaId).populate('programa_formacion');
    if (!oferta) return res.status(404).json({ message: 'Oferta no encontrada' });

    const inscritos = await Inscripcion.find({ oferta_id: ofertaId })
      .populate('tipo_documento')
      .populate('caracterizacion');

    const workbook  = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Cédulas');

    worksheet.columns = [
      { header: 'Resultado del Registro (Reservado para el sistema)', key: 'resultado',       width: 40 },
      { header: 'Tipo de Identificación',                             key: 'tipo_documento',  width: 25 },
      { header: 'Numero de Identificación',                           key: 'numero_documento',width: 25 },
      { header: 'Código de la ficha',                                 key: 'codigo_ficha',    width: 20 },
      { header: 'Tipo Población Aspirante',                           key: 'tipo_poblacion',  width: 25 },
      { header: 'Codigo Empresa (Solo si la ficha es cerrada)',       key: 'codigo_empresa',  width: 30 },
    ];
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00643C' } };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    inscritos.forEach(ins => worksheet.addRow({
      resultado:        '',
      tipo_documento:   ins.tipo_documento?.nombre || '',
      numero_documento: ins.numero_documento || '',
      codigo_ficha:     oferta?.programa_formacion?.codigo || '',
      tipo_poblacion:   ins.caracterizacion?.tipo_caracterizacion || '',
      codigo_empresa:   '',
    }));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=cedulas_${oferta.programa_formacion?.codigo || 'formato'}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error exportando Excel de cédulas:', error);
    res.status(500).json({ message: error.message });
  }
};

// ── Exportaciones ─────────────────────────────────────────────────────────────
module.exports = {
  inscribir: crearInscripcion,
  getInscritosPorOferta,
  exportarExcelCompleto,
  exportarExcelCedulas,
  fusionarPDFs: fusionarPDFsManual,
};