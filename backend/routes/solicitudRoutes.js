const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  crearSolicitud,
  getMisSolicitudes,
  getSolicitudesPendientes,
  getSolicitudById,
  eliminarSolicitud,
  rechazarSolicitud,
  aprobarSolicitud,  
  verificarArchivosSolicitud,
  descargarFicha,
  descargarCarta,
  descargarExcel,
  descargarCedulas,
  reenviarOfertaCorregida
} = require('../controllers/solicitudController');

// Rutas para instructores
router.post('/validacion', protect, crearSolicitud);
router.get('/mis-solicitudes', protect, getMisSolicitudes);  // ← NUEVA

// Rutas existentes
router.get('/pendientes', protect, getSolicitudesPendientes);
router.delete('/:id', protect, eliminarSolicitud);
router.get('/:id', protect, getSolicitudById);
router.put('/:id/rechazar', protect, rechazarSolicitud);
router.put('/:id/reenviar', protect, reenviarOfertaCorregida);  // ← NUEVA
router.get('/:id/archivos', protect, verificarArchivosSolicitud);

// ===== NUEVAS RUTAS PARA DESCARGAR ARCHIVOS =====
router.get('/:id/descargar/ficha', protect, descargarFicha);
router.get('/:id/descargar/carta', protect, descargarCarta);
router.get('/:id/descargar/excel', protect, descargarExcel);
router.get('/:id/descargar/cedulas', protect, descargarCedulas);
router.put('/:id/aprobar', protect, aprobarSolicitud);

module.exports = router;