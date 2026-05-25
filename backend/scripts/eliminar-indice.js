const { MongoClient } = require('mongodb');

async function eliminarIndice() {
  const uri = 'mongodb://localhost:27017';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('gestionytics');
    const collection = db.collection('inscripcions');
    
    // Ver índices actuales
    const indices = await collection.indexes();
    console.log('Índices actuales:', indices);
    
    // Eliminar el índice problemático
    await collection.dropIndex('link_inscripcion_1');
    console.log('✅ Índice eliminado');
    
    // Verificar que se eliminó
    const indicesFinal = await collection.indexes();
    console.log('Índices después de eliminar:', indicesFinal);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

eliminarIndice();