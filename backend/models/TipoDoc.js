const mongoose = require('mongoose');

const tipoDocSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TipoDoc', tipoDocSchema);