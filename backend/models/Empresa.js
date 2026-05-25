const mongoose = require('mongoose');

const empresaSchema = new mongoose.Schema({
  // Datos básicos de la empresa
  nombre: {
    type: String,
    required: [true, 'El nombre de la empresa es obligatorio'],
    trim: true
  },
  nit: {
    type: String,
    required: [true, 'El NIT es obligatorio'],
    unique: true,
    trim: true
  },
  fecha_creacion: {
    type: Date,
    required: [true, 'La fecha de creación es obligatoria']
  },
  tipo_empresa: {
    type: String,
    required: [true, 'El tipo de empresa es obligatorio'],
    enum: [
      'Pública',
      'Privada', 
      'Mixta',
      'ONG',
      'Fundación',
      'Cooperativa',
      'Otro'
    ],
    default: 'Privada'
  },
  direccion: {
    type: String,
    required: [true, 'La dirección es obligatoria'],
    trim: true
  },
  
  // Representante legal
  representante_legal: {
    nombre_completo: {
      type: String,
      required: [true, 'El nombre del representante legal es obligatorio'],
      trim: true
    },
    documento_identidad: {
      type: String,
      trim: true
    },
    telefono: String,
    correo: String
  },
  
  // Contacto en la empresa
  contacto: {
    nombre_completo: {
      type: String,
      required: [true, 'El nombre del contacto es obligatorio'],
      trim: true
    },
    cargo: String,
    telefono: {
      type: String,
      required: [true, 'El teléfono del contacto es obligatorio'],
      trim: true
    },
    correo: {
      type: String,
      required: [true, 'El correo del contacto es obligatorio'],
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Correo inválido']
    }
  },
  
  // Información laboral
  numero_empleados: {
    type: Number,
    required: [true, 'El número de empleados es obligatorio'],
    min: [1, 'La empresa debe tener al menos 1 empleado']
  },
  
  // Estado de la empresa
  activa: {
    type: Boolean,
    default: true
  },
  
  // Auditoría
  creado_por: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Índices para búsquedas rápidas
empresaSchema.index({ nit: 1 });
empresaSchema.index({ nombre: 1 });
empresaSchema.index({ 'contacto.correo': 1 });

module.exports = mongoose.model('Empresa', empresaSchema);