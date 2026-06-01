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

// ── El frontend llama a /todas/:tipo ─────────────────────
// Alias que apunta a la misma función que /aprobadas/:tipo
router.get('/todas/:tipo',    getOfertasAprobadasPorTipo);

// Ruta original (se mantiene para no romper nada)
router.get('/aprobadas/:tipo', getOfertasAprobadasPorTipo);

// Registrar ficha de Sofía Plus para una oferta
router.post('/:ofertaId/registrar-ficha', registrarFichaSofia);

// Obtener historial de fichas creadas por el funcionario
router.get('/historial', getHistorialFichas);

module.exports = router;