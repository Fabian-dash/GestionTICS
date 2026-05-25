import React, { useState, useEffect } from 'react';
import api from '../services/api';
import RevisarSolicitud from './revisar_solicitud';

const SolicitudesPendientes = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);

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
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .sol-btn { transition: background 0.15s, transform 0.1s; }
        .sol-btn:hover { background: #0d5e49 !important; }
        .sol-btn:active { transform: scale(0.97); }
        .sol-row { transition: background 0.12s; }
        .sol-row:hover { background: #f0faf6 !important; }
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

        {/* Error */}
        {error && (
          <div style={styles.alert}>
            <span style={styles.alertDot} />
            {error}
            <button onClick={cargarSolicitudes} style={styles.retryBtn}>Reintentar</button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={styles.loadingWrap}>
            <div style={styles.spinner} />
            <span style={styles.loadingTxt}>Cargando solicitudes...</span>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && solicitudes.length === 0 && (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
              <span style={styles.tableTitle}>Solicitudes recientes</span>
              <button onClick={cargarSolicitudes} style={styles.refreshBtn}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
                Actualizar
              </button>
            </div>

            <div style={styles.colHead}>
              <span style={{ ...styles.col, flex: '0 0 110px' }}>Código</span>
              <span style={{ ...styles.col, flex: 1 }}>Programa</span>
              <span style={{ ...styles.col, flex: '0 0 180px' }}>Instructor</span>
              <span style={{ ...styles.col, flex: '0 0 110px' }}>Fecha</span>
              <span style={{ ...styles.col, flex: '0 0 150px', textAlign: 'right' }}>Acción</span>
            </div>

            <div style={styles.rowsWrap}>
              {solicitudes.map((sol, i) => (
                <div
                  key={sol._id}
                  className="sol-row"
                  style={{ ...styles.row, background: i % 2 === 0 ? '#fff' : '#fafcfb', animation: 'fadeUp 0.3s ease both', animationDelay: `${i * 0.04}s` }}
                >
                  <div style={{ ...styles.cell, flex: '0 0 110px' }}>
                    <span style={styles.mono}>{sol.oferta_id?.programa_formacion?.codigo ?? '—'}</span>
                    <span style={styles.badgePend}>Pendiente</span>
                  </div>
                  <div style={{ ...styles.cell, flex: 1, flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                    <span style={styles.progNombre}>{sol.oferta_id?.programa_formacion?.nombre_programa ?? 'Sin nombre'}</span>
                    {sol.mensaje && (
                      <span style={styles.msgPreview}>"{sol.mensaje.length > 60 ? sol.mensaje.slice(0, 60) + '…' : sol.mensaje}"</span>
                    )}
                  </div>
                  <div style={{ ...styles.cell, flex: '0 0 180px', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                    <span style={styles.instrNombre}>{getNombre(sol)}</span>
                    <span style={styles.instrCorreo}>{sol.instructor_id?.correoElectronico ?? '—'}</span>
                  </div>
                  <div style={{ ...styles.cell, flex: '0 0 110px' }}>
                    <span style={styles.fecha}>{fmt(sol.fecha_solicitud)}</span>
                  </div>
                  <div style={{ ...styles.cell, flex: '0 0 150px', justifyContent: 'flex-end' }}>
                    <button className="sol-btn" onClick={() => setSolicitudSeleccionada(sol._id)} style={styles.reviewBtn}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                      Revisar
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

      {/* ── MODAL ── */}
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
    </div>
  );
};

/* ─── Tokens ─────────────────────────────────────────────────── */
const G      = '#0f6e56';
const G_LITE = '#e6f7f2';
const INK    = '#111827';
const MUTED  = '#6b7280';
const BORDER = '#e5e7eb';
const BG     = '#f4f6f5';
const WHITE  = '#ffffff';
const AMBER  = { bg: '#fef3c7', txt: '#92400e' };
const RED    = { bg: '#fef2f2', txt: '#991b1b', border: '#fecaca' };

const styles = {
  root: { fontFamily: "'Sora','Segoe UI',sans-serif", background: BG, minHeight: '100vh' },

  header: { background: '#0d1f1a', borderBottom: `3px solid ${G}`, padding: '36px 32px 32px' },
  headerInner: { maxWidth: 1120, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20 },
  headerLeft: { display: 'flex', flexDirection: 'column', gap: 8 },
  badge: { display: 'inline-block', background: G, color: WHITE, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', padding: '4px 10px', borderRadius: 3, width: 'fit-content' },
  title: { color: WHITE, fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: '-0.4px' },
  subtitle: { color: '#7a9e94', fontSize: 13.5, margin: 0, lineHeight: 1.5 },
  counterBubble: { display: 'flex', flexDirection: 'column', alignItems: 'center', background: G, borderRadius: 10, padding: '12px 20px', minWidth: 70, flexShrink: 0 },
  counterNum: { color: WHITE, fontSize: 28, fontWeight: 700, lineHeight: 1 },
  counterLabel: { color: '#a7ddd0', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', marginTop: 2 },

  body: { maxWidth: 1120, margin: '0 auto', padding: '28px 24px 56px' },

  alert: { display: 'flex', alignItems: 'center', gap: 10, background: RED.bg, color: RED.txt, border: `1px solid ${RED.border}`, borderRadius: 8, padding: '12px 16px', fontSize: 13.5, marginBottom: 20 },
  alertDot: { width: 8, height: 8, borderRadius: '50%', background: RED.txt, flexShrink: 0 },
  retryBtn: { marginLeft: 'auto', background: 'transparent', border: `1px solid ${RED.txt}`, color: RED.txt, borderRadius: 5, padding: '4px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 },

  loadingWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '80px 20px' },
  spinner: { width: 30, height: 30, border: `3px solid ${BORDER}`, borderTopColor: G, borderRadius: '50%', animation: 'spin 0.7s linear infinite' },
  loadingTxt: { fontSize: 13.5, color: MUTED },

  empty: { textAlign: 'center', padding: '64px 20px', background: WHITE, borderRadius: 12, border: `1.5px dashed ${BORDER}` },
  emptyIcon: { width: 60, height: 60, borderRadius: '50%', background: G_LITE, color: G, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' },
  emptyTitle: { fontSize: 16, fontWeight: 600, color: INK, margin: '0 0 6px' },
  emptyDesc: { fontSize: 13.5, color: MUTED, margin: 0 },

  tableWrap: { background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' },
  tableHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: `1px solid ${BORDER}`, background: '#fafafa' },
  tableTitle: { fontSize: 13.5, fontWeight: 700, color: INK },
  refreshBtn: { display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 },
  colHead: { display: 'flex', padding: '9px 20px', background: '#f3f4f6', borderBottom: `1px solid ${BORDER}` },
  col: { fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em' },
  rowsWrap: { display: 'flex', flexDirection: 'column' },
  row: { display: 'flex', alignItems: 'center', padding: '13px 20px', borderBottom: `1px solid ${BORDER}`, gap: 0 },
  cell: { display: 'flex', alignItems: 'center', paddingRight: 12, minWidth: 0 },
  mono: { fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, fontWeight: 500, color: INK, marginRight: 8, whiteSpace: 'nowrap' },
  badgePend: { fontSize: 10, fontWeight: 700, color: AMBER.txt, background: AMBER.bg, padding: '2px 7px', borderRadius: 20, whiteSpace: 'nowrap' },
  progNombre: { fontSize: 13.5, fontWeight: 600, color: INK, lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' },
  msgPreview: { fontSize: 12, color: MUTED, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' },
  instrNombre: { fontSize: 13, fontWeight: 600, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  instrCorreo: { fontSize: 12, color: G, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  fecha: { fontSize: 12.5, color: MUTED, whiteSpace: 'nowrap' },
  reviewBtn: { display: 'flex', alignItems: 'center', background: G, color: WHITE, border: 'none', borderRadius: 7, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  tableFoot: { padding: '10px 20px', fontSize: 12, color: MUTED, background: '#fafafa', borderTop: `1px solid ${BORDER}`, fontWeight: 500 },

  overlay: { position: 'fixed', inset: 0, background: 'rgba(10,20,16,0.65)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { maxWidth: 900, width: '90%', maxHeight: '90vh', overflowY: 'auto', borderRadius: 14, boxShadow: '0 28px 70px rgba(0,0,0,0.3)' },
};

export default SolicitudesPendientes;