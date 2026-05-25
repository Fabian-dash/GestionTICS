const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Coordinador = require('../models/Coordinador');
const Funcionario = require('../models/Funcionario'); // ← IMPORTAR FUNCIONARIO

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Buscar según el tipo de usuario
      let usuario;
      if (decoded.tipo === 'coordinador') {
        usuario = await Coordinador.findById(decoded.id);
      } else if (decoded.tipo === 'funcionario') {
        usuario = await Funcionario.findById(decoded.id).populate('modalidades');
      } else {
        usuario = await User.findById(decoded.id).select('-password');
      }
      
      if (!usuario) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      req.usuario = usuario;
      next();
    } catch (error) {
      console.error('Error de autenticación:', error);
      return res.status(401).json({
        success: false,
        message: 'Token no válido'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado, token requerido'
    });
  }
};

module.exports = { protect };