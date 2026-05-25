const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Coordinador = require('../models/Coordinador');
const Funcionario = require('../models/Funcionario');

// ===== REGISTRO UNIFICADO =====
const registerUser = async (req, res) => {
  try {
    const {
      rol,
      nombreUsuario,
      tipoIdentificacion,
      numeroIdentificacion,
      nombre,
      apellido,
      telefono,
      correoElectronico,
      password,
      coordinadorAsignado,
      modalidades
    } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ── INSTRUCTOR ──
    if (rol === 'instructor') {
      const existe = await User.findOne({
        $or: [{ correoElectronico }, { numeroIdentificacion }, { nombreUsuario }]
      });
      if (existe) return res.status(400).json({ message: 'Ya existe un instructor con esos datos' });

      const coordinadorExiste = await Coordinador.findById(coordinadorAsignado);
      if (!coordinadorExiste) return res.status(400).json({ message: 'El coordinador seleccionado no existe' });

      const user = await User.create({
        nombreUsuario,
        tipoIdentificacion,
        numeroIdentificacion,
        nombre,
        apellido,
        telefono,
        correoElectronico,
        coordinadorAsignado,
        password: hashedPassword
      });

      return res.status(201).json({
        message: 'Instructor registrado correctamente',
        user: {
          id: user._id,
          nombreUsuario: user.nombreUsuario,
          correoElectronico: user.correoElectronico,
          tipo: 'instructor'
        }
      });
    }

    // ── COORDINADOR ──
    if (rol === 'coordinador') {
      const existe = await Coordinador.findOne({
        $or: [{ correoElectronico }, { numeroIdentificacion }, { nombreUsuario }]
      });
      if (existe) return res.status(400).json({ message: 'Ya existe un coordinador con esos datos' });

      const coord = await Coordinador.create({
        nombreUsuario,
        numeroIdentificacion,
        nombre,
        telefono,
        correoElectronico,
        password: hashedPassword
      });

      return res.status(201).json({
        message: 'Coordinador registrado correctamente',
        user: {
          id: coord._id,
          nombreUsuario: coord.nombreUsuario,
          correoElectronico: coord.correoElectronico,
          tipo: 'coordinador'
        }
      });
    }

    // ── FUNCIONARIO ──
    if (rol === 'funcionario') {
      const existe = await Funcionario.findOne({
        $or: [{ correoElectronico }, { numeroIdentificacion }, { nombreUsuario }]
      });
      if (existe) return res.status(400).json({ message: 'Ya existe un funcionario con esos datos' });

      if (!modalidades || modalidades.length === 0) {
        return res.status(400).json({ message: 'Selecciona al menos una modalidad' });
      }

      const func = await Funcionario.create({
        nombreUsuario,
        numeroIdentificacion,
        nombre,
        telefono,
        correoElectronico,
        password: hashedPassword,
        modalidades
      });

      return res.status(201).json({
        message: 'Funcionario registrado correctamente',
        user: {
          id: func._id,
          nombreUsuario: func.nombreUsuario,
          correoElectronico: func.correoElectronico,
          tipo: 'funcionario'
        }
      });
    }

    return res.status(400).json({ message: 'Rol inválido. Debe ser instructor, coordinador o funcionario' });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// ===== LOGIN UNIFICADO =====
const loginUnificado = async (req, res) => {
  try {
    const { correoElectronico, password } = req.body;

    let user = null;
    let tipo = null;

    // Buscar en instructores
    user = await User.findOne({ correoElectronico }).populate('coordinadorAsignado', 'nombre');
    if (user) tipo = 'instructor';

    // Buscar en coordinadores
    if (!user) {
      user = await Coordinador.findOne({ correoElectronico });
      if (user) tipo = 'coordinador';
    }

    // Buscar en funcionarios
    if (!user) {
      user = await Funcionario.findOne({ correoElectronico }).populate('modalidades', 'nombre');
      if (user) tipo = 'funcionario';
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Datos inválidos' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Datos inválidos' });
    }

    const token = jwt.sign(
      { id: user._id, tipo },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    if (tipo === 'coordinador') {
      return res.json({
        success: true,
        message: 'Login exitoso',
        token,
        user: {
          id: user._id,
          nombreUsuario: user.nombreUsuario,
          correoElectronico: user.correoElectronico,
          nombre: user.nombre,
          tipo: 'coordinador'
        }
      });
    }

    if (tipo === 'funcionario') {
      const modalidades = user.modalidades.map(m => m.nombre);
      return res.json({
        success: true,
        message: 'Login exitoso',
        token,
        user: {
          id: user._id,
          nombreUsuario: user.nombreUsuario,
          correoElectronico: user.correoElectronico,
          nombre: user.nombre,
          tipo: 'funcionario',
          tipo_funcionario: modalidades.includes('Campesena') ? 'campesena' : 'regular',
          modalidades
        }
      });
    }

    // instructor
    return res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        id: user._id,
        nombreUsuario: user.nombreUsuario,
        correoElectronico: user.correoElectronico,
        nombre: user.nombre,
        apellido: user.apellido,
        tipo: 'instructor',
        coordinadorAsignado: user.coordinadorAsignado
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
};

module.exports = { registerUser, loginUnificado };