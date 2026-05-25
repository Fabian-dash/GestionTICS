const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUnificado  // Usar el nuevo login unificado
} = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUnificado);

module.exports = router;