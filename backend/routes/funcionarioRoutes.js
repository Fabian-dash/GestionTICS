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
  completarOferta,
} = require('../controllers/funcionarioController');

// ── Públicas ────────────────────────────────────────────────────────────────
router.post('/registro', registrarFuncionario);

// ── Consultas ────────────────────────────────────────────────────────────────
router.get('/',                              protect, getFuncionarios);
router.get('/modalidad/:modalidadId',        protect, getFuncionariosPorModalidad);
router.get('/oferta/:ofertaId',              protect, getFuncionariosParaOferta);

// ── Flujo de estados ─────────────────────────────────────────────────────────
//   lista_espera → en_proceso
router.patch('/revisar/:ofertaId',           protect, revisarOferta);
//   en_proceso   → a_corregir
router.patch('/solicitar-correccion/:ofertaId', protect, solicitarCorreccion);
//   en_proceso   → creada
router.patch('/aprobar/:ofertaId',           protect, aprobarOferta);
//   creada       → matriculada
router.patch('/matricular/:ofertaId',        protect, matricularOferta);
//   matriculada  → completado
router.patch('/completar/:ofertaId',         protect, completarOferta);

module.exports = router;