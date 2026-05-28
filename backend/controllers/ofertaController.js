const CreacionOferta = require('../models/CreacionOferta');
const Instructor = require('../models/Instructor');
const Inscripcion = require('../models/Inscripcion');
const SolicitudValidacion = require('../models/SolicitudValidacion');
const { generarFichaCaracterizacion } = require('../services/pdfGenerator');
const fs = require('fs');
const EstadoOferta = require('../models/EstadoOferta');
const { exportarExcelOferta } = require('../services/exportarExcelOferta');


const path = require('path');

const crearOferta = async (req, res) => {
  try {
    const usuario = req.usuario;
    
    console.log('🚀 INICIO - Crear oferta');
    console.log('Usuario autenticado:', {
      id: usuario._id,
      nombre: usuario.nombre
    });

    // ===== OBTENER MODO DEL BODY =====
    const modo = req.body.modo;
    console.log('📌 Modo recibido:', modo);
    console.log('📌 Body completo:', req.body);

    // Procesar archivos si existen
    const archivos = {};
    if (req.files) {
      console.log('📁 Archivos recibidos:', Object.keys(req.files));
      if (req.files.firma_digital_pdf) {
        archivos.firma_digital_pdf = req.files.firma_digital_pdf[0].path;
      }
      if (req.files.carta_pdf) {
        archivos.carta_pdf = req.files.carta_pdf[0].path;
      }
    }

    // Generar link único para inscripciones
    const uniqueCode = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
    const linkInscripciones = `/inscribirse/${uniqueCode}`;
    console.log('🔗 Link generado:', linkInscripciones);

    // ===== PROCESAR HORARIO DIAS DE FORMA SEGURA =====
    let horarioDias = [];
    if (req.body.horario_dias) {
      try {
        horarioDias = JSON.parse(req.body.horario_dias);
        console.log('📅 Días parseados:', horarioDias);
      } catch (e) {
        console.error('❌ Error parseando horario_dias:', req.body.horario_dias);
        horarioDias = [];
      }
    }

    // Verificar campos requeridos
    console.log('🔍 Verificando campos:');
    console.log('- programa_formacion:', req.body.programa_formacion);
    console.log('- modalidad:', req.body.modalidad);
    console.log('- tipo_programa:', req.body.tipo_programa);
    console.log('- tipo_oferta:', req.body.tipo_oferta);
    console.log('- empresa_solicitante:', req.body.empresa_solicitante);
    console.log('- programa_especial:', req.body.programa_especial);
    console.log('- firma_digital_pdf archivos:', req.files?.firma_digital_pdf ? 'SÍ' : 'NO');
    console.log('- carta_pdf archivos:', req.files?.carta_pdf ? 'SÍ' : 'NO');

    // ===== NUEVO: Buscar el estado "borrador" =====
    console.log('🔍 Buscando estado "borrador"...');
    const estadoBorrador = await EstadoOferta.findOne({ codigo: 'borrador' });
    if (!estadoBorrador) {
      throw new Error('No se encontró el estado "borrador" en la base de datos. Ejecuta el script insertarEstados.js');
    }
    console.log('✅ Estado encontrado:', estadoBorrador.codigo, estadoBorrador._id);

    // Crear la oferta principal
    console.log('📝 Creando oferta...');
    const nuevaOferta = new CreacionOferta({
      programa_formacion: req.body.programa_formacion,
      modalidad: req.body.modalidad,
      tipo_programa: req.body.tipo_programa,
      tipo_oferta: req.body.tipo_oferta,
      cupo_maximo: parseInt(req.body.cupo_maximo),
      ambiente: { nombre: req.body.ambiente_nombre },
      fechas: {
        inicio: req.body.fechas_inicio,
        fin: req.body.fechas_fin
      },
      ubicacion: {
        departamento: req.body.ubicacion_departamento,
        municipio: req.body.ubicacion_municipio,
        direccion: req.body.ubicacion_direccion
      },
      empresa_solicitante: req.body.empresa_solicitante,
      subsector_economico: { nombre: req.body.subsector_nombre },
      programa_especial: req.body.programa_especial || null,
      convenio: { nombre: req.body.convenio_nombre },
      horario: {
        hora_inicio: req.body.horario_hora_inicio,
        hora_fin: req.body.horario_hora_fin,
        dias: horarioDias
      },
      duracion_meses: parseInt(req.body.duracion_meses) || 12,
      es_campesena: modo === 'campesena',
      coordinador_asignado: usuario.coordinadorAsignado,
      creado_por: usuario._id,
      link_inscripciones: linkInscripciones,
      firma_digital_pdf: archivos.firma_digital_pdf,
      carta_pdf: archivos.carta_pdf,
      estado: estadoBorrador._id
    });

    console.log('💾 Guardando oferta...');
    const ofertaGuardada = await nuevaOferta.save();
    console.log('✅ Oferta guardada con ID:', ofertaGuardada._id);

    // ===== SI ES CAMPESENA, GUARDAR INSTRUCTORES =====
    if (modo === 'campesena' && req.body.instructores) {
      console.log('📥 Instructores recibidos (raw):', req.body.instructores);
      
      const instructoresData = JSON.parse(req.body.instructores);
      console.log('📥 Instructores parseados:', instructoresData.length);
      
      const instructoresPromises = instructoresData.map(async (instructor, idx) => {
        console.log(`📝 Guardando instructor ${idx + 1}:`, instructor.nombre);
        const nuevoInstructor = new Instructor({
          oferta_id: ofertaGuardada._id,
          tipo: instructor.tipo,
          tipo_identificacion: instructor.tipo_identificacion,
          identificacion: instructor.identificacion,
          nombre: instructor.nombre,
          correo: instructor.correo,
          celular: instructor.celular,
          programacion: instructor.programacion || []
        });
        return nuevoInstructor.save();
      });
      
      await Promise.all(instructoresPromises);
      console.log(`✅ ${instructoresData.length} instructores guardados`);
    }

    // Poblar la oferta para la respuesta
    console.log('🔍 Poblando oferta...');
    const ofertaPoblada = await CreacionOferta.findById(ofertaGuardada._id)
      .populate('programa_formacion')
      .populate('modalidad')
      .populate('tipo_programa')
      .populate('tipo_oferta')
      .populate('ubicacion.municipio')
      .populate('programa_especial')
      .populate('creado_por', 'nombre apellido nombreUsuario')
      .populate('empresa_solicitante', 'nombre nit')
      .populate('coordinador_asignado', 'nombre');

    // Generar PDF
    try {
      console.log('📄 Generando PDF...');
      const pdfBuffer = await generarFichaCaracterizacion(ofertaPoblada);
      const pdfPath = path.join(__dirname, '../uploads/fichas', `ficha-${ofertaGuardada._id}.pdf`);
      const pdfDir = path.dirname(pdfPath);
      
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }
      
      fs.writeFileSync(pdfPath, pdfBuffer);
      console.log(`✅ PDF generado: ${pdfPath}`);
    } catch (pdfError) {
      console.error('❌ Error generando PDF:', pdfError);
    }

    console.log('🎉 Oferta creada exitosamente');
    res.status(201).json({
      success: true,
      message: 'Oferta creada correctamente',
      data: ofertaPoblada,
      archivos
    });
    
  } catch (error) {
    console.error('❌❌❌ ERROR DETALLADO ❌❌❌');
    console.error('Nombre del error:', error.name);
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);
    if (error.errors) {
      console.error('Errores de validación:', Object.keys(error.errors).map(key => ({
        campo: key,
        mensaje: error.errors[key].message
      })));
    }
    
    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: mensajes
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al crear la oferta',
      error: error.message
    });
  }
};


// Obtener todas las ofertas
const obtenerOfertas = async (req, res) => {
  try {
    const ofertas = await CreacionOferta.find()
      .populate('programa_formacion')
      .populate('modalidad')
      .populate('tipo_programa')
      .populate('tipo_oferta')
      .populate('ubicacion.municipio')
      .populate('programa_especial')
      .populate('estado')
      .populate({
        path: 'creado_por',
        select: 'nombre apellido nombreUsuario numeroIdentificacion correoElectronico'
      })
      .populate({
        path: 'empresa_solicitante',
        select: 'nombre nit'
      })
      .populate('coordinador_asignado', 'nombre')
      .select('+carta_pdf +firma_digital_pdf')  // ← AGREGAR
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: ofertas.length,
      data: ofertas
    });
  } catch (error) {
    console.error('❌ Error al obtener ofertas:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las ofertas',
      error: error.message
    });
  }
};


const exportarExcelOfertaCompleta = async (req, res) => {
  try {
    const { id } = req.params;
    
    const oferta = await CreacionOferta.findById(id)
      .populate('programa_formacion')
      .populate('tipo_oferta')
      .populate('programa_especial')
      .populate('empresa_solicitante')
      .populate('ubicacion.municipio')
      .populate('creado_por')
      .populate('coordinador_asignado');
    
    if (!oferta) {
      return res.status(404).json({ message: 'Oferta no encontrada' });
    }

    // Si es Campesena, buscar instructores
    let instructores = [];
    if (oferta.es_campesena) {
      instructores = await Instructor.find({ oferta_id: oferta._id });
    }

    await exportarExcelOferta(oferta, instructores, res);

  } catch (error) {
    console.error('Error exportando Excel:', error);
    res.status(500).json({ message: error.message });
  }
};


// Obtener una oferta por ID
const obtenerOfertaPorId = async (req, res) => {
  try {
    const oferta = await CreacionOferta.findById(req.params.id)
      .populate('programa_formacion')
      .populate('modalidad')
      .populate('tipo_programa')
      .populate('tipo_oferta')
      .populate('ubicacion.municipio')
      .populate('programa_especial')
      .populate('estado')
      .populate({
        path: 'creado_por',
        select: 'nombre apellido nombreUsuario numeroIdentificacion correoElectronico'
      })
      .populate({
        path: 'empresa_solicitante',
        select: 'nombre nit'
      })
      .populate('coordinador_asignado', 'nombre');

    if (!oferta) {
      return res.status(404).json({
        success: false,
        message: 'Oferta no encontrada'
      });
    }

    // Contar inscritos
    const Inscripcion = require('../models/Inscripcion');
    const inscritos_count = await Inscripcion.countDocuments({ oferta_id: oferta._id });
    
    // Agregar conteo a la oferta
    const ofertaConConteo = oferta.toObject();
    ofertaConConteo.inscritos_count = inscritos_count;

    res.json({
      success: true,
      data: ofertaConConteo
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la oferta',
      error: error.message
    });
  }
};

// Obtener ofertas del usuario actual
const obtenerMisOfertas = async (req, res) => {
  try {
    const usuario = req.usuario;
    const Inscripcion = require('../models/Inscripcion');
    
    const ofertas = await CreacionOferta.find({ 
      creado_por: usuario._id 
    })
      .populate('programa_formacion')
      .populate('modalidad')
      .populate('tipo_programa')
      .populate('tipo_oferta')
      .populate('ubicacion.municipio')
      .populate('programa_especial')
      .populate('estado')
      .populate({
        path: 'empresa_solicitante',
        select: 'nombre nit'
      })
      .populate('coordinador_asignado', 'nombre')
      .select('+carta_pdf +firma_digital_pdf')
      .sort({ createdAt: -1 });

    // ===== AGREGAR CONTADOR DE INSCRITOS A CADA OFERTA =====
    const ofertasConInscritos = await Promise.all(
      ofertas.map(async (oferta) => {
        const inscritos = await Inscripcion.countDocuments({ oferta_id: oferta._id });
        const ofertaObj = oferta.toObject();
        ofertaObj.inscritos_count = inscritos;
        return ofertaObj;
      })
    );

    res.json({
      success: true,
      count: ofertasConInscritos.length,
      data: ofertasConInscritos
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tus ofertas',
      error: error.message
    });
  }
};

// Buscar oferta por link de inscripción
const getOfertaPorLink = async (req, res) => {
  try {
    const { codigo } = req.params;
    const linkCompleto = `/inscribirse/${codigo}`;
    
    console.log('🔍 Buscando oferta con link:', linkCompleto);
    
    const oferta = await CreacionOferta.findOne({ link_inscripciones: linkCompleto })
      .populate('programa_formacion')
      .populate('modalidad')
      .populate('ubicacion.municipio');

    if (!oferta) {
      return res.status(404).json({
        success: false,
        message: 'Link de inscripción no válido'
      });
    }

    res.json({
      success: true,
      data: oferta
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// =============================================
// FUNCIONES PARA FUNCIONARIOS
// =============================================

// Obtener ofertas aprobadas/en_proceso/completadas según el tipo de funcionario
// ← FUNCIÓN CORREGIDA: ahora muestra también ofertas en_proceso y completadas,
//   e incluye los flags tomadaPorMi / tomadaPorOtro para el frontend
const getOfertasAprobadasPorTipo = async (req, res) => {
  try {
    const { tipo } = req.params; // 'campesena' o 'regular'
    const funcionario = req.usuario;

    // Verificar que el funcionario tenga acceso a este tipo
    const tieneAcceso = funcionario.modalidades?.some(m =>
      m.nombre?.toLowerCase() === tipo || m.toString().includes(tipo)
    );

    if (!tieneAcceso && funcionario.tipo === 'funcionario') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver ofertas de este tipo'
      });
    }

    // Buscar los estados visibles para el funcionario: aprobada, en_proceso, completado
    const estadosVisibles = await EstadoOferta.find({
      codigo: { $in: ['aprobada', 'en_proceso', 'completado'] }
    });

    if (!estadosVisibles.length) {
      return res.status(404).json({
        success: false,
        message: 'No se encontraron estados válidos en la base de datos'
      });
    }

    const estadosIds = estadosVisibles.map(e => e._id);

    // Buscar ofertas en esos estados
    const ofertas = await CreacionOferta.find({
      estado: { $in: estadosIds },
      es_campesena: tipo === 'campesena'
    })
      .populate('programa_formacion')
      .populate('modalidad')
      .populate('tipo_oferta')
      .populate('ubicacion.municipio')
      .populate('programa_especial')
      .populate('estado')
      .populate({
        path: 'creado_por',
        select: 'nombre apellido'
      })
      .populate({
        path: 'empresa_solicitante',
        select: 'nombre nit'
      })
      .populate('coordinador_asignado', 'nombre')
      // ← NUEVO: traer datos del funcionario asignado
      .populate('funcionario_asignado', 'nombre nombreUsuario')
      .select('+carta_pdf +firma_digital_pdf')
      .sort({ createdAt: -1 });

    // Agregar flags para el frontend
    const ofertasConFlags = ofertas.map(oferta => {
      const ofertaObj = oferta.toObject();
      ofertaObj.tieneFicha = !!oferta.ficha_sofia;
      // ← NUEVO: el frontend sabe si esta oferta la tomó este funcionario u otro
      ofertaObj.tomadaPorMi =
        oferta.funcionario_asignado?._id?.toString() === funcionario._id.toString();
      ofertaObj.tomadaPorOtro =
        !!oferta.funcionario_asignado && !ofertaObj.tomadaPorMi;
      return ofertaObj;
    });

    res.json({
      success: true,
      count: ofertas.length,
      data: ofertasConFlags
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Registrar ficha de Sofía Plus
const registrarFichaSofia = async (req, res) => {
  try {
    const { ofertaId } = req.params;
    const { codigo_ficha, fecha_creacion, observaciones } = req.body;
    const funcionario = req.usuario;

    if (!codigo_ficha) {
      return res.status(400).json({
        success: false,
        message: 'El código de ficha es obligatorio'
      });
    }

    // Buscar la oferta
    const oferta = await CreacionOferta.findById(ofertaId)
      .populate('programa_formacion')
      .populate('estado');

    if (!oferta) {
      return res.status(404).json({
        success: false,
        message: 'Oferta no encontrada'
      });
    }

    // Verificar que la oferta esté aprobada
    if (oferta.estado?.codigo !== 'aprobada') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden registrar fichas para ofertas aprobadas'
      });
    }

    // Verificar que el funcionario tenga acceso a este tipo de oferta
    const tipoOferta = oferta.es_campesena ? 'campesena' : 'regular';
    const tieneAcceso = funcionario.modalidades?.some(m => 
      m.nombre?.toLowerCase() === tipoOferta || m.toString().includes(tipoOferta)
    );

    if (!tieneAcceso && funcionario.tipo === 'funcionario') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para registrar fichas de este tipo de oferta'
      });
    }

    // Registrar la ficha
    oferta.ficha_sofia = {
      codigo: codigo_ficha,
      creada_por: funcionario._id,
      fecha_creacion: fecha_creacion || new Date(),
      observaciones: observaciones || ''
    };

    // Cambiar estado a "ficha_creada"
    const estadoFichaCreada = await EstadoOferta.findOne({ codigo: 'ficha_creada' });
    if (estadoFichaCreada) {
      oferta.estado = estadoFichaCreada._id;
      
      if (!oferta.historial_estados) oferta.historial_estados = [];
      oferta.historial_estados.push({
        estado: estadoFichaCreada._id,
        comentario: `Ficha creada: ${codigo_ficha}`,
        cambiado_por: funcionario._id,
        cambiado_por_modelo: 'Funcionario',
        fecha: new Date()
      });
    }

    await oferta.save();

    res.json({
      success: true,
      message: 'Ficha registrada exitosamente',
      data: {
        oferta_id: oferta._id,
        codigo_ficha: oferta.ficha_sofia.codigo,
        fecha_creacion: oferta.ficha_sofia.fecha_creacion,
        estado: 'ficha_creada'
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Obtener historial de fichas creadas por el funcionario
const getHistorialFichas = async (req, res) => {
  try {
    const funcionario = req.usuario;

    const ofertas = await CreacionOferta.find({
      'ficha_sofia.creada_por': funcionario._id
    })
      .populate('programa_formacion', 'nombre_programa codigo')
      .populate('creado_por', 'nombre apellido')
      .select('ficha_sofia programa_formacion fechas creado_por')
      .sort({ 'ficha_sofia.fecha_creacion': -1 });

    const historial = ofertas.map(oferta => ({
      oferta_id: oferta._id,
      programa: oferta.programa_formacion?.nombre_programa,
      codigo_programa: oferta.programa_formacion?.codigo,
      codigo_ficha: oferta.ficha_sofia?.codigo,
      fecha_creacion: oferta.ficha_sofia?.fecha_creacion,
      instructor: oferta.creado_por ? `${oferta.creado_por.nombre} ${oferta.creado_por.apellido}` : 'N/A',
      observaciones: oferta.ficha_sofia?.observaciones
    }));

    res.json({
      success: true,
      count: historial.length,
      data: historial
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// Obtener ofertas por coordinador
const obtenerOfertasPorCoordinador = async (req, res) => {
  try {
    const { coordinadorId } = req.params;
    
    const ofertas = await CreacionOferta.find({ 
      coordinador_asignado: coordinadorId 
    })
      .populate('programa_formacion')
      .populate('modalidad')
      .populate('tipo_programa')
      .populate('tipo_oferta')
      .populate('ubicacion.municipio')
      .populate('programa_especial')
      .populate('estado')
      .populate({
        path: 'creado_por',
        select: 'nombre apellido nombreUsuario'
      })
      .populate({
        path: 'empresa_solicitante',
        select: 'nombre nit'
      })
      .select('+carta_pdf +firma_digital_pdf')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: ofertas.length,
      data: ofertas
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ofertas del coordinador',
      error: error.message
    });
  }
};


// Ruta para descargar PDF de una oferta
const descargarPDF = async (req, res) => {
  try {
    const oferta = await CreacionOferta.findById(req.params.id)
      .populate('programa_formacion')
      .populate('modalidad')
      .populate('tipo_programa')
      .populate('tipo_oferta')
      .populate('ubicacion.municipio')
      .populate('programa_especial')
      .populate({
        path: 'creado_por',
        select: 'nombre apellido nombreUsuario numeroIdentificacion correoElectronico'
      })
      .populate({
        path: 'empresa_solicitante',
        select: 'nombre nit'
      })
      .populate('coordinador_asignado', 'nombre');

    if (!oferta) {
      return res.status(404).json({
        success: false,
        message: 'Oferta no encontrada'
      });
    }

    console.log('Generando PDF para descarga con datos:', {
      instructor: oferta.creado_por?.nombre,
      empresa: oferta.empresa_solicitante?.nombre
    });

    const pdfBuffer = await generarFichaCaracterizacion(oferta);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ficha-${oferta._id}.pdf`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar el PDF',
      error: error.message
    });
  }
};

// Actualizar una oferta
const actualizarOferta = async (req, res) => {
  try {
    const ofertaActualizada = await CreacionOferta.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('programa_formacion')
      .populate('modalidad')
      .populate('tipo_programa')
      .populate('tipo_oferta')
      .populate('ubicacion.municipio')
      .populate('programa_especial')
      .populate({
        path: 'creado_por',
        select: 'nombre apellido nombreUsuario'
      })
      .populate({
        path: 'empresa_solicitante',
        select: 'nombre nit'
      })
      .populate('coordinador_asignado', 'nombre');

    if (!ofertaActualizada) {
      return res.status(404).json({
        success: false,
        message: 'Oferta no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Oferta actualizada correctamente',
      data: ofertaActualizada
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(400).json({
      success: false,
      message: 'Error al actualizar la oferta',
      error: error.message
    });
  }
};

// Eliminar una oferta
const eliminarOferta = async (req, res) => {
  try {
    const oferta = await CreacionOferta.findByIdAndDelete(req.params.id);

    if (!oferta) {
      return res.status(404).json({
        success: false,
        message: 'Oferta no encontrada'
      });
    }

    // Eliminar instructores asociados si existen
    await Instructor.deleteMany({ oferta_id: req.params.id });

    // Eliminar inscripciones asociadas si existen
    await Inscripcion.deleteMany({ oferta_id: req.params.id });

    // Eliminar solicitudes relacionadas si existen
    await SolicitudValidacion.deleteMany({ oferta_id: req.params.id });

    // Eliminar archivos asociados
    const pdfPath = path.join(__dirname, '../uploads/fichas', `ficha-${req.params.id}.pdf`);
    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
    }

    if (oferta.carta_pdf && fs.existsSync(oferta.carta_pdf)) {
      fs.unlinkSync(oferta.carta_pdf);
    }

    res.json({
      success: true,
      message: 'Oferta eliminada correctamente'
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la oferta',
      error: error.message
    });
  }
};

// ✅ EXPORTACIÓN ÚNICA - CON TODAS LAS FUNCIONES
module.exports = {
  crearOferta,
  obtenerOfertas,
  obtenerOfertaPorId,
  obtenerMisOfertas,
  obtenerOfertasPorCoordinador,
  actualizarOferta,
  eliminarOferta,
  getOfertaPorLink,
  descargarPDF,
  getOfertasAprobadasPorTipo,
  registrarFichaSofia,
  getHistorialFichas,
  exportarExcelOfertaCompleta  
};