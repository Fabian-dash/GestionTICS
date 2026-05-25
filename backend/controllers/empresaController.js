const Empresa = require('../models/Empresa');

// Crear una nueva empresa
const crearEmpresa = async (req, res) => {
  try {
    const usuario = req.usuario;
    
    const nuevaEmpresa = new Empresa({
      ...req.body,
      creado_por: usuario._id
    });

    await nuevaEmpresa.save();

    res.status(201).json({
      success: true,
      message: 'Empresa creada exitosamente',
      data: nuevaEmpresa
    });
  } catch (error) {
    console.error('Error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una empresa con este NIT'
      });
    }

    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: mensajes
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear la empresa',
      error: error.message
    });
  }
};

// Obtener todas las empresas
const getEmpresas = async (req, res) => {
  try {
    const empresas = await Empresa.find()
      .populate('creado_por', 'nombreUsuario nombre apellido')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: empresas.length,
      data: empresas
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Obtener una empresa por ID
const getEmpresaById = async (req, res) => {
  try {
    const empresa = await Empresa.findById(req.params.id)
      .populate('creado_por', 'nombreUsuario nombre apellido');

    if (!empresa) {
      return res.status(404).json({
        success: false,
        message: 'Empresa no encontrada'
      });
    }

    res.json({
      success: true,
      data: empresa
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Actualizar una empresa
const actualizarEmpresa = async (req, res) => {
  try {
    const empresa = await Empresa.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!empresa) {
      return res.status(404).json({
        success: false,
        message: 'Empresa no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Empresa actualizada correctamente',
      data: empresa
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una empresa con este NIT'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Eliminar una empresa (soft delete o físico)
const eliminarEmpresa = async (req, res) => {
  try {
    const empresa = await Empresa.findByIdAndDelete(req.params.id);

    if (!empresa) {
      return res.status(404).json({
        success: false,
        message: 'Empresa no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Empresa eliminada correctamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Buscar empresa por NIT
const getEmpresaByNit = async (req, res) => {
  try {
    const { nit } = req.params;
    const empresa = await Empresa.findOne({ nit });

    if (!empresa) {
      return res.status(404).json({
        success: false,
        message: 'Empresa no encontrada con ese NIT'
      });
    }

    res.json({
      success: true,
      data: empresa
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  crearEmpresa,
  getEmpresas,
  getEmpresaById,
  actualizarEmpresa,
  eliminarEmpresa,
  getEmpresaByNit
};