const { PDFDocument } = require('pdf-lib');
const fs   = require('fs');
const path = require('path');

// ── Raíces donde buscar archivos ─────────────────────────────────────────────
// __dirname  → .../backend/services
// backendDir → .../backend
// projectDir → ... (carpeta raíz del proyecto)
const backendDir = path.resolve(__dirname, '..');
const projectDir = path.resolve(__dirname, '../..');

/**
 * Dado un path (absoluto o relativo), devuelve la primera ruta real
 * que exista en disco. Si ninguna existe, devuelve null.
 */
const resolverRuta = (rutaOriginal) => {
  // Normalizar separadores (Windows usa \, pero a veces llegan /)
  const normalizada = rutaOriginal.replace(/\//g, path.sep).replace(/\\/g, path.sep);

  const candidatas = [
    // 1. Tal cual llegó
    normalizada,
    // 2. Relativa al directorio backend/
    path.join(backendDir, normalizada),
    // 3. Relativa a la raíz del proyecto
    path.join(projectDir, normalizada),
    // 4. Si la ruta ya incluye "backend/" al principio, quitar ese prefijo
    //    y buscar desde projectDir  (evita doble "backend/backend/...")
    path.join(projectDir, normalizada.replace(/^backend[\/\\]/i, '')),
    // 5. Solo el nombre de archivo dentro de uploads/ del backend
    path.join(backendDir, 'uploads', path.basename(normalizada)),
    // 6. Solo el nombre de archivo dentro de uploads/cedulas/
    path.join(backendDir, 'uploads', 'cedulas', path.basename(normalizada)),
  ];

  for (const c of candidatas) {
    const abs = path.normalize(c);
    if (fs.existsSync(abs)) return abs;
  }
  return null;
};

// ── Función principal ────────────────────────────────────────────────────────
const fusionarPDFs = async (archivosPDF, ofertaId) => {
  console.log('\n🔍 ===== INICIANDO FUSIÓN DE PDFs =====');
  console.log(`📊 Total archivos: ${archivosPDF.length}`);
  console.log(`📁 backendDir : ${backendDir}`);
  console.log(`📁 projectDir : ${projectDir}`);

  const pdfFusionado  = await PDFDocument.create();
  let pdfsProcesados  = 0;
  const pdfsFallidos  = [];

  for (const archivo of archivosPDF) {
    const etiqueta = archivo.documento || path.basename(archivo.path || '');
    console.log(`\n📄 Procesando: ${etiqueta}`);
    console.log(`   Ruta recibida : ${archivo.path}`);

    try {
      // ── 1. Resolver ruta ────────────────────────────────────────────────
      const rutaResuelta = resolverRuta(archivo.path);

      if (!rutaResuelta) {
        console.log(`   ❌ No encontrado en ninguna ubicación conocida`);
        pdfsFallidos.push({ documento: etiqueta, path: archivo.path, error: 'Archivo no encontrado' });
        continue;
      }

      console.log(`   ✅ Ruta resuelta: ${rutaResuelta}`);

      // ── 2. Leer bytes ───────────────────────────────────────────────────
      const pdfBytes = fs.readFileSync(rutaResuelta);
      console.log(`   📦 Tamaño: ${pdfBytes.length} bytes`);

      if (pdfBytes.length < 100) {
        console.log(`   ❌ Archivo demasiado pequeño`);
        pdfsFallidos.push({ documento: etiqueta, path: archivo.path, error: 'Archivo demasiado pequeño' });
        continue;
      }

      // ── 3. Verificar cabecera PDF ───────────────────────────────────────
      const header = pdfBytes.slice(0, 4).toString('ascii');
      console.log(`   🔤 Header: "${header}"`);

      if (header !== '%PDF') {
        console.log(`   ❌ No es un PDF válido (header incorrecto)`);
        pdfsFallidos.push({ documento: etiqueta, path: archivo.path, error: `Header inválido: "${header}"` });
        continue;
      }

      // ── 4. Cargar y copiar páginas ──────────────────────────────────────
      const pdf     = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const paginas = await pdfFusionado.copyPages(pdf, pdf.getPageIndices());
      paginas.forEach(p => pdfFusionado.addPage(p));

      pdfsProcesados++;
      console.log(`   ✅ ${paginas.length} página(s) agregadas`);

    } catch (err) {
      console.error(`   ❌ Error inesperado: ${err.message}`);
      pdfsFallidos.push({ documento: etiqueta, path: archivo.path, error: err.message });
    }
  }

  // ── Resumen ──────────────────────────────────────────────────────────────
  console.log('\n📊 Resumen:');
  console.log(`   Procesados : ${pdfsProcesados}`);
  console.log(`   Fallidos   : ${pdfsFallidos.length}`);

  if (pdfsFallidos.length > 0) {
    console.log('\n⚠️  Detalle de fallidos:');
    pdfsFallidos.forEach((f, i) =>
      console.log(`   [${i + 1}] ${f.documento} — ${f.error} — path: ${f.path}`)
    );
  }

  if (pdfsProcesados === 0) {
    throw new Error(`No se pudo procesar ningún PDF válido. Fallidos: ${pdfsFallidos.length}`);
  }

  // ── Guardar resultado ────────────────────────────────────────────────────
  const bytesFinales  = await pdfFusionado.save();
  const fecha         = new Date().toISOString().split('T')[0];
  const nombreArchivo = `cedulas_fusionadas_${ofertaId}_${fecha}.pdf`;
  const rutaSalida    = path.join(backendDir, 'uploads', 'fusionados', nombreArchivo);

  fs.mkdirSync(path.dirname(rutaSalida), { recursive: true });
  fs.writeFileSync(rutaSalida, bytesFinales);

  console.log(`\n💾 PDF guardado: ${rutaSalida}`);
  console.log('🔍 ===== FIN FUSIÓN =====\n');

  return {
    success:      true,
    path:         rutaSalida,
    nombre:       nombreArchivo,
    totalPaginas: pdfsProcesados,
    fallidos:     pdfsFallidos,
  };
};

module.exports = { fusionarPDFs };