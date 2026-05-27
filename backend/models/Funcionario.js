const mongoose = require('mongoose');

const funcionarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
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
  aprobado: {
  type: Boolean,
  default: false,
  },
  password: {
    type: String,
    required: true
  },
  nombreUsuario: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  // 🔥 Relación con TipoPrograma (Campesena/Regular)
  modalidades: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TipoPrograma',
    required: true
  }],
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índice para búsquedas rápidas
funcionarioSchema.index({ modalidades: 1 });

module.exports = mongoose.model('Funcionario', funcionarioSchema);