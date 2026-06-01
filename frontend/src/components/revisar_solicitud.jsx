import React, { useState, useEffect } from 'react';
import api from '../services/api';

/* ─────────────────────────────────────────────
   TOKENS
───────────────────────────────────────────── */
const C = {
  bg:           '#f8fafc',
  white:        '#ffffff',
  ink:          '#0f172a',
  inkLight:     '#334155',
  muted:        '#64748b',
  border:       '#e2e8f0',
  primary:      '#0f6e56',
  primaryDark:  '#0a4036',
  primaryLight: '#e6f7f2',
  success:      '#10b981',
  successBg:    '#f0fdf4',
  successBorder:'#86efac',
  warning:      '#f59e0b',
  warningBg:    '#fffbeb',
  warningBorder:'#fde68a',
  error:        '#ef4444',
  errorBg:      '#fef2f2',
  errorBorder:  '#fecaca',
};

/* ─────────────────────────────────────────────
   UTILS
───────────────────────────────────────────── */
const fmt = (fecha, opts) => {
  if (!fecha) return '—';
  try {
    return new Date(fecha).toLocaleDateString('es-CO', opts || { day: '2-digit', month: 'long', year: 'numeric' });
  } catch { return '—'; }
};
const fmtFull = (fecha) =>
  fecha
    ? fmt(fecha) + ' · ' + new Date(fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    : '—';
const val = (v, fallback = '—') => (v !== undefined && v !== null && v !== '') ? v : fallback;

/**
 * Extrae el nombre legible de un campo que puede ser:
 *  - string puro (nombre directamente)
 *  - ObjectId crudo (24 hex chars) → devuelve fallback
 *  - objeto con .nombre, .name, .descripcion, .titulo
 */
const nombre = (field, fallback = '—') => {
  if (!field) return fallback;
  if (typeof field === 'string') {
    // Si parece un ObjectId de MongoDB (24 hex), no mostrarlo
    if (/^[a-f\d]{24}$/i.test(field.trim())) return fallback;
    return field;
  }
  if (typeof field === 'object') {
    return field.nombre
      ?? field.name
      ?? field.descripcion
      ?? field.titulo
      ?? field.valor
      ?? fallback;
  }
  return fallback;
};

/* ─────────────────────────────────────────────
   COMPONENTE PRINCIPAL
───────────────────────────────────────────── */
const RevisarSolicitud = ({ solicitudId, onClose, onActualizar }) => {
  const [solicitud,     setSolicitud]     = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [enviando,      setEnviando]      = useState(false);
  const [archivos,      setArchivos]      = useState({ ficha: false, carta: false, excel: false, cedulas: false });
  const [descargando,   setDescargando]   = useState(null);
  const [visorArchivo,  setVisorArchivo]  = useState(null); // { tipo, url, mime }
  const [pestana,       setPestana]       = useState('info'); // 'info' | 'docs' | 'decision'

  useEffect(() => { if (solicitudId) cargarSolicitud(); }, [solicitudId]);

  const cargarSolicitud = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/solicitudes/${solicitudId}`);
      const data = res.data.data ?? res.data;
      setSolicitud(data);
      // ← Abre la consola del navegador para ver los campos reales que llegan
      console.group('📋 Solicitud cargada');
      console.log('oferta_id:', data?.oferta_id);
      console.log('programa_formacion:', data?.oferta_id?.programa_formacion);
      console.log('instructor_id:', data?.instructor_id);
      console.groupEnd();
      try {
        const archRes = await api.get(`/solicitudes/${solicitudId}/archivos`);
        setArchivos(archRes.data.data ?? archRes.data ?? {});
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
      onActualizar?.();
      onClose?.();
    } catch { setError('Error al aprobar la solicitud'); }
    finally { setEnviando(false); }
  };

  const handleRechazar = async () => {
    if (!observaciones.trim()) { setError('Debe escribir una observación para el rechazo'); return; }
    try {
      setEnviando(true);
      await api.put(`/solicitudes/${solicitudId}/rechazar`, { comentarios: observaciones });
      onActualizar?.();
      onClose?.();
    } catch { setError('Error al rechazar la solicitud'); }
    finally { setEnviando(false); }
  };

  /* Abre el archivo en el visor embebido */
  const verArchivo = async (tipo) => {
    try {
      setDescargando(tipo);
      const res = await api.get(`/solicitudes/${solicitudId}/descargar/${tipo}`, { responseType: 'blob' });
      const mime = res.headers['content-type'] || 'application/octet-stream';
      const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: mime }));
      setVisorArchivo({ tipo, url: blobUrl, mime });
    } catch { setError(`No se pudo cargar el archivo: ${tipo}`); }
    finally { setDescargando(null); }
  };

  const descargarArchivo = async (tipo) => {
    try {
      setDescargando(tipo);
      const res = await api.get(`/solicitudes/${solicitudId}/descargar/${tipo}`, { responseType: 'blob' });
      const mime = res.headers['content-type'] || '';
      const ext  = mime.includes('spreadsheet') || mime.includes('excel') ? '.xlsx' : '.pdf';
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const a    = document.createElement('a');
      a.href     = url;
      a.setAttribute('download', `${tipo}_${solicitud?.oferta_id?.programa_formacion?.codigo || 'doc'}${ext}`);
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch { setError(`Error al descargar ${tipo}`); }
    finally { setDescargando(null); }
  };

  /* ── Estados de carga / error ── */
  if (loading) return (
    <div style={S.shell}>
      <style>{CSS}</style>
      <div style={S.stateCenter}>
        <div style={S.spinner} />
        <p style={S.stateText}>Cargando solicitud...</p>
      </div>
    </div>
  );
  if (!solicitud) return (
    <div style={S.shell}>
      <style>{CSS}</style>
      <div style={S.stateCenter}>
        <p style={{ color: C.muted }}>{error || 'Solicitud no encontrada'}</p>
        <button onClick={onClose} style={S.btnSecondary}>Cerrar</button>
      </div>
    </div>
  );

  const oferta  = solicitud.oferta_id || {};
  const prog    = oferta.programa_formacion || {};
  const inst    = solicitud.instructor_id  || {};
  const docList = [
    { key: 'ficha',   label: 'Ficha técnica', icon: <IcoDoc />,   ext: 'PDF' },
    { key: 'carta',   label: 'Carta',          icon: <IcoMail />,  ext: 'PDF' },
    { key: 'excel',   label: 'Planilla Excel', icon: <IcoTable />, ext: 'XLSX' },
    { key: 'cedulas', label: 'Cédulas',        icon: <IcoId />,    ext: 'PDF' },
  ];
  const docsOk = docList.filter(d => archivos[d.key]).length;

  /* pestanas */
  const tabs = [
    { id: 'info',     label: 'Información',  badge: null },
    { id: 'docs',     label: 'Documentos',   badge: `${docsOk}/${docList.length}` },
    { id: 'decision', label: 'Decisión',     badge: null },
  ];

  return (
    <div style={S.shell}>
      <style>{CSS}</style>

      {/* ══ HEADER ══ */}
      <div style={S.header}>
        <div style={S.headerLeft}>
          <div style={S.headerIconWrap}><IcoClipboard /></div>
          <div>
            <h2 style={S.headerTitle}>Revisar Solicitud</h2>
            <p style={S.headerSub}>
              {prog.codigo ? <code style={S.code}>{prog.codigo}</code> : null}
              {prog.nombre_programa || 'Validación de oferta'}
            </p>
          </div>
        </div>
        <button onClick={onClose} style={S.closeBtn} title="Cerrar"><IcoClose /></button>
      </div>

      {/* ══ PESTAÑAS ══ */}
      <div style={S.tabBar}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setPestana(t.id)}
            style={{ ...S.tab, ...(pestana === t.id ? S.tabActive : {}) }}
          >
            {t.label}
            {t.badge && (
              <span style={{
                ...S.tabBadge,
                background: docsOk === docList.length ? C.success : C.warning,
              }}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══ BODY ══ */}
      <div style={S.body}>
        {error && (
          <div style={S.errorBanner}>
            <IcoAlert />
            <span style={{ flex: 1 }}>{error}</span>
            <button onClick={() => setError('')} style={S.errorClose}>✕</button>
          </div>
        )}

        {/* ─── PESTAÑA: INFORMACIÓN ─── */}
        {pestana === 'info' && (
          <div style={S.tabContent}>

            {/* Bloque instructor */}
            <SectionCard title="Instructor" icon={<IcoUser />} accent={C.primaryLight} borderColor={`${C.primary}40`}>
              <div style={S.gridTwo}>
                <Field label="Nombre completo"    value={[inst.nombre, inst.apellido].filter(Boolean).join(' ')} />
                <Field label="Correo electrónico" value={val(inst.correoElectronico ?? inst.email ?? inst.correo)} mono />
                <Field label="Documento"          value={val(inst.numeroIdentificacion ?? inst.numeroDocumento ?? inst.documento ?? inst.cedula)} mono />
                <Field label="Teléfono"           value={val(inst.telefono ?? inst.celular)} />
              </div>
            </SectionCard>

            {/* Bloque programa */}
            <SectionCard title="Programa de Formación" icon={<IcoBook />}>
              <div style={S.gridTwo}>
                <Field label="Código"  value={val(prog.codigo)} mono />
                <Field label="Nombre"  value={val(prog.nombre_programa ?? prog.nombre ?? prog.nombrePrograma)} wide />
                <Field label="Nivel"   value={nombre(prog.nivel_formacion ?? prog.nivel)} />
                <Field label="Horas"   value={prog.duracion_maxima != null ? `${prog.duracion_maxima} h` : prog.duracion_etapa_lectiva != null ? `${prog.duracion_etapa_lectiva} h` : prog.duracion_etapa_productiva != null ? `${prog.duracion_etapa_productiva} h` : '—'} />
                <Field label="Versión" value={val(prog.version)} />
                <Field label="Área"    value={nombre(prog.red_conocimientos ?? prog.area_conocimiento ?? prog.area)} />
                <Field label="Tipo programa" value={nombre(prog.tipo_programa)} />
              </div>
            </SectionCard>

            {/* Bloque oferta */}
            <SectionCard title="Datos de la Oferta" icon={<IcoCalendar />}>
              <div style={S.gridTwo}>
                <Field label="Tipo de oferta"        value={nombre(oferta.tipo_oferta)} />
                <Field label="Modalidad"             value={nombre(oferta.modalidad)} />
                <Field label="Programa especial"     value={nombre(oferta.programa_especial)} />
                <Field label="Municipio"             value={nombre(oferta.ubicacion?.municipio)} />
                <Field label="Dirección"             value={val(oferta.ubicacion?.direccion)} />
                <Field label="Ambiente"              value={val(oferta.ambiente?.nombre)} />
                <Field label="Empresa solicitante"   value={nombre(oferta.empresa_solicitante)} />
                <Field label="Fecha inicio"          value={fmt(oferta.fechas?.inicio)} />
                <Field label="Fecha fin"             value={fmt(oferta.fechas?.fin)} />
                <Field label="Cupo total"            value={oferta.cupo_maximo != null ? `${oferta.cupo_maximo} aprendices` : '—'} />
                <Field label="¿Es Campesena?"        value={oferta.es_campesena != null ? (oferta.es_campesena ? 'Sí' : 'No') : '—'} />
              </div>
            </SectionCard>

            {/* Bloque solicitud */}
            <SectionCard title="Solicitud" icon={<IcoInfo />} accent={C.warningBg} borderColor={C.warningBorder}>
              <div style={S.gridTwo}>
                <Field label="Fecha de solicitud" value={fmtFull(solicitud.fecha_solicitud)} wide />
                <Field label="Estado" value={
                  <span style={S.badgePend}>
                    <span style={{ ...S.dot, background: C.warning }} />
                    Pendiente
                  </span>
                } />
              </div>
              {solicitud.mensaje && (
                <div style={S.mensajeBox}>
                  <p style={S.mensajeLabel}>Mensaje del instructor</p>
                  <p style={S.mensajeText}>"{solicitud.mensaje}"</p>
                </div>
              )}
            </SectionCard>

          </div>
        )}

        {/* ─── PESTAÑA: DOCUMENTOS ─── */}
        {pestana === 'docs' && (
          <div style={S.tabContent}>

            {/* Progreso */}
            <div style={S.docsHeader}>
              <div style={S.docsProgressInfo}>
                <span style={S.docsLabel}>Completitud de documentos</span>
                <span style={{
                  ...S.docsCount,
                  color: docsOk === docList.length ? C.success : C.warning,
                }}>
                  {docsOk} de {docList.length} disponibles
                </span>
              </div>
              <div style={S.progressTrack}>
                <div style={{
                  ...S.progressBar,
                  width: `${(docsOk / docList.length) * 100}%`,
                  background: docsOk === docList.length
                    ? `linear-gradient(90deg,${C.success},#059669)`
                    : `linear-gradient(90deg,${C.warning},#d97706)`,
                }} />
              </div>
            </div>

            {/* Tarjetas de documentos */}
            <div style={S.docCards}>
              {docList.map(({ key, label, icon, ext }) => {
                const ok      = !!archivos[key];
                const loading = descargando === key;
                return (
                  <div key={key} style={{ ...S.docCard, ...(ok ? S.docCardOk : S.docCardNo) }}>
                    <div style={S.docCardTop}>
                      <div style={{ ...S.docCardIcon, color: ok ? C.primary : C.muted }}>
                        {icon}
                      </div>
                      <div style={S.docCardInfo}>
                        <span style={S.docCardLabel}>{label}</span>
                        <span style={{ ...S.docCardExt, color: ok ? C.primary : C.muted }}>{ext}</span>
                      </div>
                      <div style={{ ...S.docStatus, background: ok ? C.successBg : C.errorBg, borderColor: ok ? C.successBorder : C.errorBorder }}>
                        {ok
                          ? <><IcoCheck /><span style={{ color: C.success }}>Disponible</span></>
                          : <><IcoMinus /><span style={{ color: C.error }}>No adjunto</span></>
                        }
                      </div>
                    </div>

                    {ok && (
                      <div style={S.docCardActions}>
                        <button
                          onClick={() => verArchivo(key)}
                          disabled={loading}
                          style={S.btnVerDoc}
                          className="doc-btn"
                        >
                          {loading ? <SpinDot /> : <IcoEye />}
                          Ver archivo
                        </button>
                        <button
                          onClick={() => descargarArchivo(key)}
                          disabled={loading}
                          style={S.btnDownDoc}
                          className="doc-btn"
                        >
                          {loading ? <SpinDot /> : <IcoDownload />}
                          Descargar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p style={S.docsNota}>
              Haz clic en "Ver archivo" para previsualizarlo sin descargarlo. Verifica que todos los documentos
              estén presentes y correctos antes de tomar una decisión.
            </p>
          </div>
        )}

        {/* ─── PESTAÑA: DECISIÓN ─── */}
        {pestana === 'decision' && (
          <div style={S.tabContent}>

            {/* Resumen rápido */}
            <div style={S.resumenStrip}>
              <ResumenItem label="Programa" value={prog.nombre_programa || '—'} />
              <div style={S.resumenSep} />
              <ResumenItem label="Documentos" value={`${docsOk}/${docList.length}`} color={docsOk === docList.length ? C.success : C.warning} />
              <div style={S.resumenSep} />
              <ResumenItem label="Instructor" value={[inst.nombre, inst.apellido].filter(Boolean).join(' ') || '—'} />
            </div>

            {/* Rechazar */}
            <SectionCard title="Rechazar solicitud" icon={<IcoReject />} accent={C.errorBg} borderColor={C.errorBorder}>
              <label style={S.fieldLabel}>
                Motivo del rechazo <span style={S.required}>* obligatorio para rechazar</span>
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => { setObservaciones(e.target.value); setError(''); }}
                style={{
                  ...S.textarea,
                  borderColor: error && !observaciones.trim() ? C.error : C.border,
                  boxShadow: error && !observaciones.trim() ? `0 0 0 3px ${C.errorBg}` : 'none',
                }}
                rows={4}
                placeholder="Indique qué documentos faltan o qué debe corregir el instructor..."
              />
              <button
                onClick={handleRechazar}
                disabled={enviando || !observaciones.trim()}
                style={{
                  ...S.btnReject,
                  ...(enviando || !observaciones.trim() ? S.btnDisabled : {}),
                }}
                className={enviando || !observaciones.trim() ? '' : 'action-btn'}
              >
                <IcoReject />
                {enviando ? 'Rechazando...' : 'Rechazar solicitud'}
              </button>
              <p style={S.nota}>
                El instructor recibirá tus comentarios y deberá corregir los documentos.
              </p>
            </SectionCard>

            {/* Aprobar */}
            <SectionCard title="Aprobar solicitud" icon={<IcoApprove />} accent={C.successBg} borderColor={C.successBorder}>
              <p style={S.aprobarText}>
                Si todos los documentos están completos y correctos, aprueba la solicitud para que pase al
                funcionario correspondiente que creará la ficha en Sofía Plus.
              </p>
              {docsOk < docList.length && (
                <div style={S.warningNote}>
                  <IcoAlert small />
                  <span>Faltan {docList.length - docsOk} documento(s). Verifícalos antes de aprobar.</span>
                </div>
              )}
              <button
                onClick={handleAprobar}
                disabled={enviando}
                style={{ ...S.btnApprove, ...(enviando ? S.btnDisabled : {}) }}
                className={enviando ? '' : 'action-btn'}
              >
                <IcoApprove />
                {enviando ? 'Aprobando...' : 'Aprobar solicitud'}
              </button>
              <p style={S.nota}>
                Al aprobar, la oferta pasará al funcionario para continuar el proceso.
              </p>
            </SectionCard>

          </div>
        )}
      </div>

      {/* ══ VISOR DE ARCHIVO (overlay) ══ */}
      {visorArchivo && (
        <div style={S.visorOverlay} onClick={(e) => e.target === e.currentTarget && setVisorArchivo(null)}>
          <div style={S.visorBox}>
            <div style={S.visorHeader}>
              <span style={S.visorTitle}>
                {docList.find(d => d.key === visorArchivo.tipo)?.label ?? visorArchivo.tipo}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => descargarArchivo(visorArchivo.tipo)}
                  style={S.visorDownBtn}
                  title="Descargar"
                >
                  <IcoDownload /> Descargar
                </button>
                <button onClick={() => setVisorArchivo(null)} style={S.visorClose}>
                  <IcoClose />
                </button>
              </div>
            </div>
            <div style={S.visorContent}>
              {visorArchivo.mime?.includes('pdf') || visorArchivo.tipo !== 'excel' ? (
                <iframe
                  src={visorArchivo.url}
                  title={visorArchivo.tipo}
                  style={S.visorIframe}
                />
              ) : (
                <div style={S.visorNoPreview}>
                  <IcoTable />
                  <p>Vista previa no disponible para archivos Excel.</p>
                  <button onClick={() => descargarArchivo(visorArchivo.tipo)} style={S.btnSecondary}>
                    Descargar para abrir
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   SUB-COMPONENTES
───────────────────────────────────────────── */
const SectionCard = ({ title, icon, children, accent = C.bg, borderColor = C.border }) => (
  <div style={{ ...S.sectionCard, background: accent, borderColor }}>
    <div style={S.sectionCardHeader}>
      <span style={S.sectionCardIcon}>{icon}</span>
      <h3 style={S.sectionCardTitle}>{title}</h3>
    </div>
    {children}
  </div>
);

const Field = ({ label, value, mono, wide }) => (
  <div style={{ ...S.field, ...(wide ? { gridColumn: '1 / -1' } : {}) }}>
    <span style={S.fieldLabel}>{label}</span>
    <span style={{ ...S.fieldValue, ...(mono ? S.monoVal : {}) }}>
      {val(value)}
    </span>
  </div>
);

const ResumenItem = ({ label, value, color }) => (
  <div style={{ textAlign: 'center', flex: 1 }}>
    <p style={{ margin: 0, fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
    <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 700, color: color || C.ink }}>{value}</p>
  </div>
);

/* ─────────────────────────────────────────────
   ICONOS SVG
───────────────────────────────────────────── */
const sv = (d, size = 16) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);
const IcoClipboard = () => sv(<><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></>, 20);
const IcoClose     = () => sv(<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>, 15);
const IcoUser      = () => sv(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>);
const IcoBook      = () => sv(<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>);
const IcoCalendar  = () => sv(<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>);
const IcoInfo      = () => sv(<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>);
const IcoAlert     = ({ small }) => sv(<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>, small ? 14 : 15);
const IcoCheck     = () => sv(<><polyline points="20 6 9 17 4 12"/></>, 13);
const IcoMinus     = () => sv(<><line x1="5" y1="12" x2="19" y2="12"/></>, 13);
const IcoDoc       = () => sv(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>);
const IcoMail      = () => sv(<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>);
const IcoTable     = () => sv(<><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></>);
const IcoId        = () => sv(<><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></>);
const IcoEye       = () => sv(<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>);
const IcoDownload  = () => sv(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>);
const IcoReject    = () => sv(<><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>);
const IcoApprove   = () => sv(<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>);
const SpinDot      = () => <span style={{ width:13,height:13,border:'2px solid #e2e8f0',borderTopColor:C.primary,borderRadius:'50%',display:'inline-block',animation:'spin 0.7s linear infinite',flexShrink:0 }} />;

/* ─────────────────────────────────────────────
   ESTILOS
───────────────────────────────────────────── */
const S = {
  shell: {
    fontFamily: "'Geist', 'DM Sans', system-ui, sans-serif",
    background: C.white,
    borderRadius: 18,
    overflow: 'hidden',
    color: C.ink,
    maxWidth: 960,
    width: '100%',
    boxShadow: '0 8px 40px rgba(0,0,0,0.14)',
  },

  /* Header */
  header: {
    background: `linear-gradient(135deg, ${C.primaryDark} 0%, #0d3d30 100%)`,
    padding: '20px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 },
  headerIconWrap: {
    width: 44, height: 44,
    borderRadius: 12,
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.18)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'white', flexShrink: 0,
  },
  headerTitle: { margin: 0, fontSize: 18, fontWeight: 700, color: 'white', letterSpacing: '-0.3px' },
  headerSub: {
    margin: '3px 0 0', fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
  },
  code: {
    background: 'rgba(255,255,255,0.12)',
    color: 'rgba(255,255,255,0.85)',
    padding: '1px 7px',
    borderRadius: 5,
    fontSize: 12,
    fontFamily: 'monospace',
    fontStyle: 'normal',
  },
  closeBtn: {
    width: 34, height: 34,
    borderRadius: 8,
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.14)',
    color: 'rgba(255,255,255,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0,
    transition: 'background 0.15s',
  },

  /* Tabs */
  tabBar: {
    display: 'flex',
    borderBottom: `1px solid ${C.border}`,
    background: C.bg,
    padding: '0 24px',
    gap: 4,
  },
  tab: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '13px 16px',
    background: 'none', border: 'none',
    fontSize: 13.5, fontWeight: 600, color: C.muted,
    cursor: 'pointer', fontFamily: 'inherit',
    borderBottom: '2px solid transparent',
    marginBottom: -1,
    transition: 'color 0.15s',
  },
  tabActive: {
    color: C.primary,
    borderBottomColor: C.primary,
  },
  tabBadge: {
    color: 'white',
    fontSize: 11,
    fontWeight: 700,
    padding: '1px 7px',
    borderRadius: 20,
  },

  /* Body scroll */
  body: {
    maxHeight: '68vh',
    overflowY: 'auto',
    padding: '0',
  },
  tabContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    padding: '20px 24px 28px',
  },

  /* Error */
  errorBanner: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: C.errorBg,
    border: `1px solid ${C.errorBorder}`,
    color: '#b91c1c',
    padding: '12px 16px',
    fontSize: 13.5, fontWeight: 500,
    margin: '16px 24px 0',
    borderRadius: 10,
  },
  errorClose: {
    background: 'none', border: 'none',
    color: '#b91c1c', cursor: 'pointer',
    fontSize: 14, fontWeight: 700, padding: '0 4px',
  },

  /* Section card */
  sectionCard: {
    border: '1px solid',
    borderRadius: 14,
    padding: '18px 20px',
    display: 'flex', flexDirection: 'column', gap: 14,
  },
  sectionCardHeader: { display: 'flex', alignItems: 'center', gap: 8 },
  sectionCardIcon: { color: C.muted, display: 'flex', alignItems: 'center' },
  sectionCardTitle: { margin: 0, fontSize: 14, fontWeight: 700, color: C.ink },

  /* Grid fields */
  gridTwo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
    gap: 10,
  },
  field: {
    background: C.white,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: '11px 14px',
    display: 'flex', flexDirection: 'column', gap: 4,
  },
  fieldLabel: { fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' },
  fieldValue: { fontSize: 13.5, fontWeight: 600, color: C.ink, wordBreak: 'break-word' },
  monoVal: { fontFamily: 'monospace', color: '#2563eb', fontSize: 13 },

  /* Badges */
  badgePend: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    background: C.warningBg, color: '#b45309',
    border: `1px solid ${C.warningBorder}`,
    borderRadius: 99, padding: '3px 10px',
    fontSize: 12, fontWeight: 700,
  },
  dot: { width: 6, height: 6, borderRadius: '50%', display: 'inline-block', flexShrink: 0 },

  /* Mensaje */
  mensajeBox: {
    background: C.white,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: '14px 16px',
  },
  mensajeLabel: { margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' },
  mensajeText: { margin: 0, fontSize: 14, color: C.inkLight, lineHeight: 1.65, fontStyle: 'italic' },

  /* Documents tab */
  docsHeader: { display: 'flex', flexDirection: 'column', gap: 8 },
  docsProgressInfo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  docsLabel: { fontSize: 12.5, color: C.muted, fontWeight: 500 },
  docsCount: { fontSize: 13, fontWeight: 700 },
  progressTrack: { height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 99, transition: 'width 0.5s ease' },

  docCards: { display: 'flex', flexDirection: 'column', gap: 10 },
  docCard: {
    border: '1px solid',
    borderRadius: 12,
    padding: '14px 16px',
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  docCardOk: { background: C.successBg, borderColor: C.successBorder },
  docCardNo: { background: C.bg, borderColor: C.border, opacity: 0.75 },
  docCardTop: { display: 'flex', alignItems: 'center', gap: 12 },
  docCardIcon: { display: 'flex', alignItems: 'center', flexShrink: 0 },
  docCardInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: 2 },
  docCardLabel: { fontSize: 13.5, fontWeight: 700, color: C.ink },
  docCardExt: { fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' },
  docStatus: {
    display: 'flex', alignItems: 'center', gap: 5,
    border: '1px solid',
    borderRadius: 20,
    padding: '3px 10px',
    fontSize: 12, fontWeight: 600,
    flexShrink: 0,
  },
  docCardActions: { display: 'flex', gap: 8 },
  btnVerDoc: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: C.primary, color: 'white',
    border: 'none', borderRadius: 8,
    padding: '8px 16px',
    fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  btnDownDoc: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: C.white, color: C.inkLight,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: '8px 16px',
    fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  docsNota: { margin: 0, fontSize: 12, color: C.muted, fontStyle: 'italic' },

  /* Decision tab */
  resumenStrip: {
    display: 'flex', alignItems: 'center',
    background: C.bg,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: '16px 20px',
    gap: 16,
  },
  resumenSep: { width: 1, height: 36, background: C.border, flexShrink: 0 },

  textarea: {
    width: '100%',
    padding: '12px 14px',
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    fontSize: 13.5,
    fontFamily: 'inherit',
    color: C.inkLight,
    resize: 'vertical',
    lineHeight: 1.6,
    background: C.white,
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box',
  },
  required: { fontSize: 11, color: C.error, fontWeight: 500, marginLeft: 6 },

  btnReject: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '11px 22px',
    background: 'linear-gradient(135deg, #f87171, #dc2626)',
    color: 'white', border: 'none', borderRadius: 10,
    fontSize: 14, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
    boxShadow: '0 2px 10px rgba(220,38,38,0.3)',
  },
  aprobarText: { margin: 0, fontSize: 14, color: C.inkLight, lineHeight: 1.65 },
  warningNote: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: C.warningBg,
    border: `1px solid ${C.warningBorder}`,
    borderRadius: 8, padding: '10px 14px',
    fontSize: 13, color: '#92400e', fontWeight: 500,
  },
  btnApprove: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '11px 22px',
    background: `linear-gradient(135deg, #34d399, #059669)`,
    color: 'white', border: 'none', borderRadius: 10,
    fontSize: 14, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
    boxShadow: '0 2px 10px rgba(5,150,105,0.3)',
  },
  btnDisabled: {
    background: '#e2e8f0',
    color: '#94a3b8',
    boxShadow: 'none',
    cursor: 'not-allowed',
    opacity: 0.7,
  },
  btnSecondary: {
    padding: '9px 20px',
    background: C.bg, color: C.inkLight,
    border: `1px solid ${C.border}`,
    borderRadius: 9, cursor: 'pointer',
    fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
  },
  nota: { margin: 0, fontSize: 12, color: C.muted, fontStyle: 'italic', textAlign: 'center' },

  /* Loading states */
  stateCenter: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: 80, gap: 16,
  },
  spinner: {
    width: 36, height: 36,
    border: `3px solid ${C.border}`,
    borderTopColor: C.primary,
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  stateText: { color: C.muted, fontSize: 14, fontWeight: 500, margin: 0 },

  /* Visor overlay */
  visorOverlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(6px)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 2000, padding: 20,
  },
  visorBox: {
    width: '90vw', height: '88vh',
    maxWidth: 1100,
    background: C.white,
    borderRadius: 16,
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
    animation: 'fadeUp 0.2s ease',
  },
  visorHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 20px',
    borderBottom: `1px solid ${C.border}`,
    background: C.bg,
    flexShrink: 0,
  },
  visorTitle: { fontSize: 14, fontWeight: 700, color: C.ink },
  visorDownBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: C.primary, color: 'white',
    border: 'none', borderRadius: 8,
    padding: '7px 14px',
    fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  visorClose: {
    width: 32, height: 32,
    background: C.bg, border: `1px solid ${C.border}`,
    borderRadius: 8, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: C.muted,
  },
  visorContent: { flex: 1, overflow: 'hidden', background: '#525659' },
  visorIframe: { width: '100%', height: '100%', border: 'none' },
  visorNoPreview: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    height: '100%', gap: 16,
    color: C.muted,
  },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');
  * { box-sizing: border-box; }
  @keyframes spin   { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  .doc-btn    { transition: opacity 0.15s, transform 0.15s; }
  .doc-btn:hover { opacity: 0.85; transform: translateY(-1px); }
  .action-btn { transition: opacity 0.15s, transform 0.15s, box-shadow 0.15s; }
  .action-btn:hover { opacity: 0.88; transform: translateY(-1px); }
  textarea:focus { border-color: ${C.primary} !important; box-shadow: 0 0 0 3px ${C.primaryLight} !important; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
`;

export default RevisarSolicitud;