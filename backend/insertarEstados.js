/**
 * insertarEstados.js
 * Ejecutar UNA sola vez: node insertarEstados.js
 * Inserta los estados que faltan sin duplicar los que ya existen.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const EstadoOferta = require('./models/EstadoOferta');

const ESTADOS = [
  // ── Instructor ──────────────────────────────────────────────────
  { codigo: 'borrador',               nombre: 'Borrador',                orden: 1,  descripcion: 'Oferta en edición por el instructor' },
  { codigo: 'pendiente_coordinador',  nombre: 'Pendiente coordinador',   orden: 2,  descripcion: 'Enviada al coordinador para revisión' },
  { codigo: 'rechazada',              nombre: 'Rechazada',               orden: 3,  descripcion: 'Rechazada por el coordinador' },

  // ── Coordinador aprueba → entra al flujo del funcionario ────────
  { codigo: 'lista_espera',           nombre: 'Lista de espera',         orden: 4,  descripcion: 'Aprobada por coordinador, esperando que un funcionario la revise' },

  // ── Flujo del funcionario ────────────────────────────────────────
  { codigo: 'en_proceso',             nombre: 'En proceso',              orden: 5,  descripcion: 'El funcionario está revisando la oferta' },
  { codigo: 'a_corregir',             nombre: 'A corregir',              orden: 6,  descripcion: 'El funcionario detectó errores, el instructor debe corregir' },
  { codigo: 'creada',                 nombre: 'Creada',                  orden: 7,  descripcion: 'Oferta aprobada por funcionario, ficha generada' },
  { codigo: 'matriculada',            nombre: 'Matriculada',             orden: 8,  descripcion: 'Aprendices matriculados formalmente' },
  { codigo: 'completado',             nombre: 'Completada',              orden: 9,  descripcion: 'Proceso finalizado' },
];

const insertar = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    for (const estado of ESTADOS) {
      const existe = await EstadoOferta.findOne({ codigo: estado.codigo });
      if (existe) {
        console.log(`⏭️  Ya existe: ${estado.codigo}`);
      } else {
        await EstadoOferta.create(estado);
        console.log(`✅ Creado: ${estado.codigo} — ${estado.nombre}`);
      }
    }

    console.log('\n🎉 Estados sincronizados correctamente.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
};

insertar();