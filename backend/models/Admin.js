const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  nombreUsuario: { type: String, required: true, unique: true, trim: true },
  correoElectronico: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  nombre: { type: String, required: true, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);