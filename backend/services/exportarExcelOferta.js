const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const exportarExcelOferta = async (oferta, instructores = [], res = null) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Datos de la Oferta');

    // Determinar si es Campesena o Regular
    const esCampesena = oferta.es_campesena || false;

    if (esCampesena) {
      await generarExcelCampesena(worksheet, oferta, instructores);
    } else {
      await generarExcelRegular(worksheet, oferta);
    }

    // Aplicar estilos generales
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF00643C' }
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    // Ajustar ancho de columnas
    worksheet.columns = worksheet.columns || [];
    worksheet.columns.forEach(col => {
      if (!col.width) col.width = 30;
    });

    if (res) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=oferta_${oferta.programa_formacion?.codigo || 'completa'}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    } else {
      const fecha = new Date().toISOString().split('T')[0];
      const fileName = `oferta_${oferta.programa_formacion?.codigo || 'completa'}_${fecha}.xlsx`;
      const filePath = path.join(__dirname, '../uploads/excel', fileName);
      
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      await workbook.xlsx.writeFile(filePath);
      return filePath;
    }

  } catch (error) {
    console.error('Error generando Excel de oferta:', error);
    throw error;
  }
};

// Generar Excel para oferta REGULAR (33 columnas)
const generarExcelRegular = async (worksheet, oferta) => {
  // Encabezados
  worksheet.columns = [
    { header: 'Nombre del instructor', key: 'nombre_instructor' },
    { header: 'Correo electrónico', key: 'correo_instructor' },
    { header: 'Celular', key: 'celular_instructor' },
    { header: 'Nombre del programa', key: 'nombre_programa' },
    { header: 'Código del programa', key: 'codigo_programa' },
    { header: 'Versión del programa', key: 'version_programa' },
    { header: 'Sector del centro', key: 'sector_centro' },
    { header: 'Programa especial', key: 'programa_especial' },
    { header: 'Cupo de aprendices', key: 'cupo_aprendices' },
    { header: 'Tipo de oferta', key: 'tipo_oferta' },
    { header: '¿Hace parte de algún convenio?', key: 'convenio' },
    { header: 'Nombre de la empresa', key: 'nombre_empresa' },
    { header: 'NIT de la empresa', key: 'nit_empresa' },
    { header: 'Fecha de creación de la empresa', key: 'fecha_creacion_empresa' },
    { header: 'Tipo de empresa', key: 'tipo_empresa' },
    { header: 'Dirección de la empresa', key: 'direccion_empresa' },
    { header: 'Nombre del representante legal', key: 'representante_legal' },
    { header: 'Nombre del contacto en la empresa', key: 'contacto_nombre' },
    { header: 'Celular del contacto', key: 'contacto_celular' },
    { header: 'Correo del contacto', key: 'contacto_correo' },
    { header: 'Número de empleados', key: 'num_empleados' },
    { header: 'Municipio de desarrollo', key: 'municipio' },
    { header: 'Dirección donde se realiza', key: 'direccion' },
    { header: 'Duración en horas', key: 'duracion_horas' },
    { header: 'Fecha inicio', key: 'fecha_inicio' },
    { header: 'Fecha fin', key: 'fecha_fin' },
    { header: 'Horario por día (Mes 1)', key: 'horario_mes1' },
    { header: 'Horario por día (Mes 2)', key: 'horario_mes2' },
    { header: 'Nombre del dinamizador', key: 'dinamizador' },
    { header: 'PDF cédulas de aprendices', key: 'pdf_cedulas' },
    { header: 'Formato de inscripción masivo', key: 'formato_inscripcion' },
    { header: 'Ficha de caracterización', key: 'ficha_caracterizacion' },
    { header: 'Carta de solicitud de la empresa', key: 'carta_solicitud' }
  ];

  // Calcular duración en horas (ejemplo: 8 horas diarias * 5 días * 4 semanas * meses)
  const calcularHoras = (fechaInicio, fechaFin) => {
    if (!fechaInicio || !fechaFin) return 'N/A';
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diffDays = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
    return (diffDays * 8).toString(); // 8 horas por día
  };

  // Datos
  worksheet.addRow({
    nombre_instructor: oferta.creado_por?.nombre + ' ' + oferta.creado_por?.apellido || '',
    correo_instructor: oferta.creado_por?.correoElectronico || '',
    celular_instructor: oferta.creado_por?.telefono || '',
    nombre_programa: oferta.programa_formacion?.nombre_programa || '',
    codigo_programa: oferta.programa_formacion?.codigo || '',
    version_programa: oferta.programa_formacion?.version || '',
    sector_centro: 'Centro de Comercio y Servicios', // Configurable
    programa_especial: oferta.programa_especial?.nombre || 'Ninguno',
    cupo_aprendices: oferta.cupo_maximo || '',
    tipo_oferta: oferta.tipo_oferta?.nombre || '',
    convenio: oferta.convenio?.nombre || 'No',
    nombre_empresa: oferta.empresa_solicitante?.nombre || '',
    nit_empresa: oferta.empresa_solicitante?.nit || '',
    fecha_creacion_empresa: oferta.empresa_solicitante?.fecha_creacion ? 
      new Date(oferta.empresa_solicitante.fecha_creacion).toLocaleDateString() : '',
    tipo_empresa: oferta.empresa_solicitante?.tipo_empresa || '',
    direccion_empresa: oferta.empresa_solicitante?.direccion || '',
    representante_legal: oferta.empresa_solicitante?.representante_legal?.nombre_completo || '',
    contacto_nombre: oferta.empresa_solicitante?.contacto?.nombre_completo || '',
    contacto_celular: oferta.empresa_solicitante?.contacto?.telefono || '',
    contacto_correo: oferta.empresa_solicitante?.contacto?.correo || '',
    num_empleados: oferta.empresa_solicitante?.numero_empleados || '',
    municipio: oferta.ubicacion?.municipio?.nombre || '',
    direccion: oferta.ubicacion?.direccion || '',
    duracion_horas: calcularHoras(oferta.fechas?.inicio, oferta.fechas?.fin),
    fecha_inicio: oferta.fechas?.inicio ? new Date(oferta.fechas.inicio).toLocaleDateString() : '',
    fecha_fin: oferta.fechas?.fin ? new Date(oferta.fechas.fin).toLocaleDateString() : '',
    horario_mes1: oferta.horario?.dias?.join(', ') || '',
    horario_mes2: oferta.horario?.dias?.join(', ') || '',
    dinamizador: oferta.coordinador_asignado?.nombre || '',
    pdf_cedulas: oferta.pdf_cedulas ? 'Adjunto' : 'Pendiente',
    formato_inscripcion: 'Generado',
    ficha_caracterizacion: 'Generada',
    carta_solicitud: oferta.carta_pdf ? 'Adjunta' : 'Pendiente'
  });
};

// Generar Excel para oferta CAMPESENA (48 columnas)
const generarExcelCampesena = async (worksheet, oferta, instructores) => {
  // Encontrar instructores por tipo
  const instructorTecnico = instructores.find(i => i.tipo === 'Técnico') || {};
  const instructorEmpresarial = instructores.find(i => i.tipo === 'Empresarial') || {};
  const instructorPopular = instructores.find(i => i.tipo === 'Popular') || {};

  // Función para obtener fechas de un mes específico
  const getFechasMes = (instructor, mes) => {
    const programacion = instructor.programacion?.find(p => p.mes === mes);
    if (!programacion || !programacion.rangos) return '';
    return programacion.rangos.map(r => 
      `${new Date(r.desde).toLocaleDateString()} - ${new Date(r.hasta).toLocaleDateString()}`
    ).join(', ');
  };

  worksheet.columns = [
    { header: '¿Tiene la información de los otros instructores?', key: 'tiene_instructores' },
    // Instructor Técnico
    { header: 'Nombre completo (Técnico)', key: 'tecnico_nombre' },
    { header: 'Correo electrónico (Técnico)', key: 'tecnico_correo' },
    { header: 'Celular (Técnico)', key: 'tecnico_celular' },
    { header: 'Fechas de ejecución Mes 1 (Técnico)', key: 'tecnico_mes1' },
    { header: 'Fechas de ejecución Mes 2 (Técnico)', key: 'tecnico_mes2' },
    { header: 'Fechas de ejecución Mes 3 (Técnico)', key: 'tecnico_mes3' },
    { header: 'Fechas de ejecución Mes 4 (Técnico)', key: 'tecnico_mes4' },
    { header: 'Fechas de ejecución Mes 5 (Técnico)', key: 'tecnico_mes5' },
    // Instructor Empresarial
    { header: 'Nombre completo (Empresarial)', key: 'empresarial_nombre' },
    { header: 'Correo electrónico (Empresarial)', key: 'empresarial_correo' },
    { header: 'Celular (Empresarial)', key: 'empresarial_celular' },
    { header: 'Fechas de ejecución Mes 1 (Empresarial)', key: 'empresarial_mes1' },
    { header: 'Fechas de ejecución Mes 2 (Empresarial)', key: 'empresarial_mes2' },
    { header: 'Fechas de ejecución Mes 3 (Empresarial)', key: 'empresarial_mes3' },
    { header: 'Fechas de ejecución Mes 4 (Empresarial)', key: 'empresarial_mes4' },
    { header: 'Fechas de ejecución Mes 5 (Empresarial)', key: 'empresarial_mes5' },
    // Instructor Popular
    { header: 'Nombre completo (Popular)', key: 'popular_nombre' },
    { header: 'Correo electrónico (Popular)', key: 'popular_correo' },
    { header: 'Celular (Popular)', key: 'popular_celular' },
    { header: 'Fechas de ejecución Mes 1 (Popular)', key: 'popular_mes1' },
    { header: 'Fechas de ejecución Mes 2 (Popular)', key: 'popular_mes2' },
    // Datos del programa
    { header: 'Nombre del programa', key: 'nombre_programa' },
    { header: 'Código del programa', key: 'codigo_programa' },
    { header: 'Versión del programa', key: 'version_programa' },
    { header: 'Sector del centro', key: 'sector_centro' },
    { header: 'Programa especial', key: 'programa_especial' },
    { header: 'Cupo de aprendices', key: 'cupo_aprendices' },
    { header: 'Tipo de oferta', key: 'tipo_oferta' },
    // Datos de la empresa
    { header: 'Nombre de la empresa', key: 'nombre_empresa' },
    { header: 'NIT de la empresa', key: 'nit_empresa' },
    { header: 'Fecha de creación de la empresa', key: 'fecha_creacion_empresa' },
    { header: 'Tipo de empresa', key: 'tipo_empresa' },
    { header: 'Dirección de la empresa', key: 'direccion_empresa' },
    { header: 'Nombre del representante legal', key: 'representante_legal' },
    { header: 'Nombre del contacto en la empresa', key: 'contacto_nombre' },
    { header: 'Celular del contacto', key: 'contacto_celular' },
    { header: 'Correo del contacto', key: 'contacto_correo' },
    { header: 'Número de empleados', key: 'num_empleados' },
    // Datos de la formación
    { header: 'Municipio de desarrollo', key: 'municipio' },
    { header: 'Dirección donde se realiza', key: 'direccion' },
    { header: 'Duración en horas', key: 'duracion_horas' },
    { header: 'Fecha inicio', key: 'fecha_inicio' },
    { header: 'Fecha fin', key: 'fecha_fin' },
    // Documentos
    { header: 'PDF cédulas de aprendices', key: 'pdf_cedulas' },
    { header: 'Formato de inscripción masivo', key: 'formato_inscripcion' },
    { header: 'Ficha de caracterización', key: 'ficha_caracterizacion' },
    { header: 'Carta de solicitud de la empresa', key: 'carta_solicitud' }
  ];

  // Calcular duración en horas
  const calcularHoras = (fechaInicio, fechaFin) => {
    if (!fechaInicio || !fechaFin) return 'N/A';
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diffDays = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
    return (diffDays * 8).toString();
  };

  worksheet.addRow({
    tiene_instructores: 'Sí',
    // Técnico
    tecnico_nombre: instructorTecnico.nombre || '',
    tecnico_correo: instructorTecnico.correo || '',
    tecnico_celular: instructorTecnico.celular || '',
    tecnico_mes1: getFechasMes(instructorTecnico, 1),
    tecnico_mes2: getFechasMes(instructorTecnico, 2),
    tecnico_mes3: getFechasMes(instructorTecnico, 3),
    tecnico_mes4: getFechasMes(instructorTecnico, 4),
    tecnico_mes5: getFechasMes(instructorTecnico, 5),
    // Empresarial
    empresarial_nombre: instructorEmpresarial.nombre || '',
    empresarial_correo: instructorEmpresarial.correo || '',
    empresarial_celular: instructorEmpresarial.celular || '',
    empresarial_mes1: getFechasMes(instructorEmpresarial, 1),
    empresarial_mes2: getFechasMes(instructorEmpresarial, 2),
    empresarial_mes3: getFechasMes(instructorEmpresarial, 3),
    empresarial_mes4: getFechasMes(instructorEmpresarial, 4),
    empresarial_mes5: getFechasMes(instructorEmpresarial, 5),
    // Popular
    popular_nombre: instructorPopular.nombre || '',
    popular_correo: instructorPopular.correo || '',
    popular_celular: instructorPopular.celular || '',
    popular_mes1: getFechasMes(instructorPopular, 1),
    popular_mes2: getFechasMes(instructorPopular, 2),
    // Programa
    nombre_programa: oferta.programa_formacion?.nombre_programa || '',
    codigo_programa: oferta.programa_formacion?.codigo || '',
    version_programa: oferta.programa_formacion?.version || '',
    sector_centro: 'Centro de Comercio y Servicios',
    programa_especial: oferta.programa_especial?.nombre || 'Ninguno',
    cupo_aprendices: oferta.cupo_maximo || '',
    tipo_oferta: oferta.tipo_oferta?.nombre || '',
    // Empresa
    nombre_empresa: oferta.empresa_solicitante?.nombre || '',
    nit_empresa: oferta.empresa_solicitante?.nit || '',
    fecha_creacion_empresa: oferta.empresa_solicitante?.fecha_creacion ? 
      new Date(oferta.empresa_solicitante.fecha_creacion).toLocaleDateString() : '',
    tipo_empresa: oferta.empresa_solicitante?.tipo_empresa || '',
    direccion_empresa: oferta.empresa_solicitante?.direccion || '',
    representante_legal: oferta.empresa_solicitante?.representante_legal?.nombre_completo || '',
    contacto_nombre: oferta.empresa_solicitante?.contacto?.nombre_completo || '',
    contacto_celular: oferta.empresa_solicitante?.contacto?.telefono || '',
    contacto_correo: oferta.empresa_solicitante?.contacto?.correo || '',
    num_empleados: oferta.empresa_solicitante?.numero_empleados || '',
    // Formación
    municipio: oferta.ubicacion?.municipio?.nombre || '',
    direccion: oferta.ubicacion?.direccion || '',
    duracion_horas: calcularHoras(oferta.fechas?.inicio, oferta.fechas?.fin),
    fecha_inicio: oferta.fechas?.inicio ? new Date(oferta.fechas.inicio).toLocaleDateString() : '',
    fecha_fin: oferta.fechas?.fin ? new Date(oferta.fechas.fin).toLocaleDateString() : '',
    // Documentos
    pdf_cedulas: 'Pendiente',
    formato_inscripcion: 'Generado',
    ficha_caracterizacion: 'Generada',
    carta_solicitud: oferta.carta_pdf ? 'Adjunta' : 'Pendiente'
  });
};

module.exports = { exportarExcelOferta };