const mongoose = require('mongoose');

const solicitudValidacionSchema = new mongoose.Schema({
  oferta_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CreacionOferta',
    required: true
  },
  instructor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coordinador_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coordinador',
    required: true
  },
  mensaje: {
    type: String,
    trim: true
  },
  estado: {
    type: String,
    enum: ['pendiente', 'aprobada', 'rechazada'],
    default: 'pendiente'
  },
  fecha_solicitud: {
    type: Date,
    default: Date.now
  },
  fecha_respuesta: Date,
  comentarios: String
}, {
  timestamps: true
});

module.exports = mongoose.model('SolicitudValidacion', solicitudValidacionSchema);