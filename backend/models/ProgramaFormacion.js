const mongoose = require('mongoose');

const programaFormacionSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true
  },
  version: {
    type: String,
    required: true
  },
  nombre_programa: {
    type: String,
    required: true
  },
  tipo_programa: {
    type: String,
    required: true
  },
  nivel_formacion: {
    type: String,
    required: true
  },
  duracion_maxima: {
    type: Number
  },
  duracion_etapa_lectiva: {
    type: Number
  },
  duracion_etapa_productiva: {
    type: Number
  },
  edad_minima_requerida: {
    type: Number
  },
  grado_maximo: {
    type: String
  },
  red_conocimientos: {
    type: String
  },
  modalidad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Modalidad",
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ProgramaFormacion', programaFormacionSchema);