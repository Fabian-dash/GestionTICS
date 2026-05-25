const mongoose = require('mongoose');

const modalidadSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Modalidad', modalidadSchema);