const express = require('express');
const router = express.Router();
const {
  getProgramasFormacion,
  getModalidades,
  getTiposPrograma,
  getTiposOferta,
  getMunicipios,
  getProgramasEspeciales,
  getTiposDocumento,
  getCaracterizaciones
} = require('../controllers/datosController');
const { protect } = require('../middlewares/authMiddleware');

// ===== RUTAS PÚBLICAS (para formulario de inscripción) =====
router.get('/tipos-documento', getTiposDocumento);        // ← SIN PROTECT
router.get('/caracterizaciones', getCaracterizaciones);  // ← SIN PROTECT

// ===== RUTAS PROTEGIDAS (requieren autenticación) =====
router.get('/programas-formacion', protect, getProgramasFormacion);
router.get('/tipos-programa', protect, getTiposPrograma);
router.get('/tipos-oferta', protect, getTiposOferta);
router.get('/municipios', protect, getMunicipios);
router.get('/programas-especiales', protect, getProgramasEspeciales);

// ===== RUTAS PÚBLICAS ADICIONALES =====
router.get('/modalidades', getModalidades);

module.exports = router;