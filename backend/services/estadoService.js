const EstadoOferta = require('../models/EstadoOferta');
const CreacionOferta = require('../models/CreacionOferta');

const cambiarEstado = async (ofertaId, codigoEstado, usuario, comentario = '') => {
  try {
    console.log('🔄 Intentando cambiar estado:');
    console.log('   - ofertaId:', ofertaId);
    console.log('   - codigoEstado:', codigoEstado);
    console.log('   - usuarioId:', usuario?._id);
    console.log('   - usuarioTipo:', usuario?.tipo || usuario?.constructor?.modelName);

    // Buscar el estado por su código
    const estado = await EstadoOferta.findOne({ codigo: codigoEstado });
    
    console.log('   - Estado encontrado:', estado ? estado.nombre : 'NO ENCONTRADO');

    if (!estado) {
      throw new Error(`Estado ${codigoEstado} no encontrado en la base de datos`);
    }

    // Buscar la oferta
    const oferta = await CreacionOferta.findById(ofertaId);
    
    console.log('   - Oferta encontrada:', oferta ? 'Sí' : 'No');

    if (!oferta) {
      throw new Error('Oferta no encontrada');
    }

    // ===== ESTA ES LA PARTE QUE DEBES REEMPLAZAR =====
    // Obtener el estado actual de la oferta
    let estadoActual = null;
    if (oferta.estado) {
      estadoActual = await EstadoOferta.findById(oferta.estado);
    }

    console.log('   - Estado actual:', estadoActual ? estadoActual.nombre : 'No tiene estado');

    // Si no hay estado actual, asignar uno por defecto (borrador)
    if (!estadoActual) {
      estadoActual = await EstadoOferta.findOne({ codigo: 'borrador' });
      console.log('   - Asignando estado por defecto: borrador');
      
      if (!estadoActual) {
        throw new Error('No se encontró el estado por defecto "borrador" en la base de datos');
      }
      
      // Actualizar la oferta con el estado por defecto
      oferta.estado = estadoActual._id;
      await oferta.save();
    }
    // ===== FIN DE LA PARTE REEMPLAZADA =====

    // Verificar si la transición está permitida
    const estadosPermitidos = await obtenerEstadosPermitidos(estadoActual.codigo, usuario.tipo || 'coordinador');
    console.log('   - Estados permitidos:', estadosPermitidos.map(e => e.codigo));

    const transicionPermitida = estadosPermitidos.some(e => e.codigo === codigoEstado);
    
    if (!transicionPermitida) {
      throw new Error(`No tienes permiso para cambiar de ${estadoActual.codigo} a ${codigoEstado}`);
    }

    // Guardar estado anterior
    const estadoAnterior = oferta.estado;

    // Actualizar estado
    oferta.estado = estado._id;

    // Agregar al historial
    if (!oferta.historial_estados) {
      oferta.historial_estados = [];
    }

    oferta.historial_estados.push({
      estado: estado._id,
      comentario,
      cambiado_por: usuario._id,
      cambiado_por_modelo: usuario.constructor.modelName || usuario.tipo || 'Usuario',
      fecha: new Date()
    });

    await oferta.save();
    console.log('✅ Estado actualizado correctamente');

    // Disparar notificaciones según el estado
    if (estado.notificar_instructor) {
      console.log(`Notificando a instructor sobre cambio a ${estado.codigo}`);
    }
    
    if (estado.notificar_coordinador) {
      console.log(`Notificando a coordinador sobre cambio a ${estado.codigo}`);
    }
    
    if (estado.notificar_funcionario) {
      console.log(`Notificando a funcionario sobre cambio a ${estado.codigo}`);
    }

    return {
      success: true,
      estadoAnterior,
      estadoNuevo: estado._id,
      historial: oferta.historial_estados
    };

  } catch (error) {
    console.error('❌ Error cambiando estado:', error);
    throw error;
  }
};

// El resto de las funciones (obtenerEstadosPermitidos, obtenerHistorial, obtenerEstadoActual) quedan igual
const obtenerEstadosPermitidos = async (estadoActualCodigo, rolUsuario) => {
  // Definir transiciones permitidas según el rol
  const transiciones = {
    'borrador': {
      'instructor': ['pendiente'],
      'coordinador': ['rechazada'],
      'funcionario': []
    },
    'pendiente': {
      'instructor': [],
      'coordinador': ['rechazada', 'aprobada'],
      'funcionario': []
    },
    'rechazada': {
      'instructor': ['pendiente'],
      'coordinador': [],
      'funcionario': []
    },
    'aprobada': {
      'instructor': [],
      'coordinador': [],
      'funcionario': ['ficha_creada', 'rechazada']
    },
    'ficha_creada': {
      'instructor': [],
      'coordinador': [],
      'funcionario': ['con_inscritos', 'completada']
    },
    'con_inscritos': {
      'instructor': [],
      'coordinador': [],
      'funcionario': ['completada']
    },
    'completada': {
      'instructor': [],
      'coordinador': [],
      'funcionario': []
    }
  };

  if (!transiciones[estadoActualCodigo] || !transiciones[estadoActualCodigo][rolUsuario]) {
    return [];
  }

  const estadosPermitidos = transiciones[estadoActualCodigo][rolUsuario];
  
  const estados = await EstadoOferta.find({
    codigo: { $in: estadosPermitidos },
    activo: true
  }).sort({ orden: 1 });

  return estados;
};

const obtenerHistorial = async (ofertaId) => {
  try {
    const oferta = await CreacionOferta.findById(ofertaId)
      .populate({
        path: 'historial_estados.estado',
        model: 'EstadoOferta'
      })
      .populate({
        path: 'historial_estados.cambiado_por',
        refPath: 'historial_estados.cambiado_por_modelo'
      });
    
    if (!oferta) {
      throw new Error('Oferta no encontrada');
    }

    return oferta.historial_estados.sort((a, b) => b.fecha - a.fecha);
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    throw error;
  }
};

const obtenerEstadoActual = async (ofertaId) => {
  try {
    const oferta = await CreacionOferta.findById(ofertaId)
      .populate('estado');
    
    if (!oferta) {
      throw new Error('Oferta no encontrada');
    }

    return oferta.estado;
  } catch (error) {
    console.error('Error obteniendo estado actual:', error);
    throw error;
  }
};

module.exports = {
  cambiarEstado,
  obtenerEstadosPermitidos,
  obtenerHistorial,
  obtenerEstadoActual
};