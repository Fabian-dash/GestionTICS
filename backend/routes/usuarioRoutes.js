const express = require('express');
const router = express.Router();
const { getInstructoresPorCoordinador } = require('../controllers/usuarioController');
const { protect } = require('../middlewares/authMiddleware');

// Esta ruta requiere autenticación
router.get('/coordinador/:coordinadorId/instructores', protect, getInstructoresPorCoordinador);

module.exports = router;