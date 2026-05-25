const SolicitudValidacion = require('../models/SolicitudValidacion');
const CreacionOferta = require('../models/CreacionOferta');
const User = require('../models/User');
const Coordinador = require('../models/Coordinador');
const EstadoOferta = require('../models/EstadoOferta');
const Inscripcion = require('../models/Inscripcion');  // ← ¿Está esta línea?
const { cambiarEstado } = require('../services/estadoService');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');  


// =============================================
// FUNCIONES PARA INSTRUCTORES
// =============================================

// Instructor: Crear solicitud
const crearSolicitud = async (req, res) => {
  try {
    const { oferta_id, mensaje } = req.body;
    const instructor = req.usuario;

    // Verificar que la oferta existe y pertenece al instructor
    const oferta = await CreacionOferta.findOne({
      _id: oferta_id,
      creado_por: instructor._id
    });

    if (!oferta) {
      return res.status(404).json({
        success: false,
        message: 'Oferta no encontrada o no pertenece al instructor'
      });
    }

    // Verificar que el instructor tiene coordinador asignado
    if (!instructor.coordinadorAsignado) {
      return res.status(400).json({
        success: false,
        message: 'No tienes un coordinador asignado'
      });
    }

    // ===== CAMBIAR ESTADO DE LA OFERTA A "PENDIENTE" =====
    const estadoPendiente = await EstadoOferta.findOne({ codigo: 'pendiente' });
    if (!estadoPendiente) {
      throw new Error('Estado "pendiente" no encontrado');
    }

    // Actualizar estado de la oferta
    oferta.estado = estadoPendiente._id;
    
    // Agregar al historial
    if (!oferta.historial_estados) {
      oferta.historial_estados = [];
    }
    
    oferta.historial_estados.push({
      estado: estadoPendiente._id,
      comentario: mensaje || 'Enviada a revisión',
      cambiado_por: instructor._id,
      cambiado_por_modelo: 'User',
      fecha: new Date()
    });

    await oferta.save();
    console.log('✅ Estado de oferta actualizado a pendiente');

    // Crear solicitud
    const nuevaSolicitud = new SolicitudValidacion({
      oferta_id,
      instructor_id: instructor._id,
      coordinador_id: instructor.coordinadorAsignado,
      mensaje,
      estado: 'pendiente'
    });

    await nuevaSolicitud.save();
    console.log('✅ Solicitud creada:', nuevaSolicitud._id, 'para coordinador:', instructor.coordinadorAsignado);

    res.status(201).json({
      success: true,
      message: 'Solicitud enviada al coordinador',
      data: nuevaSolicitud
    });

  } catch (error) {
    console.error('Error en crearSolicitud:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



// =============================================
// FUNCIONES PARA DESCARGAR ARCHIVOS
// =============================================

// Descargar ficha de caracterización
const descargarFicha = async (req, res) => {
  try {
    const { id } = req.params;
    
    const solicitud = await SolicitudValidacion.findById(id).populate('oferta_id');
    if (!solicitud) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    const ofertaId = solicitud.oferta_id._id;
    const fichaPath = path.join(__dirname, '../uploads/fichas', `ficha-${ofertaId}.pdf`);
    
    if (!fs.existsSync(fichaPath)) {
      return res.status(404).json({ message: 'Ficha no encontrada' });
    }

    res.download(fichaPath, `ficha-${ofertaId}.pdf`);
  } catch (error) {
    console.error('Error descargando ficha:', error);
    res.status(500).json({ message: error.message });
  }
};

// Descargar carta PDF
const descargarCarta = async (req, res) => {
  try {
    const { id } = req.params;
    
    const solicitud = await SolicitudValidacion.findById(id).populate('oferta_id');
    if (!solicitud) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    const oferta = solicitud.oferta_id;
    if (!oferta.carta_pdf) {
      return res.status(404).json({ message: 'Carta no disponible' });
    }

    if (!fs.existsSync(oferta.carta_pdf)) {
      return res.status(404).json({ message: 'Archivo de carta no encontrado' });
    }

    res.download(oferta.carta_pdf, `carta-${oferta._id}.pdf`);
  } catch (error) {
    console.error('Error descargando carta:', error);
    res.status(500).json({ message: error.message });
  }
};

// Descargar Excel de inscritos
// Descargar Excel de inscritos
// Descargar Excel de inscritos (para el coordinador)
// Descargar Excel de inscritos (para el coordinador)
const descargarExcel = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📥 Solicitando Excel para solicitud:', id);
    
    const solicitud = await SolicitudValidacion.findById(id).populate('oferta_id');
    if (!solicitud) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    const ofertaId = solicitud.oferta_id._id;
    
    // Obtener la oferta con su programa
    const oferta = await CreacionOferta.findById(ofertaId)
      .populate('programa_formacion');
    
    if (!oferta) {
      return res.status(404).json({ message: 'Oferta no encontrada' });
    }

    // Obtener los inscritos de esta oferta
    const inscritos = await Inscripcion.find({ oferta_id: ofertaId })
      .populate('tipo_documento')
      .populate('caracterizacion');

    // Crear Excel con el formato específico
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inscritos');

    // Definir las columnas exactamente como las necesita el coordinador
    worksheet.columns = [
      { header: 'Resultado del Registro (Reservado para el sistema)', key: 'resultado', width: 40 },
      { header: 'Tipo de Identificación', key: 'tipo_documento', width: 25 },
      { header: 'Numero de Identificación', key: 'numero_documento', width: 25 },
      { header: 'Código de la ficha', key: 'codigo_ficha', width: 20 },
      { header: 'Tipo Población Aspirante', key: 'tipo_poblacion', width: 25 },
      { header: 'Codigo Empresa (Solo si la ficha es cerrada)', key: 'codigo_empresa', width: 30 }
    ];

    // Estilo para el encabezado
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF00643C' } // Verde SENA
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    // Agregar los datos de los inscritos
    if (inscritos && inscritos.length > 0) {
      inscritos.forEach(inscrito => {
        worksheet.addRow({
          resultado: '', // Vacío, reservado para el sistema
          tipo_documento: inscrito.tipo_documento?.nombre || '',
          numero_documento: inscrito.numero_documento || '',
          codigo_ficha: oferta?.programa_formacion?.codigo || '',
          tipo_poblacion: inscrito.caracterizacion?.tipo_caracterizacion || '',
          codigo_empresa: '' // Vacío por ahora
        });
      });
    } else {
      // Si no hay inscritos, mostrar una fila con el código de la ficha
      worksheet.addRow({
        resultado: '',
        tipo_documento: '',
        numero_documento: '',
        codigo_ficha: oferta?.programa_formacion?.codigo || '',
        tipo_poblacion: '',
        codigo_empresa: ''
      });
    }

    // Configurar la respuesta
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=inscritos_${oferta.programa_formacion?.codigo || 'formato'}.xlsx`);
    
    // Escribir el libro a la respuesta
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('❌ Error descargando excel:', error);
    res.status(500).json({ message: error.message });
  }
};

// Descargar PDF fusionado de cédulas
const descargarCedulas = async (req, res) => {
  try {
    const { id } = req.params;
    
    const solicitud = await SolicitudValidacion.findById(id).populate('oferta_id');
    if (!solicitud) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    const ofertaId = solicitud.oferta_id._id;
    // Buscar el PDF fusionado más reciente
    const files = fs.readdirSync(path.join(__dirname, '../uploads/fusionados'));
    const cedulasFile = files.find(f => f.includes(ofertaId.toString()) && f.endsWith('.pdf'));
    
    if (!cedulasFile) {
      return res.status(404).json({ message: 'PDF de cédulas no encontrado' });
    }

    const cedulasPath = path.join(__dirname, '../uploads/fusionados', cedulasFile);
    res.download(cedulasPath, `cedulas-${ofertaId}.pdf`);
  } catch (error) {
    console.error('Error descargando cédulas:', error);
    res.status(500).json({ message: error.message });
  }
};



// =============================================
// FUNCIONES PARA COORDINADORES
// =============================================

// Coordinador: Obtener solicitudes pendientes
const getSolicitudesPendientes = async (req, res) => {
  try {
    const coordinador = req.usuario;  // ✅ CAMBIADO
    console.log('🔍 Coordinador logueado:', coordinador._id, coordinador.nombre);

    const solicitudes = await SolicitudValidacion.find({
      coordinador_id: coordinador._id,
      estado: 'pendiente'
    })
      .populate({
        path: 'oferta_id',
        populate: {
          path: 'programa_formacion',
          select: 'nombre_programa codigo'
        }
      })
      .populate('instructor_id', 'nombre apellido correoElectronico')
      .sort({ fecha_solicitud: -1 });

    console.log('📋 Solicitudes encontradas:', solicitudes.length);
    solicitudes.forEach(s => {
      console.log('   - Solicitud ID:', s._id, 'Oferta ID:', s.oferta_id?._id, 'Instructor:', s.instructor_id?.nombre);
    });

    res.json({
      success: true,
      count: solicitudes.length,
      data: solicitudes
    });

  } catch (error) {
    console.error('Error en getSolicitudesPendientes:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// Coordinador: Aprobar solicitud
// Coordinador: Aprobar solicitud
const aprobarSolicitud = async (req, res) => {
  try {
    console.log('🔍 ===== INICIO APROBAR SOLICITUD =====');
    console.log('1. req.params:', JSON.stringify(req.params, null, 2));
    console.log('2. req.body:', JSON.stringify(req.body, null, 2));
    console.log('3. req.usuario:', req.usuario ? {
      id: req.usuario._id,
      tipo: req.usuario.tipo || req.usuario.constructor?.modelName
    } : 'NO HAY USUARIO');

    const { id } = req.params;
    const { comentarios } = req.body;
    const coordinador = req.usuario;

    if (!coordinador) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Buscar la solicitud
    const solicitud = await SolicitudValidacion.findOne({
      _id: id,
      coordinador_id: coordinador._id,
      estado: 'pendiente'
    }).populate('oferta_id');

    if (!solicitud) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    console.log('4. Solicitud encontrada, oferta ID:', solicitud.oferta_id._id);

    // Buscar la oferta
    const oferta = await CreacionOferta.findById(solicitud.oferta_id._id);
    
    if (!oferta) {
      return res.status(404).json({
        success: false,
        message: 'Oferta no encontrada'
      });
    }

    // Buscar el estado 'aprobada'
    const estadoAprobada = await EstadoOferta.findOne({ codigo: 'aprobada' });
    
    if (!estadoAprobada) {
      throw new Error('El estado "aprobada" no existe en la base de datos');
    }

    console.log('5. Estado actual de la oferta:', oferta.estado);

    // Cambiar el estado de la oferta - ACTUALIZACIÓN DIRECTA
    console.log('6. Actualizando estado de oferta a aprobada...');
    
    // Guardar estado anterior
    const estadoAnterior = oferta.estado;
    
    // Actualizar estado
    oferta.estado = estadoAprobada._id;
    
    // Agregar al historial
    if (!oferta.historial_estados) {
      oferta.historial_estados = [];
    }
    
    oferta.historial_estados.push({
      estado: estadoAprobada._id,
      comentario: comentarios || 'Aprobada por coordinador',
      cambiado_por: coordinador._id,
      cambiado_por_modelo: 'Coordinador',
      fecha: new Date()
    });

    await oferta.save();
    console.log('7. ✅ Estado de oferta actualizado correctamente');

    // Actualizar la solicitud
    console.log('8. Actualizando solicitud...');
    solicitud.estado = 'aprobada';
    solicitud.comentarios = comentarios;
    solicitud.fecha_respuesta = new Date();
    await solicitud.save();
    console.log('9. ✅ Solicitud actualizada correctamente');

    // Determinar qué tipo de funcionario necesita
    const tipoFuncionario = solicitud.oferta_id.es_campesena ? 'campesena' : 'regular';
    console.log(`10. 📢 Notificar a funcionarios tipo: ${tipoFuncionario}`);

    res.json({
      success: true,
      message: 'Solicitud aprobada exitosamente',
      data: solicitud
    });

  } catch (error) {
    console.error('❌ ERROR EN aprobarSolicitud:');
    console.error('   - Mensaje:', error.message);
    console.error('   - Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// Coordinador: Obtener solicitud por ID
const getSolicitudById = async (req, res) => {
  try {
    const { id } = req.params;
    const coordinador = req.usuario;  // ✅ CAMBIADO

    const solicitud = await SolicitudValidacion.findOne({
      _id: id,
      coordinador_id: coordinador._id
    })
      .populate({
        path: 'oferta_id',
        populate: {
          path: 'programa_formacion',
          select: 'nombre_programa codigo'
        }
      })
      .populate('instructor_id', 'nombre apellido correoElectronico');

    if (!solicitud) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    res.json({
      success: true,
      data: solicitud
    });

  } catch (error) {
    console.error('Error en getSolicitudById:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Coordinador: Rechazar solicitud
// Coordinador: Rechazar solicitud
const rechazarSolicitud = async (req, res) => {
  try {
    console.log('🔍 ===== INICIO RECHAZAR SOLICITUD =====');
    console.log('1. req.params:', JSON.stringify(req.params, null, 2));
    console.log('2. req.body:', JSON.stringify(req.body, null, 2));
    console.log('3. req.usuario:', req.usuario ? {
      id: req.usuario._id,
      tipo: req.usuario.tipo || req.usuario.constructor?.modelName
    } : 'NO HAY USUARIO');

    const { id } = req.params;
    const { comentarios } = req.body;
    const coordinador = req.usuario;

    if (!coordinador) {
      console.log('❌ ERROR: No hay coordinador en req.usuario');
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    console.log('4. Buscando solicitud con ID:', id);
    console.log('5. Coordinador ID:', coordinador._id);

    // Buscar la solicitud
    const solicitud = await SolicitudValidacion.findOne({
      _id: id,
      coordinador_id: coordinador._id,
      estado: 'pendiente'
    });

    console.log('6. Resultado búsqueda solicitud:', solicitud ? 'ENCONTRADA' : 'NO ENCONTRADA');
    
    if (!solicitud) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada o ya fue procesada'
      });
    }

    console.log('7. Solicitud encontrada:', {
      id: solicitud._id,
      estado: solicitud.estado,
      oferta_id: solicitud.oferta_id,
      instructor_id: solicitud.instructor_id
    });

    // Buscar la oferta
    console.log('8. Buscando oferta con ID:', solicitud.oferta_id);
    const oferta = await CreacionOferta.findById(solicitud.oferta_id);
    
    console.log('9. Oferta encontrada:', oferta ? 'SÍ' : 'NO');
    
    if (!oferta) {
      return res.status(404).json({
        success: false,
        message: 'La oferta asociada no existe'
      });
    }

    console.log('10. Oferta:', {
      id: oferta._id,
      estado: oferta.estado,
      programa: oferta.programa_formacion
    });

    // Buscar el estado 'rechazada'
    console.log('11. Buscando estado "rechazada" en EstadoOferta');
    const estadoRechazada = await EstadoOferta.findOne({ codigo: 'rechazada' });
    
    console.log('12. Estado rechazada:', estadoRechazada ? {
      id: estadoRechazada._id,
      codigo: estadoRechazada.codigo,
      nombre: estadoRechazada.nombre
    } : 'NO ENCONTRADO');

    if (!estadoRechazada) {
      throw new Error('El estado "rechazada" no existe en la base de datos');
    }

    // VERIFICAR QUE LA OFERTA NO ESTÉ YA RECHAZADA
    const estadoActualOferta = await EstadoOferta.findById(oferta.estado);
    console.log('13. Estado actual de la oferta:', estadoActualOferta?.codigo);

   

    // Cambiar el estado de la oferta - ACTUALIZACIÓN DIRECTA
    console.log('14. Actualizando estado de oferta...');
    
    // Guardar estado anterior
    const estadoAnterior = oferta.estado;
    
    // Actualizar estado
    oferta.estado = estadoRechazada._id;
    
    // Agregar al historial
    if (!oferta.historial_estados) {
      oferta.historial_estados = [];
    }
    
    oferta.historial_estados.push({
      estado: estadoRechazada._id,
      comentario: comentarios,
      cambiado_por: coordinador._id,
      cambiado_por_modelo: 'Coordinador',
      fecha: new Date()
    });

    await oferta.save();
    console.log('15. ✅ Estado de oferta actualizado correctamente');

    // Actualizar la solicitud
    console.log('16. Actualizando solicitud...');
    solicitud.estado = 'rechazada';
    solicitud.comentarios = comentarios;
    solicitud.fecha_respuesta = new Date();
    await solicitud.save();
    console.log('17. ✅ Solicitud actualizada correctamente');

    console.log('18. 🎉 PROCESO COMPLETADO EXITOSAMENTE');
    
    res.json({
      success: true,
      message: 'Solicitud rechazada exitosamente',
      data: {
        solicitud,
        oferta: {
          id: oferta._id,
          estado: oferta.estado
        }
      }
    });

  } catch (error) {
    console.error('❌ ERROR EN rechazarSolicitud:');
    console.error('   - Nombre:', error.name);
    console.error('   - Mensaje:', error.message);
    console.error('   - Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.toString()
    });
  }
};


// Coordinador: Verificar archivos de una solicitud
const verificarArchivosSolicitud = async (req, res) => {
  try {
    const { id } = req.params;
    const fs = require('fs');
    const path = require('path');

    const solicitud = await SolicitudValidacion.findById(id).populate('oferta_id');
    
    if (!solicitud) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    const oferta = solicitud.oferta_id;
    const archivos = {
      ficha: false,
      carta: false,
      excel: false,
      cedulas: false
    };

    // Verificar Ficha de Caracterización
    const fichaPath = path.join(__dirname, '../uploads/fichas', `ficha-${oferta._id}.pdf`);
    archivos.ficha = require('fs').existsSync(fichaPath);

    // Verificar Carta PDF
    if (oferta.carta_pdf) {
      archivos.carta = require('fs').existsSync(oferta.carta_pdf);
    }

    // Verificar Excel de inscritos
    const Inscripcion = require('../models/Inscripcion');
    const totalInscritos = await Inscripcion.countDocuments({ oferta_id: oferta._id });
    archivos.excel = totalInscritos > 0;

    // Verificar PDF fusionado de cédulas
    const fecha = new Date().toISOString().split('T')[0];
    const pdfFusionadoPath = path.join(__dirname, '../uploads/fusionados', `cedulas_fusionadas_${oferta._id}_${fecha}.pdf`);
    archivos.cedulas = require('fs').existsSync(pdfFusionadoPath);

    res.json({
      success: true,
      data: archivos
    });

  } catch (error) {
    console.error('Error en verificarArchivosSolicitud:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =============================================
// EXPORTACIONES
// =============================================
module.exports = {
  // Instructor
  crearSolicitud,
  
  // Coordinador
  getSolicitudesPendientes,
  getSolicitudById,
  rechazarSolicitud,
  aprobarSolicitud,  // ← NUEVA
  verificarArchivosSolicitud,
  
  // Descargas
  descargarFicha,
  descargarCarta,
  descargarExcel,
  descargarCedulas
};
