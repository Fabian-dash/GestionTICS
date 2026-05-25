const mongoose = require('mongoose');
const Modalidad = require('../models/Modalidad');

const insertarModalidades = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gestionytics');
    console.log('✅ Conectado a MongoDB');

    await Modalidad.deleteMany({});
    console.log('🗑️ Modalidades anteriores eliminadas');

    const modalidades = [
      { nombre: 'Presencial' },
      { nombre: 'Virtual' },
      { nombre: 'Mixta' }
    ];

    const result = await Modalidad.insertMany(modalidades);
    console.log(`✅ ${result.length} modalidades insertadas`);
    result.forEach(m => console.log(`   - ${m.nombre}: ${m._id}`));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

insertarModalidades();