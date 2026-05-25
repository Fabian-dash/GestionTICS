const mongoose = require('mongoose');

const inscripcionSchema = new mongoose.Schema({
  oferta_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CreacionOferta',
    required: true
  },
  nombres: {
    type: String,
    required: [true, 'Los nombres son obligatorios'],
    trim: true
  },
  apellidos: {
    type: String,
    required: [true, 'Los apellidos son obligatorios'],
    trim: true
  },
  tipo_documento: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TipoDoc',
    required: true
  },
  numero_documento: {
    type: String,
    required: [true, 'El número de documento es obligatorio'],
   // unique: true,
    trim: true
  },
  caracterizacion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Caracterizacion',
    required: [true, 'La caracterización es obligatoria']
  },
  telefono: {
    type: String,
    required: [true, 'El teléfono es obligatorio'],
    trim: true
  },
  correo: {
    type: String,
    required: [true, 'El correo es obligatorio'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Correo inválido']
  },
  pdf_cedula: {
    type: String,
    required: [true, 'La cédula escaneada es obligatoria']
  },
  link_inscripcion: {
    type: String
    // unique eliminado
  },
  estado: {
    type: String,
    enum: ['pendiente', 'aprobada', 'rechazada'],
    default: 'pendiente'
  },
  fecha_inscripcion: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices
inscripcionSchema.index({ oferta_id: 1 });

module.exports = mongoose.model('Inscripcion', inscripcionSchema);