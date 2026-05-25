const Funcionario = require('../models/Funcionario');
const TipoPrograma = require('../models/TipoPrograma');
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
      modalidades  // Array de IDs de TipoPrograma
    } = req.body;

    // Verificar si ya existe
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

    // Verificar que las modalidades existen
    const modalidadesValidas = await TipoPrograma.find({
      _id: { $in: modalidades }
    });

    if (modalidadesValidas.length !== modalidades.length) {
      return res.status(400).json({
        success: false,
        message: 'Una o más modalidades no son válidas'
      });
    }

    // Encriptar password
    const salt = await bcrypt.genSalt(10);
    const passwordEncriptada = await bcrypt.hash(password, salt);

    // Crear funcionario
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

    // Generar token
    const token = jwt.sign(
      { id: funcionario._id, tipo: 'funcionario' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Poblar las modalidades para la respuesta
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

// Obtener funcionarios por tipo de oferta (útil para asignar)
const getFuncionariosParaOferta = async (req, res) => {
  try {
    const { ofertaId } = req.params;
    
    const oferta = await CreacionOferta.findById(ofertaId)
      .populate('tipo_programa');
    
    if (!oferta) {
      return res.status(404).json({ message: 'Oferta no encontrada' });
    }

    // Buscar funcionarios que puedan atender esta modalidad
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

module.exports = {
  registrarFuncionario,
  getFuncionarios,
  getFuncionariosPorModalidad,
  getFuncionariosParaOferta
};