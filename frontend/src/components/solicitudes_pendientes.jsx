import React, { useState, useEffect } from 'react';
import api from '../services/api';
import RevisarSolicitud from './revisar_solicitud';

// ===== TOKENS DE DISEÑO =====
const T = {
  primary: '#0f6e56',
  primaryDark: '#0a3d2e',
  primaryLight: '#e6f7f2',
  primaryGlow: 'rgba(15, 110, 86, 0.12)',
  secondary: '#2563eb',
  ink: '#0f172a',
  inkLight: '#334155',
  muted: '#64748b',
  border: '#e2e8f0',
  bg: '#f8fafc',
  white: '#ffffff',
  success: '#10b981',
  warning: '#f59e0b',
  warningBg: '#fffbeb',
  error: '#ef4444',
  errorBg: '#fef2f2',
  errorBorder: '#fecaca',
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    full: '9999px',
  },
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
    md: '0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.01)',
    glow: '0 0 0 3px rgba(15, 110, 86, 0.12)',
  },
};

const SolicitudesPendientes = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [eliminando, setEliminando] = useState(null);
  const [confirmEliminar, setConfirmEliminar] = useState(null); // id a confirmar

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/solicitudes/pendientes');

      if (response?.data?.success === false) {
        setError(response?.data?.message || 'Error del servidor');
        setSolicitudes([]);
        return;
      }

      const data = response?.data?.data ?? response?.data ?? [];
      setSolicitudes(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Sin conexión';
      setError(`Error ${err?.response?.status ?? 'de red'}: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    try {
      setEliminando(id);
      await api.delete(`/solicitudes/${id}`);
      setSolicitudes(prev => prev.filter(s => s._id !== id));
      setConfirmEliminar(null);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Error al eliminar';
      setError(`No se pudo eliminar: ${msg}`);
    } finally {
      setEliminando(null);
    }
  };

  const handleSolicitudActualizada = () => {
    setSolicitudSeleccionada(null);
    cargarSolicitudes();
  };

  const fmt = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—';

  const getNombre = (s) =>
    [s?.instructor_id?.nombre, s?.instructor_id?.apellido].filter(Boolean).join(' ') || '—';

  return (
    <div style={styles.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }

        .sol-btn { transition: all 0.2s ease; }
        .sol-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(15, 110, 86, 0.3); }
        .sol-btn:active { transform: translateY(1px); }

        .sol-row { transition: background 0.2s ease, transform 0.1s ease; }
        .sol-row:hover { background: ${T.primaryLight} !important; }

        .del-btn { transition: all 0.18s ease; }
        .del-btn:hover { background: #fef2f2 !important; border-color: #fca5a5 !important; color: #dc2626 !important; transform: translateY(-1px); }
        .del-btn:active { transform: scale(0.96); }

        .refresh-btn { transition: all 0.2s ease; }
        .refresh-btn:hover { background: ${T.primaryLight}; border-color: ${T.primary}; color: ${T.primaryDark}; }
        .refresh-btn:active { transform: scale(0.96); }

        .confirm-overlay { animation: scaleIn 0.18s ease; }
      `}</style>

      {/* ── HEADER ── */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.headerLeft}>
            <span style={styles.badge}>COORDINADOR</span>
            <h1 style={styles.title}>Solicitudes de Validación</h1>
            <p style={styles.subtitle}>Revisa y gestiona las solicitudes enviadas por los instructores</p>
          </div>
          {solicitudes.length > 0 && (
            <div style={styles.counterBubble}>
              <span style={styles.counterNum}>{solicitudes.length}</span>
              <span style={styles.counterLabel}>pendiente{solicitudes.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </header>

      {/* ── BODY ── */}
      <main style={styles.body}>
        {error && (
          <div style={styles.alert}>
            <span style={styles.alertDot} />
            <span style={{ flex: 1 }}>{error}</span>
            <button onClick={() => setError('')} style={{ ...styles.retryBtn, marginLeft: 8 }}>✕</button>
            <button onClick={cargarSolicitudes} style={styles.retryBtn}>Reintentar</button>
          </div>
        )}

        {loading && (
          <div style={styles.loadingWrap}>
            <div style={styles.spinner} />
            <span style={styles.loadingTxt}>Cargando solicitudes...</span>
          </div>
        )}

        {!loading && !error && solicitudes.length === 0 && (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <p style={styles.emptyTitle}>Sin solicitudes pendientes</p>
            <p style={styles.emptyDesc}>Los instructores aún no han enviado solicitudes de validación</p>
          </div>
        )}

        {/* ── TABLA ── */}
        {!loading && solicitudes.length > 0 && (
          <div style={styles.tableWrap}>
            <div style={styles.tableHeader}>
              <span style={styles.tableTitle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Solicitudes recientes
              </span>
              <button onClick={cargarSolicitudes} style={styles.refreshBtn} className="refresh-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"/>
                  <polyline points="1 20 1 14 7 14"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
                Actualizar
              </button>
            </div>

            {/* Cabecera columnas */}
            <div style={styles.colHead}>
              <span style={{ ...styles.col, flex: '0 0 100px' }}>Código</span>
              <span style={{ ...styles.col, flex: 1 }}>Programa</span>
              <span style={{ ...styles.col, flex: '0 0 180px' }}>Instructor</span>
              <span style={{ ...styles.col, flex: '0 0 110px' }}>Fecha</span>
              <span style={{ ...styles.col, flex: '0 0 200px', textAlign: 'right' }}>Acciones</span>
            </div>

            <div style={styles.rowsWrap}>
              {solicitudes.map((sol, i) => (
                <div
                  key={sol._id}
                  className="sol-row"
                  style={{
                    ...styles.row,
                    animation: 'fadeUp 0.3s ease both',
                    animationDelay: `${i * 0.04}s`,
                    position: 'relative',
                  }}
                >
                  {/* Código — solo el código, sin badge */}
                  <div style={{ ...styles.cell, flex: '0 0 100px' }}>
                    <span style={styles.mono}>{sol.oferta_id?.programa_formacion?.codigo ?? '—'}</span>
                  </div>

                  {/* Programa — nombre + badge Pendiente + mensaje preview */}
                  <div style={{ ...styles.cell, flex: 1, flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                      <span style={styles.progNombre}>{sol.oferta_id?.programa_formacion?.nombre_programa ?? 'Sin nombre'}</span>
                      <span style={{ ...styles.badgePend, flexShrink: 0 }}>Pendiente</span>
                    </div>
                    {sol.mensaje && (
                      <span style={styles.msgPreview}>"{sol.mensaje.length > 60 ? sol.mensaje.slice(0, 60) + '…' : sol.mensaje}"</span>
                    )}
                  </div>

                  {/* Instructor */}
                  <div style={{ ...styles.cell, flex: '0 0 180px', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                    <span style={styles.instrNombre}>{getNombre(sol)}</span>
                    <span style={styles.instrCorreo}>{sol.instructor_id?.correoElectronico ?? '—'}</span>
                  </div>

                  {/* Fecha */}
                  <div style={{ ...styles.cell, flex: '0 0 110px' }}>
                    <span style={styles.fecha}>{fmt(sol.fecha_solicitud)}</span>
                  </div>

                  {/* Acciones: Revisar + Eliminar */}
                  <div style={{ ...styles.cell, flex: '0 0 200px', justifyContent: 'flex-end', gap: 8 }}>
                    <button
                      className="sol-btn"
                      onClick={() => setSolicitudSeleccionada(sol._id)}
                      style={styles.reviewBtn}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      Revisar
                    </button>

                    <button
                      className="del-btn"
                      onClick={() => setConfirmEliminar(sol._id)}
                      disabled={eliminando === sol._id}
                      style={styles.deleteBtn}
                      title="Eliminar solicitud"
                    >
                      {eliminando === sol._id ? (
                        <span style={styles.delSpinner} />
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.tableFoot}>
              {solicitudes.length} solicitud{solicitudes.length !== 1 ? 'es' : ''} pendiente{solicitudes.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </main>

      {/* ── MODAL REVISAR ── */}
      {solicitudSeleccionada && (
        <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && setSolicitudSeleccionada(null)}>
          <div style={styles.modal}>
            <RevisarSolicitud
              solicitudId={solicitudSeleccionada}
              onClose={() => setSolicitudSeleccionada(null)}
              onActualizar={handleSolicitudActualizada}
            />
          </div>
        </div>
      )}

      {/* ── MODAL CONFIRMAR ELIMINAR ── */}
      {confirmEliminar && (
        <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && setConfirmEliminar(null)}>
          <div style={styles.confirmBox} className="confirm-overlay">
            <div style={styles.confirmIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </div>
            <h3 style={styles.confirmTitle}>¿Eliminar solicitud?</h3>
            <p style={styles.confirmDesc}>
              Esta acción no se puede deshacer. La solicitud y sus documentos asociados serán eliminados permanentemente.
            </p>
            <div style={styles.confirmBtns}>
              <button
                onClick={() => setConfirmEliminar(null)}
                style={styles.confirmCancel}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleEliminar(confirmEliminar)}
                disabled={eliminando === confirmEliminar}
                style={styles.confirmDelete}
              >
                {eliminando === confirmEliminar ? (
                  <>
                    <span style={{ ...styles.delSpinner, borderTopColor: 'white', marginRight: 8 }} />
                    Eliminando...
                  </>
                ) : (
                  'Sí, eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  root: {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    background: T.bg,
    minHeight: '100vh',
  },

  header: {
    background: 'linear-gradient(135deg, #0b2b23 0%, #0f3b30 100%)',
    borderBottom: `3px solid ${T.primary}`,
    padding: '40px 32px',
    boxShadow: T.shadow.lg,
  },
  headerInner: {
    maxWidth: 1200,
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 24,
    flexWrap: 'wrap',
  },
  headerLeft: { display: 'flex', flexDirection: 'column', gap: 10 },
  badge: {
    display: 'inline-block',
    background: T.primary,
    color: T.white,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.1em',
    padding: '5px 12px',
    borderRadius: T.radius.full,
    width: 'fit-content',
  },
  title: {
    color: T.white,
    fontSize: '1.9rem',
    fontWeight: 700,
    margin: 0,
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
  },
  subtitle: { color: '#9bb9b0', fontSize: 14, margin: 0, lineHeight: 1.5 },
  counterBubble: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.12)',
    backdropFilter: 'blur(8px)',
    borderRadius: T.radius.lg,
    padding: '12px 24px',
    minWidth: 85,
    flexShrink: 0,
    border: '1px solid rgba(255,255,255,0.2)',
  },
  counterNum: { color: T.white, fontSize: 32, fontWeight: 800, lineHeight: 1 },
  counterLabel: { color: '#c7e3db', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', marginTop: 4 },

  body: { maxWidth: 1200, margin: '0 auto', padding: '32px 24px 56px' },

  alert: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: T.errorBg,
    color: T.error,
    border: `1px solid ${T.errorBorder}`,
    borderRadius: T.radius.md,
    padding: '14px 20px',
    fontSize: 14,
    marginBottom: 24,
  },
  alertDot: { width: 8, height: 8, borderRadius: '50%', background: T.error, flexShrink: 0 },
  retryBtn: {
    background: 'transparent',
    border: `1px solid ${T.error}`,
    color: T.error,
    borderRadius: T.radius.sm,
    padding: '5px 14px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  loadingWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '80px 20px' },
  spinner: {
    width: 36,
    height: 36,
    border: `3px solid ${T.border}`,
    borderTopColor: T.primary,
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  loadingTxt: { fontSize: 14, color: T.muted, fontWeight: 500 },

  empty: {
    textAlign: 'center',
    padding: '70px 20px',
    background: T.white,
    borderRadius: T.radius.xl,
    border: `1px dashed ${T.border}`,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: T.radius.full,
    background: T.primaryLight,
    color: T.primary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 18px',
  },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: T.ink, margin: '0 0 8px' },
  emptyDesc: { fontSize: 14, color: T.muted, margin: 0 },

  tableWrap: {
    background: T.white,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.xl,
    overflow: 'hidden',
    boxShadow: T.shadow.md,
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: `1px solid ${T.border}`,
    background: '#fefefe',
  },
  tableTitle: { display: 'flex', alignItems: 'center', fontSize: 14, fontWeight: 700, color: T.ink },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'transparent',
    border: `1px solid ${T.border}`,
    color: T.muted,
    borderRadius: T.radius.md,
    padding: '6px 14px',
    fontSize: 12.5,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  colHead: {
    display: 'flex',
    padding: '12px 24px',
    background: T.bg,
    borderBottom: `1px solid ${T.border}`,
  },
  col: { fontSize: 11.5, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' },
  rowsWrap: { display: 'flex', flexDirection: 'column' },
  row: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: `1px solid ${T.border}`,
  },
  cell: { display: 'flex', alignItems: 'center', paddingRight: 16, minWidth: 0 },

  mono: {
    fontFamily: "'Inter', monospace",
    fontSize: 12.5,
    fontWeight: 600,
    color: T.inkLight,
    marginRight: 10,
    whiteSpace: 'nowrap',
  },
  badgePend: {
    fontSize: 10.5,
    fontWeight: 700,
    color: T.warning,
    background: T.warningBg,
    padding: '3px 10px',
    borderRadius: T.radius.full,
    whiteSpace: 'nowrap',
    border: '1px solid #fde68a',
  },
  progNombre: {
    fontSize: 14,
    fontWeight: 600,
    color: T.ink,
    lineHeight: 1.4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
  },
  msgPreview: {
    fontSize: 12,
    color: T.muted,
    fontStyle: 'italic',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
  },
  instrNombre: { fontSize: 13.5, fontWeight: 600, color: T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  instrCorreo: { fontSize: 11.5, color: T.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  fecha: { fontSize: 12.5, color: T.muted, whiteSpace: 'nowrap' },

  reviewBtn: {
    display: 'flex',
    alignItems: 'center',
    background: T.primary,
    color: T.white,
    border: 'none',
    borderRadius: T.radius.md,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
  deleteBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: T.white,
    color: T.muted,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.md,
    padding: '8px 10px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    flexShrink: 0,
  },
  delSpinner: {
    width: 14,
    height: 14,
    border: '2px solid #e2e8f0',
    borderTopColor: T.error,
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.7s linear infinite',
  },

  tableFoot: {
    padding: '12px 24px',
    fontSize: 12.5,
    color: T.muted,
    background: T.bg,
    borderTop: `1px solid ${T.border}`,
    fontWeight: 500,
  },

  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(10, 20, 16, 0.7)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    maxWidth: 960,
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    borderRadius: T.radius.xl,
    boxShadow: T.shadow.xl,
    animation: 'fadeUp 0.25s ease',
  },

  // Confirm delete dialog
  confirmBox: {
    background: T.white,
    borderRadius: T.radius.xl,
    padding: '36px 32px',
    maxWidth: 420,
    width: '100%',
    textAlign: 'center',
    boxShadow: T.shadow.xl,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  confirmIcon: {
    width: 64,
    height: 64,
    borderRadius: T.radius.full,
    background: '#fef2f2',
    border: '2px solid #fecaca',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmTitle: { fontSize: 18, fontWeight: 700, color: T.ink, margin: 0 },
  confirmDesc: { fontSize: 14, color: T.muted, lineHeight: 1.6, margin: 0 },
  confirmBtns: { display: 'flex', gap: 12, marginTop: 8, width: '100%' },
  confirmCancel: {
    flex: 1,
    padding: '11px 0',
    background: T.bg,
    color: T.inkLight,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.md,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  confirmDelete: {
    flex: 1,
    padding: '11px 0',
    background: 'linear-gradient(135deg, #f87171, #dc2626)',
    color: T.white,
    border: 'none',
    borderRadius: T.radius.md,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 10px rgba(220,38,38,0.3)',
  },
};

export default SolicitudesPendientes;