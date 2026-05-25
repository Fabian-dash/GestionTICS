const mongoose = require('mongoose');

const creacionOfertaSchema = new mongoose.Schema({
  programa_formacion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProgramaFormacion',
    required: [true, 'El programa de formación es obligatorio']
  },
  
  modalidad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Modalidad',
    required: [true, 'La modalidad es obligatoria']
  },
  duracion_meses: {
    type: Number,
    required: [true, 'La duración en meses es obligatoria'],
    min: 1,
    max: 12
  },
  es_campesena: {
    type: Boolean,
    default: false
  },

  tipo_programa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TipoPrograma',
    required: [true, 'El tipo de programa es obligatorio']
  },
  
  tipo_oferta: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TipoOferta',
    required: [true, 'El tipo de oferta es obligatorio']
  },
  
  cupo_maximo: {
    type: Number,
    required: [true, 'El cupo máximo es obligatorio'],
    min: [1, 'El cupo mínimo debe ser 1']
  },
  
  cupos_disponibles: {
    type: Number,
    min: 0,
    default: function() {
      return this.cupo_maximo;
    }
  },
  
  ambiente: {
    nombre: {
      type: String,
      required: [true, 'El nombre del ambiente es obligatorio']
    }
  },
  
  fechas: {
    inicio: {
      type: Date,
      required: [true, 'La fecha de inicio es obligatoria']
    },
    fin: {
      type: Date,
      required: [true, 'La fecha de fin es obligatoria']
    }
  },
  
  ubicacion: {
    departamento: {
      type: String,
      default: 'Cauca',
      required: true
    },
    municipio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Municipio',
      required: [true, 'El municipio es obligatorio']
    },
    direccion: {
      type: String,
      required: [true, 'La dirección es obligatoria'],
      trim: true
    }
  },
  
  empresa_solicitante: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Empresa',
    required: [true, 'La empresa solicitante es obligatoria']
  },
  
  subsector_economico: {
    nombre: {
      type: String,
      required: [true, 'El subsector económico es obligatorio']
    }
  },
  
  programa_especial: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProgramaEspecial'
  },
  
  convenio: {
    nombre: {
      type: String,
      required: [true, 'El nombre del convenio es obligatorio']
    }
  },
  
  horario: {
    hora_inicio: {
      type: String,
      required: function() {
        return !this.es_campesena;
      },
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)']
    },
    hora_fin: {
      type: String,
      required: function() {
        return !this.es_campesena;
      },
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)']
    },
    dias: [{
      type: String,
      enum: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    }]
  },
  
  firma_digital: {
    tipo: {
      type: String,
      enum: ['digital', 'escaneada', 'electronica'],
      default: 'electronica'
    }
  },
  
  coordinador_asignado: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coordinador',
    required: true
  },
  
  creado_por: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  link_inscripciones: {
    type: String,
    unique: true,
    sparse: true
  },
  carta_pdf: {
    type: String  // Aquí se guardará la ruta del archivo
  },
  firma_digital_pdf: {
    type: String  // Aquí se guardará la ruta del archivo
  },
  
  estado: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EstadoOferta',
    required: true
  },

  historial_estados: [{
    estado: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EstadoOferta'
    },
    comentario: String,
    cambiado_por: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'cambiado_por_modelo'
    },
    cambiado_por_modelo: {
      type: String,
      enum: ['User', 'Coordinador', 'Funcionario']
    },
    fecha: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true // Opcional: agrega createdAt y updatedAt automáticamente
});

// ÍNDICES - DEFINIDOS DESPUÉS DEL ESQUEMA PERO DENTRO DEL MISMO ARCHIVO
creacionOfertaSchema.index({ 'programa_formacion': 1 });
creacionOfertaSchema.index({ 'modalidad': 1 });
creacionOfertaSchema.index({ 'tipo_programa': 1 });
creacionOfertaSchema.index({ 'coordinador_asignado': 1 });
creacionOfertaSchema.index({ 'empresa_solicitante': 1 });
creacionOfertaSchema.index({ 'estado': 1 });
creacionOfertaSchema.index({ 'fechas.inicio': 1 });

// Crear el modelo
const CreacionOferta = mongoose.model('CreacionOferta', creacionOfertaSchema);

// EXPORTAR EL MODELO
module.exports = CreacionOferta;