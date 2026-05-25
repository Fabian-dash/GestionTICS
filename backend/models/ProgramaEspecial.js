const mongoose = require('mongoose');

const programaEspecialSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
    unique: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ProgramaEspecial', programaEspecialSchema);