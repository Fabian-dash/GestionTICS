const mongoose = require('mongoose');

const CaracterizacionSchema = new mongoose.Schema({
  tipo_caracterizacion: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Caracterizacion', CaracterizacionSchema);