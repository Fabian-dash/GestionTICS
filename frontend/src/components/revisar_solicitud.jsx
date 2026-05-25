import React, { useState, useEffect } from 'react';
import api from '../services/api';

const RevisarSolicitud = ({ solicitudId, onClose, onActualizar }) => {
  const [solicitud,    setSolicitud]    = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [observaciones,setObservaciones]= useState('');
  const [enviando,     setEnviando]     = useState(false);
  const [archivos,     setArchivos]     = useState({ ficha: false, carta: false, excel: false, cedulas: false });
  const [descargando,  setDescargando]  = useState(null);

  useEffect(() => { if (solicitudId) cargarSolicitud(); }, [solicitudId]);

  const cargarSolicitud = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/solicitudes/${solicitudId}`);
      setSolicitud(response.data.data);
      try {
        const archivosRes = await api.get(`/solicitudes/${solicitudId}/archivos`);
        setArchivos(archivosRes.data.data);
      } catch { /* silencioso */ }
    } catch {
      setError('Error al cargar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleAprobar = async () => {
    try {
      setEnviando(true);
      await api.put(`/solicitudes/${solicitudId}/aprobar`, { comentarios: 'Aprobada por coordinador' });
      if (onActualizar) onActualizar();
      if (onClose) onClose();
    } catch {
      setError('Error al aprobar la solicitud');
    } finally {
      setEnviando(false);
    }
  };

  const handleRechazar = async () => {
    if (!observaciones.trim()) { setError('Debe escribir una observación explicando el motivo del rechazo'); return; }
    try {
      setEnviando(true);
      await api.put(`/solicitudes/${solicitudId}/rechazar`, { comentarios: observaciones });
      if (onActualizar) onActualizar();
      if (onClose) onClose();
    } catch {
      setError('Error al rechazar la solicitud');
    } finally {
      setEnviando(false);
    }
  };

  const descargarArchivo = async (tipo) => {
    try {
      setDescargando(tipo);
      const response = await api.get(`/solicitudes/${solicitudId}/descargar/${tipo}`, { responseType: 'blob' });
      const contentType = response.headers['content-type'] || '';
      const ext = contentType.includes('spreadsheet') || contentType.includes('excel') ? '.xlsx' : '.pdf';
      const url  = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `${tipo}_${solicitud?.oferta_id?.programa_formacion?.codigo}${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch { /* silencioso */ }
    finally { setDescargando(null); }
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '—';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
      + ' · ' + d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  };

  /* ── Estados de carga / error ── */
  if (loading) return (
    <>
      <style>{globalStyles}</style>
      <div style={styles.loadingWrapper}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Cargando solicitud...</p>
      </div>
    </>
  );

  if (error && !solicitud) return (
    <>
      <style>{globalStyles}</style>
      <div style={styles.errorPage}>
        <div style={styles.errorAlert}><AlertIcon /><span>{error}</span></div>
        <button onClick={onClose} style={styles.cerrarBtn} className="btn-hover">Cerrar</button>
      </div>
    </>
  );

  if (!solicitud) return (
    <>
      <style>{globalStyles}</style>
      <div style={styles.errorPage}>
        <p style={{ color: '#94a3b8' }}>Solicitud no encontrada.</p>
        <button onClick={onClose} style={styles.cerrarBtn} className="btn-hover">Cerrar</button>
      </div>
    </>
  );

  const docList = [
    { key: 'ficha',   label: 'Ficha',       icon: <DocIcon /> },
    { key: 'carta',   label: 'Carta',       icon: <MailIcon /> },
    { key: 'excel',   label: 'Excel',       icon: <TableIcon /> },
    { key: 'cedulas', label: 'Cédulas PDF', icon: <IdIcon /> },
  ];

  const totalDocs    = docList.length;
  const docsOk       = docList.filter(d => archivos[d.key]).length;
  const todosCompletos = docsOk === totalDocs;

  return (
    <>
      <style>{globalStyles}</style>
      <div style={styles.modal}>

        {/* ── Header ── */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.headerIcon}><ClipboardIcon /></div>
            <div>
              <h2 style={styles.headerTitle}>Revisar Solicitud</h2>
              <p style={styles.headerSub}>Validación de documentos y aprobación</p>
            </div>
          </div>
          <button onClick={onClose} style={styles.closeBtn} className="btn-hover" title="Cerrar">
            <CloseIcon />
          </button>
        </div>

        {/* ── Scroll body ── */}
        <div style={styles.body}>

          {/* Error inline */}
          {error && (
            <div style={styles.errorAlert} className="fade-in">
              <AlertIcon /><span>{error}</span>
            </div>
          )}

          {/* ══ Sección 1: Info oferta ══ */}
          <Section title="Información de la Oferta" icon={<InfoIcon />}>
            <div style={styles.infoGrid}>
              <InfoCard label="Código" value={solicitud.oferta_id?.programa_formacion?.codigo} mono />
              <InfoCard label="Programa" value={solicitud.oferta_id?.programa_formacion?.nombre_programa} />
              <InfoCard
                label="Instructor"
                value={`${solicitud.instructor_id?.nombre || ''} ${solicitud.instructor_id?.apellido || ''}`}
              />
              <InfoCard label="Email" value={solicitud.instructor_id?.correoElectronico} mono />
            </div>
          </Section>

          {/* ══ Sección 2: Detalles ══ */}
          <Section title="Detalles de la Solicitud" icon={<ListIcon />}>
            <div style={styles.detailsGrid}>
              <DetailRow label="Fecha solicitud"  value={formatFecha(solicitud.fecha_solicitud)} />
              <DetailRow label="Tipo de programa" value={solicitud.oferta_id?.es_campesena ? 'Campesena' : 'Regular'} />
              <DetailRow label="Tipo de oferta"   value={solicitud.oferta_id?.tipo_oferta?.nombre} />
              <DetailRow label="Estado actual"
                value={
                  <span style={styles.pendienteBadge}>
                    <span style={{ ...styles.dot, background: '#f59e0b' }} />
                    Pendiente
                  </span>
                }
              />
            </div>
            {solicitud.mensaje && (
              <div style={styles.mensajeBox}>
                <p style={styles.mensajeLabel}>Mensaje del instructor</p>
                <p style={styles.mensajeTexto}>{solicitud.mensaje}</p>
              </div>
            )}
          </Section>

          {/* ══ Sección 3: Documentos ══ */}
          <Section title="Documentos Adjuntos" icon={<AttachIcon />}>
            {/* Progress */}
            <div style={styles.docsProgress}>
              <div style={styles.docsProgressInfo}>
                <span style={styles.docsProgressLabel}>Documentos completos</span>
                <span style={{ ...styles.docsProgressCount, color: todosCompletos ? '#10b981' : '#f59e0b' }}>
                  {docsOk} / {totalDocs}
                </span>
              </div>
              <div style={styles.progressTrack}>
                <div style={{
                  ...styles.progressBar,
                  width: `${(docsOk / totalDocs) * 100}%`,
                  background: todosCompletos
                    ? 'linear-gradient(90deg,#10b981,#059669)'
                    : 'linear-gradient(90deg,#f59e0b,#d97706)',
                }} />
              </div>
            </div>

            <div style={styles.docGrid}>
              {docList.map(({ key, label, icon }) => {
                const ok        = archivos[key];
                const descarg   = descargando === key;
                return (
                  <button
                    key={key}
                    onClick={() => ok && descargarArchivo(key)}
                    disabled={!ok || descarg}
                    style={{ ...styles.docBtn, ...(ok ? styles.docBtnOk : styles.docBtnNo) }}
                    className={ok ? 'btn-hover' : ''}
                    title={ok ? `Descargar ${label}` : `${label} no disponible`}
                  >
                    <span style={{ ...styles.docBtnIcon, color: ok ? '#059669' : '#94a3b8' }}>{icon}</span>
                    <span style={styles.docBtnLabel}>{label}</span>
                    {ok
                      ? <span style={styles.docCheck}><CheckIcon /></span>
                      : <span style={styles.docMissing}><MinusIcon /></span>
                    }
                    {descarg && <span style={styles.docLoading}><SpinDot /></span>}
                  </button>
                );
              })}
            </div>
            <p style={styles.docsNota}>Revise que todos los documentos estén presentes antes de tomar una decisión.</p>
          </Section>

          {/* ══ Sección 4: Rechazar ══ */}
          <Section title="Rechazar Solicitud" icon={<RejectIcon />} accent="#fef2f2" border="#fecaca">
            <div style={styles.rechazoInner}>
              <label style={styles.textareaLabel}>
                Motivo del rechazo <span style={styles.required}>* obligatorio</span>
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => { setObservaciones(e.target.value); setError(''); }}
                style={{
                  ...styles.textarea,
                  borderColor: error && !observaciones.trim() ? '#ef4444' : '#e2e8f0',
                }}
                rows={4}
                placeholder="Indique qué documentos faltan o qué debe corregir el instructor..."
              />
              <button
                onClick={handleRechazar}
                disabled={enviando || !observaciones.trim()}
                style={{
                  ...styles.rechazarBtn,
                  ...(enviando || !observaciones.trim() ? styles.btnDisabled : {}),
                }}
                className="btn-hover"
              >
                <RejectIcon small />
                {enviando ? 'Rechazando...' : 'Rechazar solicitud'}
              </button>
              <p style={styles.nota}>Al rechazar, el instructor recibirá tus comentarios y deberá corregir los documentos.</p>
            </div>
          </Section>

          {/* ══ Sección 5: Aprobar ══ */}
          <Section title="Aprobar Solicitud" icon={<ApproveIcon />} accent="#f0fdf4" border="#bbf7d0">
            <div style={styles.aprobarInner}>
              <p style={styles.aprobarTexto}>
                Si todos los documentos están completos y correctos, aprueba la solicitud para que pase al funcionario correspondiente.
              </p>
              <button
                onClick={handleAprobar}
                disabled={enviando}
                style={{ ...styles.aprobarBtn, ...(enviando ? styles.btnDisabled : {}) }}
                className="btn-hover"
              >
                <ApproveIcon />
                {enviando ? 'Aprobando...' : 'Aprobar solicitud'}
              </button>
              <p style={styles.nota}>Al aprobar, la oferta pasará al funcionario para que cree la ficha en Sofía Plus.</p>
            </div>
          </Section>

        </div>{/* /body */}
      </div>
    </>
  );
};

/* ── Sub-components ── */
const Section = ({ title, icon, children, accent = '#f8fafc', border = '#e2e8f0' }) => (
  <div style={{ ...sectionStyle, background: accent, borderColor: border }}>
    <div style={sectionHeader}>
      <span style={sectionIconStyle}>{icon}</span>
      <h3 style={sectionTitle}>{title}</h3>
    </div>
    {children}
  </div>
);
const sectionStyle  = { borderRadius: '12px', border: '1px solid', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' };
const sectionHeader = { display: 'flex', alignItems: 'center', gap: '8px' };
const sectionIconStyle = { color: '#64748b', display: 'flex', alignItems: 'center' };
const sectionTitle  = { margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.2px' };

const InfoCard = ({ label, value, mono }) => (
  <div style={infoCardStyle}>
    <span style={infoLabelStyle}>{label}</span>
    <span style={{ ...infoValueStyle, ...(mono ? monoStyle : {}) }}>{value || '—'}</span>
  </div>
);
const infoCardStyle  = { background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '4px' };
const infoLabelStyle = { fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' };
const infoValueStyle = { fontSize: '14px', fontWeight: '600', color: '#0f172a', wordBreak: 'break-word' };
const monoStyle      = { fontFamily: "'DM Mono', monospace", fontSize: '13px', color: '#2563eb' };

const DetailRow = ({ label, value }) => (
  <div style={detailRowStyle}>
    <span style={detailLabelStyle}>{label}</span>
    <span style={detailValueStyle}>{value || '—'}</span>
  </div>
);
const detailRowStyle  = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 14px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', gap: '12px' };
const detailLabelStyle= { fontSize: '13px', color: '#64748b', fontWeight: '500', flexShrink: 0 };
const detailValueStyle= { fontSize: '13px', color: '#0f172a', fontWeight: '600', textAlign: 'right' };

/* ── Icons ── */
const ClipboardIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const InfoIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const ListIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);
const AttachIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
  </svg>
);
const RejectIcon = ({ small }) => (
  <svg width={small ? 13 : 15} height={small ? 13 : 15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);
const ApproveIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const AlertIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const MinusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const DocIcon   = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>);
const MailIcon  = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>);
const TableIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>);
const IdIcon    = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>);
const SpinDot   = () => <span style={{ width: 12, height: 12, border: '2px solid #e2e8f0', borderTop: '2px solid #059669', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />;

/* ── Global styles ── */
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');
  * { box-sizing: border-box; }
  .btn-hover { transition: transform 0.15s ease, opacity 0.15s ease; }
  .btn-hover:hover  { transform: translateY(-1px); opacity: 0.88; }
  .btn-hover:active { transform: translateY(0); }
  .fade-in { animation: fadeIn 0.25s ease both; }
  @keyframes fadeIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin   { to { transform: rotate(360deg); } }
  textarea:focus { outline: none; border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
`;

/* ── Styles ── */
const styles = {
  modal: {
    maxWidth: '780px',
    margin: '0 auto',
    background: 'white',
    borderRadius: '18px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
    overflow: 'hidden',
    fontFamily: "'DM Sans', sans-serif",
    color: '#0f172a',
    animation: 'fadeUp 0.35s ease both',
  },

  /* Header */
  header: {
    background: 'linear-gradient(135deg,#1e293b 0%,#0f172a 100%)',
    padding: '20px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '14px' },
  headerIcon: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    flexShrink: 0,
  },
  headerTitle: { margin: 0, fontSize: '18px', fontWeight: '700', color: 'white', letterSpacing: '-0.3px' },
  headerSub: { margin: '2px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: '400' },
  closeBtn: {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: 'rgba(255,255,255,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },

  /* Body */
  body: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxHeight: '78vh',
    overflowY: 'auto',
  },

  /* Error */
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#b91c1c',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500',
  },

  /* Info grid */
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '10px',
  },

  /* Details */
  detailsGrid: { display: 'flex', flexDirection: 'column', gap: '6px' },
  pendienteBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    background: '#fffbeb',
    color: '#b45309',
    border: '1px solid #fde68a',
    borderRadius: '99px',
    padding: '2px 9px',
    fontSize: '12px',
    fontWeight: '700',
  },
  dot: { width: '6px', height: '6px', borderRadius: '50%', display: 'inline-block', flexShrink: 0 },

  mensajeBox: {
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '14px 16px',
  },
  mensajeLabel: { margin: '0 0 6px', fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' },
  mensajeTexto: { margin: 0, fontSize: '14px', color: '#334155', lineHeight: '1.6', fontStyle: 'italic' },

  /* Documents */
  docsProgress: { display: 'flex', flexDirection: 'column', gap: '6px' },
  docsProgressInfo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  docsProgressLabel: { fontSize: '12px', color: '#64748b', fontWeight: '500' },
  docsProgressCount: { fontSize: '13px', fontWeight: '700', fontFamily: "'DM Mono', monospace" },
  progressTrack: { height: '5px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: '99px', transition: 'width 0.5s ease' },

  docGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' },
  docBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '11px 14px',
    border: '1px solid',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    fontFamily: "'DM Sans', sans-serif",
    position: 'relative',
    transition: 'transform 0.15s ease, opacity 0.15s ease',
  },
  docBtnOk: { background: '#f0fdf4', borderColor: '#86efac', color: '#15803d' },
  docBtnNo: { background: '#f8fafc', borderColor: '#e2e8f0', color: '#94a3b8', cursor: 'not-allowed', opacity: 0.6 },
  docBtnIcon: { display: 'flex', alignItems: 'center', flexShrink: 0 },
  docBtnLabel: { flex: 1 },
  docCheck: { color: '#10b981', display: 'flex', alignItems: 'center', flexShrink: 0 },
  docMissing: { color: '#cbd5e1', display: 'flex', alignItems: 'center', flexShrink: 0 },
  docLoading: { position: 'absolute', right: '10px', display: 'flex', alignItems: 'center' },
  docsNota: { margin: 0, fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' },

  /* Reject */
  rechazoInner: { display: 'flex', flexDirection: 'column', gap: '12px' },
  textareaLabel: { fontSize: '13px', fontWeight: '600', color: '#334155' },
  required: { fontSize: '11px', color: '#ef4444', fontWeight: '500', marginLeft: '6px' },
  textarea: {
    padding: '12px 14px',
    border: '1px solid',
    borderRadius: '10px',
    fontSize: '13px',
    fontFamily: "'DM Sans', sans-serif",
    color: '#334155',
    resize: 'vertical',
    lineHeight: '1.6',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    background: 'white',
  },
  rechazarBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '11px 20px',
    background: 'linear-gradient(135deg,#f87171 0%,#dc2626 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '700',
    fontFamily: "'DM Sans', sans-serif",
    cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(220,38,38,0.28)',
  },

  /* Approve */
  aprobarInner: { display: 'flex', flexDirection: 'column', gap: '12px' },
  aprobarTexto: { margin: 0, fontSize: '14px', color: '#334155', lineHeight: '1.6' },
  aprobarBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '11px 20px',
    background: 'linear-gradient(135deg,#34d399 0%,#059669 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '700',
    fontFamily: "'DM Sans', sans-serif",
    cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(5,150,105,0.28)',
  },
  btnDisabled: {
    background: '#e2e8f0',
    color: '#94a3b8',
    boxShadow: 'none',
    cursor: 'not-allowed',
    opacity: 0.7,
  },
  nota: { margin: 0, fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' },

  /* Loading / error page */
  loadingWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px',
    gap: '16px',
    fontFamily: "'DM Sans', sans-serif",
  },
  spinner: {
    width: '36px',
    height: '36px',
    border: '3px solid #e2e8f0',
    borderTop: '3px solid #6366f1',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: { color: '#94a3b8', fontSize: '14px', fontWeight: '500', margin: 0 },
  errorPage: {
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    fontFamily: "'DM Sans', sans-serif",
  },
  cerrarBtn: {
    padding: '9px 20px',
    background: '#f1f5f9',
    color: '#475569',
    border: '1px solid #e2e8f0',
    borderRadius: '9px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    fontFamily: "'DM Sans', sans-serif",
  },
};

export default RevisarSolicitud;