const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Funcionario = require('../models/Funcionario');
const TipoPrograma = require('../models/TipoPrograma');
require('dotenv').config();

const funcionarios = [
  {
    nombre: 'Daniela Santillana',
    numeroIdentificacion: '123456789',
    correoElectronico: 'dsantillana@sena.edu.co',
    telefono: '3001234567',
    password: 'funcionario123',
    nombreUsuario: 'dsantillana',
    modalidades: ['Campesena'] // Solo atiende Campesena
  },
  {
    nombre: 'Yeli Carolina Ortega',
    numeroIdentificacion: '987654321',
    correoElectronico: 'yeortega@sena.edu.co',
    telefono: '3007654321',
    password: 'funcionario123',
    nombreUsuario: 'yeortega',
    modalidades: ['Regular'] // Solo atiende Regular
  }
];

const insertarFuncionarios = async () => {
  try {
    // 🔥 CAMBIADO: MONGODB_URI → MONGO_URI
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    // Obtener los IDs de TipoPrograma
    const tipoCampesena = await TipoPrograma.findOne({ nombre: 'Campesena' });
    const tipoRegular = await TipoPrograma.findOne({ nombre: 'Regular' });

    if (!tipoCampesena || !tipoRegular) {
      throw new Error('No se encontraron los tipos de programa Campesena y Regular');
    }

    console.log('📌 IDs encontrados:');
    console.log('   - Campesena:', tipoCampesena._id);
    console.log('   - Regular:', tipoRegular._id);

    // Limpiar funcionarios anteriores
    await Funcionario.deleteMany({});
    console.log('🗑️ Funcionarios anteriores eliminados');

    // Insertar nuevos funcionarios
    for (const func of funcionarios) {
      // Encriptar password
      const salt = await bcrypt.genSalt(10);
      const passwordEncriptada = await bcrypt.hash(func.password, salt);

      // Obtener IDs de modalidades
      const modalidadesIds = func.modalidades.map(nombre => {
        if (nombre === 'Campesena') return tipoCampesena._id;
        if (nombre === 'Regular') return tipoRegular._id;
      });

      const nuevoFuncionario = new Funcionario({
        ...func,
        password: passwordEncriptada,
        modalidades: modalidadesIds
      });

      await nuevoFuncionario.save();
      console.log(`✅ Funcionario ${func.nombre} insertado con modalidades: ${func.modalidades.join(', ')}`);
    }

    console.log('🎉 Todos los funcionarios insertados correctamente');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

insertarFuncionarios();