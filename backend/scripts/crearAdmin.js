// scripts/crearAdmin.js
// Ejecutar UNA SOLA VEZ: node scripts/crearAdmin.js
// Luego puedes eliminar o proteger este script

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const Admin    = require('../models/Admin');

const ADMIN = {
  nombre:            'Administrador',
  nombreUsuario:     'admin',
  correoElectronico: 'admin@sena.edu.co',   // ← cambia esto
  password:          'Admin2026*',           // ← cambia esto
};

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    const existe = await Admin.findOne({ correoElectronico: ADMIN.correoElectronico });
    if (existe) {
      console.log('⚠️  Ya existe un admin con ese correo. Abortando.');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(ADMIN.password, salt);

    const admin = await Admin.create({ ...ADMIN, password: hash });
    console.log('🎉 Admin creado exitosamente:');
    console.log('   Correo:   ', admin.correoElectronico);
    console.log('   ID:       ', admin._id);
    console.log('\n⚠️  Guarda estas credenciales en un lugar seguro.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();