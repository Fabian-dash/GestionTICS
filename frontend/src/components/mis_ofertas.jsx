import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';

// ── Configuración de estados ────────────────────────────────────────────────
const ESTADO_CONFIG = {
  borrador:          { label: 'Borrador',                  bg: '#F1EFE8', color: '#5F5E5A', dot: '#888780' },
  pendiente:         { label: 'Pendiente coordinador',     bg: '#FAEEDA', color: '#7a4a0a', dot: '#EF9F27' },
  rechazada:         { label: 'Rechazada',                 bg: '#FCEBEB', color: '#9b1f1f', dot: '#E24B4A' },
  a_corregir:        { label: 'A corregir',                bg: '#FCEBEB', color: '#9b1f1f', dot: '#E24B4A' },
  lista_espera:      { label: 'En lista de espera',        bg: '#EAF3DE', color: '#2d5a0e', dot: '#639922' },
  en_proceso:        { label: 'En proceso de creación',    bg: '#E6F1FB', color: '#154e8e', dot: '#378ADD' },
  creada:            { label: 'Creada',                    bg: '#EEEDFE', color: '#3C3489', dot: '#7F77DD' },
  matriculada:       { label: 'Matriculada',               bg: '#e8f5e9', color: '#2e7d32', dot: '#43a047' },
};

const SENA = {
  dark: '#1a2332', dark2: '#243044',
  green: '#2e7d32', greenLight: '#43a047',
  greenBg: '#e8f5e9', greenMid: '#c8e6c9',
};

// ── Utils ────────────────────────────────────────────────────────────────────
const fmtFecha = (f) => f ? new Date(f).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' }) : 'N/A';
const v = (val, fb = '') => (val !== undefined && val !== null && val !== '') ? val : fb;

// ── Sub-componentes ──────────────────────────────────────────────────────────
const StatCard = ({ label, value, accent, borderColor }) => (
  <div style={{ ...S.statCard, borderTop: `3px solid ${borderColor || '#334155'}` }}>
    <p style={S.statLabel}>{label}</p>
    <p style={{ ...S.statValue, color: accent || '#0d1117' }}>{value}</p>
  </div>
);

const Badge = ({ estado }) => {
  const cfg = ESTADO_CONFIG[estado] || { label: estado || 'Desconocido', bg: '#F1EFE8', color: '#5F5E5A', dot: '#888780' };
  return (
    <span style={{ ...S.badge, backgroundColor: cfg.bg, color: cfg.color }}>
      <span style={{ ...S.badgeDot, backgroundColor: cfg.dot }} />
      {cfg.label}
    </span>
  );
};

const CuposBar = ({ inscritos, maximo }) => {
  const pct = maximo ? Math.min(Math.round((inscritos / maximo) * 100), 100) : 0;
  const barColor = pct >= 100 ? '#E24B4A' : pct >= 70 ? '#EF9F27' : SENA.greenLight;
  return (
    <div>
      <span style={S.cuposText}>{inscritos}/{maximo} inscritos</span>
      <div style={S.barBg}>
        <div style={{ ...S.barFill, width: `${pct}%`, backgroundColor: barColor }} />
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
//  MODAL EDITAR OFERTA RECHAZADA
// ────────────────────────────────────────────────────────────────────────────
const ModalEditarOferta = ({ oferta, onClose, onGuardado }) => {
  const [form, setForm]               = useState({});
  const [guardando, setGuardando]     = useState(false);
  const [error, setError]             = useState('');
  const [exito, setExito]             = useState('');
  const [paso, setPaso]               = useState('editar'); // 'editar' | 'confirmar'
  const [cartaFile, setCartaFile]     = useState(null);
  const [cartaPreview, setCartaPreview] = useState(null);
  const cartaInputRef                 = React.useRef(null);

  useEffect(() => {
    if (!oferta) return;
    setForm({
      fechas_inicio:        oferta.fechas?.inicio ? oferta.fechas.inicio.slice(0, 10) : '',
      fechas_fin:           oferta.fechas?.fin    ? oferta.fechas.fin.slice(0, 10)    : '',
      cupo_maximo:          v(oferta.cupo_maximo, ''),
      horario_hora_inicio:  v(oferta.horario?.hora_inicio, ''),
      horario_hora_fin:     v(oferta.horario?.hora_fin, ''),
      ubicacion_direccion:  v(oferta.ubicacion?.direccion, ''),
      ambiente_nombre:      v(oferta.ambiente?.nombre, ''),
      empresa_nombre:       v(oferta.empresa_solicitante?.nombre, ''),
      convenio_nombre:      v(oferta.convenio?.nombre, ''),
      duracion_meses:       v(oferta.duracion_meses, ''),
    });
    setCartaFile(null);
    setCartaPreview(null);
  }, [oferta]);

  useEffect(() => {
    return () => { if (cartaPreview) URL.revokeObjectURL(cartaPreview); };
  }, [cartaPreview]);

  const handleChange = (e) => {
    setError('');
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleCartaChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('Solo se aceptan archivos PDF para la carta.');
      e.target.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo no debe superar 10 MB.');
      e.target.value = '';
      return;
    }
    setError('');
    setCartaFile(file);
    if (cartaPreview) URL.revokeObjectURL(cartaPreview);
    setCartaPreview(URL.createObjectURL(file));
  };

  const handleRemoveCarta = () => {
    setCartaFile(null);
    if (cartaPreview) URL.revokeObjectURL(cartaPreview);
    setCartaPreview(null);
    if (cartaInputRef.current) cartaInputRef.current.value = '';
  };

  // ─── FIX: flujo simplificado ───────────────────────────────────────────
  // 1. Actualizar campos de la oferta
  // 2. Crear solicitud (crearSolicitud en el backend ya:
  //      - cierra solicitudes anteriores huérfanas
  //      - cambia el estado de la oferta a 'pendiente'
  //      - crea la solicitud nueva para el coordinador)
  // Ya NO se llama a PUT /reenviar por separado (causaba el doble cambio de estado)
  const handleGuardarYReenviar = async () => {
    try {
      setGuardando(true);
      setError('');

      // 1️⃣ Actualizar campos con FormData
      const fd = new FormData();
      fd.append('fechas_inicio',       form.fechas_inicio);
      fd.append('fechas_fin',          form.fechas_fin);
      fd.append('cupo_maximo',         form.cupo_maximo);
      fd.append('horario_hora_inicio', form.horario_hora_inicio);
      fd.append('horario_hora_fin',    form.horario_hora_fin);
      fd.append('ubicacion_direccion', form.ubicacion_direccion);
      fd.append('ambiente_nombre',     form.ambiente_nombre);
      fd.append('convenio_nombre',     form.convenio_nombre);
      fd.append('duracion_meses',      form.duracion_meses);
      if (cartaFile) fd.append('carta_pdf', cartaFile);

      await api.put(`/ofertas/${oferta._id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // 2️⃣ Crear solicitud → el backend cierra las anteriores y cambia el estado
      //    a 'pendiente' internamente. No necesitamos llamar a /reenviar.
      await api.post('/solicitudes/validacion', {
        oferta_id: oferta._id,
        mensaje:   'Oferta corregida y reenviada al coordinador',
      });

      setExito('¡Oferta actualizada y enviada al coordinador correctamente!');
      setTimeout(() => { onGuardado?.(); onClose?.(); }, 1800);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  if (!oferta) return null;

  const motivoRechazo = oferta.observaciones
    || oferta.historial_estados?.slice().reverse().find(h => h?.comentario)?.comentario
    || null;

  return (
    <div style={S.overlay} onClick={(e) => e.target === e.currentTarget && !guardando && onClose()}>
      <div style={S.editModal}>

        {/* ── Header ── */}
        <div style={S.editHeader}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={S.editHeaderChip}>EDITAR OFERTA</span>
              <Badge estado={oferta.estado?.codigo} />
            </div>
            <h2 style={S.editHeaderTitle}>
              {oferta.programa_formacion?.nombre_programa || 'Sin nombre'}
            </h2>
            <code style={S.editHeaderCode}>{oferta.programa_formacion?.codigo || '—'}</code>
          </div>
          <button style={S.btnClose} onClick={onClose} disabled={guardando}>✕</button>
        </div>

        {/* ── Motivo de rechazo ── */}
        {motivoRechazo && (
          <div style={S.motivoBox}>
            <div style={S.motivoTitle}>
              <span style={S.motivoDot} />
              Motivo del rechazo
            </div>
            <p style={S.motivoText}>"{motivoRechazo}"</p>
          </div>
        )}

        {/* ── Body scroll ── */}
        <div style={S.editBody}>

          {error && (
            <div style={S.alertError}>
              <span>⚠ {error}</span>
              <button onClick={() => setError('')} style={S.alertClose}>✕</button>
            </div>
          )}
          {exito && (
            <div style={S.alertSuccess}>
              ✓ {exito}
            </div>
          )}

          {paso === 'editar' && (
            <>
              <FieldSection title="📅 Fechas de la oferta">
                <div style={S.formGrid}>
                  <FormField label="Fecha de inicio" required>
                    <input type="date" name="fechas_inicio" value={form.fechas_inicio || ''} onChange={handleChange} style={S.input} />
                  </FormField>
                  <FormField label="Fecha de fin" required>
                    <input type="date" name="fechas_fin" value={form.fechas_fin || ''} onChange={handleChange} style={S.input} />
                  </FormField>
                  <FormField label="Duración (meses)">
                    <input type="number" name="duracion_meses" value={form.duracion_meses || ''} onChange={handleChange} style={S.input} min="1" max="60" />
                  </FormField>
                  <FormField label="Cupo máximo">
                    <input type="number" name="cupo_maximo" value={form.cupo_maximo || ''} onChange={handleChange} style={S.input} min="1" />
                  </FormField>
                </div>
              </FieldSection>

              <FieldSection title="🕐 Horario">
                <div style={S.formGrid}>
                  <FormField label="Hora inicio">
                    <input type="time" name="horario_hora_inicio" value={form.horario_hora_inicio || ''} onChange={handleChange} style={S.input} />
                  </FormField>
                  <FormField label="Hora fin">
                    <input type="time" name="horario_hora_fin" value={form.horario_hora_fin || ''} onChange={handleChange} style={S.input} />
                  </FormField>
                </div>
              </FieldSection>

              <FieldSection title="📍 Ubicación y ambiente">
                <div style={S.formGrid}>
                  <FormField label="Dirección" wide>
                    <input type="text" name="ubicacion_direccion" value={form.ubicacion_direccion || ''} onChange={handleChange} style={S.input} placeholder="Ej: Calle 10 #5-30" />
                  </FormField>
                  <FormField label="Ambiente / Aula">
                    <input type="text" name="ambiente_nombre" value={form.ambiente_nombre || ''} onChange={handleChange} style={S.input} placeholder="Ej: Aula 201" />
                  </FormField>
                  <FormField label="Convenio">
                    <input type="text" name="convenio_nombre" value={form.convenio_nombre || ''} onChange={handleChange} style={S.input} />
                  </FormField>
                </div>
              </FieldSection>

              <FieldSection title="ℹ️ Datos del programa (no editables)">
                <div style={S.roGrid}>
                  <ROField label="Programa"  value={oferta.programa_formacion?.nombre_programa} />
                  <ROField label="Código"    value={oferta.programa_formacion?.codigo} mono />
                  <ROField label="Modalidad" value={oferta.modalidad?.nombre ?? oferta.modalidad} />
                  <ROField label="Tipo"      value={oferta.tipo_oferta?.nombre ?? oferta.tipo_oferta} />
                  <ROField label="Municipio" value={oferta.ubicacion?.municipio?.nombre ?? oferta.ubicacion?.municipio} />
                </div>
              </FieldSection>

              <FieldSection title="📎 Documentos adjuntos">
                <div style={S.archivosInfo}>
                  <div style={S.archivoInfoRow}>
                    <span style={S.archivoInfoIcon}>📄</span>
                    <div>
                      <p style={S.archivoInfoLabel}>Ficha de caracterización</p>
                      <p style={S.archivoInfoDesc}>Se regenera automáticamente al guardar los cambios.</p>
                    </div>
                    <span style={S.archivoBadgeAuto}>Automático</span>
                  </div>
                  <div style={S.archivoDivider} />
                  <div style={S.archivoInfoRow}>
                    <span style={S.archivoInfoIcon}>📊</span>
                    <div>
                      <p style={S.archivoInfoLabel}>Planilla Excel de inscritos</p>
                      <p style={S.archivoInfoDesc}>Se genera automáticamente desde los inscritos registrados.</p>
                    </div>
                    <span style={S.archivoBadgeAuto}>Automático</span>
                  </div>
                  <div style={S.archivoDivider} />
                  <div style={S.archivoInfoRow}>
                    <span style={S.archivoInfoIcon}>🪪</span>
                    <div>
                      <p style={S.archivoInfoLabel}>PDF de cédulas</p>
                      <p style={S.archivoInfoDesc}>Se genera automáticamente desde las cédulas de los inscritos.</p>
                    </div>
                    <span style={S.archivoBadgeAuto}>Automático</span>
                  </div>
                </div>

                <div style={S.cartaWrap}>
                  <div style={S.cartaHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>✉️</span>
                      <div>
                        <p style={S.cartaTitle}>Carta de solicitud</p>
                        <p style={S.cartaDesc}>
                          {oferta.carta_pdf
                            ? 'Ya tienes una carta adjunta. Puedes reemplazarla subiendo un nuevo PDF.'
                            : 'No hay carta adjunta. Sube un PDF para incluirla.'}
                        </p>
                      </div>
                    </div>
                    <span style={S.archivoBadgeEditable}>Editable</span>
                  </div>

                  {oferta.carta_pdf && !cartaFile && (
                    <div style={S.cartaActual}>
                      <span style={{ fontSize: 13 }}>📎</span>
                      <span style={S.cartaActualNombre}>Carta actual adjunta</span>
                      <span style={S.cartaActualTag}>PDF existente</span>
                    </div>
                  )}

                  {cartaFile && (
                    <div style={S.cartaNueva}>
                      <div style={S.cartaNuevaLeft}>
                        <span style={{ fontSize: 20 }}>📄</span>
                        <div>
                          <p style={S.cartaNuevaName}>{cartaFile.name}</p>
                          <p style={S.cartaNuevaSize}>{(cartaFile.size / 1024).toFixed(1)} KB · PDF</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {cartaPreview && (
                          <a href={cartaPreview} target="_blank" rel="noopener noreferrer" style={S.btnCartaVer}>
                            👁 Ver
                          </a>
                        )}
                        <button onClick={handleRemoveCarta} style={S.btnCartaRemover} title="Quitar archivo">✕</button>
                      </div>
                    </div>
                  )}

                  <div
                    style={S.dropZone}
                    onClick={() => cartaInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#2e7d32'; e.currentTarget.style.background = '#f0fdf4'; }}
                    onDragLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = '#fafafa'; }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = '#d1d5db';
                      e.currentTarget.style.background = '#fafafa';
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleCartaChange({ target: { files: [file] } });
                    }}
                  >
                    <span style={{ fontSize: 28, display: 'block', marginBottom: 6 }}>☁️</span>
                    <p style={S.dropZoneTitle}>{cartaFile ? 'Cambiar archivo' : 'Subir carta PDF'}</p>
                    <p style={S.dropZoneDesc}>Arrastra y suelta o haz clic · Solo PDF · Máx. 10 MB</p>
                    <input
                      ref={cartaInputRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={handleCartaChange}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>
              </FieldSection>
            </>
          )}

          {paso === 'confirmar' && (
            <div style={S.confirmPanel}>
              <div style={S.confirmIcon}>📤</div>
              <h3 style={S.confirmTitle}>¿Confirmar y reenviar?</h3>
              <p style={S.confirmDesc}>
                Al continuar, la oferta se actualizará con los cambios que realizaste y se enviará nuevamente
                al coordinador para su revisión. El estado cambiará a <strong>Pendiente coordinador</strong>.
              </p>
              <div style={S.confirmChanges}>
                <p style={S.confirmChangesTitle}>Resumen de cambios</p>
                <div style={S.confirmGrid}>
                  {form.fechas_inicio && <ConfirmRow label="Fecha inicio" value={fmtFecha(form.fechas_inicio)} />}
                  {form.fechas_fin    && <ConfirmRow label="Fecha fin"    value={fmtFecha(form.fechas_fin)} />}
                  {form.cupo_maximo   && <ConfirmRow label="Cupo máximo"  value={`${form.cupo_maximo} aprendices`} />}
                  {form.horario_hora_inicio && <ConfirmRow label="Hora inicio" value={form.horario_hora_inicio} />}
                  {form.horario_hora_fin    && <ConfirmRow label="Hora fin"    value={form.horario_hora_fin} />}
                  {form.ubicacion_direccion && <ConfirmRow label="Dirección"   value={form.ubicacion_direccion} />}
                  {form.ambiente_nombre     && <ConfirmRow label="Ambiente"    value={form.ambiente_nombre} />}
                  {form.convenio_nombre     && <ConfirmRow label="Convenio"    value={form.convenio_nombre} />}
                  {form.duracion_meses      && <ConfirmRow label="Duración"    value={`${form.duracion_meses} meses`} />}
                  {cartaFile && (
                    <ConfirmRow
                      label="Carta PDF"
                      value={
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>📄</span>
                          <span style={{ color: SENA.green, fontWeight: 700 }}>{cartaFile.name}</span>
                          <span style={{ color: '#9aa0ab', fontWeight: 400, fontSize: 11 }}>
                            ({(cartaFile.size / 1024).toFixed(1)} KB)
                          </span>
                        </span>
                      }
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={S.editFooter}>
          {paso === 'editar' ? (
            <>
              <button style={S.btnCancelar} onClick={onClose} disabled={guardando}>Cancelar</button>
              <button style={S.btnSiguiente} onClick={() => { setError(''); setPaso('confirmar'); }} disabled={guardando}>
                Revisar y reenviar →
              </button>
            </>
          ) : (
            <>
              <button style={S.btnCancelar} onClick={() => setPaso('editar')} disabled={guardando}>
                ← Volver a editar
              </button>
              <button
                style={{ ...S.btnEnviar, ...(guardando ? S.btnDisabled : {}) }}
                onClick={handleGuardarYReenviar}
                disabled={guardando}
              >
                {guardando
                  ? <><span style={S.btnSpinner} /> Enviando...</>
                  : '✓ Guardar y enviar al coordinador'
                }
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Helpers de formulario
const FieldSection = ({ title, children }) => (
  <div style={S.fieldSection}>
    <p style={S.fieldSectionTitle}>{title}</p>
    {children}
  </div>
);

const FormField = ({ label, children, wide, required }) => (
  <div style={{ ...S.formField, ...(wide ? { gridColumn: '1 / -1' } : {}) }}>
    <label style={S.formLabel}>
      {label}
      {required && <span style={{ color: '#E24B4A', marginLeft: 3 }}>*</span>}
    </label>
    {children}
  </div>
);

const ROField = ({ label, value, mono }) => (
  <div style={S.roField}>
    <span style={S.roLabel}>{label}</span>
    <span style={{ ...S.roValue, ...(mono ? { fontFamily: 'monospace', color: '#2563eb' } : {}) }}>
      {v(value, '—')}
    </span>
  </div>
);

const ConfirmRow = ({ label, value }) => (
  <div style={S.confirmRow}>
    <span style={S.confirmRowLabel}>{label}</span>
    <span style={S.confirmRowValue}>{value}</span>
  </div>
);

// ────────────────────────────────────────────────────────────────────────────
//  MODAL VER DETALLE
// ────────────────────────────────────────────────────────────────────────────
const INFO_COLORS = {
  blue:   { bg: '#e6f1fb', label: '#185FA5', value: '#0C3D72', border: '#B8D5F2' },
  purple: { bg: '#EEEDFE', label: '#534AB7', value: '#3C3489', border: '#D2CEF5' },
  green:  { bg: SENA.greenBg, label: SENA.green, value: '#1b5e20', border: SENA.greenMid },
  amber:  { bg: '#FDF3E3', label: '#BA7517', value: '#6b3d08', border: '#FAE3B8' },
};

const ColorInfoItem = ({ label, value, palette }) => {
  const c = INFO_COLORS[palette] || INFO_COLORS.blue;
  return (
    <div style={{ backgroundColor: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontSize: 10, color: c.label, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: c.value }}>{value}</span>
    </div>
  );
};

const ModalDetalle = ({ oferta, onClose }) => {
  if (!oferta) return null;
  const inscritos   = oferta.inscritos_count ?? 0;
  const maximo      = oferta.cupo_maximo ?? 0;
  const disponibles = Math.max(0, maximo - inscritos);
  const pct         = maximo ? Math.min(Math.round((inscritos / maximo) * 100), 100) : 0;
  const barColor    = pct >= 100 ? '#E24B4A' : pct >= 70 ? '#EF9F27' : SENA.greenLight;
  const estadoCfg   = ESTADO_CONFIG[oferta.estado?.codigo];
  const cuposBg     = pct >= 100 ? 'linear-gradient(135deg,#FDEAEA,#F8CBCB)' : pct >= 70 ? 'linear-gradient(135deg,#FDF3E3,#FAE3B8)' : `linear-gradient(135deg,${SENA.greenBg},${SENA.greenMid})`;
  const cuposBorder = pct >= 100 ? '#F8CBCB' : pct >= 70 ? '#FAD48A' : '#a5d6a7';
  const cuposNumCol = pct >= 100 ? '#9b1f1f' : pct >= 70 ? '#7a4a0a' : '#1b5e20';

  return (
    <div style={S.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>
        <div style={S.modalHeader}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ marginBottom: 8 }}>
              <span style={S.modalChip}>{oferta.es_campesena ? 'Campesena' : 'Regular'} · {oferta.programa_formacion?.nivel || 'N/A'}</span>
            </div>
            <h2 style={S.modalTitle}>{oferta.programa_formacion?.nombre_programa || 'N/A'}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <code style={S.modalCode}>{oferta.programa_formacion?.codigo || 'N/A'}</code>
              <Badge estado={oferta.estado?.codigo} />
            </div>
          </div>
          <button style={S.btnClose} onClick={onClose}>✕</button>
        </div>
        <div style={S.modalBody}>
          <p style={S.sectionTitle}>Información general</p>
          <div style={S.infoGrid}>
            <ColorInfoItem label="Municipio"     value={oferta.ubicacion?.municipio?.nombre || 'N/A'} palette="blue" />
            <ColorInfoItem label="Jornada"       value={oferta.horario?.dias?.join(', ') || 'N/A'}   palette="purple" />
            <ColorInfoItem label="Horas totales" value={oferta.programa_formacion?.duracion_maxima ? `${oferta.programa_formacion.duracion_maxima} h` : 'N/A'} palette="green" />
            <ColorInfoItem label="Instructor"    value={oferta.coordinador_asignado?.nombre || 'Sin asignar'} palette="amber" />
          </div>
          <p style={S.sectionTitle}>Fechas</p>
          <div style={{ ...S.infoGrid, marginBottom: 20 }}>
            <ColorInfoItem label="Inicio" value={fmtFecha(oferta.fechas?.inicio)} palette="blue" />
            <ColorInfoItem label="Fin"    value={fmtFecha(oferta.fechas?.fin)}    palette="purple" />
          </div>
          <p style={S.sectionTitle}>Cupos</p>
          <div style={{ ...S.cuposBox, background: cuposBg, border: `1px solid ${cuposBorder}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, marginBottom: 10 }}>
              <span style={{ color: '#555', fontWeight: 500 }}>Inscritos / Máximo</span>
              <span style={{ fontWeight: 700, fontSize: 18, color: cuposNumCol }}>{inscritos} <span style={{ fontWeight: 400, fontSize: 13, color: '#999' }}>/ {maximo}</span></span>
            </div>
            <div style={{ ...S.barBg, height: 7, backgroundColor: 'rgba(255,255,255,0.5)' }}>
              <div style={{ ...S.barFill, width: `${pct}%`, backgroundColor: barColor, height: 7 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7, fontSize: 11 }}>
              <span style={{ color: '#555', fontWeight: 500 }}>✅ {disponibles} disponibles</span>
              <span style={{ color: barColor, fontWeight: 700 }}>{pct}% ocupado</span>
            </div>
          </div>
          {estadoCfg && (
            <>
              <p style={S.sectionTitle}>Estado actual</p>
              <div style={{ ...S.estadoBox, backgroundColor: estadoCfg.bg, border: `1px solid ${estadoCfg.dot}33`, borderLeft: `4px solid ${estadoCfg.dot}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: estadoCfg.dot, display: 'inline-block' }} />
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 12, color: estadoCfg.color }}>{estadoCfg.label}</p>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: '#555', lineHeight: 1.5 }}>{estadoCfg.descripcion}</p>
              </div>
            </>
          )}
          {oferta.observaciones && (
            <>
              <p style={S.sectionTitle}>Observaciones</p>
              <div style={S.obsBox}>{oferta.observaciones}</div>
            </>
          )}
        </div>
        <div style={S.modalFooter}>
          <button style={S.btnCerrar} onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
//  COMPONENTE PRINCIPAL
// ────────────────────────────────────────────────────────────────────────────
const MisOfertas = ({ onCorregir = () => {}, refreshKey = 0 }) => {
  const [ofertas, setOfertas]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [busqueda, setBusqueda]           = useState('');
  const [filtroEstado, setFiltroEstado]   = useState('');
  const [ordenCol, setOrdenCol]           = useState(null);
  const [ordenAsc, setOrdenAsc]           = useState(true);
  const [ofertaDetalle, setOfertaDetalle] = useState(null);
  const [ofertaEditar, setOfertaEditar]   = useState(null);
  const [leyendaVisible, setLeyendaVisible] = useState(false);

  useEffect(() => { cargarOfertas(); }, [refreshKey]);

  const cargarOfertas = async () => {
    try {
      setLoading(true); setError('');
      const res = await api.get('/ofertas/mis-ofertas');
      setOfertas(res.data.data || []);
    } catch (err) {
      setError('No se pudieron cargar las ofertas. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => ({
    total:       ofertas.length,
    activas:     ofertas.filter(o => ['lista_espera','en_proceso','creada','matriculada'].includes(o.estado?.codigo)).length,
    pendientes:  ofertas.filter(o => o.estado?.codigo === 'pendiente').length,
    rechazadas:  ofertas.filter(o => ['rechazada','a_corregir'].includes(o.estado?.codigo)).length,
    cuposLibres: ofertas.reduce((a, o) => a + Math.max(0, (o.cupo_maximo||0) - (o.inscritos_count||0)), 0),
    ocupacion:   (() => {
      const totalMax = ofertas.reduce((a, o) => a + (o.cupo_maximo||0), 0);
      const totalIns = ofertas.reduce((a, o) => a + (o.inscritos_count||0), 0);
      return totalMax ? Math.round(totalIns / totalMax * 100) : 0;
    })(),
  }), [ofertas]);

  const ofertasFiltradas = useMemo(() => {
    let lista = [...ofertas];
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      lista = lista.filter(o =>
        o.programa_formacion?.nombre_programa?.toLowerCase().includes(q) ||
        o.programa_formacion?.codigo?.toLowerCase().includes(q)
      );
    }
    if (filtroEstado) lista = lista.filter(o => o.estado?.codigo === filtroEstado);
    if (ordenCol) {
      lista.sort((a, b) => {
        let va, vb;
        if (ordenCol === 'programa') { va = a.programa_formacion?.nombre_programa || ''; vb = b.programa_formacion?.nombre_programa || ''; }
        if (ordenCol === 'inicio')   { va = a.fechas?.inicio || ''; vb = b.fechas?.inicio || ''; }
        if (ordenCol === 'cupos')    { va = a.inscritos_count || 0;  vb = b.inscritos_count || 0; }
        if (typeof va === 'string') return ordenAsc ? va.localeCompare(vb) : vb.localeCompare(va);
        return ordenAsc ? va - vb : vb - va;
      });
    }
    return lista;
  }, [ofertas, busqueda, filtroEstado, ordenCol, ordenAsc]);

  const toggleOrden = (col) => {
    if (ordenCol === col) setOrdenAsc(a => !a);
    else { setOrdenCol(col); setOrdenAsc(true); }
  };

  const SortIcon = ({ col }) => ordenCol !== col
    ? <span style={S.sortIconInactive}>↕</span>
    : <span style={S.sortIconActive}>{ordenAsc ? '↑' : '↓'}</span>;

  if (loading) return (
    <div style={S.loadingWrap}>
      <div style={S.spinner} />
      <p style={S.loadingText}>Cargando ofertas...</p>
    </div>
  );

  return (
    <div style={S.container}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={S.pageHeader}>
        <div style={S.headerLeft}>
          <div style={S.headerIcon}>📋</div>
          <div>
            <div style={S.headerTitle}>Mis Ofertas</div>
            <div style={S.headerSub}>SENA · Gestión de Ofertas</div>
          </div>
        </div>
        <div style={S.headerMetrics}>
          <div style={S.metric}><div style={S.metricValue}>{stats.total}</div><div style={S.metricLabel}>Ofertas</div></div>
          <div style={S.metric}><div style={S.metricValue}>{stats.cuposLibres}</div><div style={S.metricLabel}>Cupos libres</div></div>
          <div style={S.metric}><div style={S.metricValue}>{stats.ocupacion}%</div><div style={S.metricLabel}>Ocupación</div></div>
        </div>
      </div>

      {error && (
        <div style={S.errorAlert}>
          <span>⚠ {error}</span>
          <button style={S.btnReintentar} onClick={cargarOfertas}>Reintentar</button>
        </div>
      )}

      <div style={S.statsRow}>
        <StatCard label="Total ofertas" value={stats.total}      borderColor="#334155" />
        <StatCard label="Activas"       value={stats.activas}    accent={SENA.green}  borderColor={SENA.green} />
        <StatCard label="Pendientes"    value={stats.pendientes} accent="#b45309"     borderColor="#e69519" />
        <StatCard label="Rechazadas"    value={stats.rechazadas} accent="#9b1f1f"     borderColor="#E24B4A" />
      </div>

      {/* Leyenda */}
      <div style={S.leyendaWrap}>
        <button style={S.leyendaToggle} onClick={() => setLeyendaVisible(v => !v)}>
          <span style={{ color: SENA.green, fontSize: 15 }}>ℹ</span>
          Estados de una oferta
          <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.6 }}>{leyendaVisible ? '▲' : '▼'}</span>
        </button>
        {leyendaVisible && (
          <div style={S.leyendaGrid}>
            {Object.entries(ESTADO_CONFIG).map(([codigo, cfg]) => (
              <div key={codigo} style={S.leyendaItem}>
                <div style={{ marginBottom: 6 }}>
                  <span style={{ ...S.badge, backgroundColor: cfg.bg, color: cfg.color }}>
                    <span style={{ ...S.badgeDot, backgroundColor: cfg.dot }} />
                    {cfg.label}
                  </span>
                </div>
                <p style={S.leyendaDesc}>{cfg.descripcion}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabla */}
      <div style={S.tableWrap}>
        <div style={S.filterBar}>
          <div style={S.searchWrap}>
            <span style={{ fontSize: 13, color: '#9aa0ab' }}>🔍</span>
            <input style={S.searchInput} type="text" placeholder="Buscar por programa o código..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          </div>
          <select style={S.select} value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            {Object.entries(ESTADO_CONFIG).map(([k, cfg]) => (
              <option key={k} value={k}>{cfg.label}</option>
            ))}
          </select>
          <span style={S.countBadge}>{ofertasFiltradas.length} resultado{ofertasFiltradas.length !== 1 ? 's' : ''}</span>
        </div>

        <div style={S.tableScroll}>
          <table style={S.table}>
            <thead>
              <tr style={{ backgroundColor: '#f0f4f8' }}>
                <th style={{ ...S.th, width: '28%', cursor: 'pointer' }} onClick={() => toggleOrden('programa')}>Programa <SortIcon col="programa" /></th>
                <th style={{ ...S.th, width: '10%' }}>Código</th>
                <th style={{ ...S.th, width: '8%' }}>Tipo</th>
                <th style={{ ...S.th, width: '17%', cursor: 'pointer' }} onClick={() => toggleOrden('inicio')}>Fechas <SortIcon col="inicio" /></th>
                <th style={{ ...S.th, width: '14%', cursor: 'pointer' }} onClick={() => toggleOrden('cupos')}>Cupos <SortIcon col="cupos" /></th>
                <th style={{ ...S.th, width: '13%' }}>Estado</th>
                <th style={{ ...S.th, width: '10%' }}></th>
              </tr>
            </thead>
            <tbody>
              {ofertasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} style={S.emptyCell}>
                    <div style={S.emptyContent}>
                      <span style={{ fontSize: 32 }}>📭</span>
                      <p style={{ margin: '8px 0 4px', fontWeight: 500 }}>
                        {ofertas.length === 0 ? 'No has creado ninguna oferta aún' : 'Sin resultados para este filtro'}
                      </p>
                      <p style={{ margin: 0, fontSize: 13, color: '#888' }}>
                        {ofertas.length === 0 ? 'Usa "Nueva oferta" para comenzar' : 'Prueba con otros términos o estado'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : ofertasFiltradas.map((oferta, i) => {
                const rechazada = oferta.estado?.codigo === 'rechazada';
                const aCorregir = oferta.estado?.codigo === 'a_corregir';
                return (
                  <tr
                    key={oferta._id}
                    style={{ ...S.row, backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = rechazada ? '#fff8f8' : '#f7fdf7'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)'}
                  >
                    <td style={{ ...S.td, fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {rechazada && (
                          <span title="Esta oferta fue rechazada — haz clic en Editar para corregirla"
                            style={{ fontSize: 13, cursor: 'help' }}>⚠️</span>
                        )}
                        {oferta.programa_formacion?.nombre_programa || 'N/A'}
                      </div>
                    </td>
                    <td style={S.td}><code style={S.code}>{oferta.programa_formacion?.codigo || 'N/A'}</code></td>
                    <td style={S.td}>
                      {oferta.es_campesena
                        ? <span style={S.tipoCampesena}>Campesena</span>
                        : <span style={S.tipoRegular}>Regular</span>
                      }
                    </td>
                    <td style={{ ...S.td, fontSize: 11 }}>
                      <div>{fmtFecha(oferta.fechas?.inicio)}</div>
                      <div style={{ color: '#9aa0ab' }}>→ {fmtFecha(oferta.fechas?.fin)}</div>
                    </td>
                    <td style={S.td}>
                      <CuposBar inscritos={oferta.inscritos_count ?? 0} maximo={oferta.cupo_maximo ?? 0} />
                    </td>
                    <td style={S.td}><Badge estado={oferta.estado?.codigo} /></td>
                    <td style={S.td}>
                      {rechazada ? (
                        <button
                          style={S.btnEditar}
                          onClick={() => setOfertaEditar(oferta)}
                          title="La oferta fue rechazada. Edita y reenvía al coordinador."
                        >
                          ✏️ Editar
                        </button>
                      ) : aCorregir ? (
                        <button
                          style={{ ...S.btnVer, background: '#FCEBEB', color: '#9b1f1f', borderColor: '#F09595' }}
                          onClick={() => onCorregir(oferta)}
                        >
                          Corregir
                        </button>
                      ) : (
                        <button style={S.btnVer} onClick={() => setOfertaDetalle(oferta)}>
                          Ver detalle
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {ofertaDetalle && <ModalDetalle oferta={ofertaDetalle} onClose={() => setOfertaDetalle(null)} />}

      {ofertaEditar && (
        <ModalEditarOferta
          oferta={ofertaEditar}
          onClose={() => setOfertaEditar(null)}
          onGuardado={() => { setOfertaEditar(null); cargarOfertas(); }}
        />
      )}
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
//  ESTILOS (sin cambios)
// ────────────────────────────────────────────────────────────────────────────
const S = {
  container: { width: '100%', fontFamily: "'Segoe UI', system-ui, sans-serif", color: '#0d1117' },
  pageHeader: {
    background: `linear-gradient(135deg, #1a2332 0%, #243044 100%)`,
    borderBottom: `3px solid #2e7d32`,
    color: '#fff', padding: '20px 24px 18px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: '10px 10px 0 0',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  headerIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: SENA.green, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 },
  headerTitle: { fontSize: 17, fontWeight: 600, color: '#fff' },
  headerSub:   { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  headerMetrics: { display: 'flex', gap: 24 },
  metric:       { textAlign: 'center' },
  metricValue:  { fontSize: 22, fontWeight: 700, color: SENA.greenLight, lineHeight: 1 },
  metricLabel:  { fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 },
  statsRow:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, margin: '14px 0' },
  statCard:     { backgroundColor: '#fff', border: '1px solid #e4e7ec', borderRadius: 10, padding: '14px 16px' },
  statLabel:    { margin: '0 0 4px', fontSize: 11, color: '#5a6270' },
  statValue:    { margin: 0, fontSize: 26, fontWeight: 600, lineHeight: 1 },
  leyendaWrap:  { marginBottom: '1rem', border: '1px solid #e4e7ec', borderRadius: 10, overflow: 'hidden', backgroundColor: '#fff' },
  leyendaToggle: { width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#f7f8fa', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#5a6270', textAlign: 'left' },
  leyendaGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 1, backgroundColor: '#e4e7ec', borderTop: '1px solid #e4e7ec' },
  leyendaItem:  { backgroundColor: '#fff', padding: '12px 16px' },
  leyendaDesc:  { margin: 0, fontSize: 11, color: '#9aa0ab', lineHeight: 1.5 },
  tableWrap:    { border: '1px solid #e4e7ec', borderRadius: 10, overflow: 'hidden', backgroundColor: '#fff' },
  filterBar:    { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid #e4e7ec', backgroundColor: '#f7f8fa', flexWrap: 'wrap' },
  searchWrap:   { display: 'flex', alignItems: 'center', flex: 1, minWidth: 180, border: '1px solid #e4e7ec', borderRadius: 7, backgroundColor: '#fff', padding: '0 10px', gap: 6 },
  searchInput:  { flex: 1, border: 'none', outline: 'none', fontSize: 13, padding: '7px 0', backgroundColor: 'transparent', color: '#0d1117' },
  select:       { fontSize: 12, padding: '7px 10px', border: '1px solid #e4e7ec', borderRadius: 7, backgroundColor: '#fff', color: '#0d1117', cursor: 'pointer' },
  countBadge:   { fontSize: 11, color: '#9aa0ab', whiteSpace: 'nowrap', background: '#f7f8fa', border: '1px solid #e4e7ec', padding: '4px 10px', borderRadius: 20 },
  tableScroll:  { overflowX: 'auto' },
  table:        { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' },
  th:           { padding: '9px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#5a6270', borderBottom: '1px solid #e4e7ec', userSelect: 'none', textTransform: 'uppercase', letterSpacing: '0.06em' },
  td:           { padding: '10px 12px', fontSize: 12, borderBottom: '1px solid #f0f2f5', verticalAlign: 'middle', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#0d1117' },
  row:          { transition: 'background 0.1s' },
  sortIconInactive: { marginLeft: 4, opacity: 0.35, fontSize: 11 },
  sortIconActive:   { marginLeft: 4, color: SENA.green, fontSize: 11 },
  badge:        { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20 },
  badgeDot:     { width: 5, height: 5, borderRadius: '50%', flexShrink: 0 },
  cuposText:    { fontSize: 11, display: 'block', marginBottom: 4, color: '#5a6270' },
  barBg:        { height: 4, borderRadius: 4, backgroundColor: '#e9ecef', overflow: 'hidden' },
  barFill:      { height: '100%', borderRadius: 4, transition: 'width 0.3s' },
  tipoCampesena:{ fontSize: 11, fontWeight: 600, color: '#3C3489', backgroundColor: '#eeedfe', padding: '2px 8px', borderRadius: 12 },
  tipoRegular:  { fontSize: 11, color: '#9aa0ab' },
  code:         { fontSize: 10, backgroundColor: '#f0f2f5', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', color: '#444' },
  btnVer:       { fontSize: 11, fontWeight: 600, color: SENA.green, backgroundColor: SENA.greenBg, border: `1px solid ${SENA.greenMid}`, padding: '5px 12px', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap' },
  btnEditar: {
    fontSize: 11, fontWeight: 700,
    color: '#9b1f1f', backgroundColor: '#FCEBEB',
    border: '2px solid #E24B4A',
    padding: '5px 12px', borderRadius: 6,
    cursor: 'pointer', whiteSpace: 'nowrap',
    transition: 'all 0.15s',
  },
  errorAlert:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FCEBEB', color: '#9b1f1f', padding: '10px 16px', borderRadius: 8, fontSize: 13, marginBottom: '1rem' },
  btnReintentar:{ fontSize: 12, fontWeight: 600, color: '#9b1f1f', backgroundColor: 'transparent', border: '1px solid #9b1f1f', padding: '4px 10px', borderRadius: 6, cursor: 'pointer' },
  loadingWrap:  { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: 14 },
  spinner:      { width: 32, height: 32, border: '3px solid #e0e0e0', borderTop: `3px solid ${SENA.green}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loadingText:  { fontSize: 14, color: '#888', margin: 0 },
  emptyCell:    { padding: '40px 0', textAlign: 'center' },
  emptyContent: { display: 'inline-block', textAlign: 'center', color: '#5a6270' },

  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(10,16,26,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  modal:    { backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e4e7ec', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' },
  modalHeader: { background: `linear-gradient(135deg, #1a2332 0%, #243044 100%)`, borderBottom: `2px solid #2e7d32`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '18px 20px 14px', gap: 12 },
  modalChip:   { display: 'inline-block', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: SENA.greenLight, backgroundColor: 'rgba(46,125,50,0.18)', padding: '3px 9px', borderRadius: 20, marginBottom: 8 },
  modalTitle:  { margin: 0, fontSize: 15, fontWeight: 600, color: '#fff', lineHeight: 1.4 },
  modalCode:   { fontFamily: 'monospace', backgroundColor: 'rgba(255,255,255,0.12)', color: '#94a3b8', padding: '2px 8px', borderRadius: 4, fontSize: 11 },
  btnClose:    { background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#94a3b8', lineHeight: 1, padding: 4, flexShrink: 0 },
  modalBody:   { padding: '18px 20px', flex: 1 },
  sectionTitle:{ margin: '0 0 10px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9aa0ab' },
  infoGrid:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 },
  cuposBox:    { borderRadius: 8, padding: '14px 16px', marginBottom: 20 },
  estadoBox:   { borderRadius: '0 8px 8px 0', padding: '12px 14px', marginBottom: 20 },
  obsBox:      { fontSize: 13, color: '#555', lineHeight: 1.6, backgroundColor: '#FFFBF0', borderRadius: '0 8px 8px 0', padding: '12px 14px', border: '1px solid #FAE3B8', borderLeft: '4px solid #EF9F27' },
  modalFooter: { padding: '12px 20px', borderTop: '1px solid #e4e7ec', backgroundColor: '#f7f8fa', display: 'flex', justifyContent: 'flex-end' },
  btnCerrar:   { fontSize: 12, fontWeight: 600, color: '#5a6270', backgroundColor: '#fff', border: '1px solid #e4e7ec', padding: '6px 18px', borderRadius: 6, cursor: 'pointer' },

  editModal: { backgroundColor: '#fff', borderRadius: 14, width: '100%', maxWidth: 640, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' },
  editHeader: { background: `linear-gradient(135deg, #2d1515 0%, #3d1f1f 100%)`, borderBottom: '2px solid #E24B4A', padding: '18px 22px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  editHeaderChip: { display: 'inline-block', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#E24B4A', backgroundColor: 'rgba(226,75,74,0.15)', padding: '3px 9px', borderRadius: 20 },
  editHeaderTitle: { margin: '6px 0 4px', fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.4 },
  editHeaderCode:  { fontFamily: 'monospace', backgroundColor: 'rgba(255,255,255,0.1)', color: '#94a3b8', padding: '2px 8px', borderRadius: 4, fontSize: 11 },
  motivoBox: { background: '#fff8f0', borderLeft: '4px solid #EF9F27', borderBottom: '1px solid #fde68a', padding: '12px 20px' },
  motivoTitle: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 },
  motivoDot:   { width: 7, height: 7, borderRadius: '50%', backgroundColor: '#EF9F27', flexShrink: 0 },
  motivoText:  { margin: 0, fontSize: 13, color: '#78350f', lineHeight: 1.6, fontStyle: 'italic' },
  editBody: { flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 20 },
  alertError:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FCEBEB', color: '#9b1f1f', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: 8, fontSize: 13 },
  alertClose:   { background: 'none', border: 'none', color: '#9b1f1f', cursor: 'pointer', fontWeight: 700, fontSize: 14 },
  alertSuccess: { background: '#f0fdf4', color: '#166534', border: '1px solid #86efac', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600 },
  fieldSection: { display: 'flex', flexDirection: 'column', gap: 12 },
  fieldSectionTitle: { margin: 0, fontSize: 11, fontWeight: 700, color: '#5a6270', textTransform: 'uppercase', letterSpacing: '0.06em', paddingBottom: 6, borderBottom: '1px solid #f0f2f5' },
  formGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 },
  formField: { display: 'flex', flexDirection: 'column', gap: 5 },
  formLabel: { fontSize: 11, fontWeight: 700, color: '#5a6270', textTransform: 'uppercase', letterSpacing: '0.04em' },
  input: { padding: '9px 12px', border: '1px solid #e4e7ec', borderRadius: 8, fontSize: 13, color: '#0d1117', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.15s' },
  roGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 },
  roField: { background: '#f7f8fa', border: '1px solid #e4e7ec', borderRadius: 8, padding: '9px 12px', display: 'flex', flexDirection: 'column', gap: 3 },
  roLabel: { fontSize: 10, fontWeight: 700, color: '#9aa0ab', textTransform: 'uppercase', letterSpacing: '0.04em' },
  roValue: { fontSize: 12, fontWeight: 600, color: '#0d1117' },
  confirmPanel: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center', padding: '10px 0 4px' },
  confirmIcon:  { fontSize: 40 },
  confirmTitle: { margin: 0, fontSize: 17, fontWeight: 700, color: '#0d1117' },
  confirmDesc:  { margin: 0, fontSize: 13, color: '#5a6270', lineHeight: 1.6, maxWidth: 420 },
  confirmChanges: { width: '100%', background: '#f7f8fa', border: '1px solid #e4e7ec', borderRadius: 10, padding: '14px 16px', textAlign: 'left' },
  confirmChangesTitle: { margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: '#5a6270', textTransform: 'uppercase', letterSpacing: '0.05em' },
  confirmGrid: { display: 'flex', flexDirection: 'column', gap: 6 },
  confirmRow:  { display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: '1px solid #f0f2f5' },
  confirmRowLabel: { color: '#5a6270', fontWeight: 500 },
  confirmRowValue: { color: '#0d1117', fontWeight: 700 },
  editFooter: { padding: '14px 22px', borderTop: '1px solid #e4e7ec', background: '#f7f8fa', display: 'flex', justifyContent: 'flex-end', gap: 10 },
  btnCancelar:{ fontSize: 12, fontWeight: 600, color: '#5a6270', background: '#fff', border: '1px solid #e4e7ec', padding: '8px 18px', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit' },
  btnSiguiente:{ fontSize: 13, fontWeight: 700, color: '#fff', background: `linear-gradient(135deg, ${SENA.green}, ${SENA.greenLight})`, border: 'none', padding: '8px 22px', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(46,125,50,0.3)' },
  btnEnviar:   { fontSize: 13, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#16a34a,#15803d)', border: 'none', padding: '8px 22px', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 8px rgba(21,128,61,0.35)' },
  btnDisabled: { background: '#e2e8f0', color: '#94a3b8', boxShadow: 'none', cursor: 'not-allowed' },
  btnSpinner:  { width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite', flexShrink: 0 },
  archivosInfo: { background: '#f7f8fa', border: '1px solid #e4e7ec', borderRadius: 10, overflow: 'hidden' },
  archivoInfoRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' },
  archivoInfoIcon: { fontSize: 20, flexShrink: 0 },
  archivoInfoLabel: { margin: 0, fontSize: 13, fontWeight: 600, color: '#0d1117' },
  archivoInfoDesc:  { margin: '2px 0 0', fontSize: 11, color: '#9aa0ab' },
  archivoDivider:   { height: 1, background: '#e4e7ec', margin: '0 16px' },
  archivoBadgeAuto: { marginLeft: 'auto', flexShrink: 0, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#f0f2f5', color: '#5a6270', border: '1px solid #e4e7ec' },
  archivoBadgeEditable: { marginLeft: 'auto', flexShrink: 0, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: SENA.greenBg, color: SENA.green, border: `1px solid ${SENA.greenMid}` },
  cartaWrap: { border: `2px dashed ${SENA.greenMid}`, borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12, background: '#fafffe' },
  cartaHeader: { display: 'flex', alignItems: 'flex-start', gap: 10 },
  cartaTitle:  { margin: 0, fontSize: 13, fontWeight: 700, color: '#0d1117' },
  cartaDesc:   { margin: '2px 0 0', fontSize: 11, color: '#9aa0ab' },
  cartaActual: { display: 'flex', alignItems: 'center', gap: 8, background: '#f0fdf4', border: `1px solid ${SENA.greenMid}`, borderRadius: 8, padding: '8px 12px' },
  cartaActualNombre: { flex: 1, fontSize: 12, fontWeight: 600, color: '#0d1117' },
  cartaActualTag:    { fontSize: 10, color: SENA.green, fontWeight: 700, background: SENA.greenBg, padding: '2px 8px', borderRadius: 12 },
  cartaNueva: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0fdf4', border: `1px solid ${SENA.greenMid}`, borderRadius: 8, padding: '10px 12px', gap: 8 },
  cartaNuevaLeft: { display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 },
  cartaNuevaName: { margin: 0, fontSize: 12, fontWeight: 700, color: '#0d1117', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  cartaNuevaSize: { margin: '2px 0 0', fontSize: 10, color: '#9aa0ab' },
  btnCartaVer: { fontSize: 11, fontWeight: 600, padding: '5px 10px', background: SENA.greenBg, color: SENA.green, border: `1px solid ${SENA.greenMid}`, borderRadius: 6, cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap' },
  btnCartaRemover: { fontSize: 13, fontWeight: 700, padding: '5px 9px', background: '#FCEBEB', color: '#9b1f1f', border: '1px solid #fca5a5', borderRadius: 6, cursor: 'pointer' },
  dropZone: { border: '2px dashed #d1d5db', borderRadius: 8, padding: '18px 12px', textAlign: 'center', cursor: 'pointer', background: '#fafafa', transition: 'border-color 0.15s, background 0.15s' },
  dropZoneTitle: { margin: 0, fontSize: 13, fontWeight: 600, color: '#374151' },
  dropZoneDesc:  { margin: '4px 0 0', fontSize: 11, color: '#9aa0ab' },
};

export default MisOfertas;