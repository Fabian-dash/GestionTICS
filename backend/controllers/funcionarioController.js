const Funcionario = require('../models/Funcionario');
const TipoPrograma = require('../models/TipoPrograma');
const CreacionOferta = require('../models/CreacionOferta');
const EstadoOferta = require('../models/EstadoOferta');
const { generarFichaCaracterizacion } = require('../services/pdfGenerator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// ─── helper: busca estado o lanza error claro ───────────────────────────────
const getEstado = async (codigo) => {
  const estado = await EstadoOferta.findOne({ codigo });
  if (!estado) throw new Error(`Estado "${codigo}" no encontrado. Ejecuta insertarEstados.js`);
  return estado;
};

// ─── helper: verifica que la oferta pertenece al funcionario asignado ────────
const verificarAsignacion = (oferta, funcionarioId) => {
  if (oferta.funcionario_asignado?.toString() !== funcionarioId.toString()) {
    throw { status: 403, message: 'No eres el funcionario asignado a esta oferta' };
  }
};

// ─── helper: agrega entrada al historial ─────────────────────────────────────
const pushHistorial = (oferta, estadoId, comentario, funcionarioId) => {
  if (!oferta.historial_estados) oferta.historial_estados = [];
  oferta.historial_estados.push({
    estado: estadoId,
    comentario,
    cambiado_por: funcionarioId,
    cambiado_por_modelo: 'Funcionario',
    fecha: new Date()
  });
};

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
    await funcionario.populate('modalidades', 'nombre');

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
    const funcionarios = await Funcionario.find({ activo: true }).select('-password').populate('modalidades', 'nombre').sort({ nombre: 1 });
    res.json({ success: true, data: funcionarios });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getFuncionariosPorModalidad = async (req, res) => {
  try {
    const funcionarios = await Funcionario.find({ modalidades: req.params.modalidadId, activo: true }).select('-password').populate('modalidades', 'nombre');
    res.json({ success: true, data: funcionarios });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getFuncionariosParaOferta = async (req, res) => {
  try {
    const oferta = await CreacionOferta.findById(req.params.ofertaId).populate('tipo_programa');
    if (!oferta) return res.status(404).json({ message: 'Oferta no encontrada' });
    const funcionarios = await Funcionario.find({ modalidades: oferta.tipo_programa._id, activo: true }).select('-password').populate('modalidades', 'nombre');
    res.json({ success: true, data: funcionarios });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================================================================
// FLUJO DE ESTADOS — FUNCIONARIO
//
//  lista_espera
//      ↓ [revisar]
//  en_proceso
//      ↓ [solicitarCorreccion]          ↓ [crearOferta]
//  a_corregir ──[instructor corrige]──→ en_proceso
//                                           ↓ [crearOferta]
//                                       creada
//                                           ↓ [matricular]
//                                       matriculada
//                                           ↓ [completar]
//                                       completado
// =============================================================================

// -----------------------------------------------------------------------------
// REVISAR: lista_espera → en_proceso
// El funcionario toma la oferta y comienza la revisión.
// -----------------------------------------------------------------------------
const revisarOferta = async (req, res) => {
  try {
    const { ofertaId } = req.params;
    const funcionario = req.usuario;

    const oferta = await CreacionOferta.findById(ofertaId).populate('estado');
    if (!oferta) return res.status(404).json({ success: false, message: 'Oferta no encontrada' });

    // Solo ofertas en lista_espera sin funcionario asignado
    if (oferta.estado?.codigo !== 'lista_espera') {
      return res.status(400).json({ success: false, message: 'Solo puedes revisar ofertas en lista de espera' });
    }
    if (oferta.funcionario_asignado) {
      return res.status(409).json({ success: false, message: 'Esta oferta ya fue tomada por otro funcionario' });
    }

    const estadoEnProceso = await getEstado('en_proceso');

    oferta.funcionario_asignado = funcionario._id;
    oferta.estado = estadoEnProceso._id;
    pushHistorial(oferta, estadoEnProceso._id, `Oferta tomada para revisión por: ${funcionario.nombre}`, funcionario._id);

    await oferta.save();

    res.json({
      success: true,
      message: 'Oferta en proceso de revisión',
      data: { oferta_id: oferta._id, estado: 'en_proceso', funcionario: funcionario.nombre }
    });
  } catch (error) {
    console.error('Error revisando oferta:', error);
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// -----------------------------------------------------------------------------
// SOLICITAR CORRECCIÓN: en_proceso → a_corregir
// El funcionario detecta errores y los envía de vuelta al instructor.
// El instructor corrige y reenvía → vuelve a en_proceso (sin pasar por coordinador).
// -----------------------------------------------------------------------------
const solicitarCorreccion = async (req, res) => {
  try {
    const { ofertaId } = req.params;
    const { motivo } = req.body;
    const funcionario = req.usuario;

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

    oferta.estado = estadoACorregir._id;
    oferta.motivo_correccion = motivo.trim();
    pushHistorial(oferta, estadoACorregir._id, `Corrección solicitada: ${motivo}`, funcionario._id);

    await oferta.save();

    res.json({
      success: true,
      message: 'Solicitud de corrección enviada al instructor',
      data: { oferta_id: oferta._id, estado: 'a_corregir', motivo }
    });
  } catch (error) {
    console.error('Error solicitando corrección:', error);
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// -----------------------------------------------------------------------------
// APROBAR/CREAR: en_proceso → creada
// El funcionario aprueba la revisión. Se genera número de ficha y PDF.
// -----------------------------------------------------------------------------
const aprobarOferta = async (req, res) => {
  try {
    const { ofertaId } = req.params;
    const funcionario = req.usuario;

    const oferta = await CreacionOferta.findById(ofertaId)
      .populate('estado')
      .populate('programa_formacion')
      .populate('modalidad')
      .populate('tipo_programa')
      .populate('tipo_oferta')
      .populate('ubicacion.municipio')
      .populate('programa_especial')
      .populate('creado_por', 'nombre apellido nombreUsuario')
      .populate('empresa_solicitante', 'nombre nit')
      .populate('coordinador_asignado', 'nombre');

    if (!oferta) return res.status(404).json({ success: false, message: 'Oferta no encontrada' });

    verificarAsignacion(oferta, funcionario._id);

    if (oferta.estado?.codigo !== 'en_proceso') {
      return res.status(400).json({ success: false, message: 'Solo puedes aprobar ofertas "en proceso"' });
    }

    const estadoCreada = await getEstado('creada');

    // Generar número de ficha único si no tiene
    if (!oferta.numero_ficha) {
      const timestamp = Date.now().toString().slice(-6);
      const codigo = oferta.programa_formacion?.codigo || 'XXX';
      oferta.numero_ficha = `${codigo}-${timestamp}`;
    }

    oferta.estado = estadoCreada._id;
    oferta.fecha_aprobacion_funcionario = new Date();
    pushHistorial(oferta, estadoCreada._id, `Oferta creada y aprobada por funcionario: ${funcionario.nombre}`, funcionario._id);

    await oferta.save();

    // Regenerar PDF con número de ficha
    try {
      const pdfBuffer = await generarFichaCaracterizacion(oferta);
      const pdfDir = path.join(__dirname, '../uploads/fichas');
      if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
      fs.writeFileSync(path.join(pdfDir, `ficha_${oferta.numero_ficha}.pdf`), pdfBuffer);
    } catch (pdfError) {
      console.error('⚠️ Error regenerando PDF (no bloquea el flujo):', pdfError.message);
    }

    res.json({
      success: true,
      message: 'Oferta creada correctamente. Ficha y solicitud generadas.',
      data: {
        oferta_id: oferta._id,
        estado: 'creada',
        numero_ficha: oferta.numero_ficha
      }
    });
  } catch (error) {
    console.error('Error aprobando oferta:', error);
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// -----------------------------------------------------------------------------
// MATRICULAR: creada → matriculada
// El funcionario matricula formalmente a los aprendices.
// -----------------------------------------------------------------------------
const matricularOferta = async (req, res) => {
  try {
    const { ofertaId } = req.params;
    const funcionario = req.usuario;

    const oferta = await CreacionOferta.findById(ofertaId).populate('estado');
    if (!oferta) return res.status(404).json({ success: false, message: 'Oferta no encontrada' });

    verificarAsignacion(oferta, funcionario._id);

    if (oferta.estado?.codigo !== 'creada') {
      return res.status(400).json({ success: false, message: 'Solo puedes matricular ofertas en estado "creada"' });
    }

    const estadoMatriculada = await getEstado('matriculada');

    oferta.estado = estadoMatriculada._id;
    oferta.fecha_matricula = new Date();
    pushHistorial(oferta, estadoMatriculada._id, `Aprendices matriculados por: ${funcionario.nombre}`, funcionario._id);

    await oferta.save();

    res.json({
      success: true,
      message: 'Aprendices matriculados correctamente',
      data: { oferta_id: oferta._id, estado: 'matriculada', fecha_matricula: oferta.fecha_matricula }
    });
  } catch (error) {
    console.error('Error matriculando:', error);
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// -----------------------------------------------------------------------------
// COMPLETAR: matriculada → completado
// Cierre final del proceso.
// -----------------------------------------------------------------------------
const completarOferta = async (req, res) => {
  try {
    const { ofertaId } = req.params;
    const { observaciones } = req.body || {};
    const funcionario = req.usuario;

    const oferta = await CreacionOferta.findById(ofertaId).populate('estado');
    if (!oferta) return res.status(404).json({ success: false, message: 'Oferta no encontrada' });

    verificarAsignacion(oferta, funcionario._id);

    if (oferta.estado?.codigo !== 'matriculada') {
      return res.status(400).json({ success: false, message: 'Solo puedes completar ofertas en estado "matriculada"' });
    }

    const estadoCompletado = await getEstado('completado');

    oferta.estado = estadoCompletado._id;
    oferta.fecha_completado = new Date();
    pushHistorial(oferta, estadoCompletado._id, observaciones || `Completada por: ${funcionario.nombre}`, funcionario._id);

    await oferta.save();

    res.json({
      success: true,
      message: 'Oferta marcada como completada',
      data: { oferta_id: oferta._id, estado: 'completado', fecha_completado: oferta.fecha_completado }
    });
  } catch (error) {
    console.error('Error completando oferta:', error);
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
  // Registro y consultas
  registrarFuncionario,
  getFuncionarios,
  getFuncionariosPorModalidad,
  getFuncionariosParaOferta,

  // Flujo de estados
  revisarOferta,          // lista_espera   → en_proceso
  solicitarCorreccion,    // en_proceso     → a_corregir
  aprobarOferta,          // en_proceso     → creada
  matricularOferta,       // creada         → matriculada
  completarOferta,        // matriculada    → completado
};