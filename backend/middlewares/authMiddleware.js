const jwt        = require('jsonwebtoken');
const User       = require('../models/User');
const Coordinador = require('../models/Coordinador');
const Funcionario = require('../models/Funcionario');
const Admin      = require('../models/Admin');

// ── Middleware general (instructor / coordinador / funcionario / admin) ──
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      let usuario;

      if (decoded.tipo === 'admin') {
        usuario = await Admin.findById(decoded.id).select('-password');
      } else if (decoded.tipo === 'coordinador') {
        usuario = await Coordinador.findById(decoded.id).select('-password');
      } else if (decoded.tipo === 'funcionario') {
        usuario = await Funcionario.findById(decoded.id).populate('modalidades').select('-password');
      } else {
        // instructor
        usuario = await User.findById(decoded.id).select('-password');
      }

      if (!usuario) {
        return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
      }

      // ── Verificar aprobación (no aplica a admin) ──
      if (decoded.tipo !== 'admin' && usuario.aprobado === false) {
        return res.status(403).json({
          success: false,
          message: 'Tu cuenta está pendiente de aprobación por el administrador.',
          code: 'CUENTA_PENDIENTE'
        });
      }

      req.usuario = usuario;
      next();
    } catch (error) {
      console.error('Error de autenticación:', error);
      return res.status(401).json({ success: false, message: 'Token no válido' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'No autorizado, token requerido' });
  }
};

// ── Middleware exclusivo para admin ─────────────────────────────
const protectAdmin = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.tipo !== 'admin') {
        return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol de administrador.' });
      }

      const admin = await Admin.findById(decoded.id).select('-password');
      if (!admin) {
        return res.status(401).json({ success: false, message: 'Administrador no encontrado' });
      }

      req.usuario = admin;
      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Token no válido' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'No autorizado, token requerido' });
  }
};

module.exports = { protect, protectAdmin };