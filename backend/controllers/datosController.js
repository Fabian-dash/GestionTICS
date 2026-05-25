// IMPORTAR MODELOS CON LOS NOMBRES CORRECTOS
const ProgramaFormacion = require('../models/ProgramaFormacion');
const Modalidad = require('../models/Modalidad');
const TipoPrograma = require('../models/TipoPrograma');
const TipoOferta = require('../models/TipoOferta');
const Municipio = require('../models/Municipio');
const ProgramaEspecial = require('../models/ProgramaEspecial');
const TipoDoc = require('../models/TipoDoc'); // NUEVO
const Caracterizacion = require('../models/Caracterizacion'); // NUEVO

const getProgramasFormacion = async (req, res) => {
  try {
    console.log('🔍 Buscando programas de formación...');
    const programas = await ProgramaFormacion.find();
    console.log(`✅ Encontrados ${programas.length} programas`);
    res.json({
      success: true,
      data: programas
    });
  } catch (error) {
    console.error('❌ Error en getProgramasFormacion:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getModalidades = async (req, res) => {
  try {
    console.log('🔍 Buscando modalidades...');
    const modalidades = await Modalidad.find();
    console.log(`✅ Encontradas ${modalidades.length} modalidades`);
    res.json({
      success: true,
      data: modalidades
    });
  } catch (error) {
    console.error('❌ Error en getModalidades:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getTiposPrograma = async (req, res) => {
  try {
    console.log('🔍 Buscando tipos de programa...');
    const tipos = await TipoPrograma.find();
    console.log(`✅ Encontrados ${tipos.length} tipos de programa`);
    res.json({
      success: true,
      data: tipos
    });
  } catch (error) {
    console.error('❌ Error en getTiposPrograma:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getTiposOferta = async (req, res) => {
  try {
    console.log('🔍 Buscando tipos de oferta...');
    const tipos = await TipoOferta.find();
    console.log(`✅ Encontrados ${tipos.length} tipos de oferta`);
    res.json({
      success: true,
      data: tipos
    });
  } catch (error) {
    console.error('❌ Error en getTiposOferta:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getMunicipios = async (req, res) => {
  try {
    console.log('🔍 Buscando municipios...');
    const municipios = await Municipio.find();
    console.log(`✅ Encontrados ${municipios.length} municipios`);
    res.json({
      success: true,
      data: municipios
    });
  } catch (error) {
    console.error('❌ Error en getMunicipios:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getProgramasEspeciales = async (req, res) => {
  try {
    console.log('🔍 Buscando programas especiales...');
    const programas = await ProgramaEspecial.find();
    console.log(`✅ Encontrados ${programas.length} programas especiales`);
    res.json({
      success: true,
      data: programas
    });
  } catch (error) {
    console.error('❌ Error en getProgramasEspeciales:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ===== NUEVAS FUNCIONES PARA INSCRIPCIONES =====

const getTiposDocumento = async (req, res) => {
  try {
    console.log('🔍 Buscando tipos de documento...');
    const tipos = await TipoDoc.find();
    console.log(`✅ Encontrados ${tipos.length} tipos de documento`);
    res.json({
      success: true,
      data: tipos
    });
  } catch (error) {
    console.error('❌ Error en getTiposDocumento:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getCaracterizaciones = async (req, res) => {
  try {
    console.log('🔍 Buscando caracterizaciones...');
    const caracterizaciones = await Caracterizacion.find();
    console.log(`✅ Encontradas ${caracterizaciones.length} caracterizaciones`);
    res.json({
      success: true,
      data: caracterizaciones
    });
  } catch (error) {
    console.error('❌ Error en getCaracterizaciones:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getProgramasFormacion,
  getModalidades,
  getTiposPrograma,
  getTiposOferta,
  getMunicipios,
  getProgramasEspeciales,
  // NUEVAS EXPORTACIONES
  getTiposDocumento,
  getCaracterizaciones
};