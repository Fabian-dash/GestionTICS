const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const ofertaRoutes = require('./routes/ofertaRoutes');
const datosRoutes = require('./routes/datosRoutes');
const inscripcionRoutes = require('./routes/inscripcionRoutes');
const coordinadorRoutes = require('./routes/coordinadorRoutes');
const empresaRoutes = require('./routes/empresaRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const solicitudRoutes = require('./routes/solicitudRoutes');
const ofertasFuncionarioRoutes = require('./routes/ofertasFuncionarioRoutes');
const adminRoutes = require('./routes/adminRoutes');
const funcionarioRoutes = require('./routes/funcionarioRoutes'); // ← NUEVO

const app = express();

// Configuración CORS
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));

// Middleware manual para OPTIONS
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.status(200).end();
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/ofertas', ofertaRoutes);
app.use('/api', datosRoutes);
app.use('/api/inscripciones', inscripcionRoutes);
app.use('/api/coordinadores', coordinadorRoutes);
app.use('/api/empresas', empresaRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/solicitudes', solicitudRoutes);
app.use('/api/ofertas-funcionario', ofertasFuncionarioRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/funcionarios', funcionarioRoutes); // ← NUEVO

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API Gestionytics funcionando 🚀' });
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.originalUrl} no encontrada`
  });
});

// Middleware de manejo de errores (debe ir al final)
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  
  // Error de multer por tamaño de archivo
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'El archivo es demasiado grande. Máximo permitido: 25MB'
    });
  }
  
  // Error de multer por tipo de archivo
  if (err.code === 'LIMIT_PART_COUNT' || err.message?.includes('Solo se permiten')) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Tipo de archivo no permitido'
    });
  }
  
  // Errores generales
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor'
  });
});

module.exports = app;