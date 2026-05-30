const Funcionario    = require('../models/Funcionario');
const TipoPrograma   = require('../models/TipoPrograma');
const CreacionOferta = require('../models/CreacionOferta');
const EstadoOferta   = require('../models/EstadoOferta');
const { generarFichaCaracterizacion } = require('../services/pdfGenerator');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const fs     = require('fs');
const path   = require('path');

// ─── helpers ─────────────────────────────────────────────────────────────────
const getEstado = async (codigo) => {
  const estado = await EstadoOferta.findOne({ codigo });
  if (!estado) throw new Error(`Estado "${codigo}" no encontrado. Ejecuta insertarEstados.js`);
  return estado;
};

const verificarAsignacion = (oferta, funcionarioId) => {
  if (oferta.funcionario_asignado?.toString() !== funcionarioId.toString()) {
    throw { status: 403, message: 'No eres el funcionario asignado a esta oferta' };
  }
};

const pushHistorial = (oferta, estadoId, comentario, funcionarioId) => {
  if (!oferta.historial_estados) oferta.historial_estados = [];
  oferta.historial_estados.push({
    estado:              estadoId,
    comentario,
    cambiado_por:        funcionarioId,
    cambiado_por_modelo: 'Funcionario',
    fecha:               new Date(),
  });
};

// populate completo del instructor — reutilizable
const POPULATE_INSTRUCTOR = 'nombre apellido correoElectronico telefono numeroIdentificacion nombreUsuario';

// =============================================================================
// REGISTRO Y CONSULTAS
// =============================================================================

const registrarFuncionario = async (req, res) => {
  try {
    const { nombre, numeroIdentificacion, correoElectronico, telefono, password, nombreUsuario, modalidades } = req.body;

    const existe = await Funcionario.findOne({
      $or: [{ correoElectronico }, { nombreUsuario }, { numeroIdentificacion }]
    });
    if (existe) return res.status(400).json({ success: false, message: 'El funcionario ya existe con esos datos' });

    const modalidadesValidas = await TipoPrograma.find({ _id: { $in: modalidades } });
    if (modalidadesValidas.length !== modalidades.length)
      return res.status(400).json({ success: false, message: 'Una o más modalidades no son válidas' });

    const salt = await bcrypt.genSalt(10);
    const passwordEncriptada = await bcrypt.hash(password, salt);

    const funcionario = new Funcionario({ nombre, numeroIdentificacion, correoElectronico, telefono, password: passwordEncriptada, nombreUsuario, modalidades });
    await funcionario.save();

    const token = jwt.sign({ id: funcionario._id, tipo: 'funcionario' }, process.env.JWT_SECRET, { expiresIn: '30d' });
    await funcionario.populate({ path: 'creado_por', select: 'nombre apellido correoElectronico telefono numeroIdentificacion nombreUsuario' })

    res.status(201).json({
      success: true,
      message: 'Funcionario registrado exitosamente',
      token,
      user: { id: funcionario._id, nombre: funcionario.nombre, nombreUsuario: funcionario.nombreUsuario, tipo: 'funcionario', modalidades: funcionario.modalidades.map(m => m.nombre) }
    });
  } catch (error) {
    console.error('Error registrando funcionario:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getFuncionarios = async (req, res) => {
  try {
    const funcionarios = await Funcionario.find({ activo: true })
      .select('-password')
      .populate('modalidades', 'nombre')
      .sort({ nombre: 1 });
    res.json({ success: true, data: funcionarios });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getFuncionariosPorModalidad = async (req, res) => {
  try {
    const funcionarios = await Funcionario.find({ modalidades: req.params.modalidadId, activo: true })
      .select('-password')
      .populate('modalidades', 'nombre');
    res.json({ success: true, data: funcionarios });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getFuncionariosParaOferta = async (req, res) => {
  try {
    const oferta = await CreacionOferta.findById(req.params.ofertaId).populate('tipo_programa');
    if (!oferta) return res.status(404).json({ message: 'Oferta no encontrada' });
    const funcionarios = await Funcionario.find({ modalidades: oferta.tipo_programa._id, activo: true })
      .select('-password')
      .populate('modalidades', 'nombre');
    res.json({ success: true, data: funcionarios });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================================================================
// FLUJO DE ESTADOS
// =============================================================================

// -----------------------------------------------------------------------------
// 1. REVISAR: lista_espera → en_proceso
// -----------------------------------------------------------------------------
const revisarOferta = async (req, res) => {
  try {
    const { ofertaId } = req.params;
    const funcionario  = req.usuario;

    const oferta = await CreacionOferta.findById(ofertaId).populate('estado');
    if (!oferta) return res.status(404).json({ success: false, message: 'Oferta no encontrada' });

    if (oferta.estado?.codigo !== 'lista_espera') {
      return res.status(400).json({ success: false, message: 'Solo puedes revisar ofertas en lista de espera' });
    }
    if (oferta.funcionario_asignado) {
      return res.status(409).json({ success: false, message: 'Esta oferta ya fue tomada por otro funcionario' });
    }

    const estadoEnProceso = await getEstado('en_proceso');

    oferta.funcionario_asignado = funcionario._id;
    oferta.estado               = estadoEnProceso._id;
    pushHistorial(oferta, estadoEnProceso._id, `Oferta tomada para revisión por: ${funcionario.nombre}`, funcionario._id);

    await oferta.save();

    res.json({
      success: true,
      message: 'Oferta en proceso de revisión',
      data: { oferta_id: oferta._id, estado: 'en_proceso', funcionario: funcionario.nombre }
    });
  } catch (error) {
    console.error('Error revisando oferta:', error);
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// -----------------------------------------------------------------------------
// 2. SOLICITAR CORRECCIÓN: en_proceso → a_corregir
// -----------------------------------------------------------------------------
const solicitarCorreccion = async (req, res) => {
  try {
    const { ofertaId } = req.params;
    const { motivo, aprendices_con_novedad } = req.body;
    const funcionario  = req.usuario;

    if (!motivo?.trim()) {
      return res.status(400).json({ success: false, message: 'Debes indicar el motivo de la corrección' });
    }

    const oferta = await CreacionOferta.findById(ofertaId).populate('estado');
    if (!oferta) return res.status(404).json({ success: false, message: 'Oferta no encontrada' });

    verificarAsignacion(oferta, funcionario._id);

    if (oferta.estado?.codigo !== 'en_proceso') {
      return res.status(400).json({ success: false, message: 'Solo puedes solicitar corrección en ofertas "en proceso"' });
    }

    const estadoACorregir = await getEstado('a_corregir');

    oferta.estado             = estadoACorregir._id;
    oferta.motivo_correccion  = motivo.trim();
    oferta.novedades_aprendices = (Array.isArray(aprendices_con_novedad) && aprendices_con_novedad.length > 0)
      ? aprendices_con_novedad.map(a => ({
          aprendiz_id:  a.aprendiz_id,
          nombre:       a.nombre || '',
          observacion:  a.observacion || 'Datos incorrectos o incompletos',
          fecha:        new Date(),
        }))
      : [];

    pushHistorial(
      oferta, estadoACorregir._id,
      `Corrección solicitada: ${motivo}. ${oferta.novedades_aprendices.length} aprendiz(es) con novedad.`,
      funcionario._id
    );

    await oferta.save();

    res.json({
      success: true,
      message: 'Solicitud de corrección enviada al instructor',
      data: { oferta_id: oferta._id, estado: 'a_corregir', motivo, novedades_count: oferta.novedades_aprendices.length }
    });
  } catch (error) {
    console.error('Error solicitando corrección:', error);
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// -----------------------------------------------------------------------------
// 3. OBTENER NOVEDADES POR APRENDIZ (para el instructor)
// -----------------------------------------------------------------------------
const getNovedadesAprendices = async (req, res) => {
  try {
    const oferta = await CreacionOferta.findById(req.params.ofertaId);
    if (!oferta) return res.status(404).json({ success: false, message: 'Oferta no encontrada' });

    const novedadesMap = {};
    (oferta.novedades_aprendices || []).forEach(n => {
      novedadesMap[n.aprendiz_id?.toString()] = n.observacion || 'Datos incorrectos o incompletos';
    });

    res.json({ success: true, data: novedadesMap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -----------------------------------------------------------------------------
// 4. APROBAR/CREAR: en_proceso → creada
// -----------------------------------------------------------------------------
const aprobarOferta = async (req, res) => {
  try {
    const { ofertaId } = req.params;
    const funcionario  = req.usuario;

    // ✅ FIX: populate completo del instructor con todos los campos
    const oferta = await CreacionOferta.findById(ofertaId)
      .populate('estado')
      .populate('programa_formacion')
      .populate('modalidad')
      .populate('tipo_programa')
      .populate('tipo_oferta')
      .populate('ubicacion.municipio')
      .populate('programa_especial')
      .populate('creado_por', POPULATE_INSTRUCTOR)   // ← todos los campos del instructor
      .populate('empresa_solicitante', 'nombre nit')
      .populate('coordinador_asignado', 'nombre');

    if (!oferta) return res.status(404).json({ success: false, message: 'Oferta no encontrada' });

    verificarAsignacion(oferta, funcionario._id);

    if (oferta.estado?.codigo !== 'en_proceso') {
      return res.status(400).json({ success: false, message: 'Solo puedes aprobar ofertas "en proceso"' });
    }

    const estadoCreada = await getEstado('creada');

    if (!oferta.numero_ficha) {
      const codigo = oferta.programa_formacion?.codigo || 'XXX';
      oferta.numero_ficha = `${codigo}-${Date.now().toString().slice(-6)}`;
    }

    oferta.estado                      = estadoCreada._id;
    oferta.fecha_aprobacion_funcionario = new Date();
    pushHistorial(oferta, estadoCreada._id, `Oferta aprobada por funcionario: ${funcionario.nombre}`, funcionario._id);

    await oferta.save();

    try {
      const pdfBuffer = await generarFichaCaracterizacion(oferta);
      const pdfDir    = path.join(__dirname, '../uploads/fichas');
      if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
      fs.writeFileSync(path.join(pdfDir, `ficha_${oferta.numero_ficha}.pdf`), pdfBuffer);
    } catch (pdfError) {
      console.error('⚠️ Error regenerando PDF (no bloquea):', pdfError.message);
    }

    res.json({
      success: true,
      message: 'Oferta aprobada correctamente. Ficha generada.',
      data: { oferta_id: oferta._id, estado: 'creada', numero_ficha: oferta.numero_ficha }
    });
  } catch (error) {
    console.error('Error aprobando oferta:', error);
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// -----------------------------------------------------------------------------
// 5. MATRICULAR: creada → matriculada
// -----------------------------------------------------------------------------
const matricularOferta = async (req, res) => {
  try {
    const { ofertaId } = req.params;
    const funcionario  = req.usuario;

    const oferta = await CreacionOferta.findById(ofertaId)
      .populate('estado')
      .populate('creado_por', POPULATE_INSTRUCTOR);  // ← fix populate

    if (!oferta) return res.status(404).json({ success: false, message: 'Oferta no encontrada' });

    verificarAsignacion(oferta, funcionario._id);

    if (oferta.estado?.codigo !== 'creada') {
      return res.status(400).json({ success: false, message: 'Solo puedes matricular ofertas en estado "creada"' });
    }

    const estadoMatriculada = await getEstado('matriculada');
    const fechaFormateada   = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });

    oferta.nota_matricula  = `Su ficha fue matriculada satisfactoriamente por ${funcionario.nombre} el ${fechaFormateada}.`;
    oferta.estado          = estadoMatriculada._id;
    oferta.fecha_matricula = new Date();

    pushHistorial(oferta, estadoMatriculada._id, oferta.nota_matricula, funcionario._id);
    await oferta.save();

    res.json({
      success: true,
      message: '¡Aprendices matriculados exitosamente!',
      data: { oferta_id: oferta._id, estado: 'matriculada', fecha_matricula: oferta.fecha_matricula, nota_instructor: oferta.nota_matricula }
    });
  } catch (error) {
    console.error('Error matriculando:', error);
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// -----------------------------------------------------------------------------
// 5b. APROBAR Y MATRICULAR en un solo paso
//     Flujo especial: oferta corregida (en_proceso) → creada → matriculada
//     Usado cuando el instructor ya corrigió y el funcionario confirma matrícula
//     desde el modal de detalle sin pasar por estado "creada" visualmente.
// -----------------------------------------------------------------------------
const aprobarYMatricularOferta = async (req, res) => {
  try {
    const { ofertaId } = req.params;
    const funcionario  = req.usuario;

    const oferta = await CreacionOferta.findById(ofertaId)
      .populate('estado')
      .populate('programa_formacion')
      .populate('modalidad')
      .populate('tipo_programa')
      .populate('tipo_oferta')
      .populate('ubicacion.municipio')
      .populate('programa_especial')
      .populate('creado_por', POPULATE_INSTRUCTOR)
      .populate('empresa_solicitante', 'nombre nit')
      .populate('coordinador_asignado', 'nombre');

    if (!oferta) return res.status(404).json({ success: false, message: 'Oferta no encontrada' });

    verificarAsignacion(oferta, funcionario._id);

    // Solo se permite si está en_proceso (oferta corregida por instructor)
    if (oferta.estado?.codigo !== 'en_proceso') {
      return res.status(400).json({
        success: false,
        message: `No se puede ejecutar esta acción en estado "${oferta.estado?.codigo}". La oferta debe estar en proceso.`
      });
    }

    // Paso 1: generar ficha (estado creada internamente)
    if (!oferta.numero_ficha) {
      const codigo = oferta.programa_formacion?.codigo || 'XXX';
      oferta.numero_ficha = `${codigo}-${Date.now().toString().slice(-6)}`;
    }
    oferta.fecha_aprobacion_funcionario = new Date();

    try {
      const pdfBuffer = await generarFichaCaracterizacion(oferta);
      const pdfDir    = path.join(__dirname, '../uploads/fichas');
      if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
      fs.writeFileSync(path.join(pdfDir, `ficha_${oferta.numero_ficha}.pdf`), pdfBuffer);
    } catch (pdfError) {
      console.error('⚠️ PDF no generado (no bloquea):', pdfError.message);
    }

    // Paso 2: pasar directo a matriculada
    const estadoMatriculada = await getEstado('matriculada');
    const fechaFormateada   = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });

    oferta.nota_matricula  = `Su ficha fue aprobada y matriculada por ${funcionario.nombre} el ${fechaFormateada}.`;
    oferta.estado          = estadoMatriculada._id;
    oferta.fecha_matricula = new Date();

    pushHistorial(
      oferta, estadoMatriculada._id,
      `Oferta corregida aprobada y matriculada por: ${funcionario.nombre}`,
      funcionario._id
    );

    await oferta.save();

    res.json({
      success: true,
      message: '¡Oferta aprobada y aprendices matriculados correctamente!',
      data: {
        oferta_id:       oferta._id,
        estado:          'matriculada',
        numero_ficha:    oferta.numero_ficha,
        fecha_matricula: oferta.fecha_matricula,
      }
    });
  } catch (error) {
    console.error('Error en aprobarYMatricular:', error);
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// -----------------------------------------------------------------------------
// 6. COMPLETAR: matriculada → completado
// -----------------------------------------------------------------------------
const completarOferta = async (req, res) => {
  try {
    const { ofertaId }      = req.params;
    const { observaciones } = req.body || {};
    const funcionario       = req.usuario;

    const oferta = await CreacionOferta.findById(ofertaId).populate('estado');
    if (!oferta) return res.status(404).json({ success: false, message: 'Oferta no encontrada' });

    verificarAsignacion(oferta, funcionario._id);

    if (oferta.estado?.codigo !== 'matriculada') {
      return res.status(400).json({ success: false, message: 'Solo puedes completar ofertas en estado "matriculada"' });
    }

    const estadoCompletado = await getEstado('completado');

    oferta.estado           = estadoCompletado._id;
    oferta.fecha_completado = new Date();
    pushHistorial(oferta, estadoCompletado._id, observaciones || `Proceso completado por: ${funcionario.nombre}`, funcionario._id);

    await oferta.save();

    res.json({
      success: true,
      message: 'Oferta completada exitosamente.',
      data: { oferta_id: oferta._id, estado: 'completado', fecha_completado: oferta.fecha_completado }
    });
  } catch (error) {
    console.error('Error completando oferta:', error);
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
  registrarFuncionario,
  getFuncionarios,
  getFuncionariosPorModalidad,
  getFuncionariosParaOferta,

  revisarOferta,             // lista_espera  → en_proceso
  solicitarCorreccion,       // en_proceso    → a_corregir
  getNovedadesAprendices,    // novedades para instructor
  aprobarOferta,             // en_proceso    → creada
  matricularOferta,          // creada        → matriculada
  aprobarYMatricularOferta,  // en_proceso    → matriculada (flujo corregida)
  completarOferta,           // matriculada   → completado
};