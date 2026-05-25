const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { 
  getOfertasAprobadasPorTipo,
  registrarFichaSofia,
  getHistorialFichas
} = require('../controllers/ofertaController');

// Todas las rutas requieren autenticación
router.use(protect);

// Obtener ofertas aprobadas según el tipo de funcionario
router.get('/aprobadas/:tipo', getOfertasAprobadasPorTipo);

// Registrar ficha de Sofía Plus para una oferta
router.post('/:ofertaId/registrar-ficha', registrarFichaSofia);

// Obtener historial de fichas creadas por el funcionario
router.get('/historial', getHistorialFichas);

module.exports = router;