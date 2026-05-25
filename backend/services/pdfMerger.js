const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const fusionarPDFs = async (archivosPDF, ofertaId) => {
  try {
    console.log('🔍 ===== INICIANDO FUSIÓN DE PDFs =====');
    console.log('📊 Total de archivos a fusionar:', archivosPDF.length);
    
    // Crear un nuevo documento PDF
    const pdfFusionado = await PDFDocument.create();
    let pdfsProcesados = 0;
    let pdfsFallidos = [];
    
    // Recorrer cada archivo PDF
    for (const archivo of archivosPDF) {
      try {
        console.log(`📄 Procesando archivo: ${archivo.path}`);
        
        // Verificar que el archivo existe
        if (!fs.existsSync(archivo.path)) {
          console.log(`❌ Archivo no encontrado: ${archivo.path}`);
          pdfsFallidos.push({ path: archivo.path, error: 'Archivo no encontrado' });
          continue;
        }
        
        // Leer el archivo PDF
        const pdfBytes = fs.readFileSync(archivo.path);
        
        // Verificar que el archivo tiene contenido
        if (pdfBytes.length < 100) {
          console.log(`❌ Archivo demasiado pequeño: ${pdfBytes.length} bytes`);
          pdfsFallidos.push({ path: archivo.path, error: 'Archivo demasiado pequeño' });
          continue;
        }
        
        // Verificar que empieza con %PDF (cabecera de PDF)
        const header = pdfBytes.slice(0, 4).toString();
        if (header !== '%PDF') {
          console.log(`❌ Archivo no es un PDF válido (header: ${header})`);
          pdfsFallidos.push({ path: archivo.path, error: 'No es un PDF válido' });
          continue;
        }
        
        // Cargar el PDF ignorando encriptación
        const pdf = await PDFDocument.load(pdfBytes, { 
          ignoreEncryption: true
        });
        
        // Copiar todas las páginas
        const paginas = await pdfFusionado.copyPages(pdf, pdf.getPageIndices());
        
        // Agregar cada página al documento fusionado
        paginas.forEach((pagina) => {
          pdfFusionado.addPage(pagina);
        });
        
        pdfsProcesados++;
        console.log(`✅ PDF procesado correctamente. Páginas: ${paginas.length}`);
        
      } catch (pdfError) {
        console.error(`❌ Error procesando PDF ${archivo.path}:`, pdfError.message);
        pdfsFallidos.push({ 
          path: archivo.path, 
          error: pdfError.message,
          documento: archivo.documento
        });
      }
    }
    
    console.log('📊 Resumen de fusión:');
    console.log(`   - Procesados: ${pdfsProcesados}`);
    console.log(`   - Fallidos: ${pdfsFallidos.length}`);
    
    if (pdfsProcesados === 0) {
      throw new Error('No se pudo procesar ningún PDF válido');
    }
    
    // Guardar el PDF fusionado
    const pdfBytes = await pdfFusionado.save();
    
    // Crear nombre de archivo
    const fecha = new Date().toISOString().split('T')[0];
    const timestamp = Date.now();
    const nombreArchivo = `cedulas_fusionadas_${ofertaId}_${fecha}.pdf`;
    const rutaSalida = path.join(__dirname, '../uploads/fusionados', nombreArchivo);
    
    // Asegurar que la carpeta existe
    const dirSalida = path.dirname(rutaSalida);
    if (!fs.existsSync(dirSalida)) {
      fs.mkdirSync(dirSalida, { recursive: true });
    }
    
    // Escribir el archivo
    fs.writeFileSync(rutaSalida, pdfBytes);
    
    return {
      success: true,
      path: rutaSalida,
      nombre: nombreArchivo,
      totalPaginas: pdfsProcesados,
      fallidos: pdfsFallidos
    };
    
  } catch (error) {
    console.error('❌ Error fusionando PDFs:', error);
    throw error;
  }
};

module.exports = { fusionarPDFs };