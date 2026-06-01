const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nombreUsuario: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  tipoIdentificacion: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'TipoDoc',  // ← antes decía 'Tipodoc'
  required: true
},
  numeroIdentificacion: {
    type: String,
    required: true,
    unique: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  apellido: {
    type: String,
    required: true,
    trim: true
  },
  telefono: {
    type: String,
    required: true
  },
  correoElectronico: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  coordinadorAsignado: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coordinador',
    required: true
  },
  aprobado: {
  type: Boolean,
  default: false,
  },
  password: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);