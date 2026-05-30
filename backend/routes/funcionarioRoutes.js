const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  registrarFuncionario,
  getFuncionarios,
  getFuncionariosPorModalidad,
  getFuncionariosParaOferta,
  revisarOferta,
  solicitarCorreccion,
  aprobarOferta,
  matricularOferta,
  aprobarYMatricularOferta,   // ✅ NUEVA IMPORTACIÓN
  completarOferta,
  getNovedadesAprendices,
} = require('../controllers/funcionarioController');

// ── Públicas ────────────────────────────────────────────────────────────────
router.post('/registro', registrarFuncionario);

// ── Consultas ────────────────────────────────────────────────────────────────
router.get('/',                              protect, getFuncionarios);
router.get('/modalidad/:modalidadId',        protect, getFuncionariosPorModalidad);
router.get('/oferta/:ofertaId',              protect, getFuncionariosParaOferta);

// ── Flujo de estados ─────────────────────────────────────────────────────────
//   lista_espera → en_proceso
router.patch('/revisar/:ofertaId',                protect, revisarOferta);
//   en_proceso   → a_corregir
router.patch('/solicitar-correccion/:ofertaId',   protect, solicitarCorreccion);
//   en_proceso   → creada
router.patch('/aprobar/:ofertaId',                protect, aprobarOferta);
//   creada       → matriculada
router.patch('/matricular/:ofertaId',             protect, matricularOferta);
//   en_proceso (corregida) → matriculada en un paso  ✅ NUEVA RUTA
router.patch('/aprobar-y-matricular/:ofertaId',   protect, aprobarYMatricularOferta);
//   matriculada  → completado
router.patch('/completar/:ofertaId',              protect, completarOferta);

// Obtener novedades por aprendiz (para el instructor)
router.get('/novedades-aprendices/:ofertaId',     protect, getNovedadesAprendices);

module.exports = router;