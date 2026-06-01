const SolicitudValidacion = require('../models/SolicitudValidacion');
const CreacionOferta = require('../models/CreacionOferta');
const User = require('../models/User');
const Coordinador = require('../models/Coordinador');
const EstadoOferta = require('../models/EstadoOferta');
const Inscripcion = require('../models/Inscripcion');
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
    }).populate('estado');

    if (!oferta) {
      return res.status(404).json({
        success: false,
        message: 'Oferta no encontrada o no pertenece al instructor'
      });
    }

    // ===== VALIDACIÓN: Si fue aprobada y NO está rechazada, bloquear =====
    // (permitir reenvío si el coordinador rechazó en algún momento)
    const solicitudAprobada = await SolicitudValidacion.findOne({
      oferta_id: oferta_id,
      instructor_id: instructor._id,
      estado: 'aprobada'
    });

    if (solicitudAprobada && oferta.estado?.codigo !== 'rechazada') {
      return res.status(400).json({
        success: false,
        message: 'Esta oferta ya fue aprobada. No se puede reenviar.'
      });
    }

    // Verificar que el instructor tiene coordinador asignado
    if (!instructor.coordinadorAsignado) {
      return res.status(400).json({
        success: false,
        message: 'No tienes un coordinador asignado'
      });
    }

    // ===== FIX: Cerrar solicitudes anteriores pendientes/rechazadas =====
    // Evita que un reenvío quede bloqueado por solicitudes huérfanas
    const cerradas = await SolicitudValidacion.updateMany(
      {
        oferta_id:     oferta_id,
        instructor_id: instructor._id,
        estado:        { $in: ['pendiente', 'rechazada'] }
      },
      { $set: { estado: 'cerrada' } }
    );
    if (cerradas.modifiedCount > 0) {
      console.log(`🔄 ${cerradas.modifiedCount} solicitud(es) anterior(es) marcadas como 'cerrada'`);
    }

    // ===== CAMBIAR ESTADO DE LA OFERTA A "PENDIENTE" =====
    const estadoPendiente = await EstadoOferta.findOne({ codigo: 'pendiente' });
    if (!estadoPendiente) {
      throw new Error('Estado "pendiente" no encontrado. Ejecuta insertarEstados.js');
    }

    oferta.estado = estadoPendiente._id;

    if (!oferta.historial_estados) {
      oferta.historial_estados = [];
    }

    oferta.historial_estados.push({
      estado:              estadoPendiente._id,
      comentario:          mensaje || 'Enviada a revisión del coordinador',
      cambiado_por:        instructor._id,
      cambiado_por_modelo: 'User',
      fecha:               new Date()
    });

    await oferta.save();
    console.log('✅ Estado de oferta actualizado a pendiente');

    // Crear solicitud nueva
    const nuevaSolicitud = new SolicitudValidacion({
      oferta_id,
      instructor_id:   instructor._id,
      coordinador_id:  instructor.coordinadorAsignado,
      mensaje,
      estado:          'pendiente'
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

// Eliminar solicitud (instructor que la creó o admin)
const eliminarSolicitud = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = req.usuario;

    const solicitud = await SolicitudValidacion.findById(id);
    if (!solicitud) {
      return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
    }

    try {
      const short = {
        _id:             solicitud._id,
        estado:          solicitud.estado,
        fecha_solicitud: solicitud.fecha_solicitud,
        instructor_id:   solicitud.instructor_id,
        coordinador_id:  solicitud.coordinador_id,
        oferta_id: solicitud.oferta_id ? {
          _id:                solicitud.oferta_id._id,
          programa_formacion: solicitud.oferta_id.programa_formacion,
          estado:             solicitud.oferta_id.estado,
          creado_por:         solicitud.oferta_id.creado_por
        } : null
      };
      console.log('📦 Solicitud (debug):', JSON.stringify(short, null, 2));
    } catch (e) {
      console.warn('No se pudo serializar solicitud para debug', e);
    }

    const esInstructor = usuario && usuario._id && solicitud.instructor_id.toString() === usuario._id.toString();
    const esAdmin = usuario && usuario.constructor && usuario.constructor.modelName === 'Admin';

    if (!esInstructor && !esAdmin) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para eliminar esta solicitud' });
    }

    await SolicitudValidacion.findByIdAndDelete(id);

    res.json({ success: true, message: 'Solicitud eliminada correctamente' });
  } catch (error) {
    console.error('Error en eliminarSolicitud:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================================
// INSTRUCTOR: Reenviar oferta corregida al funcionario
// Estado: a_corregir → en_proceso
// No pasa por coordinador, va directo al funcionario
// =============================================
const reenviarOfertaCorregida = async (req, res) => {
  try {
    const { oferta_id, mensaje } = req.body;
    const instructor = req.usuario;

    console.log(instructor);

    const oferta = await CreacionOferta.findById(oferta_id).populate('estado');

    if (!oferta) {
      return res.status(404).json({
        success: false,
        message: 'Oferta no encontrada'
      });
    }

    if (oferta.creado_por.toString() !== instructor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para modificar esta oferta'
      });
    }

    if (oferta.estado?.codigo !== 'a_corregir') {
      return res.status(400).json({
        success: false,
        message: 'Solo puedes reenviar ofertas que están en estado "a corregir"'
      });
    }

    if (!oferta.funcionario_asignado) {
      return res.status(400).json({
        success: false,
        message: 'Esta oferta no tiene un funcionario asignado'
      });
    }

    const estadoEnProceso = await EstadoOferta.findOne({ codigo: 'en_proceso' });
    if (!estadoEnProceso) {
      throw new Error('Estado "en_proceso" no encontrado. Ejecuta insertarEstados.js');
    }

    oferta.estado = estadoEnProceso._id;
    oferta.motivo_correccion = null;

    if (!oferta.historial_estados) oferta.historial_estados = [];
    oferta.historial_estados.push({
      estado:              estadoEnProceso._id,
      comentario:          mensaje || 'Oferta corregida y reenviada al funcionario',
      cambiado_por:        instructor._id,
      cambiado_por_modelo: 'User',
      fecha:               new Date()
    });

    await oferta.save();
    console.log('✅ Oferta reenviada al funcionario en estado en_proceso');

    res.json({
      success: true,
      message: 'Oferta corregida y enviada al funcionario',
      data: {
        oferta_id: oferta._id,
        estado:    'en_proceso'
      }
    });

  } catch (error) {
    console.error('Error en reenviarOfertaCorregida:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// =============================================
// FUNCIONES PARA DESCARGAR ARCHIVOS
// =============================================

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

const descargarExcel = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📥 Solicitando Excel para solicitud:', id);

    const solicitud = await SolicitudValidacion.findById(id).populate('oferta_id');
    if (!solicitud) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    const ofertaId = solicitud.oferta_id._id;

    const oferta = await CreacionOferta.findById(ofertaId).populate('programa_formacion');
    if (!oferta) {
      return res.status(404).json({ message: 'Oferta no encontrada' });
    }

    const inscritos = await Inscripcion.find({ oferta_id: ofertaId })
      .populate('tipo_documento')
      .populate('caracterizacion');

    const workbook  = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inscritos');

    worksheet.columns = [
      { header: 'Resultado del Registro (Reservado para el sistema)', key: 'resultado',       width: 40 },
      { header: 'Tipo de Identificación',                             key: 'tipo_documento',  width: 25 },
      { header: 'Numero de Identificación',                           key: 'numero_documento', width: 25 },
      { header: 'Código de la ficha',                                 key: 'codigo_ficha',    width: 20 },
      { header: 'Tipo Población Aspirante',                           key: 'tipo_poblacion',  width: 25 },
      { header: 'Codigo Empresa (Solo si la ficha es cerrada)',       key: 'codigo_empresa',  width: 30 }
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: 'FF00643C' }
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    if (inscritos && inscritos.length > 0) {
      inscritos.forEach(inscrito => {
        worksheet.addRow({
          resultado:        '',
          tipo_documento:   inscrito.tipo_documento?.nombre || '',
          numero_documento: inscrito.numero_documento || '',
          codigo_ficha:     oferta?.programa_formacion?.codigo || '',
          tipo_poblacion:   inscrito.caracterizacion?.tipo_caracterizacion || '',
          codigo_empresa:   ''
        });
      });
    } else {
      worksheet.addRow({
        resultado: '', tipo_documento: '', numero_documento: '',
        codigo_ficha: oferta?.programa_formacion?.codigo || '',
        tipo_poblacion: '', codigo_empresa: ''
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=inscritos_${oferta.programa_formacion?.codigo || 'formato'}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('❌ Error descargando excel:', error);
    res.status(500).json({ message: error.message });
  }
};

const descargarCedulas = async (req, res) => {
  try {
    const { id } = req.params;

    const solicitud = await SolicitudValidacion.findById(id).populate('oferta_id');
    if (!solicitud) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    const ofertaId = solicitud.oferta_id._id;
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

const getSolicitudesPendientes = async (req, res) => {
  try {
    const coordinador = req.usuario;
    console.log('🔍 Coordinador logueado:', coordinador._id, coordinador.nombre);

    const solicitudes = await SolicitudValidacion.find({
      coordinador_id: coordinador._id,
      estado:         'pendiente'
    })
      .populate({
        path: 'oferta_id',
        populate: {
          path:   'programa_formacion',
          select: 'nombre_programa codigo'
        }
      })
      .populate('instructor_id', 'nombre apellido correoElectronico')
      .sort({ fecha_solicitud: -1 });

    console.log('📋 Solicitudes encontradas:', solicitudes.length);

    res.json({
      success: true,
      count:   solicitudes.length,
      data:    solicitudes
    });

  } catch (error) {
    console.error('Error en getSolicitudesPendientes:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// =============================================
// ✅ COORDINADOR: Aprobar solicitud
// =============================================
const aprobarSolicitud = async (req, res) => {
  try {
    console.log('🔍 ===== INICIO APROBAR SOLICITUD =====');

    const { id } = req.params;
    const { comentarios } = req.body;
    const coordinador = req.usuario;

    if (!coordinador) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const solicitud = await SolicitudValidacion.findOne({
      _id:            id,
      coordinador_id: coordinador._id,
      estado:         'pendiente'
    }).populate('oferta_id');

    if (!solicitud) {
      return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
    }

    const oferta = await CreacionOferta.findById(solicitud.oferta_id._id);
    if (!oferta) {
      return res.status(404).json({ success: false, message: 'Oferta no encontrada' });
    }

    const estadoListaEspera = await EstadoOferta.findOne({ codigo: 'lista_espera' });
    if (!estadoListaEspera) {
      throw new Error('Estado "lista_espera" no encontrado. Ejecuta insertarEstados.js');
    }

    oferta.estado = estadoListaEspera._id;

    if (!oferta.historial_estados) oferta.historial_estados = [];
    oferta.historial_estados.push({
      estado:              estadoListaEspera._id,
      comentario:          comentarios || 'Aprobada por coordinador — en lista de espera para funcionario',
      cambiado_por:        coordinador._id,
      cambiado_por_modelo: 'Coordinador',
      fecha:               new Date()
    });

    await oferta.save();
    console.log('✅ Estado de oferta actualizado a lista_espera');

    solicitud.estado          = 'aprobada';
    solicitud.comentarios     = comentarios;
    solicitud.fecha_respuesta = new Date();
    await solicitud.save();
    console.log('✅ Solicitud marcada como aprobada');

    res.json({
      success: true,
      message: 'Solicitud aprobada. La oferta está en lista de espera para el funcionario.',
      data:    solicitud
    });

  } catch (error) {
    console.error('❌ ERROR EN aprobarSolicitud:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};


const getSolicitudById = async (req, res) => {
  try {
    const { id } = req.params;
    const coordinador = req.usuario;

    console.log('🔍 getSolicitudById - coordinador en req.usuario:', coordinador?._id);

    const solicitud = await SolicitudValidacion.findOne({ _id: id, coordinador_id: coordinador._id })
      .populate({
        path: 'oferta_id',
        populate: [
          { path: 'programa_formacion', select: 'nombre_programa codigo nivel_formacion duracion_maxima version area_conocimiento tipo_programa' },
          { path: 'modalidad',          select: 'nombre' },
          { path: 'tipo_oferta',        select: 'nombre' },
          { path: 'programa_especial',  select: 'nombre' },
          { path: 'ambiente',           select: 'nombre' },
          { path: 'empresa_solicitante',select: 'nombre' },
          { path: 'ubicacion.municipio',select: 'nombre' }
        ]
      })
      .populate('instructor_id', 'nombre apellido correoElectronico numeroIdentificacion numeroDocumento telefono celular');

    if (!solicitud) {
      const posible = await SolicitudValidacion.findById(id)
        .populate({ path: 'oferta_id', populate: { path: 'programa_formacion', select: 'nombre_programa codigo' } })
        .populate('instructor_id', 'nombre apellido correoElectronico');

      if (posible) {
        console.warn('⚠️ Solicitud encontrada pero coordinador no coincide. coordinadorReq=%s, coordinadorSolicitud=%s',
          coordinador._id, posible.coordinador_id);
        return res.status(403).json({ success: false, message: 'No autorizado: no eres el coordinador asignado a esta solicitud' });
      }

      return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
    }

    res.json({ success: true, data: solicitud });

  } catch (error) {
    console.error('Error en getSolicitudById:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


const rechazarSolicitud = async (req, res) => {
  try {
    console.log('🔍 ===== INICIO RECHAZAR SOLICITUD =====');

    const { id } = req.params;
    const { comentarios } = req.body;
    const coordinador = req.usuario;

    if (!coordinador) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const solicitud = await SolicitudValidacion.findOne({
      _id:            id,
      coordinador_id: coordinador._id,
      estado:         'pendiente'
    });

    if (!solicitud) {
      return res.status(404).json({ success: false, message: 'Solicitud no encontrada o ya fue procesada' });
    }

    const oferta = await CreacionOferta.findById(solicitud.oferta_id);
    if (!oferta) {
      return res.status(404).json({ success: false, message: 'La oferta asociada no existe' });
    }

    const estadoRechazada = await EstadoOferta.findOne({ codigo: 'rechazada' });
    if (!estadoRechazada) {
      throw new Error('Estado "rechazada" no existe en la base de datos');
    }

    oferta.estado = estadoRechazada._id;

    if (!oferta.historial_estados) oferta.historial_estados = [];
    oferta.historial_estados.push({
      estado:              estadoRechazada._id,
      comentario:          comentarios,
      cambiado_por:        coordinador._id,
      cambiado_por_modelo: 'Coordinador',
      fecha:               new Date()
    });

    await oferta.save();

    solicitud.estado          = 'rechazada';
    solicitud.comentarios     = comentarios;
    solicitud.fecha_respuesta = new Date();
    await solicitud.save();

    console.log('✅ Solicitud rechazada correctamente');

    res.json({
      success: true,
      message: 'Solicitud rechazada exitosamente',
      data: {
        solicitud,
        oferta: { id: oferta._id, estado: oferta.estado }
      }
    });

  } catch (error) {
    console.error('❌ ERROR EN rechazarSolicitud:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};


const verificarArchivosSolicitud = async (req, res) => {
  try {
    const { id } = req.params;

    const solicitud = await SolicitudValidacion.findById(id).populate('oferta_id');
    if (!solicitud) {
      return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
    }

    const oferta  = solicitud.oferta_id;
    const archivos = { ficha: false, carta: false, excel: false, cedulas: false };

    const fichaPath = path.join(__dirname, '../uploads/fichas', `ficha-${oferta._id}.pdf`);
    archivos.ficha = fs.existsSync(fichaPath);

    if (oferta.carta_pdf) {
      archivos.carta = fs.existsSync(oferta.carta_pdf);
    }

    const totalInscritos = await Inscripcion.countDocuments({ oferta_id: oferta._id });
    archivos.excel = totalInscritos > 0;

    const fecha = new Date().toISOString().split('T')[0];
    const pdfFusionadoPath = path.join(__dirname, '../uploads/fusionados', `cedulas_fusionadas_${oferta._id}_${fecha}.pdf`);
    archivos.cedulas = fs.existsSync(pdfFusionadoPath);

    res.json({ success: true, data: archivos });

  } catch (error) {
    console.error('Error en verificarArchivosSolicitud:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


const getMisSolicitudes = async (req, res) => {
  try {
    const instructor = req.usuario;
    console.log('🔍 Obteniendo solicitudes del instructor:', instructor._id);

    const misSolicitudes = await SolicitudValidacion.find({
      instructor_id: instructor._id
    })
      .populate({
        path:   'oferta_id',
        select: 'programa_formacion estado motivo_correccion',
        populate: [
          { path: 'programa_formacion', select: 'nombre_programa codigo' },
          { path: 'estado',             select: 'codigo nombre' }
        ]
      })
      .populate('coordinador_id', 'nombre')
      .sort({ fecha_solicitud: -1 });

    console.log('📋 Solicitudes del instructor:', misSolicitudes.length);

    res.json({
      success: true,
      count:   misSolicitudes.length,
      data:    misSolicitudes
    });
  } catch (error) {
    console.error('Error en getMisSolicitudes:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// =============================================
// EXPORTACIONES
// =============================================
module.exports = {
  // Instructor
  crearSolicitud,
  getMisSolicitudes,
  reenviarOfertaCorregida,
  eliminarSolicitud,

  // Coordinador
  getSolicitudesPendientes,
  getSolicitudById,
  rechazarSolicitud,
  aprobarSolicitud,
  verificarArchivosSolicitud,

  // Descargas
  descargarFicha,
  descargarCarta,
  descargarExcel,
  descargarCedulas
};