import React, { useState, useEffect } from 'react';
import api from '../services/api';

const OfertasRechazadas = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [expandido, setExpandido]     = useState(null);

  useEffect(() => { cargarRechazadas(); }, []);

  const cargarRechazadas = async () => {
    try {
      const response = await api.get('/solicitudes/mis-rechazadas');
      setSolicitudes(response.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandido = (id) => setExpandido(expandido === id ? null : id);

  if (loading) {
    return (
      <>
        <style>{globalStyles}</style>
        <div style={styles.loadingWrapper}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Cargando ofertas rechazadas...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{globalStyles}</style>
      <div style={styles.page}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.headerIcon}><RejectIcon /></div>
            <div>
              <h1 style={styles.title}>Ofertas Rechazadas</h1>
              <p style={styles.subtitle}>Revisa los motivos y corrige para reenviar</p>
            </div>
          </div>
          {solicitudes.length > 0 && (
            <div style={styles.countBadge}>
              <span style={styles.countNumber}>{solicitudes.length}</span>
              <span style={styles.countLabel}>rechazadas</span>
            </div>
          )}
        </div>

        {/* Empty */}
        {solicitudes.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}><CheckCircleIcon /></div>
            <h3 style={styles.emptyTitle}>¡Sin rechazos!</h3>
            <p style={styles.emptyText}>Ninguna de tus ofertas ha sido rechazada. Sigue así.</p>
          </div>
        ) : (
          <div style={styles.list}>
            {solicitudes.map((sol, idx) => {
              const isHovered  = hoveredCard === sol._id;
              const isExpanded = expandido   === sol._id;
              const programa   = sol.oferta_id?.programa_formacion?.nombre_programa || 'Programa sin nombre';
              const codigo     = sol.oferta_id?.programa_formacion?.codigo;
              const motivo     = sol.comentarios || 'Sin motivo especificado';
              const fecha      = sol.fecha_respuesta
                ? new Date(sol.fecha_respuesta).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
                : '—';

              return (
                <div
                  key={sol._id}
                  style={{ ...styles.card, ...(isHovered ? styles.cardHovered : {}) }}
                  onMouseEnter={() => setHoveredCard(sol._id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Left accent */}
                  <div style={styles.cardAccent} />

                  <div style={styles.cardInner}>
                    {/* Top row */}
                    <div style={styles.cardTop}>
                      <div style={styles.cardTopLeft}>
                        {/* Index badge */}
                        <div style={styles.indexBadge}>{String(idx + 1).padStart(2, '0')}</div>
                        <div>
                          <div style={styles.programaRow}>
                            <h3 style={styles.programaNombre}>{programa}</h3>
                            {codigo && <span style={styles.codigoPill}>{codigo}</span>}
                          </div>
                          <div style={styles.metaRow}>
                            <span style={styles.estadoBadge}>
                              <span style={styles.dot} />
                              Rechazada
                            </span>
                            <span style={styles.fecha}>
                              <CalendarIcon />
                              {fecha}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={styles.cardActions}>
                        <button
                          onClick={() => toggleExpandido(sol._id)}
                          style={styles.expandBtn}
                          className="btn-hover"
                          title={isExpanded ? 'Ocultar motivo' : 'Ver motivo'}
                        >
                          <ChevronIcon rotated={isExpanded} />
                          {isExpanded ? 'Ocultar' : 'Ver motivo'}
                        </button>
                        <button
                          onClick={() => alert(`Corregir oferta ${sol._id} — Próximamente`)}
                          style={styles.corregirBtn}
                          className="btn-hover"
                        >
                          <EditIcon />
                          Corregir y reenviar
                        </button>
                      </div>
                    </div>

                    {/* Motivo expandible */}
                    {isExpanded && (
                      <div style={styles.motivoBox}>
                        <div style={styles.motivoHeader}>
                          <AlertIcon />
                          <span style={styles.motivoLabel}>Motivo del rechazo</span>
                        </div>
                        <p style={styles.motivoTexto}>{motivo}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

/* ── Icons ── */
const RejectIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);
const CheckCircleIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#86efac" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const CalendarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const AlertIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const ChevronIcon = ({ rotated }) => (
  <svg
    width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: 'transform 0.2s ease', transform: rotated ? 'rotate(180deg)' : 'rotate(0deg)' }}
  >
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

/* ── Global styles ── */
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');
  * { box-sizing: border-box; }
  .btn-hover { transition: transform 0.15s ease, opacity 0.15s ease; }
  .btn-hover:hover { transform: translateY(-1px); opacity: 0.88; }
  .btn-hover:active { transform: translateY(0); }
  @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin   { to { transform: rotate(360deg); } }
  @keyframes slideDown { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
`;

/* ── Styles ── */
const styles = {
  page: {
    padding: '32px 28px',
    maxWidth: '1000px',
    margin: '0 auto',
    fontFamily: "'DM Sans', sans-serif",
    color: '#0f172a',
    animation: 'fadeUp 0.4s ease both',
  },

  /* Header */
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '28px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '14px' },
  headerIcon: {
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg,#f87171 0%,#dc2626 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(220,38,38,0.35)',
  },
  title: {
    margin: 0,
    fontSize: '22px',
    fontWeight: '700',
    letterSpacing: '-0.3px',
    color: '#0f172a',
  },
  subtitle: { margin: '2px 0 0', fontSize: '13px', color: '#64748b', fontWeight: '400' },
  countBadge: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '50px',
    padding: '8px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  countNumber: { fontSize: '22px', fontWeight: '700', color: '#dc2626', lineHeight: 1 },
  countLabel: {
    fontSize: '11px',
    color: '#fca5a5',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },

  /* List */
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },

  /* Card */
  card: {
    background: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    display: 'flex',
    transition: 'box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  cardHovered: {
    boxShadow: '0 6px 24px rgba(0,0,0,0.09)',
    transform: 'translateY(-2px)',
    borderColor: '#fecaca',
  },
  cardAccent: {
    width: '4px',
    flexShrink: 0,
    background: 'linear-gradient(180deg,#f87171 0%,#dc2626 100%)',
  },
  cardInner: { flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' },

  /* Top row */
  cardTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
  },
  cardTopLeft: { display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 },
  indexBadge: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    fontSize: '12px',
    fontWeight: '700',
    fontFamily: "'DM Mono', monospace",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  programaRow: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' },
  programaNombre: { margin: 0, fontSize: '15px', fontWeight: '600', color: '#0f172a' },
  codigoPill: {
    background: '#eff6ff',
    color: '#2563eb',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    padding: '2px 8px',
    fontSize: '11px',
    fontWeight: '600',
    fontFamily: "'DM Mono', monospace",
  },
  metaRow: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
  estadoBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    background: '#fef2f2',
    color: '#b91c1c',
    border: '1px solid #fecaca',
    borderRadius: '99px',
    padding: '2px 9px',
    fontSize: '11px',
    fontWeight: '600',
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#ef4444',
    display: 'inline-block',
    flexShrink: 0,
  },
  fecha: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '12px',
    color: '#94a3b8',
    fontFamily: "'DM Mono', monospace",
  },

  /* Actions */
  cardActions: { display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap' },
  expandBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '7px 12px',
    background: '#f8fafc',
    color: '#64748b',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    fontFamily: "'DM Sans', sans-serif",
  },
  corregirBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 14px',
    background: 'linear-gradient(135deg,#f87171 0%,#dc2626 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    fontFamily: "'DM Sans', sans-serif",
    boxShadow: '0 2px 8px rgba(220,38,38,0.28)',
  },

  /* Motivo */
  motivoBox: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    padding: '14px 16px',
    animation: 'slideDown 0.2s ease both',
  },
  motivoHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    marginBottom: '8px',
  },
  motivoLabel: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#b91c1c',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  motivoTexto: {
    margin: 0,
    fontSize: '13px',
    color: '#7f1d1d',
    lineHeight: '1.65',
  },

  /* Empty */
  emptyState: {
    textAlign: 'center',
    padding: '64px 32px',
    background: '#f0fdf4',
    borderRadius: '16px',
    border: '1px dashed #86efac',
  },
  emptyIcon: { marginBottom: '16px' },
  emptyTitle: { margin: '0 0 8px', fontSize: '18px', fontWeight: '600', color: '#15803d' },
  emptyText: { margin: '0 auto', fontSize: '14px', color: '#4ade80', maxWidth: '280px', lineHeight: '1.6' },

  /* Loading */
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
    border: '3px solid #fee2e2',
    borderTop: '3px solid #dc2626',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: { color: '#94a3b8', fontSize: '14px', fontWeight: '500', margin: 0 },
};

export default OfertasRechazadas;