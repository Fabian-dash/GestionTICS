const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const ofertaController = require('../controllers/ofertaController');
const { protect } = require('../middlewares/authMiddleware');

// Configurar campos de archivos
const uploadFields = upload.fields([
  { name: 'firma_digital_pdf', maxCount: 1 },
  { name: 'carta_pdf', maxCount: 1 }
]);

// Ruta para crear oferta con archivos
router.post('/', protect, uploadFields, ofertaController.crearOferta);

// Rutas existentes...
router.get('/', protect, ofertaController.obtenerOfertas);
router.get('/mis-ofertas', protect, ofertaController.obtenerMisOfertas);
router.get('/link/:codigo', ofertaController.getOfertaPorLink);
router.get('/coordinador/:coordinadorId', protect, ofertaController.obtenerOfertasPorCoordinador);
router.get('/:id', protect, ofertaController.obtenerOfertaPorId);
router.put('/:id', protect, ofertaController.actualizarOferta);
router.delete('/:id', protect, ofertaController.eliminarOferta);
router.get('/:id/pdf', protect, ofertaController.descargarPDF);

// ✅ NUEVA RUTA CORREGIDA - Usando ofertaController
router.get('/:id/exportar-excel', protect, ofertaController.exportarExcelOfertaCompleta);

module.exports = router;