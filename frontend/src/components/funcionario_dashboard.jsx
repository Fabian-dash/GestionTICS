import React, { useState, useEffect } from 'react';
import api from '../services/api';

/* ─── Constantes de estados ─── */
const ESTADO = {
  PENDIENTE_COORDINADOR: 'pendiente_coordinador',
  LISTA_ESPERA: 'lista_espera',
  EN_PROCESO: 'en_proceso',
  A_CORREGIR: 'a_corregir',
  APROBADA: 'aprobada',
  MATRICULADA: 'matriculada',
  COMPLETADA: 'completado',
};

const ESTADO_CONFIG = {
  [ESTADO.PENDIENTE_COORDINADOR]: {
    label: 'Pendiente coordinador',
    color: '#92400e',
    bg: '#fef3c7',
    border: '#fcd34d',
    dot: '#f59e0b',
  },
  [ESTADO.LISTA_ESPERA]: {
    label: 'Lista de espera',
    color: '#374151',
    bg: '#f3f4f6',
    border: '#d1d5db',
    dot: '#9ca3af',
  },
  [ESTADO.EN_PROCESO]: {
    label: 'En proceso',
    color: '#065f46',
    bg: '#d1fae5',
    border: '#6ee7b7',
    dot: '#10b981',
  },
  [ESTADO.A_CORREGIR]: {
    label: 'A corregir',
    color: '#7f1d1d',
    bg: '#fee2e2',
    border: '#fca5a5',
    dot: '#ef4444',
  },
  [ESTADO.APROBADA]: {
    label: 'Aprobada',
    color: '#064e3b',
    bg: '#d1fae5',
    border: '#34d399',
    dot: '#059669',
  },
  [ESTADO.MATRICULADA]: {
    label: 'Matriculada',
    color: '#1e3a5f',
    bg: '#dbeafe',
    border: '#93c5fd',
    dot: '#3b82f6',
  },
  [ESTADO.COMPLETADA]: {
    label: 'Completada',
    color: '#14532d',
    bg: '#bbf7d0',
    border: '#4ade80',
    dot: '#16a34a',
  },
};

/* ─── Tabs de filtro según acciones disponibles ─── */
const TABS = [
  { id: 'disponibles', label: 'Disponibles', estados: [ESTADO.LISTA_ESPERA] },
  { id: 'en_proceso', label: 'En proceso', estados: [ESTADO.EN_PROCESO] },
  { id: 'a_corregir', label: 'A corregir', estados: [ESTADO.A_CORREGIR] },
  { id: 'aprobadas', label: 'Aprobadas', estados: [ESTADO.APROBADA] },
  { id: 'matriculadas', label: 'Matriculadas', estados: [ESTADO.MATRICULADA] },
  { id: 'completadas', label: 'Completadas', estados: [ESTADO.COMPLETADA] },
  { id: 'todas', label: 'Todas', estados: null },
];

/* ─── Helper ─── */
const fmt = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/* ══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════════════════ */
const FuncionarioDashboard = () => {
  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [descargando, setDescargando] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabActiva, setTabActiva] = useState('disponibles');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [modalCorreccion, setModalCorreccion] = useState(null);
  const [motivoCorreccion, setMotivoCorreccion] = useState('');
  const [modalMatricula, setModalMatricula] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const tipoFuncionario = user.tipo_funcionario || 'regular';

  useEffect(() => {
    cargarOfertas();
  }, []);

  /* ─── API calls ─── */
  const cargarOfertas = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/ofertas-funcionario/todas/${tipoFuncionario}`);
      setOfertas(res.data.data || []);
    } catch (e) {
      setError('Error al cargar las ofertas');
    } finally {
      setLoading(false);
    }
  };

  const handleTomarOferta = async (ofertaId) => {
    if (!window.confirm('¿Confirmas tomar esta oferta? Quedará asignada solo a ti.')) return;
    try {
      setActionLoading(ofertaId);
      await api.patch(`/funcionarios/tomar/${ofertaId}`);
      flash('success', '¡Oferta tomada correctamente!');
      cargarOfertas();
    } catch (e) {
      flash('error', e.response?.data?.message || 'Error al tomar la oferta');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSolicitarCorreccion = async () => {
    if (!motivoCorreccion.trim()) {
      flash('error', 'Debes indicar el motivo de la corrección');
      return;
    }
    try {
      setActionLoading(modalCorreccion._id);
      await api.patch(`/funcionarios/solicitar-correccion/${modalCorreccion._id}`, {
        motivo: motivoCorreccion,
      });
      flash('success', 'Solicitud de corrección enviada al instructor');
      setModalCorreccion(null);
      setMotivoCorreccion('');
      cargarOfertas();
    } catch (e) {
      flash('error', e.response?.data?.message || 'Error al solicitar corrección');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAprobar = async (ofertaId) => {
    if (!window.confirm('¿Aprobar esta oferta? Se generarán la ficha y solicitud.')) return;
    try {
      setActionLoading(ofertaId);
      await api.patch(`/funcionarios/aprobar/${ofertaId}`);
      flash('success', '¡Oferta aprobada! Ficha y solicitud generadas.');
      cargarOfertas();
    } catch (e) {
      flash('error', e.response?.data?.message || 'Error al aprobar la oferta');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMatricular = async () => {
    if (!window.confirm('¿Confirmar matrícula de los aprendices en esta oferta?')) return;
    try {
      setActionLoading(modalMatricula._id);
      await api.patch(`/funcionarios/matricular/${modalMatricula._id}`);
      flash('success', '¡Aprendices matriculados correctamente!');
      setModalMatricula(null);
      cargarOfertas();
    } catch (e) {
      flash('error', e.response?.data?.message || 'Error al matricular aprendices');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompletar = async (ofertaId) => {
    if (!window.confirm('¿Marcar como completada? Esta acción es definitiva.')) return;
    try {
      setActionLoading(ofertaId);
      await api.patch(`/funcionarios/completar/${ofertaId}`);
      flash('success', '¡Oferta marcada como completada!');
      cargarOfertas();
    } catch (e) {
      flash('error', e.response?.data?.message || 'Error al completar la oferta');
    } finally {
      setActionLoading(null);
    }
  };

  const descargarExcel = async (ofertaId) => {
    try {
      setDescargando(ofertaId);
      const res = await api.get(`/ofertas/${ofertaId}/exportar-excel`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const oferta = ofertas.find((o) => o._id === ofertaId);
      link.setAttribute('download', `oferta_${oferta?.programa_formacion?.codigo || ofertaId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      flash('success', 'Excel descargado correctamente');
    } catch (e) {
      flash('error', 'Error al descargar el Excel');
    } finally {
      setDescargando(null);
    }
  };

  const flash = (type, msg) => {
    if (type === 'success') setSuccess(msg);
    else setError(msg);
    setTimeout(() => (type === 'success' ? setSuccess('') : setError('')), 4000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  /* ─── Filtro por tab ─── */
  const tabConfig = TABS.find((t) => t.id === tabActiva);
  const ofertasFiltradas = tabConfig?.estados
    ? ofertas.filter((o) => tabConfig.estados.includes(o.estado?.codigo))
    : ofertas;

  /* ─── Contadores ─── */
  const counts = {};
  TABS.forEach((t) => {
    counts[t.id] = t.estados
      ? ofertas.filter((o) => t.estados.includes(o.estado?.codigo)).length
      : ofertas.length;
  });

  return (
    <>
      <style>{globalStyles}</style>
      <div className="fd-root">
        {/* ── Sidebar ── */}
        <aside className={`fd-sidebar${sidebarCollapsed ? ' fd-sidebar--collapsed' : ''}`}>
          <div className="fd-sidebar__brand">
            <div className="fd-sidebar__logo">
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                <rect width="30" height="30" rx="7" fill="rgba(255,255,255,0.15)" />
                <path
                  d="M8 15C8 11.134 11.134 8 15 8C18.866 8 22 11.134 22 15V22H15C11.134 22 8 18.866 8 15Z"
                  fill="white"
                />
              </svg>
            </div>
            {!sidebarCollapsed && (
              <div className="fd-sidebar__brand-text">
                <span className="fd-sidebar__brand-name">Gestión y TICs</span>
                <span className="fd-sidebar__brand-sub">SENA Portal</span>
              </div>
            )}
            <button className="fd-sidebar__toggle" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          </div>

          <nav className="fd-sidebar__nav">
            {!sidebarCollapsed && <span className="fd-nav-section">MENÚ</span>}
            <button className="fd-nav-item fd-nav-item--active" title={sidebarCollapsed ? 'Ofertas' : ''}>
              <IcoClipboard />
              {!sidebarCollapsed && <span>Ofertas</span>}
              {!sidebarCollapsed && <span className="fd-nav-dot" />}
            </button>
          </nav>

          {!sidebarCollapsed && (
            <div className="fd-sidebar__footer">
              <div className="fd-profile">
                <div className="fd-profile__avatar">
                  {(user?.nombre || 'F').charAt(0).toUpperCase()}
                </div>
                <div className="fd-profile__info">
                  <span className="fd-profile__name">{user?.nombre || 'Funcionario'}</span>
                  <span className="fd-profile__role">
                    {tipoFuncionario === 'campesena' ? 'Campesena' : 'Regular'}
                  </span>
                </div>
              </div>
              <button className="fd-logout" onClick={handleLogout}>
                <IcoLogout /> Cerrar sesión
              </button>
            </div>
          )}
        </aside>

        {/* ── Main ── */}
        <div className="fd-main">
          {/* Topbar */}
          <header className="fd-topbar">
            <div>
              <h1 className="fd-topbar__title">Gestión de Ofertas</h1>
              <p className="fd-topbar__breadcrumb">
                Funcionario <span>/</span> Ofertas
              </p>
            </div>
            <div className="fd-topbar__right">
              <span className="fd-tipo-badge">
                {tipoFuncionario === 'campesena' ? '🌾 Campesena' : '🎓 Regular'}
              </span>
              <img
                src="https://www.sena.edu.co/Style%20Library/alayout/images/logoSena.png"
                alt="SENA"
                className="fd-topbar__logo"
              />
            </div>
          </header>

          {/* Flujo de estados visual */}
          <div className="fd-flujo-strip">
            {[
              ESTADO.PENDIENTE_COORDINADOR,
              ESTADO.LISTA_ESPERA,
              ESTADO.EN_PROCESO,
              ESTADO.A_CORREGIR,
              ESTADO.APROBADA,
              ESTADO.MATRICULADA,
              ESTADO.COMPLETADA,
            ].map((cod, idx, arr) => {
              const cfg = ESTADO_CONFIG[cod];
              const count = ofertas.filter((o) => o.estado?.codigo === cod).length;
              return (
                <React.Fragment key={cod}>
                  <div className="fd-flujo-step">
                    <div
                      className="fd-flujo-dot"
                      style={{ background: cfg.dot }}
                    />
                    <span className="fd-flujo-label">{cfg.label}</span>
                    {count > 0 && (
                      <span className="fd-flujo-count" style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
                        {count}
                      </span>
                    )}
                  </div>
                  {idx < arr.length - 1 && (
                    <div className="fd-flujo-arrow">›</div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Alerts */}
          {(error || success) && (
            <div className="fd-alert-wrap">
              {error && (
                <div className="fd-alert fd-alert--error">
                  <IcoError />
                  {error}
                  <button className="fd-alert__close" onClick={() => setError('')}>×</button>
                </div>
              )}
              {success && (
                <div className="fd-alert fd-alert--success">
                  <IcoCheck />
                  {success}
                </div>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="fd-tabs-wrap">
            <div className="fd-tabs">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={`fd-tab${tabActiva === tab.id ? ' fd-tab--active' : ''}`}
                  onClick={() => setTabActiva(tab.id)}
                >
                  {tab.label}
                  {counts[tab.id] > 0 && (
                    <span className="fd-tab-badge">{counts[tab.id]}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <main className="fd-content">
            {loading ? (
              <div className="fd-loading">
                <div className="fd-spinner" />
                <p>Cargando ofertas...</p>
              </div>
            ) : ofertasFiltradas.length === 0 ? (
              <div className="fd-empty">
                <div className="fd-empty__icon"><IcoClipboard /></div>
                <h3 className="fd-empty__title">Sin ofertas en este estado</h3>
                <p className="fd-empty__desc">
                  No hay ofertas en la categoría "{tabConfig?.label}" en este momento.
                </p>
              </div>
            ) : (
              <div className="fd-grid">
                {ofertasFiltradas.map((oferta) => (
                  <OfertaCard
                    key={oferta._id}
                    oferta={oferta}
                    descargando={descargando === oferta._id}
                    actionLoading={actionLoading === oferta._id}
                    onDescargar={descargarExcel}
                    onTomar={handleTomarOferta}
                    onSolicitarCorreccion={(o) => { setModalCorreccion(o); setMotivoCorreccion(''); }}
                    onAprobar={handleAprobar}
                    onMatricular={(o) => setModalMatricula(o)}
                    onCompletar={handleCompletar}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ── Modal: Solicitar Corrección ── */}
      {modalCorreccion && (
        <div className="fd-modal-overlay" onClick={() => setModalCorreccion(null)}>
          <div className="fd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fd-modal__header">
              <h2 className="fd-modal__title">Solicitar corrección</h2>
              <button className="fd-modal__close" onClick={() => setModalCorreccion(null)}>×</button>
            </div>
            <div className="fd-modal__body">
              <p className="fd-modal__subtitle">
                Oferta: <strong>{modalCorreccion.programa_formacion?.nombre_programa}</strong>
              </p>
              <p className="fd-modal__subtitle" style={{ marginBottom: '12px' }}>
                Describe las inconsistencias detectadas para que el instructor pueda corregirlas.
              </p>
              <textarea
                className="fd-textarea"
                rows={5}
                placeholder="Ej: El listado de aprendices contiene datos incompletos en las columnas de documento y teléfono..."
                value={motivoCorreccion}
                onChange={(e) => setMotivoCorreccion(e.target.value)}
              />
            </div>
            <div className="fd-modal__footer">
              <button className="fd-btn fd-btn--ghost" onClick={() => setModalCorreccion(null)}>
                Cancelar
              </button>
              <button
                className={`fd-btn fd-btn--danger${actionLoading === modalCorreccion._id ? ' fd-btn--loading' : ''}`}
                onClick={handleSolicitarCorreccion}
                disabled={actionLoading === modalCorreccion._id}
              >
                {actionLoading === modalCorreccion._id ? (
                  <><span className="fd-btn-spinner" /> Enviando...</>
                ) : (
                  'Enviar solicitud'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Confirmar Matrícula ── */}
      {modalMatricula && (
        <div className="fd-modal-overlay" onClick={() => setModalMatricula(null)}>
          <div className="fd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fd-modal__header">
              <h2 className="fd-modal__title">Confirmar matrícula</h2>
              <button className="fd-modal__close" onClick={() => setModalMatricula(null)}>×</button>
            </div>
            <div className="fd-modal__body">
              <p className="fd-modal__subtitle">
                Estás a punto de matricular formalmente a los aprendices de:
              </p>
              <div className="fd-modal__info-box">
                <strong>{modalMatricula.programa_formacion?.nombre_programa}</strong>
                <br />
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  Código: {modalMatricula.programa_formacion?.codigo} &nbsp;·&nbsp;
                  {modalMatricula.cupo_maximo} cupos
                </span>
              </div>
              <p className="fd-modal__note">
                Esta acción registrará formalmente la inscripción de los aprendices. ¿Confirmas?
              </p>
            </div>
            <div className="fd-modal__footer">
              <button className="fd-btn fd-btn--ghost" onClick={() => setModalMatricula(null)}>
                Cancelar
              </button>
              <button
                className={`fd-btn fd-btn--primary${actionLoading === modalMatricula._id ? ' fd-btn--loading' : ''}`}
                onClick={handleMatricular}
                disabled={actionLoading === modalMatricula._id}
              >
                {actionLoading === modalMatricula._id ? (
                  <><span className="fd-btn-spinner" /> Matriculando...</>
                ) : (
                  'Confirmar matrícula'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ══════════════════════════════════════════════════════════
   OFERTA CARD — muestra acciones según estado
══════════════════════════════════════════════════════════ */
const OfertaCard = ({
  oferta,
  descargando,
  actionLoading,
  onDescargar,
  onTomar,
  onSolicitarCorreccion,
  onAprobar,
  onMatricular,
  onCompletar,
}) => {
  const estadoCodigo = oferta.estado?.codigo;
  const cfg = ESTADO_CONFIG[estadoCodigo] || ESTADO_CONFIG[ESTADO.PENDIENTE_COORDINADOR];

  const pct = oferta.cupo_maximo
    ? Math.round(((oferta.cupo_maximo - (oferta.cupos_disponibles ?? 0)) / oferta.cupo_maximo) * 100)
    : 0;

  /* Condiciones de visibilidad de acciones */
  const esMia = oferta.tomadaPorMi;
  const disponibleParaTomar = estadoCodigo === ESTADO.LISTA_ESPERA && !oferta.funcionario_asignado;
  const enProcesoMia = estadoCodigo === ESTADO.EN_PROCESO && esMia;
  const puedoAprobar = estadoCodigo === ESTADO.EN_PROCESO && esMia;
  const puedeMatricular = estadoCodigo === ESTADO.APROBADA && esMia;
  const puedeCompletar = estadoCodigo === ESTADO.MATRICULADA && esMia;
  const ocupadaOtro = oferta.tomadaPorOtro;

  return (
    <div
      className={`fd-card${ocupadaOtro ? ' fd-card--ocupada' : ''}${estadoCodigo === ESTADO.COMPLETADA ? ' fd-card--completada' : ''}`}
    >
      {/* Header */}
      <div className="fd-card__head">
        <div className="fd-card__tags">
          <span className={`fd-tag fd-tag--${oferta.es_campesena ? 'campesena' : 'regular'}`}>
            {oferta.es_campesena ? '🌾 Campesena' : '🎓 Regular'}
          </span>
          <span
            className="fd-tag"
            style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
          >
            {cfg.label}
          </span>
          {esMia && estadoCodigo !== ESTADO.COMPLETADA && (
            <span className="fd-tag fd-tag--mia">✓ Asignada a ti</span>
          )}
          {ocupadaOtro && <span className="fd-tag fd-tag--ocupada">🔒 Ocupada</span>}
        </div>
        <span className="fd-card__code">{oferta.programa_formacion?.codigo}</span>
      </div>

      {/* Body */}
      <div className="fd-card__body">
        <h3 className="fd-card__title">{oferta.programa_formacion?.nombre_programa}</h3>
        <div className="fd-card__meta">
          <MetaRow icon={<IcoUser />} label="Instructor" value={oferta.creado_por?.nombre} />
          <MetaRow icon={<IcoBuild />} label="Empresa" value={oferta.empresa_solicitante?.nombre} />
          <MetaRow
            icon={<IcoCal />}
            label="Período"
            value={`${fmt(oferta.fechas?.inicio)} → ${fmt(oferta.fechas?.fin)}`}
          />
          {oferta.funcionario_asignado && (
            <MetaRow
              icon={<IcoUser />}
              label="Funcionario"
              value={esMia ? '👤 Tú' : oferta.funcionario_asignado?.nombre}
            />
          )}
          {oferta.motivo_correccion && estadoCodigo === ESTADO.A_CORREGIR && (
            <div className="fd-correccion-nota">
              <strong>Motivo de corrección:</strong> {oferta.motivo_correccion}
            </div>
          )}
          {estadoCodigo === ESTADO.COMPLETADA && oferta.fecha_completado && (
            <MetaRow icon={<IcoCheck />} label="Completada el" value={fmt(oferta.fecha_completado)} />
          )}
        </div>

        {/* Barra de cupos */}
        <div className="fd-cupos">
          <div className="fd-cupos__labels">
            <span>Cupos ocupados</span>
            <span>
              <strong>{oferta.cupo_maximo - (oferta.cupos_disponibles ?? 0)}</strong>
              {' '}/ {oferta.cupo_maximo}
            </span>
          </div>
          <div className="fd-cupos__track">
            <div className="fd-cupos__fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* Footer — Acciones */}
      <div className="fd-card__foot">
        {/* Siempre: Descargar Excel */}
        <button
          className={`fd-btn fd-btn--secondary fd-btn--sm${descargando ? ' fd-btn--loading' : ''}`}
          onClick={() => onDescargar(oferta._id)}
          disabled={descargando || !!actionLoading}
        >
          {descargando ? <><span className="fd-btn-spinner" /> Descargando...</> : <><IcoDown /> Excel</>}
        </button>

        {/* Lista de espera → Tomar */}
        {disponibleParaTomar && (
          <button
            className={`fd-btn fd-btn--primary${actionLoading ? ' fd-btn--loading' : ''}`}
            onClick={() => onTomar(oferta._id)}
            disabled={!!actionLoading}
          >
            {actionLoading ? <><span className="fd-btn-spinner" /> Procesando...</> : <><IcoTake /> Tomar oferta</>}
          </button>
        )}

        {/* En proceso (mía) → Solicitar corrección + Aprobar */}
        {enProcesoMia && (
          <>
            <button
              className="fd-btn fd-btn--warning"
              onClick={() => onSolicitarCorreccion(oferta)}
              disabled={!!actionLoading}
            >
              <IcoEdit /> Pedir corrección
            </button>
            <button
              className={`fd-btn fd-btn--success${actionLoading ? ' fd-btn--loading' : ''}`}
              onClick={() => onAprobar(oferta._id)}
              disabled={!!actionLoading}
            >
              {actionLoading ? <><span className="fd-btn-spinner" /> Procesando...</> : <>✓ Aprobar oferta</>}
            </button>
          </>
        )}

        {/* Aprobada (mía) → Matricular */}
        {puedeMatricular && (
          <button
            className={`fd-btn fd-btn--primary${actionLoading ? ' fd-btn--loading' : ''}`}
            onClick={() => onMatricular(oferta)}
            disabled={!!actionLoading}
          >
            {actionLoading ? <><span className="fd-btn-spinner" /> Procesando...</> : <><IcoUsers /> Matricular aprendices</>}
          </button>
        )}

        {/* Matriculada (mía) → Completar */}
        {puedeCompletar && (
          <button
            className={`fd-btn fd-btn--success${actionLoading ? ' fd-btn--loading' : ''}`}
            onClick={() => onCompletar(oferta._id)}
            disabled={!!actionLoading}
          >
            {actionLoading ? <><span className="fd-btn-spinner" /> Procesando...</> : <>✅ Marcar completada</>}
          </button>
        )}

        {/* Ocupada por otro */}
        {ocupadaOtro && (
          <div className="fd-notice fd-notice--warn">🔒 Asignada a otro funcionario</div>
        )}

        {/* Completada */}
        {estadoCodigo === ESTADO.COMPLETADA && (
          <div className="fd-notice fd-notice--ok">✅ Proceso finalizado</div>
        )}

        {/* Pendiente coordinador / A corregir — solo lectura */}
        {(estadoCodigo === ESTADO.PENDIENTE_COORDINADOR ||
          estadoCodigo === ESTADO.A_CORREGIR) && (
          <div className="fd-notice fd-notice--info">
            {estadoCodigo === ESTADO.PENDIENTE_COORDINADOR
              ? '⏳ Esperando decisión del coordinador'
              : '🔧 El instructor está corrigiendo los datos'}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Sub-components ─── */
const MetaRow = ({ icon, label, value }) => (
  <div className="fd-meta-row">
    <span className="fd-meta-row__icon">{icon}</span>
    <div>
      <span className="fd-meta-row__label">{label}</span>
      <span className="fd-meta-row__value">{value || '—'}</span>
    </div>
  </div>
);

/* ─── Iconos ─── */
const IcoClipboard = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);
const IcoLogout = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);
const IcoDown = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);
const IcoTake = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);
const IcoEdit = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IcoUsers = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
);
const IcoUser = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
  </svg>
);
const IcoBuild = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2M5 21H3M9 7h1m-1 4h1m4-4h1m-1 4h1M9 15h6" />
  </svg>
);
const IcoCal = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
const IcoError = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
  </svg>
);
const IcoCheck = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

/* ══════════════════════════════════════════════════════════
   ESTILOS GLOBALES
══════════════════════════════════════════════════════════ */
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .fd-root {
    display: flex; height: 100vh;
    font-family: 'DM Sans', sans-serif;
    background: #eef0f4; color: #1a1e2e;
  }

  /* ── Sidebar ── */
  .fd-sidebar {
    width: 256px; min-width: 256px;
    background: #0a3d2e; display: flex; flex-direction: column;
    transition: width .3s ease, min-width .3s ease; z-index: 20;
  }
  .fd-sidebar--collapsed { width: 64px; min-width: 64px; }
  .fd-sidebar__brand {
    display: flex; align-items: center; gap: 10px;
    padding: 20px 14px; border-bottom: 1px solid rgba(255,255,255,.08);
  }
  .fd-sidebar__logo { flex-shrink: 0; }
  .fd-sidebar__brand-text { flex: 1; overflow: hidden; }
  .fd-sidebar__brand-name { display: block; font-size: 14px; font-weight: 700; color: #fff; white-space: nowrap; }
  .fd-sidebar__brand-sub  { display: block; font-size: 11px; color: rgba(255,255,255,.4); white-space: nowrap; }
  .fd-sidebar__toggle {
    flex-shrink: 0; width: 28px; height: 28px;
    background: rgba(255,255,255,.08); border: none; border-radius: 6px;
    color: rgba(255,255,255,.55); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
  }
  .fd-sidebar__toggle:hover { background: rgba(255,255,255,.16); }
  .fd-sidebar__nav { padding: 14px 10px; flex: 1; }
  .fd-nav-section { display: block; font-size: 10px; font-weight: 600; color: rgba(255,255,255,.3); letter-spacing: .1em; padding: 0 8px 10px; }
  .fd-nav-item {
    width: 100%; display: flex; align-items: center; gap: 10px;
    padding: 9px 10px; border: none; border-radius: 8px;
    background: transparent; color: rgba(255,255,255,.6);
    font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500;
    cursor: pointer; text-align: left; transition: all .2s;
  }
  .fd-nav-item:hover { background: rgba(255,255,255,.07); color: #fff; }
  .fd-nav-item--active { background: rgba(255,255,255,.12); color: #fff; }
  .fd-nav-dot { margin-left: auto; width: 6px; height: 6px; background: #4ade80; border-radius: 50%; }
  .fd-sidebar__footer { padding: 14px; border-top: 1px solid rgba(255,255,255,.08); }
  .fd-profile { display: flex; align-items: center; gap: 10px; padding: 10px; background: rgba(255,255,255,.06); border-radius: 8px; margin-bottom: 10px; }
  .fd-profile__avatar { width: 32px; height: 32px; background: #005f3a; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #fff; flex-shrink: 0; }
  .fd-profile__name { display: block; font-size: 13px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .fd-profile__role { display: block; font-size: 11px; color: rgba(255,255,255,.4); }
  .fd-logout { width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.2); border-radius: 7px; color: #fca5a5; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: all .2s; }
  .fd-logout:hover { background: rgba(239,68,68,.2); color: #fff; }

  /* ── Main ── */
  .fd-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }

  /* ── Topbar ── */
  .fd-topbar { background: #fff; border-bottom: 1px solid #e2e8f0; padding: 0 28px; height: 62px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
  .fd-topbar__title { font-size: 17px; font-weight: 700; color: #0f172a; }
  .fd-topbar__breadcrumb { font-size: 12px; color: #94a3b8; margin-top: 2px; }
  .fd-topbar__breadcrumb span { color: #0a3d2e; font-weight: 500; margin: 0 4px; }
  .fd-topbar__right { display: flex; align-items: center; gap: 14px; }
  .fd-tipo-badge { padding: 5px 12px; background: #ecfdf5; border: 1px solid #bbf7d0; border-radius: 20px; font-size: 12px; font-weight: 600; color: #065f46; }
  .fd-topbar__logo { height: 30px; filter: saturate(0) opacity(.55); }

  /* ── Flujo strip ── */
  .fd-flujo-strip {
    display: flex; align-items: center; gap: 4px;
    padding: 10px 28px; background: #fff; border-bottom: 1px solid #e2e8f0;
    overflow-x: auto; flex-shrink: 0;
  }
  .fd-flujo-step { display: flex; align-items: center; gap: 5px; white-space: nowrap; }
  .fd-flujo-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .fd-flujo-label { font-size: 11px; font-weight: 500; color: #64748b; }
  .fd-flujo-count { font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 10px; border: 1px solid; }
  .fd-flujo-arrow { color: #cbd5e1; font-size: 14px; margin: 0 2px; }

  /* ── Alert ── */
  .fd-alert-wrap { padding: 12px 28px 0; }
  .fd-alert { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; animation: slideDown .3s ease; }
  @keyframes slideDown { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
  .fd-alert--error   { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
  .fd-alert--success { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
  .fd-alert__close { margin-left: auto; background: none; border: none; color: inherit; cursor: pointer; font-size: 18px; }

  /* ── Tabs ── */
  .fd-tabs-wrap { padding: 14px 28px 0; flex-shrink: 0; }
  .fd-tabs { display: flex; gap: 4px; border-bottom: 2px solid #e8eaed; padding-bottom: 0; overflow-x: auto; }
  .fd-tab { padding: 8px 14px; border: none; background: transparent; color: #64748b; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all .2s; display: flex; align-items: center; gap: 6px; white-space: nowrap; }
  .fd-tab:hover { color: #0a3d2e; }
  .fd-tab--active { color: #0a3d2e; border-bottom-color: #0a3d2e; font-weight: 600; }
  .fd-tab-badge { font-size: 11px; font-weight: 700; padding: 1px 6px; border-radius: 10px; background: #e2e8f0; color: #475569; }
  .fd-tab--active .fd-tab-badge { background: #d1fae5; color: #065f46; }

  /* ── Content ── */
  .fd-content { flex: 1; overflow-y: auto; padding: 20px 28px; }

  /* ── Loading / Empty ── */
  .fd-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 260px; gap: 14px; color: #64748b; font-size: 14px; }
  .fd-spinner { width: 34px; height: 34px; border: 3px solid #e2e8f0; border-top-color: #0a3d2e; border-radius: 50%; animation: spin .8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .fd-empty { display: flex; flex-direction: column; align-items: center; padding: 60px 20px; text-align: center; }
  .fd-empty__icon { width: 52px; height: 52px; background: #f1f5f9; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #94a3b8; margin-bottom: 14px; }
  .fd-empty__icon svg { width: 24px; height: 24px; }
  .fd-empty__title { font-size: 15px; font-weight: 600; color: #334155; margin-bottom: 6px; }
  .fd-empty__desc { font-size: 13px; color: #94a3b8; max-width: 300px; }

  /* ── Grid ── */
  .fd-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 16px; }

  /* ── Card ── */
  .fd-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; transition: box-shadow .2s, transform .2s; }
  .fd-card:hover { box-shadow: 0 8px 24px rgba(10,61,46,.09); transform: translateY(-2px); }
  .fd-card--ocupada { opacity: .72; border-color: #fca5a5; }
  .fd-card--completada { border-color: #86efac; }

  .fd-card__head { padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; background: #fafbfc; flex-wrap: wrap; gap: 6px; }
  .fd-card__tags { display: flex; gap: 5px; flex-wrap: wrap; }
  .fd-card__code { font-family: 'DM Mono', monospace; font-size: 11px; color: #94a3b8; background: #f1f5f9; padding: 2px 7px; border-radius: 4px; }
  .fd-tag { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; border: 1px solid transparent; }
  .fd-tag--regular   { background: #dbeafe; color: #1e40af; }
  .fd-tag--campesena { background: #fef9c3; color: #854d0e; }
  .fd-tag--mia       { background: #dbeafe; color: #1e3a8a; }
  .fd-tag--ocupada   { background: #fee2e2; color: #991b1b; }

  .fd-card__body { padding: 14px 16px; }
  .fd-card__title { font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 12px; line-height: 1.45; }
  .fd-card__meta { display: flex; flex-direction: column; gap: 7px; margin-bottom: 14px; }

  .fd-meta-row { display: flex; align-items: flex-start; gap: 7px; }
  .fd-meta-row__icon { color: #94a3b8; flex-shrink: 0; margin-top: 2px; }
  .fd-meta-row__label { display: block; font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: .06em; }
  .fd-meta-row__value { display: block; font-size: 12px; font-weight: 500; color: #334155; }

  .fd-correccion-nota { font-size: 12px; background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; border-radius: 6px; padding: 8px 10px; margin-top: 4px; }

  .fd-cupos { }
  .fd-cupos__labels { display: flex; justify-content: space-between; font-size: 11px; color: #64748b; margin-bottom: 5px; }
  .fd-cupos__track { height: 5px; background: #f1f5f9; border-radius: 99px; overflow: hidden; }
  .fd-cupos__fill { height: 100%; background: linear-gradient(90deg, #0a3d2e, #16a34a); border-radius: 99px; transition: width .6s ease; min-width: 3px; }

  .fd-card__foot { padding: 12px 16px; border-top: 1px solid #f1f5f9; background: #fafbfc; display: flex; flex-direction: column; gap: 7px; }

  .fd-notice { padding: 7px 11px; border-radius: 7px; font-size: 12px; font-weight: 500; text-align: center; }
  .fd-notice--warn { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
  .fd-notice--ok   { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
  .fd-notice--info { background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; }

  /* ── Buttons ── */
  .fd-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 9px 16px; border-radius: 8px; border: none; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all .2s; width: 100%; }
  .fd-btn--sm { padding: 7px 12px; font-size: 12px; }
  .fd-btn--primary   { background: #0a3d2e; color: #fff; }
  .fd-btn--primary:hover:not(:disabled) { background: #0d5240; }
  .fd-btn--secondary { background: #f8fafc; color: #334155; border: 1px solid #e2e8f0; }
  .fd-btn--secondary:hover:not(:disabled) { background: #f1f5f9; }
  .fd-btn--success   { background: #16a34a; color: #fff; }
  .fd-btn--success:hover:not(:disabled)  { background: #15803d; }
  .fd-btn--warning   { background: #f59e0b; color: #fff; }
  .fd-btn--warning:hover:not(:disabled)  { background: #d97706; }
  .fd-btn--danger    { background: #dc2626; color: #fff; }
  .fd-btn--danger:hover:not(:disabled)   { background: #b91c1c; }
  .fd-btn--ghost     { background: transparent; color: #64748b; border: 1px solid #e2e8f0; }
  .fd-btn--ghost:hover:not(:disabled)    { background: #f8fafc; }
  .fd-btn--loading   { opacity: .7; cursor: not-allowed; }
  .fd-btn:disabled   { opacity: .55; cursor: not-allowed; }
  .fd-btn-spinner { width: 12px; height: 12px; border: 2px solid rgba(255,255,255,.3); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; }

  /* ── Modal ── */
  .fd-modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.45); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
  .fd-modal { background: #fff; border-radius: 14px; width: 100%; max-width: 480px; overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,.18); }
  .fd-modal__header { padding: 18px 22px 14px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; }
  .fd-modal__title { font-size: 16px; font-weight: 700; color: #0f172a; }
  .fd-modal__close { background: none; border: none; font-size: 22px; color: #94a3b8; cursor: pointer; line-height: 1; }
  .fd-modal__close:hover { color: #334155; }
  .fd-modal__body { padding: 18px 22px; }
  .fd-modal__subtitle { font-size: 13px; color: #475569; margin-bottom: 4px; }
  .fd-modal__info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; margin: 10px 0; font-size: 13px; color: #0f172a; }
  .fd-modal__note { font-size: 12px; color: #64748b; margin-top: 10px; }
  .fd-modal__footer { padding: 14px 22px 18px; display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid #f1f5f9; }
  .fd-modal__footer .fd-btn { width: auto; }
  .fd-textarea { width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 13px; color: #334155; resize: vertical; outline: none; transition: border-color .2s; }
  .fd-textarea:focus { border-color: #0a3d2e; }
`;

export default FuncionarioDashboard;