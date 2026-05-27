const express = require('express');
const router  = express.Router();
const { protect }        = require('../middlewares/authMiddleware');
const { protectAdmin }   = require('../middlewares/authMiddleware');
const {
  crearAdmin,
  listarUsuarios,
  aprobarUsuario,
  rechazarUsuario,
  eliminarUsuario,
} = require('../controllers/adminController');

// Crear admin (solo usar una vez, luego bloquear o proteger con clave)
router.post('/crear', crearAdmin);

// Rutas protegidas — solo admin
router.get('/usuarios',                    protectAdmin, listarUsuarios);
router.put('/usuarios/:tipo/:id/aprobar',  protectAdmin, aprobarUsuario);
router.put('/usuarios/:tipo/:id/rechazar', protectAdmin, rechazarUsuario);
router.delete('/usuarios/:tipo/:id',       protectAdmin, eliminarUsuario);

module.exports = router;