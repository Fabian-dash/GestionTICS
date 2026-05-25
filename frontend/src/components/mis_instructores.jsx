import React, { useState, useEffect } from 'react';
import api from '../services/api';

const MisInstructores = () => {
  const [instructores, setInstructores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    cargarInstructores();
  }, []);

  const cargarInstructores = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const coordinadorId = user.id;
      const response = await api.get(`/usuarios/coordinador/${coordinadorId}/instructores`);
      setInstructores(response.data.data || []);
    } catch (error) {
      console.error('Error cargando instructores:', error);
      if (error.response?.status === 401) {
        setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
      } else {
        setError('Error al cargar la lista de instructores');
      }
    } finally {
      setLoading(false);
    }
  };

  const filtrados = instructores.filter((i) => {
    const q = search.toLowerCase();
    return (
      `${i.nombre} ${i.apellido}`.toLowerCase().includes(q) ||
      i.correoElectronico?.toLowerCase().includes(q) ||
      i.nombreUsuario?.toLowerCase().includes(q)
    );
  });

  const getInitials = (nombre, apellido) =>
    `${nombre?.charAt(0) || ''}${apellido?.charAt(0) || ''}`.toUpperCase();

  const avatarColors = [
    'linear-gradient(135deg,#10b981,#059669)',
    'linear-gradient(135deg,#3b82f6,#1d4ed8)',
    'linear-gradient(135deg,#8b5cf6,#6d28d9)',
    'linear-gradient(135deg,#f59e0b,#d97706)',
    'linear-gradient(135deg,#06b6d4,#0891b2)',
  ];

  if (loading) {
    return (
      <>
        <style>{globalStyles}</style>
        <div style={styles.loadingWrapper}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Cargando instructores...</p>
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
              <PeopleIcon />
            </div>
            <div>
              <h1 style={styles.title}>Mis Instructores</h1>
              <p style={styles.subtitle}>Instructores asignados a tu coordinación</p>
            </div>
          </div>

          {instructores.length > 0 && (
            <div style={styles.countBadge}>
              <span style={styles.countNumber}>{instructores.length}</span>
              <span style={styles.countLabel}>asignados</span>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={styles.errorAlert}>
            <AlertIcon />
            <span>{error}</span>
          </div>
        )}

        {/* Empty */}
        {!error && instructores.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}><InboxIcon /></div>
            <h3 style={styles.emptyTitle}>Sin instructores asignados</h3>
            <p style={styles.emptyText}>
              Cuando los instructores te seleccionen como coordinador, aparecerán aquí.
            </p>
          </div>
        ) : (
          <>
            {/* Search */}
            {instructores.length > 2 && (
              <div style={styles.searchWrapper}>
                <span style={styles.searchIcon}><SearchIcon /></span>
                <input
                  type="text"
                  placeholder="Buscar por nombre, correo o usuario..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={styles.searchInput}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={styles.clearBtn}>
                    <CloseIcon />
                  </button>
                )}
              </div>
            )}

            {/* Results info */}
            {search && (
              <p style={styles.resultInfo}>
                {filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''} para "{search}"
              </p>
            )}

            {/* Grid */}
            <div style={styles.grid}>
              {filtrados.map((instructor, idx) => {
                const isHovered = hoveredCard === instructor._id;
                const color = avatarColors[idx % avatarColors.length];

                return (
                  <div
                    key={instructor._id}
                    style={{ ...styles.card, ...(isHovered ? styles.cardHovered : {}) }}
                    onMouseEnter={() => setHoveredCard(instructor._id)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <div style={{ ...styles.cardAccent, background: color }} />

                    {/* Card header */}
                    <div style={styles.cardHeader}>
                      <div
                        style={{ ...styles.avatar, background: color }}
                      >
                        {getInitials(instructor.nombre, instructor.apellido)}
                      </div>
                      <div style={styles.cardHeaderInfo}>
                        <h3 style={styles.cardName}>
                          {instructor.nombre} {instructor.apellido}
                        </h3>
                        <span style={styles.roleBadge}>Instructor</span>
                      </div>
                    </div>

                    {/* Card body */}
                    <div style={styles.cardBody}>
                      <InfoRow icon={<EmailIcon />} label="Email" value={instructor.correoElectronico} />
                      <InfoRow icon={<PhoneIcon />} label="Teléfono" value={instructor.telefono} />
                      <InfoRow icon={<UserIcon />} label="Usuario" value={instructor.nombreUsuario} mono />
                      <InfoRow icon={<IdIcon />} label="Documento" value={instructor.numeroIdentificacion} mono />
                      <InfoRow
                        icon={<CalendarIcon />}
                        label="Registro"
                        value={new Date(instructor.createdAt).toLocaleDateString('es-CO', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      />
                    </div>

                    {/* Card footer */}
                    <div style={styles.cardFooter}>
                      <button
                        onClick={() => window.location.href = `/dashboard?instructor=${instructor._id}`}
                        style={{
                          ...styles.verBtn,
                          background: isHovered
                            ? 'linear-gradient(135deg,#10b981,#059669)'
                            : 'linear-gradient(135deg,#1e293b,#334155)',
                        }}
                        className="btn-hover"
                      >
                        <OfertasIcon />
                        Ver ofertas
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {filtrados.length === 0 && search && (
              <div style={styles.noResults}>
                <p>Sin resultados para "<strong>{search}</strong>"</p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

/* ── Helper components ── */
const InfoRow = ({ icon, label, value, mono }) => (
  <div style={styles.infoRow}>
    <span style={styles.infoIcon}>{icon}</span>
    <span style={styles.infoLabel}>{label}</span>
    <span style={{ ...styles.infoValue, ...(mono ? styles.monoValue : {}) }}>
      {value || '—'}
    </span>
  </div>
);

/* ── SVG Icons ── */
const PeopleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const EmailIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);
const PhoneIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.44 2 2 0 0 1 3.58 1.25h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.82-1.82a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const UserIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IdIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
  </svg>
);
const CalendarIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const OfertasIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const InboxIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
  </svg>
);

/* ── Global styles ── */
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');
  * { box-sizing: border-box; }
  .btn-hover { transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease; }
  .btn-hover:hover { transform: translateY(-1px); }
  .btn-hover:active { transform: translateY(0); }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

/* ── Styles ── */
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
    background: 'linear-gradient(135deg,#10b981 0%,#059669 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(16,185,129,0.35)',
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
  countBadge: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '50px',
    padding: '8px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  countNumber: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#059669',
    lineHeight: 1,
  },
  countLabel: {
    fontSize: '11px',
    color: '#6ee7b7',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },

  /* Search */
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px',
    maxWidth: '420px',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
  },
  searchInput: {
    width: '100%',
    padding: '10px 36px 10px 36px',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '13px',
    fontFamily: "'DM Sans', sans-serif",
    color: '#334155',
    outline: 'none',
    background: '#f8fafc',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  },
  clearBtn: {
    position: 'absolute',
    right: '10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    padding: '2px',
  },
  resultInfo: {
    fontSize: '13px',
    color: '#94a3b8',
    marginBottom: '16px',
    marginTop: '-8px',
  },

  /* Grid */
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '20px',
  },

  /* Card */
  card: {
    background: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    transition: 'box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  cardHovered: {
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    transform: 'translateY(-2px)',
    borderColor: '#a7f3d0',
  },
  cardAccent: {
    height: '4px',
  },
  cardHeader: {
    padding: '16px 18px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid #f1f5f9',
  },
  avatar: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '16px',
    fontWeight: '700',
    flexShrink: 0,
    letterSpacing: '0.5px',
  },
  cardHeaderInfo: {
    flex: 1,
    minWidth: 0,
  },
  cardName: {
    margin: '0 0 4px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#0f172a',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  roleBadge: {
    display: 'inline-block',
    background: '#f0fdf4',
    color: '#059669',
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '6px',
    border: '1px solid #bbf7d0',
    letterSpacing: '0.3px',
  },

  /* Body */
  cardBody: {
    padding: '12px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
  },
  infoIcon: {
    color: '#94a3b8',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    width: '16px',
  },
  infoLabel: {
    color: '#94a3b8',
    fontWeight: '500',
    width: '74px',
    flexShrink: 0,
    fontSize: '12px',
  },
  infoValue: {
    color: '#334155',
    fontWeight: '500',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  monoValue: {
    fontFamily: "'DM Mono', monospace",
    fontSize: '12px',
    color: '#475569',
  },

  /* Footer */
  cardFooter: {
    padding: '12px 18px 16px',
  },
  verBtn: {
    width: '100%',
    padding: '9px 14px',
    color: 'white',
    border: 'none',
    borderRadius: '9px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    fontFamily: "'DM Sans', sans-serif",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '7px',
    transition: 'background 0.2s ease, transform 0.15s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
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
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: '500',
  },

  /* Empty */
  emptyState: {
    textAlign: 'center',
    padding: '64px 32px',
    background: '#f8fafc',
    borderRadius: '16px',
    border: '1px dashed #cbd5e1',
  },
  emptyIcon: { marginBottom: '16px', opacity: 0.6 },
  emptyTitle: {
    margin: '0 0 8px',
    fontSize: '18px',
    fontWeight: '600',
    color: '#334155',
  },
  emptyText: {
    margin: '0 auto',
    fontSize: '14px',
    color: '#94a3b8',
    maxWidth: '300px',
    lineHeight: '1.6',
  },

  /* No results */
  noResults: {
    textAlign: 'center',
    padding: '32px',
    color: '#94a3b8',
    fontSize: '14px',
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

export default MisInstructores;