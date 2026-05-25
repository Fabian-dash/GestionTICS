const mongoose = require('mongoose');
const ProgramaFormacion = require('../models/ProgramaFormacion');

const insertarProgramas = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gestionytics');
    console.log('✅ Conectado a MongoDB');

    // Limpiar colección
    await ProgramaFormacion.deleteMany({});
    console.log('🗑️ Programas anteriores eliminados');

    // Datos de ejemplo
    const programas = [
      {
        codigo: 'PF001',
        version: '1.0',
        nombre_programa: 'Técnico en Sistemas',
        tipo_programa: 'Técnico',
        nivel_formacion: 'Técnico',
        duracion_maxima: 24,
        duracion_etapa_lectiva: 12,
        duracion_etapa_productiva: 12,
        edad_minima_requerida: 18,
        grado_maximo: '11',
        red_conocimientos: 'Tecnología',
        modalidad: '6a05cf433cf727e1bea09463' // ID de Presencial
      },
      {
        codigo: 'PF002',
        version: '1.0',
        nombre_programa: 'Empresarial en Administración',
        tipo_programa: 'Empresarial',
        nivel_formacion: 'Empresarial',
        duracion_maxima: 24,
        duracion_etapa_lectiva: 12,
        duracion_etapa_productiva: 12,
        edad_minima_requerida: 18,
        grado_maximo: '11',
        red_conocimientos: 'Administración',
        modalidad: '6a05cf433cf727e1bea09463'
      },
      {
        codigo: 'PF003',
        version: '1.0',
        nombre_programa: 'Popular en Artesanías',
        tipo_programa: 'Popular',
        nivel_formacion: 'Popular',
        duracion_maxima: 12,
        duracion_etapa_lectiva: 6,
        duracion_etapa_productiva: 6,
        edad_minima_requerida: 16,
        grado_maximo: '9',
        red_conocimientos: 'Artes',
        modalidad: '6a05cf433cf727e1bea09463'
      }
    ];

    await ProgramaFormacion.insertMany(programas);
    console.log(`✅ ${programas.length} programas insertados`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

insertarProgramas();