const Funcionario = require('../models/Funcionario');
const TipoPrograma = require('../models/TipoPrograma');
const CreacionOferta = require('../models/CreacionOferta');
const EstadoOferta = require('../models/EstadoOferta');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Registrar funcionario
const registrarFuncionario = async (req, res) => {
  try {
    const { 
      nombre, 
      numeroIdentificacion, 
      correoElectronico, 
      telefono, 
      password, 
      nombreUsuario,
      modalidades
    } = req.body;

    const existe = await Funcionario.findOne({
      $or: [
        { correoElectronico },
        { nombreUsuario },
        { numeroIdentificacion }
      ]
    });

    if (existe) {
      return res.status(400).json({
        success: false,
        message: 'El funcionario ya existe con esos datos'
      });
    }

    const modalidadesValidas = await TipoPrograma.find({
      _id: { $in: modalidades }
    });

    if (modalidadesValidas.length !== modalidades.length) {
      return res.status(400).json({
        success: false,
        message: 'Una o más modalidades no son válidas'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordEncriptada = await bcrypt.hash(password, salt);

    const funcionario = new Funcionario({
      nombre,
      numeroIdentificacion,
      correoElectronico,
      telefono,
      password: passwordEncriptada,
      nombreUsuario,
      modalidades
    });

    await funcionario.save();

    const token = jwt.sign(
      { id: funcionario._id, tipo: 'funcionario' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    await funcionario.populate('modalidades', 'nombre');

    res.status(201).json({
      success: true,
      message: 'Funcionario registrado exitosamente',
      token,
      user: {
        id: funcionario._id,
        nombre: funcionario.nombre,
        nombreUsuario: funcionario.nombreUsuario,
        tipo: 'funcionario',
        modalidades: funcionario.modalidades.map(m => m.nombre)
      }
    });

  } catch (error) {
    console.error('Error registrando funcionario:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Obtener todos los funcionarios
const getFuncionarios = async (req, res) => {
  try {
    const funcionarios = await Funcionario.find({ activo: true })
      .select('-password')
      .populate('modalidades', 'nombre')
      .sort({ nombre: 1 });

    res.json({
      success: true,
      data: funcionarios
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Obtener funcionarios por modalidad
const getFuncionariosPorModalidad = async (req, res) => {
  try {
    const { modalidadId } = req.params;
    
    const funcionarios = await Funcionario.find({ 
      modalidades: modalidadId,
      activo: true 
    })
    .select('-password')
    .populate('modalidades', 'nombre');

    res.json({
      success: true,
      data: funcionarios
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Obtener funcionarios por tipo de oferta
const getFuncionariosParaOferta = async (req, res) => {
  try {
    const { ofertaId } = req.params;
    
    const oferta = await CreacionOferta.findById(ofertaId)
      .populate('tipo_programa');
    
    if (!oferta) {
      return res.status(404).json({ message: 'Oferta no encontrada' });
    }

    const funcionarios = await Funcionario.find({ 
      modalidades: oferta.tipo_programa._id,
      activo: true 
    })
    .select('-password')
    .populate('modalidades', 'nombre');

    res.json({
      success: true,
      data: funcionarios
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =============================================
// TOMAR UNA OFERTA APROBADA
// El funcionario se asigna exclusivamente a la oferta.
// Si ya fue tomada por otro, retorna 409 Conflict.
// =============================================
const tomarOferta = async (req, res) => {
  try {
    const { ofertaId } = req.params;
    const funcionario = req.usuario;

    const oferta = await CreacionOferta.findById(ofertaId).populate('estado');

    if (!oferta) {
      return res.status(404).json({
        success: false,
        message: 'Oferta no encontrada'
      });
    }

    // Solo se pueden tomar ofertas en estado "aprobada"
    if (oferta.estado?.codigo !== 'aprobada') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden tomar ofertas en estado aprobado'
      });
    }

    // Verificar que nadie la haya tomado ya
    if (oferta.funcionario_asignado) {
      return res.status(409).json({
        success: false,
        message: 'Esta oferta ya fue tomada por otro funcionario'
      });
    }

    // Buscar estado "en_proceso"
    const estadoEnProceso = await EstadoOferta.findOne({ codigo: 'en_proceso' });
    if (!estadoEnProceso) {
      return res.status(500).json({
        success: false,
        message: 'Estado "en_proceso" no encontrado. Ejecuta el script insertarEstados.js'
      });
    }

    oferta.funcionario_asignado = funcionario._id;
    oferta.estado = estadoEnProceso._id;

    if (!oferta.historial_estados) oferta.historial_estados = [];
    oferta.historial_estados.push({
      estado: estadoEnProceso._id,
      comentario: `Oferta tomada por funcionario: ${funcionario.nombre}`,
      cambiado_por: funcionario._id,
      cambiado_por_modelo: 'Funcionario',
      fecha: new Date()
    });

    await oferta.save();

    res.json({
      success: true,
      message: 'Oferta asignada correctamente',
      data: {
        oferta_id: oferta._id,
        estado: 'en_proceso',
        funcionario: funcionario.nombre
      }
    });

  } catch (error) {
    console.error('Error tomando oferta:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =============================================
// COMPLETAR UNA OFERTA
// Solo el funcionario que la tomó puede marcarla como completada.
// =============================================
const completarOferta = async (req, res) => {
  try {
    const { ofertaId } = req.params;
    const { observaciones } = req.body || {};
    const funcionario = req.usuario;

    const oferta = await CreacionOferta.findById(ofertaId).populate('estado');

    if (!oferta) {
      return res.status(404).json({
        success: false,
        message: 'Oferta no encontrada'
      });
    }

    // Solo el funcionario asignado puede completarla
    if (oferta.funcionario_asignado?.toString() !== funcionario._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Solo el funcionario asignado puede completar esta oferta'
      });
    }

    // Solo se pueden completar ofertas en estado "en_proceso"
    if (oferta.estado?.codigo !== 'en_proceso') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden completar ofertas en estado "en proceso"'
      });
    }

    const estadoCompletado = await EstadoOferta.findOne({ codigo: 'completado' });
    if (!estadoCompletado) {
      return res.status(500).json({
        success: false,
        message: 'Estado "completado" no encontrado. Ejecuta el script insertarEstados.js'
      });
    }

    oferta.estado = estadoCompletado._id;
    oferta.fecha_completado = new Date();

    if (!oferta.historial_estados) oferta.historial_estados = [];
    oferta.historial_estados.push({
      estado: estadoCompletado._id,
      comentario: observaciones || `Oferta completada por: ${funcionario.nombre}`,
      cambiado_por: funcionario._id,
      cambiado_por_modelo: 'Funcionario',
      fecha: new Date()
    });

    await oferta.save();

    res.json({
      success: true,
      message: 'Oferta marcada como completada',
      data: {
        oferta_id: oferta._id,
        estado: 'completado',
        fecha_completado: oferta.fecha_completado
      }
    });

  } catch (error) {
    console.error('Error completando oferta:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  registrarFuncionario,
  getFuncionarios,
  getFuncionariosPorModalidad,
  getFuncionariosParaOferta,
  tomarOferta,
  completarOferta
};