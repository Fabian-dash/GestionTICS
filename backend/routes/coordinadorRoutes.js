const express = require('express');
const router = express.Router();
const { getCoordinadores } = require('../controllers/coordinadorController');

// Ruta pública para obtener coordinadores
router.get('/', getCoordinadores);

module.exports = router;