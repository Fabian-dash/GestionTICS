const mongoose = require('mongoose');

const tipoOfertaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TipoOferta', tipoOfertaSchema);