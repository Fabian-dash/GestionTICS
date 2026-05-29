const mongoose = require('mongoose');
const EstadoOferta = require('../models/EstadoOferta');
require('dotenv').config();

const estados = [
  {
    codigo: 'borrador',
    nombre: 'Borrador',
    descripcion: 'El instructor está creando la oferta',
    color: '#95a5a6',
    orden: 1,
    permite_edicion: true,
    notificar_instructor: false
  },
  {
    codigo: 'pendiente',
    nombre: 'Pendiente',
    descripcion: 'Enviada al coordinador, esperando revisión',
    color: '#f39c12',
    orden: 2,
    permite_edicion: false,
    notificar_instructor: false,
    notificar_coordinador: true
  },
  {
    codigo: 'rechazada',
    nombre: 'Rechazada',
    descripcion: 'El coordinador rechazó la oferta',
    color: '#e74c3c',
    orden: 3,
    permite_edicion: true,
    notificar_instructor: true,
    notificar_coordinador: false
  },
  {
    codigo: 'aprobada',
    nombre: 'Aprobada',
    descripcion: 'El coordinador aprobó la oferta',
    color: '#27ae60',
    orden: 4,
    permite_edicion: false,
    notificar_instructor: true,
    notificar_coordinador: false,
    notificar_funcionario: true
  },
  // ← NUEVO: Oferta aprobada por coordinador y puesta en lista de espera
  {
    codigo: 'lista_espera',
    nombre: 'Lista de Espera',
    descripcion: 'Oferta aprobada por coordinador, en lista de espera para funcionario',
    color: '#06b6d4',
    orden: 5,
    permite_edicion: false,
    notificar_instructor: true,
    notificar_funcionario: true
  },
  {
    codigo: 'ficha_creada',
    nombre: 'Ficha Creada',
    descripcion: 'El funcionario creó la ficha en Sofía Plus',
    color: '#2980b9',
    orden: 5,
    permite_edicion: false,
    notificar_instructor: true
  },
  {
    codigo: 'con_inscritos',
    nombre: 'Con Inscritos',
    descripcion: 'Ya hay aprendices inscritos',
    color: '#8e44ad',
    orden: 6,
    permite_edicion: false,
    notificar_instructor: true
  },
  // ← NUEVO: el funcionario tomó la oferta y está trabajando en ella
  {
    codigo: 'en_proceso',
    nombre: 'En Proceso',
    descripcion: 'Oferta tomada por un funcionario, en proceso',
    color: '#e67e22',
    orden: 7,
    permite_edicion: false,
    notificar_instructor: true,
    notificar_funcionario: true
  },
  // ← NUEVO: el funcionario marcó la oferta como completada
  {
    codigo: 'completado',
    nombre: 'Completado',
    descripcion: 'Oferta completada por el funcionario',
    color: '#1abc9c',
    orden: 8,
    permite_edicion: false,
    notificar_instructor: true,
    notificar_funcionario: false
  },
  {
    codigo: 'completada',
    nombre: 'Completada',
    descripcion: 'Aprendices matriculados, oferta finalizada',
    color: '#2c3e50',
    orden: 9,
    permite_edicion: false,
    notificar_instructor: true
  }
];

const insertarEstados = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    // Limpiar estados anteriores
    await EstadoOferta.deleteMany({});
    console.log('🗑️ Estados anteriores eliminados');

    // Insertar nuevos estados
    const result = await EstadoOferta.insertMany(estados);
    console.log(`✅ ${result.length} estados insertados:`);
    result.forEach(estado => {
      console.log(`   - ${estado.nombre} (${estado.codigo})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

insertarEstados();