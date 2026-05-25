const Coordinador = require('../models/Coordinador');

const getCoordinadores = async (req, res) => {
  try {
    const coordinadores = await Coordinador.find();
    res.json({
      success: true,
      data: coordinadores
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getCoordinadores
};