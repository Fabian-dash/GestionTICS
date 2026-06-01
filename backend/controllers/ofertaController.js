const CreacionOferta = require('../models/CreacionOferta');
const Instructor = require('../models/Instructor');
const Inscripcion = require('../models/Inscripcion');
const SolicitudValidacion = require('../models/SolicitudValidacion');
const { generarFichaCaracterizacion } = require('../services/pdfGenerator');
const fs = require('fs');
const EstadoOferta = require('../models/EstadoOferta');
const { exportarExcelOferta } = require('../services/exportarExcelOferta');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// CREAR OFERTA
// ─────────────────────────────────────────────────────────────────────────────
const crearOferta = async (req, res) => {
  try {
    const usuario = req.usuario;

    console.log('🚀 INICIO - Crear oferta');
    console.log('Usuario autenticado:', { id: usuario._id, nombre: usuario.nombre });

    const modo = req.body.modo;
    console.log('📌 Modo recibido:', modo);

    const archivos = {};
    if (req.files) {
      if (req.files.firma_digital_pdf) archivos.firma_digital_pdf = req.files.firma_digital_pdf[0].path;
      if (req.files.carta_pdf)         archivos.carta_pdf         = req.files.carta_pdf[0].path;
    }

    const uniqueCode = Math.random().toString(36).substring(2, 15) +
                       Math.random().toString(36).substring(2, 15);
    const linkInscripciones = `/inscribirse/${uniqueCode}`;

    let horarioDias = [];
    if (req.body.horario_dias) {
      try   { horarioDias = JSON.parse(req.body.horario_dias); }
      catch { horarioDias = []; }
    }

    const estadoBorrador = await EstadoOferta.findOne({ codigo: 'borrador' });
    if (!estadoBorrador) throw new Error('No se encontró el estado "borrador". Ejecuta insertarEstados.js');

    const nuevaOferta = new CreacionOferta({
      programa_formacion:   req.body.programa_formacion,
      modalidad:            req.body.modalidad,
      tipo_programa:        req.body.tipo_programa,
      tipo_oferta:          req.body.tipo_oferta,
      cupo_maximo:          parseInt(req.body.cupo_maximo),
      ambiente:             { nombre: req.body.ambiente_nombre },
      fechas:               { inicio: req.body.fechas_inicio, fin: req.body.fechas_fin },
      ubicacion: {
        departamento: req.body.ubicacion_departamento,
        municipio:    req.body.ubicacion_municipio,
        direccion:    req.body.ubicacion_direccion,
      },
      empresa_solicitante:  req.body.empresa_solicitante,
      subsector_economico:  { nombre: req.body.subsector_nombre },
      programa_especial:    req.body.programa_especial || null,
      convenio:             { nombre: req.body.convenio_nombre },
      horario: {
        hora_inicio: req.body.horario_hora_inicio,
        hora_fin:    req.body.horario_hora_fin,
        dias:        horarioDias,
      },
      duracion_meses:       parseInt(req.body.duracion_meses) || 12,
      es_campesena:         modo === 'campesena',
      coordinador_asignado: usuario.coordinadorAsignado,
      creado_por:           usuario._id,
      link_inscripciones:   linkInscripciones,
      firma_digital_pdf:    archivos.firma_digital_pdf,
      carta_pdf:            archivos.carta_pdf,
      estado:               estadoBorrador._id,
    });

    const ofertaGuardada = await nuevaOferta.save();
    console.log('✅ Oferta guardada con ID:', ofertaGuardada._id);

    if (modo === 'campesena' && req.body.instructores) {
      const instructoresData = JSON.parse(req.body.instructores);
      await Promise.all(instructoresData.map(inst =>
        new Instructor({
          oferta_id:         ofertaGuardada._id,
          tipo:              inst.tipo,
          tipo_identificacion: inst.tipo_identificacion,
          identificacion:    inst.identificacion,
          nombre:            inst.nombre,
          correo:            inst.correo,
          celular:           inst.celular,
          programacion:      inst.programacion || [],
        }).save()
      ));
    }

    const ofertaPoblada = await CreacionOferta.findById(ofertaGuardada._id)
      .populate('programa_formacion')
      .populate('modalidad')
      .populate('tipo_programa')
      .populate('tipo_oferta')
      .populate('ubicacion.municipio')
      .populate('programa_especial')
      .populate('creado_por', 'nombre apellido nombreUsuario')
      .populate('empresa_solicitante', 'nombre nit')
      .populate('coordinador_asignado', 'nombre');

    try {
      const pdfBuffer = await generarFichaCaracterizacion(ofertaPoblada);
      const pdfDir = path.join(__dirname, '../uploads/fichas');
      if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
      fs.writeFileSync(path.join(pdfDir, `ficha-${ofertaGuardada._id}.pdf`), pdfBuffer);
    } catch (pdfError) {
      console.error('⚠️ Error generando PDF (no bloquea):', pdfError.message);
    }

    res.status(201).json({ success: true, message: 'Oferta creada correctamente', data: ofertaPoblada, archivos });

  } catch (error) {
    console.error('❌ Error al crear oferta:', error.message);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Error de validación', errors: Object.values(error.errors).map(e => e.message) });
    }
    res.status(500).json({ success: false, message: 'Error al crear la oferta', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// OBTENER TODAS LAS OFERTAS
// ─────────────────────────────────────────────────────────────────────────────
const obtenerOfertas = async (req, res) => {
  try {
    const ofertas = await CreacionOferta.find()
      .populate('programa_formacion')
      .populate('modalidad')
      .populate('tipo_programa')
      .populate('tipo_oferta')
      .populate('ubicacion.municipio')
      .populate('programa_especial')
      .populate('estado')
      .populate({ path: 'creado_por', select: 'nombre apellido nombreUsuario numeroIdentificacion correoElectronico' })
      .populate({ path: 'empresa_solicitante', select: 'nombre nit' })
      .populate('coordinador_asignado', 'nombre')
      .select('+carta_pdf +firma_digital_pdf')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: ofertas.length, data: ofertas });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener las ofertas', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// OBTENER OFERTA POR ID
// ─────────────────────────────────────────────────────────────────────────────
const obtenerOfertaPorId = async (req, res) => {
  try {
    const oferta = await CreacionOferta.findById(req.params.id)
      .populate('programa_formacion')
      .populate('modalidad')
      .populate('tipo_programa')
      .populate('tipo_oferta')
      .populate('ubicacion.municipio')
      .populate('programa_especial')
      .populate('estado')
      .populate({ path: 'creado_por', select: 'nombre apellido nombreUsuario numeroIdentificacion correoElectronico' })
      .populate({ path: 'empresa_solicitante', select: 'nombre nit' })
      .populate('coordinador_asignado', 'nombre');

    if (!oferta) return res.status(404).json({ success: false, message: 'Oferta no encontrada' });

    const inscritos_count = await Inscripcion.countDocuments({ oferta_id: oferta._id });
    const ofertaObj = oferta.toObject();
    ofertaObj.inscritos_count = inscritos_count;

    res.json({ success: true, data: ofertaObj });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener la oferta', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MIS OFERTAS (del instructor autenticado)
// ─────────────────────────────────────────────────────────────────────────────
const obtenerMisOfertas = async (req, res) => {
  try {
    const usuario = req.usuario;

    const ofertas = await CreacionOferta.find({ creado_por: usuario._id })
      .populate('programa_formacion')
      .populate('modalidad')
      .populate('tipo_programa')
      .populate('tipo_oferta')
      .populate('ubicacion.municipio')
      .populate('programa_especial')
      .populate('estado')
      .populate({ path: 'empresa_solicitante', select: 'nombre nit' })
      .populate('coordinador_asignado', 'nombre')
      .select('+carta_pdf +firma_digital_pdf')
      .sort({ createdAt: -1 });

    const ofertasConInscritos = await Promise.all(
      ofertas.map(async (oferta) => {
        const inscritos = await Inscripcion.countDocuments({ oferta_id: oferta._id });
        const obj = oferta.toObject();
        obj.inscritos_count = inscritos;
        return obj;
      })
    );

    res.json({ success: true, count: ofertasConInscritos.length, data: ofertasConInscritos });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener tus ofertas', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// OBTENER OFERTAS POR COORDINADOR
// ─────────────────────────────────────────────────────────────────────────────
const obtenerOfertasPorCoordinador = async (req, res) => {
  try {
    const ofertas = await CreacionOferta.find({ coordinador_asignado: req.params.coordinadorId })
      .populate('programa_formacion')
      .populate('modalidad')
      .populate('tipo_programa')
      .populate('tipo_oferta')
      .populate('ubicacion.municipio')
      .populate('programa_especial')
      .populate('estado')
      .populate({ path: 'creado_por', select: 'nombre apellido nombreUsuario' })
      .populate({ path: 'empresa_solicitante', select: 'nombre nit' })
      .select('+carta_pdf +firma_digital_pdf')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: ofertas.length, data: ofertas });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener ofertas del coordinador', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BUSCAR OFERTA POR LINK
// ─────────────────────────────────────────────────────────────────────────────
const getOfertaPorLink = async (req, res) => {
  try {
    const linkCompleto = `/inscribirse/${req.params.codigo}`;
    const oferta = await CreacionOferta.findOne({ link_inscripciones: linkCompleto })
      .populate('programa_formacion')
      .populate('modalidad')
      .populate('ubicacion.municipio');

    if (!oferta) return res.status(404).json({ success: false, message: 'Link de inscripción no válido' });

    res.json({ success: true, data: oferta });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// OFERTAS APROBADAS POR TIPO (para funcionario)
// ─────────────────────────────────────────────────────────────────────────────
const getOfertasAprobadasPorTipo = async (req, res) => {
  try {
    const { tipo } = req.params;
    const funcionario = req.usuario;

    const estadosVisibles = await EstadoOferta.find({
      codigo: { $in: ['lista_espera', 'en_proceso', 'a_corregir', 'creada', 'matriculada', 'completado'] }
    });

    if (!estadosVisibles.length) {
      return res.status(404).json({ success: false, message: 'No se encontraron estados válidos' });
    }

    const estadosIds = estadosVisibles.map(e => e._id);

    const ofertas = await CreacionOferta.find({
      estado:       { $in: estadosIds },
      es_campesena: tipo === 'campesena',
    })
      .populate('programa_formacion')
      .populate('modalidad')
      .populate('tipo_oferta')
      .populate('ubicacion.municipio')
      .populate('programa_especial')
      .populate('estado')
      // ✅ FIX: se agregan correoElectronico, telefono y numeroIdentificacion
      // para que el modal de detalle pueda mostrar todos los datos del instructor.
      // Antes solo llegaban 'nombre' y 'apellido', dejando esos campos en '—'.
      .populate({ path: 'creado_por', select: 'nombre apellido correoElectronico telefono numeroIdentificacion' })
      .populate({ path: 'empresa_solicitante', select: 'nombre nit' })
      .populate('coordinador_asignado', 'nombre')
      .populate('funcionario_asignado', 'nombre nombreUsuario')
      .select('+carta_pdf +firma_digital_pdf')
      .sort({ createdAt: -1 });

    const ofertasConFlags = ofertas.map(oferta => {
      const obj = oferta.toObject();
      obj.tieneFicha   = !!oferta.ficha_sofia;
      obj.tomadaPorMi  = oferta.funcionario_asignado?._id?.toString() === funcionario._id.toString();
      obj.tomadaPorOtro = !!oferta.funcionario_asignado && !obj.tomadaPorMi;
      return obj;
    });

    res.json({ success: true, count: ofertasConFlags.length, data: ofertasConFlags });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRAR FICHA SOFIA
// ─────────────────────────────────────────────────────────────────────────────
const registrarFichaSofia = async (req, res) => {
  try {
    const { ofertaId } = req.params;
    const { codigo_ficha, fecha_creacion, observaciones } = req.body;
    const funcionario = req.usuario;

    if (!codigo_ficha) return res.status(400).json({ success: false, message: 'El código de ficha es obligatorio' });

    const oferta = await CreacionOferta.findById(ofertaId).populate('estado');
    if (!oferta) return res.status(404).json({ success: false, message: 'Oferta no encontrada' });

    oferta.ficha_sofia = {
      codigo:         codigo_ficha,
      creada_por:     funcionario._id,
      fecha_creacion: fecha_creacion || new Date(),
      observaciones:  observaciones || '',
    };

    await oferta.save();

    res.json({ success: true, message: 'Ficha registrada exitosamente', data: { codigo_ficha } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// HISTORIAL DE FICHAS
// ─────────────────────────────────────────────────────────────────────────────
const getHistorialFichas = async (req, res) => {
  try {
    const funcionario = req.usuario;
    const ofertas = await CreacionOferta.find({ 'ficha_sofia.creada_por': funcionario._id })
      .populate('programa_formacion', 'nombre_programa codigo')
      .populate('creado_por', 'nombre apellido')
      .select('ficha_sofia programa_formacion fechas creado_por')
      .sort({ 'ficha_sofia.fecha_creacion': -1 });

    const historial = ofertas.map(o => ({
      oferta_id:       o._id,
      programa:        o.programa_formacion?.nombre_programa,
      codigo_programa: o.programa_formacion?.codigo,
      codigo_ficha:    o.ficha_sofia?.codigo,
      fecha_creacion:  o.ficha_sofia?.fecha_creacion,
      instructor:      o.creado_por ? `${o.creado_por.nombre} ${o.creado_por.apellido}` : 'N/A',
      observaciones:   o.ficha_sofia?.observaciones,
    }));

    res.json({ success: true, count: historial.length, data: historial });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DESCARGAR PDF
// ─────────────────────────────────────────────────────────────────────────────
const descargarPDF = async (req, res) => {
  try {
    const oferta = await CreacionOferta.findById(req.params.id)
      .populate('programa_formacion')
      .populate('modalidad')
      .populate('tipo_programa')
      .populate('tipo_oferta')
      .populate('ubicacion.municipio')
      .populate('programa_especial')
      .populate({ path: 'creado_por', select: 'nombre apellido nombreUsuario numeroIdentificacion correoElectronico' })
      .populate({ path: 'empresa_solicitante', select: 'nombre nit' })
      .populate('coordinador_asignado', 'nombre');

    if (!oferta) return res.status(404).json({ success: false, message: 'Oferta no encontrada' });

    const pdfBuffer = await generarFichaCaracterizacion(oferta);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ficha-${oferta._id}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al generar el PDF', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTAR EXCEL
// ─────────────────────────────────────────────────────────────────────────────
const exportarExcelOfertaCompleta = async (req, res) => {
  try {
    const oferta = await CreacionOferta.findById(req.params.id)
      .populate('programa_formacion')
      .populate('tipo_oferta')
      .populate('programa_especial')
      .populate('empresa_solicitante')
      .populate('ubicacion.municipio')
      .populate('creado_por')
      .populate('coordinador_asignado');

    if (!oferta) return res.status(404).json({ message: 'Oferta no encontrada' });

    let instructores = [];
    if (oferta.es_campesena) instructores = await Instructor.find({ oferta_id: oferta._id });

    await exportarExcelOferta(oferta, instructores, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ACTUALIZAR OFERTA
// ─────────────────────────────────────────────────────────────────────────────
const actualizarOferta = async (req, res) => {
  try {
    const ofertaActual = await CreacionOferta.findById(req.params.id);
    if (!ofertaActual) {
      return res.status(404).json({ success: false, message: 'Oferta no encontrada' });
    }

    const update = { ...req.body };

    if (req.files?.carta_pdf?.[0]) {
      const nuevaCarta = req.files.carta_pdf[0].path;
      if (ofertaActual.carta_pdf && fs.existsSync(ofertaActual.carta_pdf)) {
        try { fs.unlinkSync(ofertaActual.carta_pdf); } catch (e) {
          console.warn('⚠️ No se pudo borrar la carta anterior:', e.message);
        }
      }
      update.carta_pdf = nuevaCarta;
    }

    const ofertaActualizada = await CreacionOferta.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    )
      .populate('programa_formacion')
      .populate('modalidad')
      .populate('tipo_programa')
      .populate('tipo_oferta')
      .populate('ubicacion.municipio')
      .populate('programa_especial')
      .populate({ path: 'creado_por',         select: 'nombre apellido nombreUsuario' })
      .populate({ path: 'empresa_solicitante', select: 'nombre nit' })
      .populate('coordinador_asignado', 'nombre');

    res.json({ success: true, message: 'Oferta actualizada correctamente', data: ofertaActualizada });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error al actualizar la oferta', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ELIMINAR OFERTA
// ─────────────────────────────────────────────────────────────────────────────
const eliminarOferta = async (req, res) => {
  try {
    const oferta = await CreacionOferta.findByIdAndDelete(req.params.id);
    if (!oferta) return res.status(404).json({ success: false, message: 'Oferta no encontrada' });

    await Instructor.deleteMany({ oferta_id: req.params.id });
    await Inscripcion.deleteMany({ oferta_id: req.params.id });
    await SolicitudValidacion.deleteMany({ oferta_id: req.params.id });

    const pdfPath = path.join(__dirname, '../uploads/fichas', `ficha-${req.params.id}.pdf`);
    if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
    if (oferta.carta_pdf && fs.existsSync(oferta.carta_pdf)) fs.unlinkSync(oferta.carta_pdf);

    res.json({ success: true, message: 'Oferta eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar la oferta', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// REENVIAR OFERTA (instructor corrige y reenvía)
//
// a_corregir  → en_proceso         (vuelve al funcionario ✅)
// borrador    → pendiente_coordinador
// rechazada   → pendiente_coordinador
// ─────────────────────────────────────────────────────────────────────────────
const reenviarOferta = async (req, res) => {
  try {
    const { id } = req.params;
    const { comentario } = req.body || {};
    const usuario = req.usuario;

    const oferta = await CreacionOferta.findById(id).populate('estado');
    if (!oferta) return res.status(404).json({ success: false, message: 'Oferta no encontrada' });

    if (oferta.creado_por.toString() !== usuario._id.toString()) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para reenviar esta oferta' });
    }

    const estadoActual = oferta.estado?.codigo;
    let nuevoEstadoCodigo;

    if (estadoActual === 'a_corregir') {
      nuevoEstadoCodigo = 'en_proceso';              // ✅ vuelve al funcionario
    } else if (estadoActual === 'borrador' || estadoActual === 'rechazada') {
      nuevoEstadoCodigo = 'pendiente';  // va al coordinador
    } else {
      return res.status(400).json({
        success: false,
        message: `No se puede reenviar una oferta en estado "${estadoActual}"`,
      });
    }

    const nuevoEstado = await EstadoOferta.findOne({ codigo: nuevoEstadoCodigo });
    if (!nuevoEstado) {
      return res.status(500).json({ success: false, message: `Estado "${nuevoEstadoCodigo}" no encontrado en BD` });
    }

    oferta.estado = nuevoEstado._id;

    // Limpiar novedades cuando el instructor corrige
    if (estadoActual === 'a_corregir') {
      oferta.novedades_aprendices = [];
      oferta.motivo_correccion    = null;
    }

    if (!oferta.historial_estados) oferta.historial_estados = [];
    oferta.historial_estados.push({
      estado:              nuevoEstado._id,
      comentario:          comentario?.trim() || 'Oferta corregida y reenviada',
      cambiado_por:        usuario._id,
      cambiado_por_modelo: 'User',
      fecha:               new Date(),
    });

    await oferta.save();

    res.json({
      success: true,
      message: 'Oferta reenviada correctamente',
      data: { oferta_id: oferta._id, nuevo_estado: nuevoEstadoCodigo },
    });
  } catch (error) {
    console.error('Error al reenviar oferta:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  crearOferta,
  obtenerOfertas,
  obtenerOfertaPorId,
  obtenerMisOfertas,
  obtenerOfertasPorCoordinador,
  actualizarOferta,
  eliminarOferta,
  getOfertaPorLink,
  descargarPDF,
  getOfertasAprobadasPorTipo,
  registrarFichaSofia,
  getHistorialFichas,
  exportarExcelOfertaCompleta,
  reenviarOferta,
};