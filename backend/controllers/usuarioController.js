const User = require('../models/User');

// Obtener instructores asignados a un coordinador
const getInstructoresPorCoordinador = async (req, res) => {
  try {
    const { coordinadorId } = req.params;
    
    const instructores = await User.find({ 
      coordinadorAsignado: coordinadorId 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: instructores.length,
      data: instructores
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getInstructoresPorCoordinador
};