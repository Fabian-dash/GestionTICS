const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  registrarFuncionario,
  getFuncionarios,
  getFuncionariosPorModalidad,
  getFuncionariosParaOferta
} = require('../controllers/funcionarioController');

// Rutas públicas
router.post('/registro', registrarFuncionario);

// Rutas protegidas
router.get('/', protect, getFuncionarios);
router.get('/modalidad/:modalidadId', protect, getFuncionariosPorModalidad);
router.get('/oferta/:ofertaId', protect, getFuncionariosParaOferta);

module.exports = router;