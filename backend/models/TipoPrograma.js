const mongoose = require('mongoose');

const tipoProgramaSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  nombre: {
    type: String,
    required: true,
    unique: true,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TipoPrograma', tipoProgramaSchema);