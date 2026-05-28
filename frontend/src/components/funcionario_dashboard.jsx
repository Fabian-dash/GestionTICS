import React, { useState, useEffect } from 'react';
import api from '../services/api';

const FuncionarioDashboard = () => {
  const [vistaActiva, setVistaActiva] = useState('ofertas');
  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // ID de oferta en acción
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [descargando, setDescargando] = useState(null); // ID de oferta descargando
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const tipoFuncionario = user.tipo_funcionario || 'regular';

  useEffect(() => {
    cargarOfertasAprobadas();
  }, []);

  const cargarOfertasAprobadas = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/ofertas-funcionario/aprobadas/${tipoFuncionario}`);
      setOfertas(response.data.data || []);
    } catch (error) {
      console.error('Error cargando ofertas:', error);
      setError('Error al cargar las ofertas');
    } finally {
      setLoading(false);
    }
  };

  const descargarExcelCompleto = async (ofertaId) => {
    try {
      setDescargando(ofertaId);
      setError('');
      const response = await api.get(`/ofertas/${ofertaId}/exportar-excel`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const oferta = ofertas.find(o => o._id === ofertaId);
      const tipo = oferta?.es_campesena ? 'campesena' : 'regular';
      link.setAttribute(
        'download',
        `oferta_${tipo}_${oferta?.programa_formacion?.codigo || ofertaId}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSuccess('Excel descargado correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error descargando Excel:', error);
      setError(error.response?.data?.message || 'Error al descargar el Excel');
    } finally {
      setDescargando(null);
    }
  };

  // ── NUEVA FUNCIÓN: Tomar oferta ──
  const handleTomarOferta = async (ofertaId) => {
    if (
      !window.confirm(
        '¿Confirmas que deseas tomar esta oferta?\n\nUna vez asignada, ningún otro funcionario podrá tomarla.'
      )
    )
      return;
    try {
      setActionLoading(ofertaId);
      setError('');
      await api.patch(`/funcionarios/tomar/${ofertaId}`);
      setSuccess('¡Oferta asignada correctamente!');
      cargarOfertasAprobadas();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Error al tomar la oferta');
    } finally {
      setActionLoading(null);
    }
  };

  // ── NUEVA FUNCIÓN: Completar oferta ──
  const handleCompletarOferta = async (ofertaId) => {
    if (!window.confirm('¿Marcar esta oferta como completada? Esta acción no se puede deshacer.'))
      return;
    try {
      setActionLoading(ofertaId);
      setError('');
      await api.patch(`/funcionarios/completar/${ofertaId}`);
      setSuccess('¡Oferta marcada como completada!');
      cargarOfertasAprobadas();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Error al completar la oferta');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const navItems = [
    { id: 'ofertas', label: 'Ofertas', icon: <IconClipboard /> },
    // Comentado temporalmente: ocultar acceso a Historial
    // { id: 'historial', label: 'Historial', icon: <IconChart /> }
  ];

  // Contadores para el stats row
  const totalOfertas = ofertas.length;
  const misOfertas = ofertas.filter(o => o.tomadaPorMi).length;
  const completadas = ofertas.filter(o => o.estado?.codigo === 'completado').length;
  const disponibles = ofertas.filter(
    o => !o.funcionario_asignado && o.estado?.codigo === 'aprobada'
  ).length;

  return (
    <>
      <style>{globalStyles}</style>
      <div className="fd-root">
        {/* ── Sidebar ── */}
        <aside className={`fd-sidebar ${sidebarCollapsed ? 'fd-sidebar--collapsed' : ''}`}>
          <div className="fd-sidebar__brand">
            <div className="fd-sidebar__brand-logo">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="6" fill="white" fillOpacity="0.15" />
                <path
                  d="M7 14C7 10.134 10.134 7 14 7V7C17.866 7 21 10.134 21 14V21H14C10.134 21 7 17.866 7 14V14Z"
                  fill="white"
                />
              </svg>
            </div>
            {!sidebarCollapsed && (
              <div className="fd-sidebar__brand-text">
                <span className="fd-sidebar__brand-name">Gestion y TICS</span>
                <span className="fd-sidebar__brand-sub">SENA Portal</span>
              </div>
            )}
            <button
              className="fd-sidebar__collapse-btn"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <IconChevron collapsed={sidebarCollapsed} />
            </button>
          </div>

          <nav className="fd-sidebar__nav">
            <span className="fd-sidebar__nav-label">{!sidebarCollapsed && 'NAVEGACIÓN'}</span>
            {navItems.map(item => (
              <button
                key={item.id}
                className={`fd-nav-item ${vistaActiva === item.id ? 'fd-nav-item--active' : ''}`}
                onClick={() => setVistaActiva(item.id)}
                title={sidebarCollapsed ? item.label : ''}
              >
                <span className="fd-nav-item__icon">{item.icon}</span>
                {!sidebarCollapsed && (
                  <span className="fd-nav-item__label">{item.label}</span>
                )}
                {!sidebarCollapsed && vistaActiva === item.id && (
                  <span className="fd-nav-item__dot" />
                )}
              </button>
            ))}
          </nav>

          {!sidebarCollapsed && (
            <div className="fd-sidebar__profile">
              <div className="fd-profile-card">
                <div className="fd-profile-card__avatar">
                  {(user?.nombre || 'F').charAt(0).toUpperCase()}
                </div>
                <div className="fd-profile-card__info">
                  <span className="fd-profile-card__name">{user?.nombre || 'Funcionario'}</span>
                  <span className="fd-profile-card__role">
                    {tipoFuncionario === 'campesena' ? 'Campesena' : 'Regular'}
                  </span>
                </div>
              </div>
              <button className="fd-logout-btn" onClick={handleLogout}>
                <IconLogout />
                <span>Cerrar sesión</span>
              </button>
            </div>
          )}
        </aside>

        {/* ── Main ── */}
        <div className="fd-main">
          {/* Topbar */}
          <header className="fd-topbar">
            <div className="fd-topbar__left">
              <h1 className="fd-topbar__title">
                {vistaActiva === 'ofertas' ? 'Ofertas Aprobadas' : 'Historial de Fichas'}
              </h1>
              <div className="fd-breadcrumb">
                <span>Funcionario</span>
                <span className="fd-breadcrumb__sep">/</span>
                <span className="fd-breadcrumb__current">
                  {vistaActiva === 'ofertas' ? 'Ofertas' : 'Historial'}
                </span>
              </div>
            </div>
            <div className="fd-topbar__right">
              <div className="fd-tipo-badge">
                {tipoFuncionario === 'campesena' ? '🌾 Campesena' : '🎓 Regular'}
              </div>
              <img
                src="https://www.sena.edu.co/Style%20Library/alayout/images/logoSena.png"
                alt="SENA"
                className="fd-topbar__logo"
              />
            </div>
          </header>

          {/* Alerts */}
          <div className="fd-alerts">
            {error && (
              <div className="fd-alert fd-alert--error">
                <IconError />
                <span>{error}</span>
                <button className="fd-alert__close" onClick={() => setError('')}>×</button>
              </div>
            )}
            {success && (
              <div className="fd-alert fd-alert--success">
                <IconCheck />
                <span>{success}</span>
              </div>
            )}
          </div>

          {/* Content */}
          <main className="fd-content">
            {vistaActiva === 'ofertas' && (
              <>
                {loading ? (
                  <div className="fd-loading">
                    <div className="fd-spinner" />
                    <p>Cargando ofertas...</p>
                  </div>
                ) : ofertas.length === 0 ? (
                  <div className="fd-empty">
                    <div className="fd-empty__icon">
                      <IconClipboard />
                    </div>
                    <h3 className="fd-empty__title">Sin ofertas asignadas</h3>
                    <p className="fd-empty__desc">
                      Espera a que el coordinador apruebe ofertas para tu perfil.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Stats */}
                    <div className="fd-stats-row">
                      <StatCard label="Total" value={totalOfertas} accent="#64748b" />
                      <StatCard label="Disponibles" value={disponibles} accent="#0a3d2e" />
                      <StatCard label="Mis ofertas" value={misOfertas} accent="#1d6fa4" />
                      <StatCard label="Completadas" value={completadas} accent="#16a34a" />
                    </div>

                    {/* Grid de cards */}
                    <div className="fd-grid">
                      {ofertas.map(oferta => (
                        <OfertaCard
                          key={oferta._id}
                          oferta={oferta}
                          descargando={descargando === oferta._id}
                          actionLoading={actionLoading === oferta._id}
                          onDescargar={descargarExcelCompleto}
                          onTomar={handleTomarOferta}
                          onCompletar={handleCompletarOferta}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {vistaActiva === 'historial' && (
              <div className="fd-empty">
                <div className="fd-empty__icon">
                  <IconChart />
                </div>
                <h3 className="fd-empty__title">Historial de fichas</h3>
                <p className="fd-empty__desc">
                  Historial de fichas y estadísticas detalladas estarán disponibles en futuras actualizaciones.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
};

/* ─── Sub-components ─── */

const StatCard = ({ label, value, accent }) => (
  <div className="fd-stat-card" style={{ '--accent': accent }}>
    <span className="fd-stat-card__value">{value}</span>
    <span className="fd-stat-card__label">{label}</span>
    <div className="fd-stat-card__bar" />
  </div>
);

const OfertaCard = ({ oferta, descargando, actionLoading, onDescargar, onTomar, onCompletar }) => {
  const pct = oferta.cupo_maximo
    ? Math.round(
        ((oferta.cupo_maximo - oferta.cupos_disponibles) / oferta.cupo_maximo) * 100
      )
    : 0;

  const estadoCodigo = oferta.estado?.codigo;
  const disponible = !oferta.funcionario_asignado && estadoCodigo === 'aprobada';
  const enProcesoMia = oferta.tomadaPorMi && estadoCodigo === 'en_proceso';
  const ocupadaOtro = oferta.tomadaPorOtro;
  const completada = estadoCodigo === 'completado';

  return (
    <div className={`fd-card ${ocupadaOtro ? 'fd-card--ocupada' : ''} ${completada ? 'fd-card--completada' : ''}`}>
      {/* Header */}
      <div className="fd-card__header">
        <div className="fd-card__header-left">
          <span
            className={`fd-tag ${oferta.es_campesena ? 'fd-tag--campesena' : 'fd-tag--regular'}`}
          >
            {oferta.es_campesena ? '🌾 Campesena' : '🎓 Regular'}
          </span>
          {disponible && <span className="fd-tag fd-tag--disponible">Disponible</span>}
          {enProcesoMia && <span className="fd-tag fd-tag--mia">✓ Asignada a ti</span>}
          {ocupadaOtro && <span className="fd-tag fd-tag--ocupada">🔒 Ocupada</span>}
          {completada && <span className="fd-tag fd-tag--completado">✅ Completado</span>}
        </div>
        <span className="fd-card__code">{oferta.programa_formacion?.codigo}</span>
      </div>

      {/* Body */}
      <div className="fd-card__body">
        <h3 className="fd-card__title">{oferta.programa_formacion?.nombre_programa}</h3>

        <div className="fd-card__meta">
          <MetaItem
            icon={<IconUser />}
            label="Instructor"
            value={oferta.creado_por?.nombre}
          />
          <MetaItem
            icon={<IconBuilding />}
            label="Empresa"
            value={oferta.empresa_solicitante?.nombre}
          />
          <MetaItem
            icon={<IconCalendar />}
            label="Período"
            value={`${new Date(oferta.fechas?.inicio).toLocaleDateString('es-CO')} → ${new Date(oferta.fechas?.fin).toLocaleDateString('es-CO')}`}
          />
          {/* Muestra quién tiene la oferta */}
          {oferta.funcionario_asignado && (
            <MetaItem
              icon={<IconUser />}
              label="Funcionario asignado"
              value={oferta.tomadaPorMi ? '👤 Tú' : oferta.funcionario_asignado?.nombre}
            />
          )}
          {completada && oferta.fecha_completado && (
            <MetaItem
              icon={<IconCheck />}
              label="Completada el"
              value={new Date(oferta.fecha_completado).toLocaleDateString('es-CO')}
            />
          )}
        </div>

        {/* Barra de cupos */}
        <div className="fd-cupos">
          <div className="fd-cupos__labels">
            <span>Cupos ocupados</span>
            <span>
              <strong>{oferta.cupo_maximo - oferta.cupos_disponibles}</strong> /{' '}
              {oferta.cupo_maximo}
            </span>
          </div>
          <div className="fd-cupos__bar">
            <div className="fd-cupos__fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* Footer con acciones */}
      <div className="fd-card__footer">
        {/* Descargar Excel — siempre visible */}
        <button
          className={`fd-btn fd-btn--secondary ${descargando ? 'fd-btn--loading' : ''}`}
          onClick={() => onDescargar(oferta._id)}
          disabled={descargando || actionLoading}
        >
          {descargando ? (
            <>
              <span className="fd-btn-spinner" /> Descargando...
            </>
          ) : (
            <>
              <IconDownload /> Descargar Excel
            </>
          )}
        </button>

        {/* ── Disponible → Tomar oferta ── */}
        {disponible && (
          <button
            className={`fd-btn fd-btn--primary ${actionLoading ? 'fd-btn--loading' : ''}`}
            onClick={() => onTomar(oferta._id)}
            disabled={actionLoading || descargando}
          >
            {actionLoading ? (
              <>
                <span className="fd-btn-spinner" /> Procesando...
              </>
            ) : (
              <>
                <IconTake /> Tomar oferta
              </>
            )}
          </button>
        )}

        {/* ── En proceso y es mía → Marcar completado ── */}
        {enProcesoMia && (
          <button
            className={`fd-btn fd-btn--success ${actionLoading ? 'fd-btn--loading' : ''}`}
            onClick={() => onCompletar(oferta._id)}
            disabled={actionLoading || descargando}
          >
            {actionLoading ? (
              <>
                <span className="fd-btn-spinner" /> Procesando...
              </>
            ) : (
              <>
                ✅ Marcar como completado
              </>
            )}
          </button>
        )}

        {/* ── Ocupada por otro ── */}
        {ocupadaOtro && (
          <div className="fd-card__notice fd-card__notice--warn">
            🔒 Asignada a otro funcionario
          </div>
        )}

        {/* ── Completada ── */}
        {completada && (
          <div className="fd-card__notice fd-card__notice--ok">
            ✅ Esta oferta fue completada
          </div>
        )}
      </div>
    </div>
  );
};

const MetaItem = ({ icon, label, value }) => (
  <div className="fd-meta-item">
    <span className="fd-meta-item__icon">{icon}</span>
    <div>
      <span className="fd-meta-item__label">{label}</span>
      <span className="fd-meta-item__value">{value || '—'}</span>
    </div>
  </div>
);

/* ─── Icons ─── */
const IconClipboard = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);
const IconChart = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);
const IconChevron = ({ collapsed }) => (
  <svg
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}
  >
    <path d="M15 18l-6-6 6-6" />
  </svg>
);
const IconLogout = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);
const IconDownload = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);
const IconTake = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);
const IconUser = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
  </svg>
);
const IconBuilding = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2M5 21H3M9 7h1m-1 4h1m4-4h1m-1 4h1M9 15h6" />
  </svg>
);
const IconCalendar = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
const IconError = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" />
  </svg>
);
const IconCheck = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

/* ─── Styles ─── */
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .fd-root {
    display: flex;
    height: 100vh;
    font-family: 'DM Sans', sans-serif;
    background: #f0f2f5;
    color: #1a1e2e;
  }

  /* ── Sidebar ── */
  .fd-sidebar {
    width: 260px; min-width: 260px;
    background: #0a3d2e;
    display: flex; flex-direction: column;
    transition: width 0.3s ease, min-width 0.3s ease;
    position: relative; z-index: 10;
  }
  .fd-sidebar--collapsed { width: 68px; min-width: 68px; }

  .fd-sidebar__brand {
    display: flex; align-items: center; gap: 12px;
    padding: 22px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .fd-sidebar__brand-logo {
    flex-shrink: 0; width: 36px; height: 36px;
    display: flex; align-items: center; justify-content: center;
  }
  .fd-sidebar__brand-text { flex: 1; overflow: hidden; }
  .fd-sidebar__brand-name {
    display: block; font-size: 15px; font-weight: 700;
    color: white; white-space: nowrap;
  }
  .fd-sidebar__brand-sub {
    display: block; font-size: 11px; font-weight: 400;
    color: rgba(255,255,255,0.45); letter-spacing: 0.05em; white-space: nowrap;
  }
  .fd-sidebar__collapse-btn {
    margin-left: auto; flex-shrink: 0;
    width: 28px; height: 28px;
    background: rgba(255,255,255,0.08); border: none; border-radius: 6px;
    color: rgba(255,255,255,0.6); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.2s;
  }
  .fd-sidebar__collapse-btn:hover { background: rgba(255,255,255,0.15); }

  .fd-sidebar__nav { padding: 16px 10px; flex: 1; }
  .fd-sidebar__nav-label {
    display: block; font-size: 10px; font-weight: 600;
    color: rgba(255,255,255,0.3); letter-spacing: 0.1em;
    padding: 0 8px 10px; white-space: nowrap; overflow: hidden;
  }
  .fd-nav-item {
    width: 100%; display: flex; align-items: center; gap: 10px;
    padding: 10px; border: none; border-radius: 8px;
    background: transparent; color: rgba(255,255,255,0.6);
    font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500;
    cursor: pointer; text-align: left;
    transition: all 0.2s; position: relative; margin-bottom: 2px; white-space: nowrap;
  }
  .fd-nav-item:hover { background: rgba(255,255,255,0.07); color: white; }
  .fd-nav-item--active { background: rgba(255,255,255,0.12); color: white; }
  .fd-nav-item__icon { flex-shrink: 0; }
  .fd-nav-item__label { flex: 1; }
  .fd-nav-item__dot {
    width: 6px; height: 6px; background: #4ade80;
    border-radius: 50%; flex-shrink: 0;
  }

  .fd-sidebar__profile { padding: 16px; border-top: 1px solid rgba(255,255,255,0.08); }
  .fd-profile-card {
    display: flex; align-items: center; gap: 10px;
    padding: 10px; border-radius: 8px;
    background: rgba(255,255,255,0.06); margin-bottom: 10px;
  }
  .fd-profile-card__avatar {
    width: 34px; height: 34px; background: #005f3a; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 700; color: white; flex-shrink: 0;
  }
  .fd-profile-card__name {
    display: block; font-size: 13px; font-weight: 600; color: white;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .fd-profile-card__role { display: block; font-size: 11px; color: rgba(255,255,255,0.45); }
  .fd-logout-btn {
    width: 100%; display: flex; align-items: center; gap: 8px;
    padding: 8px 10px; background: rgba(239,68,68,0.12);
    border: 1px solid rgba(239,68,68,0.2); border-radius: 7px;
    color: #fca5a5; font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s;
  }
  .fd-logout-btn:hover { background: rgba(239,68,68,0.22); color: white; }

  /* ── Main ── */
  .fd-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

  /* ── Topbar ── */
  .fd-topbar {
    background: white; border-bottom: 1px solid #e8eaed;
    padding: 0 28px; height: 64px;
    display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
  }
  .fd-topbar__title { font-size: 18px; font-weight: 700; color: #0f172a; }
  .fd-breadcrumb {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; color: #94a3b8; margin-top: 2px;
  }
  .fd-breadcrumb__sep { opacity: 0.5; }
  .fd-breadcrumb__current { color: #0a3d2e; font-weight: 500; }
  .fd-topbar__right { display: flex; align-items: center; gap: 16px; }
  .fd-tipo-badge {
    padding: 5px 12px; background: #ecfdf5;
    border: 1px solid #bbf7d0; border-radius: 20px;
    font-size: 12px; font-weight: 600; color: #065f46;
  }
  .fd-topbar__logo { height: 32px; width: auto; filter: saturate(0) opacity(0.6); }

  /* ── Alerts ── */
  .fd-alerts { padding: 0 28px; }
  .fd-alert {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 14px; border-radius: 8px;
    font-size: 13px; font-weight: 500; margin-top: 16px;
    animation: slideDown 0.3s ease;
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fd-alert--error   { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
  .fd-alert--success { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
  .fd-alert__close {
    margin-left: auto; background: none; border: none;
    color: inherit; cursor: pointer; font-size: 18px; line-height: 1;
  }

  /* ── Content ── */
  .fd-content { flex: 1; overflow-y: auto; padding: 24px 28px; }

  /* ── Loading ── */
  .fd-loading {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; height: 300px; gap: 16px;
    color: #64748b; font-size: 14px;
  }
  .fd-spinner {
    width: 36px; height: 36px;
    border: 3px solid #e2e8f0; border-top-color: #0a3d2e;
    border-radius: 50%; animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Empty ── */
  .fd-empty {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 60px 20px; text-align: center;
  }
  .fd-empty__icon {
    width: 56px; height: 56px; background: #f1f5f9; border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    color: #94a3b8; margin-bottom: 16px;
  }
  .fd-empty__icon svg { width: 26px; height: 26px; }
  .fd-empty__title { font-size: 16px; font-weight: 600; color: #334155; margin-bottom: 6px; }
  .fd-empty__desc { font-size: 14px; color: #94a3b8; max-width: 320px; }

  /* ── Stats ── */
  .fd-stats-row {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 16px; margin-bottom: 24px;
  }
  .fd-stat-card {
    background: white; border-radius: 10px;
    padding: 18px 20px; border: 1px solid #e8eaed;
    position: relative; overflow: hidden;
  }
  .fd-stat-card__value {
    display: block; font-size: 28px; font-weight: 700;
    color: var(--accent, #0a3d2e); font-family: 'DM Mono', monospace;
  }
  .fd-stat-card__label {
    display: block; font-size: 12px; font-weight: 500;
    color: #94a3b8; margin-top: 4px;
    text-transform: uppercase; letter-spacing: 0.05em;
  }
  .fd-stat-card__bar {
    position: absolute; bottom: 0; left: 0; right: 0;
    height: 3px; background: var(--accent, #0a3d2e); opacity: 0.5;
  }

  /* ── Grid ── */
  .fd-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 18px;
  }

  /* ── Card ── */
  .fd-card {
    background: white; border: 1px solid #e8eaed;
    border-radius: 12px; overflow: hidden;
    transition: box-shadow 0.2s, transform 0.2s;
  }
  .fd-card:hover { box-shadow: 0 8px 24px rgba(10,61,46,0.1); transform: translateY(-2px); }
  .fd-card--ocupada { opacity: 0.75; border-color: #fecaca; }
  .fd-card--completada { border-color: #bbf7d0; }

  .fd-card__header {
    padding: 14px 16px;
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid #f1f5f9; background: #fafbfc;
  }
  .fd-card__header-left { display: flex; gap: 6px; flex-wrap: wrap; }
  .fd-card__code {
    font-family: 'DM Mono', monospace; font-size: 12px; color: #94a3b8;
    background: #f1f5f9; padding: 3px 8px; border-radius: 4px;
  }

  /* Tags */
  .fd-tag {
    display: inline-block; padding: 3px 9px; border-radius: 20px;
    font-size: 11px; font-weight: 600; letter-spacing: 0.03em;
  }
  .fd-tag--regular    { background: #dbeafe; color: #1e40af; }
  .fd-tag--campesena  { background: #fef9c3; color: #854d0e; }
  .fd-tag--disponible { background: #dcfce7; color: #14532d; }
  .fd-tag--mia        { background: #dbeafe; color: #1e3a8a; }
  .fd-tag--ocupada    { background: #fee2e2; color: #991b1b; }
  .fd-tag--completado { background: #d1fae5; color: #065f46; }

  .fd-card__body { padding: 16px; }
  .fd-card__title {
    font-size: 15px; font-weight: 600; color: #0f172a;
    margin-bottom: 14px; line-height: 1.4;
  }
  .fd-card__meta { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }

  .fd-meta-item { display: flex; align-items: flex-start; gap: 8px; }
  .fd-meta-item__icon { color: #94a3b8; flex-shrink: 0; margin-top: 1px; }
  .fd-meta-item__label {
    display: block; font-size: 10px; font-weight: 600;
    color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em;
  }
  .fd-meta-item__value { display: block; font-size: 13px; font-weight: 500; color: #334155; }

  /* Cupos */
  .fd-cupos__labels {
    display: flex; justify-content: space-between;
    font-size: 12px; color: #64748b; margin-bottom: 6px;
  }
  .fd-cupos__bar {
    height: 6px; background: #f1f5f9; border-radius: 99px; overflow: hidden;
  }
  .fd-cupos__fill {
    height: 100%; background: linear-gradient(90deg, #0a3d2e, #16a34a);
    border-radius: 99px; transition: width 0.6s ease; min-width: 4px;
  }

  /* Footer */
  .fd-card__footer {
    padding: 14px 16px; border-top: 1px solid #f1f5f9;
    background: #fafbfc;
    display: flex; flex-direction: column; gap: 8px;
  }
  .fd-card__notice {
    padding: 8px 12px; border-radius: 7px;
    font-size: 12px; font-weight: 500; text-align: center;
  }
  .fd-card__notice--warn { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
  .fd-card__notice--ok   { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }

  /* Buttons */
  .fd-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 7px;
    padding: 9px 16px; border-radius: 8px; border: none;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all 0.2s; width: 100%;
  }
  .fd-btn--primary  { background: #0a3d2e; color: white; }
  .fd-btn--primary:hover:not(:disabled) { background: #0d5240; }
  .fd-btn--secondary {
    background: #f8fafc; color: #334155;
    border: 1px solid #e2e8f0;
  }
  .fd-btn--secondary:hover:not(:disabled) { background: #f1f5f9; }
  .fd-btn--success  { background: #16a34a; color: white; }
  .fd-btn--success:hover:not(:disabled)  { background: #15803d; }
  .fd-btn--loading  { opacity: 0.7; cursor: not-allowed; }
  .fd-btn:disabled  { opacity: 0.6; cursor: not-allowed; }
  .fd-btn-spinner {
    width: 13px; height: 13px;
    border: 2px solid rgba(255,255,255,0.3); border-top-color: white;
    border-radius: 50%; animation: spin 0.7s linear infinite;
  }
`;

export default FuncionarioDashboard;