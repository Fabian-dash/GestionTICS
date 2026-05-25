const ExcelJS = require('exceljs');

// Generar Excel solo con cédulas (datos personales)
const generarExcelCedulas = async (inscritos) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Cédulas');
  
  // Encabezados
  worksheet.getCell('A1').value = 'Tipo Documento';
  worksheet.getCell('B1').value = 'Número de Documento';
  worksheet.getCell('C1').value = 'Nombres';
  worksheet.getCell('D1').value = 'Apellidos';
  worksheet.getCell('E1').value = 'Teléfono';
  worksheet.getCell('F1').value = 'Email';
  worksheet.getCell('G1').value = 'Caracterización';
  
  // Estilo de encabezados
  ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1'].forEach(cell => {
    worksheet.getCell(cell).font = { bold: true };
    worksheet.getCell(cell).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
  });

  // Datos de los inscritos
  inscritos.forEach((inscrito, index) => {
    const row = index + 2;
    worksheet.getCell(`A${row}`).value = inscrito.tipo_documento?.nombre || '';
    worksheet.getCell(`B${row}`).value = inscrito.numero_documento;
    worksheet.getCell(`C${row}`).value = inscrito.nombres;
    worksheet.getCell(`D${row}`).value = inscrito.apellidos;
    worksheet.getCell(`E${row}`).value = inscrito.telefono;
    worksheet.getCell(`F${row}`).value = inscrito.correo;
    worksheet.getCell(`G${row}`).value = inscrito.caracterizacion?.tipo_caracterizacion || '';
  });

  // Ajustar ancho de columnas
  worksheet.columns = [
    { width: 20 }, // A
    { width: 20 }, // B
    { width: 25 }, // C
    { width: 25 }, // D
    { width: 15 }, // E
    { width: 30 }, // F
    { width: 30 }  // G
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};



const generarExcelInscripcion = async (inscripcion, oferta) => {
  const workbook = new ExcelJS.Workbook();
  
  // ===== HOJA 1: Formato para el sistema =====
  const hoja1 = workbook.addWorksheet('Formato Sistema');
  
  // Encabezados
  hoja1.getCell('A1').value = 'Resultado del Registro (Reservado para el sistema)';
  hoja1.getCell('B1').value = 'Tipo de Documento';
  hoja1.getCell('C1').value = 'Número de Documento';
  hoja1.getCell('D1').value = 'Código de Ficha';
  hoja1.getCell('E1').value = 'Caracterización';
  hoja1.getCell('F1').value = '';
  hoja1.getCell('G1').value = 'Código Empresa (solo si la ficha es cerrada)';
  
  // Estilo de encabezados
  ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1'].forEach(cell => {
    hoja1.getCell(cell).font = { bold: true };
    hoja1.getCell(cell).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
  });

  // Datos de la inscripción
  hoja1.getCell('A2').value = 'EXITOSO'; // Por defecto
  hoja1.getCell('B2').value = inscripcion.tipo_documento?.nombre || '';
  hoja1.getCell('C2').value = inscripcion.numero_documento;
  hoja1.getCell('D2').value = oferta.programa_formacion?.codigo || '';
  hoja1.getCell('E2').value = inscripcion.caracterizacion?.tipo_caracterizacion || '';
  hoja1.getCell('F2').value = '';
  
  // Si la oferta es cerrada, poner código de empresa
  if (oferta.tipo_oferta?.nombre?.toLowerCase() === 'cerrada') {
    hoja1.getCell('G2').value = oferta.empresa_solicitante?.nit || '';
  }

  // Ajustar ancho de columnas
  hoja1.columns = [
    { width: 30 }, // A
    { width: 20 }, // B
    { width: 20 }, // C
    { width: 20 }, // D
    { width: 30 }, // E
    { width: 10 }, // F
    { width: 25 }  // G
  ];

  // ===== HOJA 2: Datos personales =====
  const hoja2 = workbook.addWorksheet('Datos Personales');
  
  // Encabezados
  hoja2.getCell('A1').value = 'Tipo Documento';
  hoja2.getCell('B1').value = 'Número de Documento';
  hoja2.getCell('C1').value = 'Nombres';
  hoja2.getCell('D1').value = 'Apellidos';
  hoja2.getCell('E1').value = 'Teléfono';
  hoja2.getCell('F1').value = 'Email';
  hoja2.getCell('G1').value = 'Caracterización';
  
  // Estilo de encabezados
  ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1'].forEach(cell => {
    hoja2.getCell(cell).font = { bold: true };
    hoja2.getCell(cell).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
  });

  // Datos de la inscripción
  hoja2.getCell('A2').value = inscripcion.tipo_documento?.nombre || '';
  hoja2.getCell('B2').value = inscripcion.numero_documento;
  hoja2.getCell('C2').value = inscripcion.nombres;
  hoja2.getCell('D2').value = inscripcion.apellidos;
  hoja2.getCell('E2').value = inscripcion.telefono;
  hoja2.getCell('F2').value = inscripcion.correo;
  hoja2.getCell('G2').value = inscripcion.caracterizacion?.tipo_caracterizacion || '';

  // Ajustar ancho de columnas
  hoja2.columns = [
    { width: 20 }, // A
    { width: 20 }, // B
    { width: 25 }, // C
    { width: 25 }, // D
    { width: 15 }, // E
    { width: 30 }, // F
    { width: 30 }  // G
  ];

  // Generar el archivo
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

module.exports = { generarExcelInscripcion, generarExcelCedulas };