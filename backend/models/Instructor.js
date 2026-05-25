const mongoose = require('mongoose');

const rangoFechasSchema = new mongoose.Schema({
  desde: {
    type: Date,
    required: [true, 'La fecha desde es obligatoria']
  },
  hasta: {
    type: Date,
    required: [true, 'La fecha hasta es obligatoria']
  },
  hora_inicio: {
    type: String,
    required: [true, 'La hora de inicio es obligatoria'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)']
  },
  hora_fin: {
    type: String,
    required: [true, 'La hora de fin es obligatoria'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)']
  }
});

const programacionMensualSchema = new mongoose.Schema({
  mes: {
    type: Number,
    required: [true, 'El mes es obligatorio'],
    min: 1,
    max: 5
  },
  rangos: [rangoFechasSchema]
});

const instructorSchema = new mongoose.Schema({
  oferta_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CreacionOferta',
    required: true
  },
  
  tipo: {
    type: String,
    enum: ['Técnico', 'Empresarial', 'Popular'],
    required: [true, 'El tipo de instructor es obligatorio']
  },
  
  tipo_identificacion: {
    type: String,
    required: [true, 'El tipo de identificación es obligatorio'],
    enum: ['CC', 'CE', 'TI', 'PAP', 'NIT']
  },
  
  identificacion: {
    type: String,
    required: [true, 'El número de identificación es obligatorio'],
    trim: true
  },
  
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true
  },
  
  correo: {
    type: String,
    required: [true, 'El correo es obligatorio'],
    trim: true,
    lowercase: true
  },
  
  celular: {
    type: String,
    required: [true, 'El celular es obligatorio'],
    trim: true
  },
  
  programacion: [programacionMensualSchema],
  
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices
instructorSchema.index({ oferta_id: 1 });
instructorSchema.index({ identificacion: 1 });

// SIN MIDDLEWARES - Simplificado al máximo
// Las validaciones se harán en el frontend o controlador

module.exports = mongoose.model('Instructor', instructorSchema);