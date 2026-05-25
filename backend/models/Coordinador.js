const mongoose = require('mongoose');

const coordinadorSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  // ===== NUEVOS CAMPOS =====
  numeroIdentificacion: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  correoElectronico: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  telefono: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  // Para que puedan iniciar sesión
  nombreUsuario: {
    type: String,
    required: true,
    unique: true,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Coordinador', coordinadorSchema);