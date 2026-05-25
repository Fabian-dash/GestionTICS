import React, { useState, useEffect } from 'react';
import api from '../services/api';

const VerInscritos = () => {
  const [ofertas, setOfertas] = useState([]);
  const [inscritos, setInscritos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [ofertaSeleccionada, setOfertaSeleccionada] = useState(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [fusionando, setFusionando] = useState(false);

  useEffect(() => {
    cargarOfertas();
  }, []);

  const cargarOfertas = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ofertas/mis-ofertas');
      setOfertas(response.data.data || []);
    } catch (error) {
      console.error('Error cargando ofertas:', error);
      setError('Error al cargar las ofertas');
    } finally {
      setLoading(false);
    }
  };

  const cargarInscritos = async (ofertaId) => {
    try {
      setLoading(true);
      const response = await api.get(`/inscripciones/oferta/${ofertaId}`);
      setInscritos(response.data.data || []);
      const oferta = ofertas.find(o => o._id === ofertaId);
      setOfertaSeleccionada(oferta);
      setMostrarDetalle(true);
    } catch (error) {
      console.error('Error cargando inscritos:', error);
      setError('Error al cargar los inscritos');
    } finally {
      setLoading(false);
    }
  };

  const exportarDatosCompletos = async () => {
    if (!ofertaSeleccionada) return;
    try {
      setExportando(true);
      const response = await api.get(`/inscripciones/oferta/${ofertaSeleccionada._id}/exportar/completo`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inscripciones_completas_${ofertaSeleccionada.programa_formacion?.codigo}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSuccess('Excel exportado correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Error al exportar los datos');
    } finally {
      setExportando(false);
    }
  };

  const exportarExcelCedulas = async () => {
    if (!ofertaSeleccionada) return;
    try {
      setExportando(true);
      const response = await api.get(`/inscripciones/oferta/${ofertaSeleccionada._id}/exportar/cedulas`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cedulas_${ofertaSeleccionada.programa_formacion?.codigo}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSuccess('Excel de cédulas exportado correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Error al exportar el Excel de cédulas');
    } finally {
      setExportando(false);
    }
  };

  const fusionarPDFs = async () => {
    if (!ofertaSeleccionada) return;
    try {
      setFusionando(true);
      setError('');
      const response = await api.post(`/inscripciones/oferta/${ofertaSeleccionada._id}/fusionar-pdfs`);
      if (response.data.success) {
        setSuccess(`PDFs fusionados exitosamente. Total: ${response.data.data.totalPaginas} páginas`);
      } else {
        setError(response.data.message || 'Error al fusionar PDFs');
      }
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setError(error.response?.data?.message || 'Error al fusionar los PDFs');
    } finally {
      setFusionando(false);
    }
  };

  const volverAlInicio = () => {
    setMostrarDetalle(false);
    setOfertaSeleccionada(null);
    setInscritos([]);
  };

  const obtenerEstadoCupos = (oferta) => {
    const disponibles = oferta.cupos_disponibles || 0;
    if (disponibles === 0) return { label: 'Agotado', ok: false };
    if (disponibles < 5) return { label: `Últimos ${disponibles}`, ok: false };
    return { label: `${disponibles} libres`, ok: true };
  };

  const pct = (oferta) => {
    const inscritos = oferta.cupo_maximo - (oferta.cupos_disponibles || 0);
    return Math.round((inscritos / oferta.cupo_maximo) * 100);
  };

  if (loading && !mostrarDetalle) {
    return (
      <div style={s.root}>
        <div style={s.header}>
          <div style={s.headerInner}>
            <div style={s.headerBadge}>INSTRUCTORES</div>
            <h1 style={s.headerTitle}>Estado de Cupos por Oferta</h1>
            <p style={s.headerSub}>Consulta inscritos y exporta documentos por programa</p>
          </div>
        </div>
        <div style={s.body}>
          <div style={s.loadingState}>
            <div style={s.loadingSpinner} />
            <span style={s.loadingText}>Cargando ofertas...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.root}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerInner}>
          <div style={s.headerBadge}>INSTRUCTORES</div>
          <h1 style={s.headerTitle}>
            {mostrarDetalle ? 'Lista de Inscritos' : 'Estado de Cupos por Oferta'}
          </h1>
          <p style={s.headerSub}>
            {mostrarDetalle
              ? `${ofertaSeleccionada?.programa_formacion?.nombre_programa} · ${inscritos.length} inscritos`
              : 'Consulta inscritos y exporta documentos por programa'}
          </p>
        </div>
        {mostrarDetalle && (
          <button onClick={volverAlInicio} style={s.backBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Volver
          </button>
        )}
      </div>

      <div style={s.body}>

        {/* Alertas */}
        {error && (
          <div style={s.alertError}>
            <span style={s.dot} />
            {error}
          </div>
        )}
        {success && (
          <div style={s.alertSuccess}>
            <span style={{ ...s.dot, background: '#085041' }} />
            {success}
          </div>
        )}

        {!mostrarDetalle ? (
          /* ── Vista: listado de ofertas ── */
          <>
            {ofertas.length === 0 ? (
              <div style={s.emptyState}>
                <div style={s.emptyIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <p style={s.emptyTitle}>Sin ofertas creadas</p>
                <p style={s.emptyDesc}>Aún no tienes ofertas registradas en el sistema</p>
              </div>
            ) : (
              <div style={s.card}>
                <div style={s.tableWrap}>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        {['Programa', 'Código', 'Cupo total', 'Inscritos', 'Disponibles', 'Estado', 'Acciones'].map(col => (
                          <th key={col} style={s.th}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ofertas.map((oferta, i) => {
                        const inscritosCount = oferta.cupo_maximo - (oferta.cupos_disponibles || 0);
                        const estado = obtenerEstadoCupos(oferta);
                        const p = pct(oferta);
                        return (
                          <tr key={oferta._id} style={{ ...s.tr, background: i % 2 === 0 ? WHITE : BG }}>
                            <td style={{ ...s.td, fontWeight: 500, color: INK, maxWidth: 260 }}>
                              {oferta.programa_formacion?.nombre_programa}
                            </td>
                            <td style={{ ...s.td, fontFamily: 'monospace', fontSize: 12, color: INK_SOFT }}>
                              {oferta.programa_formacion?.codigo}
                            </td>
                            <td style={{ ...s.td, textAlign: 'center' }}>{oferta.cupo_maximo}</td>
                            <td style={{ ...s.td, textAlign: 'center', fontWeight: 600, color: INK }}>{inscritosCount}</td>
                            <td style={{ ...s.td, textAlign: 'center' }}>
                              <div style={s.progressWrap}>
                                <div style={{ ...s.progressBar, width: `${p}%`, background: p >= 100 ? '#993c1d' : p > 70 ? '#854f0b' : TEAL_MID }} />
                              </div>
                              <span style={{ fontSize: 11, color: INK_SOFT }}>{oferta.cupos_disponibles} / {oferta.cupo_maximo}</span>
                            </td>
                            <td style={s.td}>
                              <span style={estado.ok ? s.tagOk : s.tagNo}>{estado.label}</span>
                            </td>
                            <td style={s.td}>
                              <button onClick={() => cargarInscritos(oferta._id)} style={s.btnSm}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}>
                                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                </svg>
                                Ver inscritos
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          /* ── Vista: detalle de inscritos ── */
          <>
            {/* Info oferta + acciones */}
            <div style={s.detalleTop}>
              <div style={s.card} >
                <div style={s.cardHeader2}>
                  <div style={s.cardIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <span style={s.cardTitle}>{ofertaSeleccionada?.programa_formacion?.nombre_programa}</span>
                </div>
                <div style={s.divider} />
                <div style={s.ofertaStats}>
                  {[
                    { label: 'Código', val: ofertaSeleccionada?.programa_formacion?.codigo },
                    { label: 'Inscritos', val: inscritos.length },
                    { label: 'Cupo total', val: ofertaSeleccionada?.cupo_maximo },
                    { label: 'Disponibles', val: ofertaSeleccionada?.cupos_disponibles },
                  ].map(({ label, val }) => (
                    <div key={label} style={s.statMini}>
                      <span style={s.statMiniLabel}>{label}</span>
                      <span style={s.statMiniVal}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botones de acción */}
              <div style={s.actionsCard}>
                <p style={s.actionsTitle}>Exportar y procesar</p>
                <div style={s.actionsGroup}>
                  <button
                    onClick={exportarDatosCompletos}
                    disabled={exportando || inscritos.length === 0}
                    style={inscritos.length === 0 ? { ...s.actionBtn, ...s.actionBtnDisabled } : { ...s.actionBtn, background: TEAL }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 7 }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Datos completos
                  </button>
                  <button
                    onClick={exportarExcelCedulas}
                    disabled={exportando || inscritos.length === 0}
                    style={inscritos.length === 0 ? { ...s.actionBtn, ...s.actionBtnDisabled } : { ...s.actionBtn, background: '#185fa5' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 7 }}>
                      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                    </svg>
                    Excel cédulas
                  </button>
                  <button
                    onClick={fusionarPDFs}
                    disabled={fusionando || inscritos.length === 0}
                    style={inscritos.length === 0 ? { ...s.actionBtn, ...s.actionBtnDisabled } : { ...s.actionBtn, background: '#533489' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 7 }}>
                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
                    </svg>
                    {fusionando ? 'Fusionando...' : 'Fusionar PDFs'}
                  </button>
                  <button onClick={volverAlInicio} style={{ ...s.actionBtn, background: '#5f5e5a' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 7 }}>
                      <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.96"/>
                    </svg>
                    Limpiar
                  </button>
                </div>
              </div>
            </div>

            {/* Tabla inscritos */}
            {inscritos.length === 0 ? (
              <div style={s.emptyState}>
                <div style={s.emptyIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  </svg>
                </div>
                <p style={s.emptyTitle}>Sin inscritos</p>
                <p style={s.emptyDesc}>No hay inscritos para esta oferta aún</p>
              </div>
            ) : (
              <div style={s.card}>
                <div style={s.tableWrap}>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        {['#', 'Nombre completo', 'Tipo doc.', 'Documento', 'Email', 'Teléfono', 'Caracterización'].map(col => (
                          <th key={col} style={s.th}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {inscritos.map((inscrito, i) => (
                        <tr key={inscrito._id} style={{ ...s.tr, background: i % 2 === 0 ? WHITE : BG }}>
                          <td style={{ ...s.td, color: INK_SOFT, fontSize: 12, width: 36 }}>{i + 1}</td>
                          <td style={{ ...s.td, fontWeight: 500, color: INK }}>
                            {inscrito.nombres} {inscrito.apellidos}
                          </td>
                          <td style={{ ...s.td, color: INK_SOFT, fontSize: 12 }}>
                            {inscrito.tipo_documento?.nombre || 'N/A'}
                          </td>
                          <td style={{ ...s.td, fontFamily: 'monospace', fontSize: 13 }}>
                            {inscrito.numero_documento}
                          </td>
                          <td style={{ ...s.td, color: TEAL, fontSize: 13 }}>{inscrito.correo}</td>
                          <td style={{ ...s.td, fontSize: 13 }}>{inscrito.telefono}</td>
                          <td style={s.td}>
                            {inscrito.caracterizacion?.tipo_caracterizacion
                              ? <span style={s.tagCaract}>{inscrito.caracterizacion.tipo_caracterizacion}</span>
                              : <span style={{ color: INK_SOFT, fontSize: 12 }}>N/A</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={s.tableFooter}>
                  <span style={s.tableFooterText}>
                    Total: <strong>{inscritos.length}</strong> inscritos de <strong>{ofertaSeleccionada?.cupo_maximo}</strong> cupos
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

/* ─── Tokens ─────────────────────────────────────────────────────────────── */
const TEAL       = '#0f6e56';
const TEAL_LIGHT = '#e1f5ee';
const TEAL_MID   = '#1d9e75';
const INK        = '#1a1f2e';
const INK_SOFT   = '#6b7280';
const BORDER     = '#e4e7ed';
const BG         = '#f5f6f8';
const WHITE      = '#ffffff';
const RED_BG     = '#fff0ee';
const RED_TXT    = '#993c1d';

const s = {
  root: {
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    background: BG,
    minHeight: '100vh',
  },

  /* Header */
  header: {
    background: INK,
    padding: '40px 32px 36px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerInner: {
    maxWidth: 900,
  },
  headerBadge: {
    display: 'inline-block',
    background: TEAL_MID,
    color: WHITE,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.12em',
    padding: '4px 10px',
    borderRadius: 4,
    marginBottom: 14,
  },
  headerTitle: {
    color: WHITE,
    fontSize: 26,
    fontWeight: 700,
    margin: '0 0 8px',
    letterSpacing: '-0.3px',
  },
  headerSub: {
    color: '#9aa3b5',
    fontSize: 14,
    margin: 0,
    lineHeight: 1.6,
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.1)',
    color: WHITE,
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 8,
    padding: '9px 16px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    marginLeft: 24,
    flexShrink: 0,
  },

  /* Body */
  body: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '28px 24px 48px',
  },

  /* Alerts */
  alertError: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: RED_BG, color: RED_TXT,
    border: `1px solid #f5c4b3`,
    borderRadius: 8, padding: '12px 16px', fontSize: 14, marginBottom: 20,
  },
  alertSuccess: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: TEAL_LIGHT, color: '#085041',
    border: `1px solid #9fe1cb`,
    borderRadius: 8, padding: '12px 16px', fontSize: 14, marginBottom: 20,
  },
  dot: {
    display: 'inline-block', width: 8, height: 8,
    borderRadius: '50%', background: RED_TXT, flexShrink: 0,
  },

  /* Loading */
  loadingState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '80px 20px',
  },
  loadingSpinner: {
    width: 32, height: 32,
    border: `3px solid ${BORDER}`, borderTopColor: TEAL,
    borderRadius: '50%', animation: 'spin 0.7s linear infinite',
  },
  loadingText: { fontSize: 14, color: INK_SOFT },

  /* Empty */
  emptyState: {
    textAlign: 'center', padding: '60px 20px',
    background: WHITE, borderRadius: 12, border: `1px dashed ${BORDER}`,
  },
  emptyIcon: {
    width: 60, height: 60, borderRadius: '50%',
    background: TEAL_LIGHT, color: TEAL,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 16px',
  },
  emptyTitle: { fontSize: 17, fontWeight: 600, color: INK, margin: '0 0 6px' },
  emptyDesc:  { fontSize: 14, color: INK_SOFT, margin: 0 },

  /* Card genérica */
  card: {
    background: WHITE, borderRadius: 12,
    border: `1px solid ${BORDER}`, marginBottom: 20,
  },
  cardHeader2: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '18px 22px 14px',
  },
  cardIcon: {
    width: 34, height: 34, borderRadius: 8,
    background: TEAL_LIGHT, color: TEAL,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardTitle: { fontSize: 15, fontWeight: 600, color: INK, letterSpacing: '-0.1px' },
  divider:   { height: 1, background: BORDER },

  /* Oferta stats strip */
  ofertaStats: {
    display: 'flex', gap: 0,
    borderTop: `1px solid ${BORDER}`,
  },
  statMini: {
    flex: 1, display: 'flex', flexDirection: 'column', gap: 2,
    padding: '12px 18px',
    borderRight: `1px solid ${BORDER}`,
  },
  statMiniLabel: { fontSize: 11, fontWeight: 600, color: INK_SOFT, textTransform: 'uppercase', letterSpacing: '0.06em' },
  statMiniVal:   { fontSize: 16, fontWeight: 700, color: INK },

  /* Detalle top grid */
  detalleTop: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: 20,
    marginBottom: 0,
    alignItems: 'start',
  },

  /* Actions card */
  actionsCard: {
    background: WHITE, borderRadius: 12, border: `1px solid ${BORDER}`,
    padding: '18px 20px', marginBottom: 20,
  },
  actionsTitle: {
    fontSize: 11, fontWeight: 700, color: INK_SOFT,
    textTransform: 'uppercase', letterSpacing: '0.08em',
    margin: '0 0 12px',
  },
  actionsGroup: { display: 'flex', flexDirection: 'column', gap: 8 },
  actionBtn: {
    display: 'flex', alignItems: 'center',
    color: WHITE, border: 'none', borderRadius: 7,
    padding: '10px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  actionBtnDisabled: {
    background: '#c5ccd8', cursor: 'not-allowed',
  },

  /* Table */
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    background: INK, color: WHITE,
    padding: '11px 14px', textAlign: 'left',
    fontSize: 12, fontWeight: 600, letterSpacing: '0.04em',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '10px 14px',
    borderBottom: `1px solid ${BORDER}`,
    fontSize: 13, color: INK_SOFT,
    verticalAlign: 'middle',
  },
  tr: {},

  /* Progress bar */
  progressWrap: {
    height: 4, background: BORDER, borderRadius: 99,
    overflow: 'hidden', marginBottom: 4,
  },
  progressBar: { height: '100%', borderRadius: 99, transition: 'width 0.3s' },

  /* Tags */
  tagOk: {
    fontSize: 11, fontWeight: 700, color: '#085041',
    background: TEAL_LIGHT, padding: '3px 9px', borderRadius: 20,
  },
  tagNo: {
    fontSize: 11, fontWeight: 700, color: RED_TXT,
    background: RED_BG, padding: '3px 9px', borderRadius: 20,
  },
  tagCaract: {
    fontSize: 11, fontWeight: 700, color: '#3c3489',
    background: '#eeedfe', padding: '3px 9px', borderRadius: 20,
  },

  /* Botón pequeño */
  btnSm: {
    display: 'inline-flex', alignItems: 'center',
    background: TEAL, color: WHITE, border: 'none',
    borderRadius: 6, padding: '7px 12px',
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
  },

  /* Table footer */
  tableFooter: {
    padding: '12px 18px',
    borderTop: `1px solid ${BORDER}`,
    textAlign: 'right',
  },
  tableFooterText: { fontSize: 13, color: INK_SOFT },
};

export default VerInscritos;