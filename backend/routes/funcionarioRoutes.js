const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  registrarFuncionario,
  getFuncionarios,
  getFuncionariosPorModalidad,
  getFuncionariosParaOferta,
  tomarOferta,
  completarOferta
} = require('../controllers/funcionarioController');

// Rutas públicas
router.post('/registro', registrarFuncionario);

// Rutas protegidas
router.get('/', protect, getFuncionarios);
router.get('/modalidad/:modalidadId', protect, getFuncionariosPorModalidad);
router.get('/oferta/:ofertaId', protect, getFuncionariosParaOferta);

// Nuevas rutas: tomar y completar oferta
router.patch('/tomar/:ofertaId', protect, tomarOferta);
router.patch('/completar/:ofertaId', protect, completarOferta);

module.exports = router;