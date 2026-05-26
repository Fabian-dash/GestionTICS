import React, { useState, useEffect } from 'react';
import api from '../services/api';

const LinksInscripcion = () => {
  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUsuario(user);
    cargarMisOfertas();
  }, []);

  const cargarMisOfertas = async () => {
    try {
      const response = await api.get('/ofertas/mis-ofertas');
      setOfertas(response.data.data || []);
    } catch (error) {
      console.error('Error cargando mis ofertas:', error);
    } finally {
      setLoading(false);
    }
  };

  const copiarLink = (link) => {
    const urlCompleta = `http://localhost:3000${link}`;
    navigator.clipboard.writeText(urlCompleta);
    setCopiado(link);
    setTimeout(() => setCopiado(null), 2000);
  };

  const abrirLink = (link) => {
    window.open(`http://localhost:3000${link}`, '_blank');
  };

  const descargarPDF = async (ofertaId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/ofertas/${ofertaId}/pdf`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` }
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ficha-${ofertaId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error descargando PDF:', error);
      alert('Error al descargar el PDF');
    }
  };

  const getCuposColor = (disponibles, maximo) => {
    const ratio = disponibles / maximo;
    if (ratio > 0.5) return '#10b981';
    if (ratio > 0.2) return '#f59e0b';
    return '#ef4444';
  };

  if (loading) {
    return (
      <>
        <style>{globalStyles}</style>
        <div style={styles.loadingWrapper}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Cargando ofertas...</p>
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
            <div style={styles.headerIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </div>
            <div>
              <h1 style={styles.title}>Links de Inscripción</h1>
              <p style={styles.subtitle}>Gestiona y comparte tus ofertas de formación</p>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        {ofertas.length > 0 && (
          <div style={styles.statsBar}>
            <div style={styles.statItem}>
              <span style={styles.statNumber}>{ofertas.length}</span>
              <span style={styles.statLabel}>Ofertas activas</span>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statItem}>
              <span style={styles.statNumber}>
                {ofertas.reduce((acc, o) => acc + (o.cupos_disponibles || 0), 0)}
              </span>
              <span style={styles.statLabel}>Cupos disponibles</span>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statItem}>
              <span style={styles.statNumber}>
                {ofertas.reduce((acc, o) => acc + (o.cupo_maximo || 0), 0)}
              </span>
              <span style={styles.statLabel}>Cupos totales</span>
            </div>
          </div>
        )}

        {/* Empty state */}
        {ofertas.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <path d="M8 21h8M12 17v4"/>
              </svg>
            </div>
            <h3 style={styles.emptyTitle}>Sin ofertas aún</h3>
            <p style={styles.emptyText}>Ve a "Crear Oferta" para empezar a compartir tus programas de formación.</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {ofertas.map((oferta) => {
              const isHovered = hoveredCard === oferta._id;
              const cuposColor = getCuposColor(oferta.cupos_disponibles, oferta.cupo_maximo);
              const cuposPct = Math.round((oferta.cupos_disponibles / oferta.cupo_maximo) * 100);

              return (
                <div
                  key={oferta._id}
                  style={{
                    ...styles.card,
                    ...(isHovered ? styles.cardHovered : {})
                  }}
                  onMouseEnter={() => setHoveredCard(oferta._id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Card top accent */}
                  <div style={styles.cardAccent} />

                  {/* Card header */}
                  <div style={styles.cardHeader}>
                    <div style={styles.cardTitleRow}>
                      <h3 style={styles.cardTitle}>
                        {oferta.programa_formacion?.nombre_programa || 'Programa sin nombre'}
                      </h3>
                      {oferta.programa_formacion?.codigo && (
                        <span style={styles.codigoBadge}>
                          {oferta.programa_formacion.codigo}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cupos progress */}
                  <div style={styles.cuposSection}>
                    <div style={styles.cuposHeader}>
                      <span style={styles.cuposLabel}>Cupos disponibles</span>
                      <span style={{ ...styles.cuposValue, color: cuposColor }}>
                        {oferta.cupos_disponibles} / {oferta.cupo_maximo}
                      </span>
                    </div>
                    <div style={styles.progressTrack}>
                      <div style={{
                        ...styles.progressBar,
                        width: `${cuposPct}%`,
                        backgroundColor: cuposColor
                      }} />
                    </div>
                  </div>

                  {/* Info rows */}
                  <div style={styles.infoGrid}>
                    <InfoRow
                      icon={<CalendarIcon />}
                      label="Fechas"
                      value={`${new Date(oferta.fechas?.inicio).toLocaleDateString('es-CO', { day:'2-digit', month:'short' })} — ${new Date(oferta.fechas?.fin).toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' })}`}
                    />
                    <InfoRow
                      icon={<LocationIcon />}
                      label="Ubicación"
                      value={oferta.ubicacion?.municipio?.nombre || 'N/A'}
                    />
                    <InfoRow
                      icon={<PersonIcon />}
                      label="Coordinador"
                      value={oferta.coordinador_asignado?.nombre || 'N/A'}
                    />
                  </div>

                  {/* Link box */}
                  <div style={styles.linkSection}>
                    <div style={styles.linkBox}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                        <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                      </svg>
                      <span style={styles.linkText}>
                        {`localhost:3000${oferta.link_inscripciones || '/inscribirse/error'}`}
                      </span>
                    </div>

                    {/* Actions */}
                    <div style={styles.actions}>
                      <button
                        onClick={() => copiarLink(oferta.link_inscripciones)}
                        style={{
                          ...styles.btn,
                          ...styles.btnPrimary,
                          ...(copiado === oferta.link_inscripciones ? styles.btnCopied : {})
                        }}
                        className="btn-hover"
                      >
                        {copiado === oferta.link_inscripciones ? (
                          <><CheckIcon /> Copiado</>
                        ) : (
                          <><CopyIcon /> Copiar</>
                        )}
                      </button>

                      <button
                        onClick={() => abrirLink(oferta.link_inscripciones)}
                        style={{ ...styles.btn, ...styles.btnSecondary }}
                        className="btn-hover"
                      >
                        <ExternalIcon /> Abrir
                      </button>

                      <button
                        onClick={() => descargarPDF(oferta._id)}
                        style={{ ...styles.btn, ...styles.btnOutline }}
                        className="btn-hover"
                        title="Descargar ficha de caracterización"
                      >
                        <PdfIcon />
                      </button>
                    </div>
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

/* ── Small helper components ── */
const InfoRow = ({ icon, label, value }) => (
  <div style={styles.infoRow}>
    <span style={styles.infoIcon}>{icon}</span>
    <div style={styles.infoContent}>
      <span style={styles.infoLabel}>{label}</span>
      <span style={styles.infoValue}>{value}</span>
    </div>
  </div>
);

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const LocationIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const PersonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const CopyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const ExternalIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);
const PdfIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
);

/* ── Global styles (keyframes, hover) ── */
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');

  * { box-sizing: border-box; }

  .btn-hover { transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease; }
  .btn-hover:hover { transform: translateY(-1px); opacity: 0.92; }
  .btn-hover:active { transform: translateY(0); }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
`;

/* ── Styles object ── */
const styles = {
  page: {
    padding: '32px 28px',
    maxWidth: '1280px',
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
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  headerIcon: {
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(16,184,129,0.35)',
  },
  title: {
    margin: 0,
    fontSize: '22px',
    fontWeight: '700',
    letterSpacing: '-0.3px',
    color: '#0f172a',
  },
  subtitle: {
    margin: '2px 0 0',
    fontSize: '13px',
    color: '#64748b',
    fontWeight: '400',
  },
  userBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '50px',
    padding: '6px 14px 6px 6px',
  },
  userAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #10b981, #047857)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '700',
  },
  userName: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#334155',
  },

  /* Stats bar */
  statsBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '0',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '14px 24px',
    marginBottom: '28px',
    width: 'fit-content',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0 24px',
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#047857',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '11px',
    color: '#94a3b8',
    marginTop: '4px',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  statDivider: {
    width: '1px',
    height: '32px',
    background: '#e2e8f0',
  },

  /* Grid */
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: '20px',
  },

  /* Card */
  card: {
    background: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    position: 'relative',
    transition: 'box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  cardHovered: {
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    transform: 'translateY(-2px)',
    borderColor: '#bfdbfe',
  },
  cardAccent: {
    height: '4px',
    background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
  },
  cardHeader: {
    padding: '16px 18px 12px',
  },
  cardTitleRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '10px',
  },
  cardTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: '1.4',
    flex: 1,
  },
  codigoBadge: {
    background: '#ecfdf5',
    color: '#047857',
    fontSize: '11px',
    fontWeight: '600',
    padding: '3px 8px',
    borderRadius: '6px',
    whiteSpace: 'nowrap',
    border: '1px solid #d1fae5',
    fontFamily: "'DM Mono', monospace",
    letterSpacing: '0.3px',
    flexShrink: 0,
  },

  /* Cupos */
  cuposSection: {
    padding: '0 18px 14px',
  },
  cuposHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  cuposLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '500',
  },
  cuposValue: {
    fontSize: '13px',
    fontWeight: '700',
    fontFamily: "'DM Mono', monospace",
  },
  progressTrack: {
    height: '5px',
    background: '#f1f5f9',
    borderRadius: '99px',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: '99px',
    transition: 'width 0.6s ease',
  },

  /* Info rows */
  infoGrid: {
    padding: '4px 18px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    borderBottom: '1px solid #f1f5f9',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
  },
  infoIcon: {
    color: '#94a3b8',
    flexShrink: 0,
    marginTop: '1px',
  },
  infoContent: {
    display: 'flex',
    gap: '6px',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  infoLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: '13px',
    color: '#334155',
    fontWeight: '500',
  },

  /* Link */
  linkSection: {
    padding: '14px 18px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  linkBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '7px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '9px 12px',
  },
  linkText: {
    fontSize: '12px',
    color: '#475569',
    fontFamily: "'DM Mono', monospace",
    wordBreak: 'break-all',
    lineHeight: '1.5',
  },

  /* Buttons */
  actions: {
    display: 'flex',
    gap: '8px',
  },
  btn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    fontFamily: "'DM Sans', sans-serif",
    whiteSpace: 'nowrap',
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    color: 'white',
    flex: 1,
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(16,184,129,0.3)',
  },
  btnCopied: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
  },
  btnSecondary: {
    background: '#f1f5f9',
    color: '#334155',
    flex: 1,
    justifyContent: 'center',
    border: '1px solid #e2e8f0',
  },
  btnOutline: {
    background: 'transparent',
    color: '#64748b',
    border: '1px solid #e2e8f0',
    padding: '8px 10px',
  },

  /* Empty */
  emptyState: {
    textAlign: 'center',
    padding: '64px 32px',
    background: '#f8fafc',
    borderRadius: '16px',
    border: '1px dashed #cbd5e1',
  },
  emptyIcon: {
    marginBottom: '16px',
    opacity: 0.6,
  },
  emptyTitle: {
    margin: '0 0 8px',
    fontSize: '18px',
    fontWeight: '600',
    color: '#334155',
  },
  emptyText: {
    margin: 0,
    fontSize: '14px',
    color: '#94a3b8',
    maxWidth: '300px',
    marginInline: 'auto',
    lineHeight: '1.6',
  },

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
    border: '3px solid #e2e8f0',
    borderTop: '3px solid #10b981',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: '14px',
    fontWeight: '500',
    margin: 0,
  },
};

export default LinksInscripcion;