const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Coordinador = require('../models/Coordinador');
require('dotenv').config();

const actualizarCoordinadores = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    // Datos actualizados de los coordinadores
    const coordinadores = [
      {
        _id: "69934af7befedd227f4fd974", // ID de Jose Alirio
        nombre: "Jose Alirio Cobo Lemos",
        numeroIdentificacion: "10671330",
        correoElectronico: "jose.cobo@sena.edu.co",
        telefono: "3226784590",
        nombreUsuario: "jose.cobo",
        password: "coordinador123"
      },
      {
        _id: "69934af7befedd227f4fd975", // Franco Orlando
        nombre: "Franco Orlando Garzón Arcos",
        numeroIdentificacion: "1067399",
        correoElectronico: "franco.garzon@sena.edu.co",
        telefono: "3226784591",
        nombreUsuario: "franco.garzon",
        password: "coordinador123"
      },
      {
        _id: "69934af7befedd227f4fd976", // Javier Mauricio
        nombre: "Javier Mauricio Palomino Paredes",
        numeroIdentificacion: "10784451",
        correoElectronico: "javier.palomino@sena.edu.co",
        telefono: "3226784592",
        nombreUsuario: "javier.palomino",
        password: "coordinador123"
      },
      {
        _id: "69934af7befedd227f4fd977", // Leidy Ruiz
        nombre: "Leidy Ruiz Velasco",
        numeroIdentificacion: "10166717",
        correoElectronico: "leidy.ruiz@sena.edu.co",
        telefono: "3226784593",
        nombreUsuario: "leidy.ruiz",
        password: "coordinador123"
      }
    ];

    // Encriptar contraseñas
    for (let coord of coordinadores) {
      const salt = await bcrypt.genSalt(10);
      coord.password = await bcrypt.hash(coord.password, salt);
    }

    // Actualizar cada coordinador
    for (let coord of coordinadores) {
      await Coordinador.findByIdAndUpdate(coord._id, coord);
      console.log(`✅ Actualizado: ${coord.nombre}`);
    }

    console.log('🎉 Todos los coordinadores actualizados');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

actualizarCoordinadores();