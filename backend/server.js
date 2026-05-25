const app = require('./app');
const mongoose = require('mongoose');
require('dotenv').config();

// IMPORTAR TODOS LOS MODELOS
require('./models/TipoDoc');
require('./models/User');
require('./models/Coordinador');
require('./models/ProgramaFormacion');
require('./models/Modalidad');
require('./models/TipoPrograma');
require('./models/TipoOferta');
require('./models/Municipio');
require('./models/ProgramaEspecial');
require('./models/Empresa');
require('./models/Caracterizacion');
require('./models/Instructor'); // <-- CAMBIADO de InstructorCampesena a Instructor
require('./models/CreacionOferta');

const PORT = process.env.PORT || 4000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB conectado');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    });
  })
  .catch((error) => {
    console.log('❌ Error conectando a MongoDB:');
    console.log(error);
  });