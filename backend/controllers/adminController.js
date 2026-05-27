const Admin    = require('../models/Admin');
const User     = require('../models/User');
const Coordinador = require('../models/Coordinador');
const Funcionario = require('../models/Funcionario');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');

// ── Helpers ──────────────────────────────────────────────────────
const MODELOS = {
  instructor:  { model: User,        label: 'Instructor'  },
  coordinador: { model: Coordinador, label: 'Coordinador' },
  funcionario: { model: Funcionario, label: 'Funcionario' },
};

// ── Crear primer admin (ejecutar una sola vez desde script) ──────
const crearAdmin = async (req, res) => {
  try {
    const { nombreUsuario, correoElectronico, password, nombre } = req.body;
    const existe = await Admin.findOne({ correoElectronico });
    if (existe) return res.status(400).json({ success: false, message: 'Ya existe un admin con ese correo' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const admin = await Admin.create({ nombreUsuario, correoElectronico, password: hash, nombre });
    res.status(201).json({ success: true, message: 'Admin creado', data: { id: admin._id, correoElectronico: admin.correoElectronico } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Listar todos los usuarios con su estado de aprobación ────────
const listarUsuarios = async (req, res) => {
  try {
    const campos = 'nombre apellido nombreUsuario correoElectronico aprobado createdAt';

    const [instructores, coordinadores, funcionarios] = await Promise.all([
      User.find({}, campos).lean(),
      Coordinador.find({}, campos).lean(),
      Funcionario.find({}, campos).lean(),
    ]);

    const mapear = (arr, tipo) => arr.map(u => ({ ...u, tipo }));

    const todos = [
      ...mapear(instructores,  'instructor'),
      ...mapear(coordinadores, 'coordinador'),
      ...mapear(funcionarios,  'funcionario'),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, count: todos.length, data: todos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Aprobar usuario ──────────────────────────────────────────────
const aprobarUsuario = async (req, res) => {
  try {
    const { id, tipo } = req.params;
    const entrada = MODELOS[tipo];
    if (!entrada) return res.status(400).json({ success: false, message: 'Tipo de usuario inválido' });

    const usuario = await entrada.model.findByIdAndUpdate(
      id, { aprobado: true }, { new: true }
    ).select('-password');

    if (!usuario) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

    res.json({ success: true, message: `${entrada.label} aprobado correctamente`, data: usuario });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Rechazar / revocar acceso ────────────────────────────────────
const rechazarUsuario = async (req, res) => {
  try {
    const { id, tipo } = req.params;
    const entrada = MODELOS[tipo];
    if (!entrada) return res.status(400).json({ success: false, message: 'Tipo de usuario inválido' });

    const usuario = await entrada.model.findByIdAndUpdate(
      id, { aprobado: false }, { new: true }
    ).select('-password');

    if (!usuario) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

    res.json({ success: true, message: `Acceso de ${entrada.label} revocado`, data: usuario });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Eliminar usuario ─────────────────────────────────────────────
const eliminarUsuario = async (req, res) => {
  try {
    const { id, tipo } = req.params;
    const entrada = MODELOS[tipo];
    if (!entrada) return res.status(400).json({ success: false, message: 'Tipo de usuario inválido' });

    const usuario = await entrada.model.findByIdAndDelete(id);
    if (!usuario) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

    res.json({ success: true, message: 'Usuario eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { crearAdmin, listarUsuarios, aprobarUsuario, rechazarUsuario, eliminarUsuario };