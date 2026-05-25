const mongoose = require('mongoose');

const municipioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  cod_dane: {
    type: String,
    required: true
  },
  estado: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Municipio', municipioSchema);