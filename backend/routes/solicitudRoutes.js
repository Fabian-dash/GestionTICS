const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  crearSolicitud,
  getSolicitudesPendientes,
  getSolicitudById,
  rechazarSolicitud,
  aprobarSolicitud,  
  verificarArchivosSolicitud,
  descargarFicha,
  descargarCarta,
  descargarExcel,
  descargarCedulas
} = require('../controllers/solicitudController');

// Rutas existentes
router.post('/validacion', protect, crearSolicitud);
router.get('/pendientes', protect, getSolicitudesPendientes);
router.get('/:id', protect, getSolicitudById);
router.put('/:id/rechazar', protect, rechazarSolicitud);
router.get('/:id/archivos', protect, verificarArchivosSolicitud);

// ===== NUEVAS RUTAS PARA DESCARGAR ARCHIVOS =====
router.get('/:id/descargar/ficha', protect, descargarFicha);
router.get('/:id/descargar/carta', protect, descargarCarta);
router.get('/:id/descargar/excel', protect, descargarExcel);
router.get('/:id/descargar/cedulas', protect, descargarCedulas);
router.put('/:id/aprobar', protect, aprobarSolicitud);

module.exports = router;