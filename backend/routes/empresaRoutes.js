const express = require('express');
const router = express.Router();
const {
  crearEmpresa,
  getEmpresas,
  getEmpresaById,
  actualizarEmpresa,
  eliminarEmpresa,
  getEmpresaByNit
} = require('../controllers/empresaController');
const { protect } = require('../middlewares/authMiddleware');

// Todas las rutas de empresas requieren autenticación
router.post('/', protect, crearEmpresa);
router.get('/', protect, getEmpresas);
router.get('/nit/:nit', protect, getEmpresaByNit);
router.get('/:id', protect, getEmpresaById);
router.put('/:id', protect, actualizarEmpresa);
router.delete('/:id', protect, eliminarEmpresa);

module.exports = router;