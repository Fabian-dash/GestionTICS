const mongoose = require('mongoose');

const estadoOfertaSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: [true, 'El código del estado es obligatorio'],
    unique: true,
    trim: true,
    lowercase: true
  },
  nombre: {
    type: String,
    required: [true, 'El nombre del estado es obligatorio'],
    trim: true
  },
  descripcion: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    default: '#00643C'
  },
  orden: {
    type: Number,
    default: 0
  },
  permite_edicion: {
    type: Boolean,
    default: false
  },
  notificar_instructor: {
    type: Boolean,
    default: false
  },
  notificar_coordinador: {
    type: Boolean,
    default: false
  },
  notificar_funcionario: {
    type: Boolean,
    default: false
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices para mejorar búsquedas
estadoOfertaSchema.index({ orden: 1 });
estadoOfertaSchema.index({ activo: 1 });

module.exports = mongoose.model('EstadoOferta', estadoOfertaSchema);