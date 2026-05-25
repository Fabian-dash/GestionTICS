const mongoose = require('mongoose');
const Coordinador = require('../models/Coordinador');
require('dotenv').config();

const coordinadores = [
  { nombre: "Jose Alirio Cobo Lemos" },
  { nombre: "Franco Orlando Garzón Arcos" },
  { nombre: "Javier Mauricio Palomino Paredes" },
  { nombre: "Leidy Ruiz Velasco" }
];

const insertarCoordinadores = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    // Limpiar colección existente (opcional)
    await Coordinador.deleteMany({});
    console.log('🗑️ Coordinadores anteriores eliminados');

    // Insertar nuevos coordinadores
    const result = await Coordinador.insertMany(coordinadores);
    console.log(`✅ ${result.length} coordinadores insertados:`);
    result.forEach(coord => {
      console.log(`   - ${coord.nombre}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

insertarCoordinadores();