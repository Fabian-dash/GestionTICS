import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ESTADO = {
  PENDIENTE_COORDINADOR: 'pendiente_coordinador',
  LISTA_ESPERA:          'lista_espera',
  EN_PROCESO:            'en_proceso',
  A_CORREGIR:            'a_corregir',
  CREADA:                'creada',
  MATRICULADA:           'matriculada',
  COMPLETADA:            'completado',
  RECHAZADA:             'rechazada',
};

const ESTADO_CONFIG = {
  [ESTADO.PENDIENTE_COORDINADOR]: { label: 'Pendiente',   color: '#92400e', bg: '#fef3c7', border: '#fde68a', dot: '#f59e0b' },
  [ESTADO.LISTA_ESPERA]:          { label: 'Disponible',  color: '#065f46', bg: '#d1fae5', border: '#6ee7b7', dot: '#10b981' },
  [ESTADO.EN_PROCESO]:            { label: 'En proceso',  color: '#1e40af', bg: '#dbeafe', border: '#93c5fd', dot: '#3b82f6' },
  [ESTADO.A_CORREGIR]:            { label: 'A corregir',  color: '#7f1d1d', bg: '#fee2e2', border: '#fca5a5', dot: '#ef4444' },
  [ESTADO.CREADA]:                { label: 'Creada',      color: '#4c1d95', bg: '#ede9fe', border: '#c4b5fd', dot: '#7c3aed' },
  [ESTADO.MATRICULADA]:           { label: 'Matriculada', color: '#134e4a', bg: '#ccfbf1', border: '#5eead4', dot: '#14b8a6' },
  [ESTADO.COMPLETADA]:            { label: 'Completada',  color: '#14532d', bg: '#bbf7d0', border: '#4ade80', dot: '#16a34a' },
  [ESTADO.RECHAZADA]:             { label: 'Rechazada',   color: '#7f1d1d', bg: '#fee2e2', border: '#fca5a5', dot: '#ef4444' },
};

const TABS = [
  { id: 'disponibles',  label: 'Disponibles',  icon: '🟢', estados: [ESTADO.LISTA_ESPERA] },
  { id: 'en_proceso',   label: 'En proceso',   icon: '🔵', estados: [ESTADO.EN_PROCESO] },
  { id: 'a_corregir',   label: 'A corregir',   icon: '🔴', estados: [ESTADO.A_CORREGIR] },
  { id: 'creadas',      label: 'Creadas',       icon: '🟣', estados: [ESTADO.CREADA] },
  { id: 'matriculadas', label: 'Matriculadas',  icon: '🩵', estados: [ESTADO.MATRICULADA] },
  { id: 'completadas',  label: 'Completadas',   icon: '✅', estados: [ESTADO.COMPLETADA] },
  { id: 'todas',        label: 'Todas',         icon: '📋', estados: null },
];

const FLUJO = [
  ESTADO.LISTA_ESPERA, ESTADO.EN_PROCESO, ESTADO.A_CORREGIR,
  ESTADO.CREADA, ESTADO.MATRICULADA, ESTADO.COMPLETADA,
];

const fmt = (d) => d
  ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

const fueCorregida = (oferta) => {
  const sinNovedades = !oferta.novedades_aprendices || oferta.novedades_aprendices.length === 0;
  const sinMotivo    = !oferta.motivo_correccion;
  const historial    = oferta.historial_estados || [];
  const tuvoACorregir = historial.some(h =>
    h.estado?.codigo === 'a_corregir' || h.comentario?.toLowerCase().includes('corregid')
  );
  return sinNovedades && sinMotivo && tuvoACorregir;
};

/* ══════════════════════════════════════════════════════════
   DASHBOARD PRINCIPAL
══════════════════════════════════════════════════════════ */
const FuncionarioDashboard = () => {
  const [ofertas,         setOfertas]         = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [actionLoading,   setActionLoading]   = useState(null);
  const [descargando,     setDescargando]     = useState(null);
  const [error,           setError]           = useState('');
  const [success,         setSuccess]         = useState('');
  const [tabActiva,       setTabActiva]       = useState('disponibles');
  const [collapsed,       setCollapsed]       = useState(false);
  const [modalDetalle,    setModalDetalle]    = useState(null);
  const [modalCorreccion, setModalCorreccion] = useState(null);
  const [motivoCorrec,    setMotivoCorrec]    = useState('');
  const [modalMatricula,  setModalMatricula]  = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const tipo = user.tipo_funcionario || 'regular';

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      setLoading(true);
      const r = await api.get(`/ofertas-funcionario/todas/${tipo}`);
      setOfertas(r.data.data || []);
    } catch { setError('Error al cargar las ofertas'); }
    finally   { setLoading(false); }
  };

  const flash = (t, m) => {
    t === 'success' ? setSuccess(m) : setError(m);
    setTimeout(() => t === 'success' ? setSuccess('') : setError(''), 4500);
  };

  const handleRevisar = async (id) => {
    if (!window.confirm('¿Tomar esta oferta para revisión?')) return;
    try {
      setActionLoading(id);
      await api.patch(`/funcionarios/revisar/${id}`);
      flash('success', 'Oferta asignada — ahora está en proceso');
      cargar();
    } catch (e) { flash('error', e.response?.data?.message || 'Error'); }
    finally     { setActionLoading(null); }
  };

  const handleSolicitarCorreccion = async (ofertaId, motivo, aprendices = []) => {
    if (!motivo?.trim()) { flash('error', 'Escribe el motivo de corrección'); return; }
    try {
      setActionLoading(ofertaId);
      await api.patch(`/funcionarios/solicitar-correccion/${ofertaId}`, {
        motivo: motivo.trim(),
        aprendices_con_novedad: aprendices,
      });
      flash('success', `Corrección solicitada — ${aprendices.length} aprendiz(es) marcados`);
      setModalDetalle(null);
      setMotivoCorrec('');
      cargar();
    } catch (e) { flash('error', e.response?.data?.message || 'Error'); }
    finally     { setActionLoading(null); }
  };

  const handleCrear = async (id) => {
    try {
      setActionLoading(id);
      await api.patch(`/funcionarios/aprobar/${id}`);
      flash('success', 'Oferta creada — ficha generada exitosamente');
      setModalDetalle(null);
      cargar();
    } catch (e) { flash('error', e.response?.data?.message || 'Error'); }
    finally     { setActionLoading(null); }
  };

  // ─── MATRICULAR DESDE MODAL DETALLE ───────────────────────────────────────
  // Si la oferta está en_proceso (fue corregida) → usa aprobar-y-matricular
  // Si está en creada → usa matricular normal
  const handleMatricularDesdeDetalle = async (oferta) => {
    try {
      setActionLoading(oferta._id);
      const cod = oferta.estado?.codigo;
      const endpoint = cod === 'en_proceso'
        ? `/funcionarios/aprobar-y-matricular/${oferta._id}`
        : `/funcionarios/matricular/${oferta._id}`;
      await api.patch(endpoint);
      flash('success', '🎓 ¡Aprendices matriculados correctamente!');
      setModalDetalle(null);
      cargar();
    } catch (e) { flash('error', e.response?.data?.message || 'Error'); }
    finally     { setActionLoading(null); }
  };

  // ─── MATRICULAR DESDE TARJETA (estado CREADA) ────────────────────────────
  const handleMatricular = async () => {
    if (!window.confirm('¿Confirmar matrícula de aprendices?')) return;
    try {
      setActionLoading(modalMatricula._id);
      const cod = modalMatricula.estado?.codigo;
      const endpoint = cod === 'en_proceso'
        ? `/funcionarios/aprobar-y-matricular/${modalMatricula._id}`
        : `/funcionarios/matricular/${modalMatricula._id}`;
      await api.patch(endpoint);
      flash('success', '🎓 ¡Aprendices matriculados correctamente!');
      setModalMatricula(null);
      cargar();
    } catch (e) { flash('error', e.response?.data?.message || 'Error'); }
    finally     { setActionLoading(null); }
  };

  const handleCompletar = async (id) => {
    if (!window.confirm('¿Marcar como completada? Esta acción es definitiva.')) return;
    try {
      setActionLoading(id);
      await api.patch(`/funcionarios/completar/${id}`);
      flash('success', 'Oferta completada');
      cargar();
    } catch (e) { flash('error', e.response?.data?.message || 'Error'); }
    finally     { setActionLoading(null); }
  };

  const handleDescargar = async (id) => {
    try {
      setDescargando(id);
      const r = await api.get(`/ofertas/${id}/exportar-excel`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', `oferta_${id}.xlsx`);
      document.body.appendChild(a); a.click(); a.remove();
      flash('success', 'Excel descargado');
    } catch { flash('error', 'Error al descargar'); }
    finally  { setDescargando(null); }
  };

  const tabCfg   = TABS.find(t => t.id === tabActiva);
  const filtradas = tabCfg?.estados
    ? ofertas.filter(o => tabCfg.estados.includes(o.estado?.codigo))
    : ofertas;
  const counts   = Object.fromEntries(
    TABS.map(t => [t.id, t.estados
      ? ofertas.filter(o => t.estados.includes(o.estado?.codigo)).length
      : ofertas.length
    ])
  );

  const stats = {
    total:       ofertas.length,
    disponibles: ofertas.filter(o => o.estado?.codigo === ESTADO.LISTA_ESPERA).length,
    enProceso:   ofertas.filter(o => o.estado?.codigo === ESTADO.EN_PROCESO).length,
    completadas: ofertas.filter(o => o.estado?.codigo === ESTADO.COMPLETADA).length,
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="fd-shell">

        {/* ── SIDEBAR ── */}
        <aside className={`fd-sidebar${collapsed ? ' fd-sidebar--sm' : ''}`}>
          <div className="fd-brand">
            <div className="fd-brand__mark">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            {!collapsed && (
              <div className="fd-brand__text">
                <span className="fd-brand__name">GestiónTICS</span>
                <span className="fd-brand__sub">SENA · Portal</span>
              </div>
            )}
            <button className="fd-brand__toggle" onClick={() => setCollapsed(c => !c)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d={collapsed ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'}/>
              </svg>
            </button>
          </div>

          <nav className="fd-nav">
            {!collapsed && <span className="fd-nav__label">PANEL</span>}
            <button className="fd-nav__item fd-nav__item--active">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
              {!collapsed && <span>Ofertas</span>}
              {!collapsed && <span className="fd-nav__badge">{stats.total}</span>}
            </button>
          </nav>

          {!collapsed && (
            <div className="fd-sidebar__foot">
              <div className="fd-user">
                <div className="fd-user__av">{(user?.nombre || 'F')[0].toUpperCase()}</div>
                <div className="fd-user__info">
                  <span className="fd-user__name">{user?.nombre || 'Funcionario'}</span>
                  <span className="fd-user__role">{tipo === 'campesena' ? '🌾 Campesena' : '🎓 Regular'}</span>
                </div>
              </div>
              <button className="fd-logout"
                onClick={() => { localStorage.clear(); window.location.href = '/login'; }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 16l4-4m0 0l-4-4m4 4H7M13 16v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                Cerrar sesión
              </button>
            </div>
          )}
        </aside>

        {/* ── MAIN ── */}
        <div className="fd-main">

          {/* TOPBAR */}
          <header className="fd-topbar">
            <div className="fd-topbar__left">
              <h1 className="fd-topbar__title">Gestión de Ofertas</h1>
              <div className="fd-topbar__crumb">
                <span>Funcionario</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
                <span className="fd-topbar__crumb-current">{tabCfg?.label}</span>
              </div>
            </div>
            <div className="fd-topbar__right">
              <span className="fd-tipo-pill">
                {tipo === 'campesena' ? '🌾 Campesena' : '🎓 Regular'}
              </span>
              <img
                src="https://www.sena.edu.co/Style%20Library/alayout/images/logoSena.png"
                alt="SENA" className="fd-sena-logo"
              />
            </div>
          </header>

          {/* STATS */}
          <div className="fd-stats">
            {[
              { label: 'Total ofertas', value: stats.total,       color: '#6366f1' },
              { label: 'Disponibles',   value: stats.disponibles, color: '#10b981' },
              { label: 'En proceso',    value: stats.enProceso,   color: '#3b82f6' },
              { label: 'Completadas',   value: stats.completadas, color: '#16a34a' },
            ].map(s => (
              <div key={s.label} className="fd-stat" style={{ '--accent': s.color }}>
                <span className="fd-stat__val">{s.value}</span>
                <span className="fd-stat__lbl">{s.label}</span>
              </div>
            ))}
          </div>

          {/* FLUJO */}
          <div className="fd-flujo">
            {FLUJO.map((cod, i) => {
              const cfg    = ESTADO_CONFIG[cod];
              const cnt    = ofertas.filter(o => o.estado?.codigo === cod).length;
              const activo = filtradas.some(o => o.estado?.codigo === cod);
              return (
                <React.Fragment key={cod}>
                  <div className={`fd-flujo__step${activo ? ' fd-flujo__step--active' : ''}`}>
                    <div className="fd-flujo__dot" style={{ background: cfg.dot }}/>
                    <span className="fd-flujo__name">{cfg.label}</span>
                    {cnt > 0 && (
                      <span className="fd-flujo__cnt"
                        style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
                        {cnt}
                      </span>
                    )}
                  </div>
                  {i < FLUJO.length - 1 && <div className="fd-flujo__arrow">›</div>}
                </React.Fragment>
              );
            })}
          </div>

          {/* ALERTAS */}
          {(error || success) && (
            <div className="fd-alerts">
              {error   && <div className="fd-alert fd-alert--err"><span>⚠ {error}</span><button onClick={() => setError('')}>×</button></div>}
              {success && <div className="fd-alert fd-alert--ok"><span>✓ {success}</span></div>}
            </div>
          )}

          {/* TABS */}
          <div className="fd-tabs-bar">
            {TABS.map(t => (
              <button key={t.id}
                className={`fd-tab${tabActiva === t.id ? ' fd-tab--on' : ''}`}
                onClick={() => setTabActiva(t.id)}>
                <span className="fd-tab__icon">{t.icon}</span>
                {t.label}
                {counts[t.id] > 0 && <span className="fd-tab__cnt">{counts[t.id]}</span>}
              </button>
            ))}
          </div>

          {/* CONTENIDO */}
          <main className="fd-content">
            {loading ? (
              <div className="fd-spinner-wrap">
                <div className="fd-spinner"/>
                <p>Cargando ofertas...</p>
              </div>
            ) : filtradas.length === 0 ? (
              <div className="fd-empty">
                <div className="fd-empty__ico">📭</div>
                <p className="fd-empty__title">Sin ofertas en "{tabCfg?.label}"</p>
                <p className="fd-empty__sub">No hay ofertas en esta categoría por el momento.</p>
              </div>
            ) : (
              <div className="fd-grid">
                {filtradas.map(o => (
                  <OfertaCard key={o._id} oferta={o}
                    descargando={descargando === o._id}
                    actionLoading={actionLoading === o._id}
                    onDescargar={handleDescargar}
                    onRevisar={handleRevisar}
                    onCorreccion={(of) => { setModalCorreccion(of); setMotivoCorrec(''); }}
                    onCrear={handleCrear}
                    onMatricular={(of) => setModalMatricula(of)}
                    onCompletar={handleCompletar}
                    onDetalle={(of) => setModalDetalle(of)}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* MODAL DETALLE */}
      {modalDetalle && (
        <ModalDetalle
          oferta={modalDetalle}
          onClose={() => { setModalDetalle(null); setMotivoCorrec(''); }}
          onSolicitarCorreccion={handleSolicitarCorreccion}
          onCrear={handleCrear}
          onMatricular={handleMatricularDesdeDetalle}
          actionLoading={actionLoading}
          motivoCorrec={motivoCorrec}
          setMotivoCorrec={setMotivoCorrec}
        />
      )}

      {/* MODAL CORRECCIÓN RÁPIDA */}
      {modalCorreccion && (
        <div className="fd-overlay" onClick={() => setModalCorreccion(null)}>
          <div className="fd-modal" onClick={e => e.stopPropagation()}>
            <div className="fd-modal__head">
              <div className="fd-modal__head-icon fd-modal__head-icon--warn">⚠</div>
              <div>
                <h3 className="fd-modal__title">Solicitar corrección</h3>
                <p className="fd-modal__sub">{modalCorreccion.programa_formacion?.nombre_programa}</p>
              </div>
              <button className="fd-modal__close" onClick={() => setModalCorreccion(null)}>✕</button>
            </div>
            <div className="fd-modal__body">
              <label className="fd-label">
                Motivo de la corrección <span className="fd-required">*</span>
              </label>
              <textarea className="fd-textarea" rows={4}
                placeholder="Describe las inconsistencias encontradas..."
                value={motivoCorrec}
                onChange={e => setMotivoCorrec(e.target.value)}/>
            </div>
            <div className="fd-modal__foot">
              <button className="fd-btn fd-btn--ghost" onClick={() => setModalCorreccion(null)}>
                Cancelar
              </button>
              <button className="fd-btn fd-btn--danger"
                disabled={!motivoCorrec.trim() || actionLoading === modalCorreccion._id}
                onClick={() => handleSolicitarCorreccion(modalCorreccion._id, motivoCorrec, [])}>
                {actionLoading === modalCorreccion._id
                  ? <><Spinner/> Enviando...</>
                  : 'Enviar corrección'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MATRÍCULA (desde tarjeta estado CREADA) */}
      {modalMatricula && (
        <div className="fd-overlay" onClick={() => setModalMatricula(null)}>
          <div className="fd-modal" onClick={e => e.stopPropagation()}>
            <div className="fd-modal__head">
              <div className="fd-modal__head-icon fd-modal__head-icon--ok">🎓</div>
              <div>
                <h3 className="fd-modal__title">Confirmar matrícula</h3>
                <p className="fd-modal__sub">{modalMatricula.programa_formacion?.nombre_programa}</p>
              </div>
              <button className="fd-modal__close" onClick={() => setModalMatricula(null)}>✕</button>
            </div>
            <div className="fd-modal__body">
              <div className="fd-info-box">
                <div className="fd-info-box__row">
                  <span>Código</span>
                  <strong>{modalMatricula.programa_formacion?.codigo}</strong>
                </div>
                <div className="fd-info-box__row">
                  <span>Cupos</span>
                  <strong>{modalMatricula.cupo_maximo}</strong>
                </div>
              </div>
              <p className="fd-modal__note">
                Esta acción registrará formalmente la matrícula y enviará una nota de confirmación al instructor.
              </p>
            </div>
            <div className="fd-modal__foot">
              <button className="fd-btn fd-btn--ghost" onClick={() => setModalMatricula(null)}>
                Cancelar
              </button>
              <button className="fd-btn fd-btn--primary"
                disabled={actionLoading === modalMatricula._id}
                onClick={handleMatricular}>
                {actionLoading === modalMatricula._id
                  ? <><Spinner/> Matriculando...</>
                  : '🎓 Confirmar matrícula'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ══════════════════════════════════════════════════════════
   TARJETA DE OFERTA
══════════════════════════════════════════════════════════ */
const OfertaCard = ({
  oferta, descargando, actionLoading,
  onDescargar, onRevisar, onCorreccion, onCrear,
  onMatricular, onCompletar, onDetalle,
}) => {
  const cod  = oferta.estado?.codigo;
  const cfg  = ESTADO_CONFIG[cod] || ESTADO_CONFIG[ESTADO.LISTA_ESPERA];
  const mia  = oferta.tomadaPorMi;
  const otro = oferta.tomadaPorOtro;

  const ocupados = (oferta.cupo_maximo || 0) - (oferta.cupos_disponibles || 0);
  const pct      = oferta.cupo_maximo
    ? Math.round((ocupados / oferta.cupo_maximo) * 100)
    : 0;

  const corregida      = fueCorregida(oferta);
  const puedeRevisar   = cod === ESTADO.LISTA_ESPERA && !oferta.funcionario_asignado;
  const enProcesoMia   = cod === ESTADO.EN_PROCESO && mia;
  const puedeMatricula = cod === ESTADO.CREADA && mia;
  const puedeCompletar = cod === ESTADO.MATRICULADA && mia;

  return (
    <div className={`ofc-card${otro ? ' ofc-card--locked' : ''}`}>
      <div className="ofc-card__top">
        <div className="ofc-card__badges">
          <span className="ofc-badge"
            style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: cfg.dot, display: 'inline-block', marginRight: 5,
            }}/>
            {cfg.label}
          </span>
          <span className={`ofc-badge ofc-badge--tipo${oferta.es_campesena ? ' ofc-badge--camp' : ''}`}>
            {oferta.es_campesena ? '🌾 Campesena' : '🎓 Regular'}
          </span>
          {mia && !otro && <span className="ofc-badge ofc-badge--mia">✓ Tuya</span>}
          {otro          && <span className="ofc-badge ofc-badge--lock">🔒 Ocupada</span>}
          {enProcesoMia && corregida && (
            <span className="ofc-badge ofc-badge--corregida">✏ Corregida</span>
          )}
        </div>
        <code className="ofc-code">{oferta.programa_formacion?.codigo}</code>
      </div>

      <div className="ofc-card__body">
        <h3 className="ofc-card__title">{oferta.programa_formacion?.nombre_programa}</h3>

        {enProcesoMia && corregida && (
          <div className="ofc-nota-correccion">
            <span className="ofc-nota-correccion__icon">✅</span>
            <span>El instructor ya corrigió los datos. Revisa el detalle y procede a matricular.</span>
          </div>
        )}

        <div className="ofc-meta">
          <div className="ofc-meta__row">
            <span className="ofc-meta__lbl">Instructor</span>
            <span className="ofc-meta__val">{oferta.creado_por?.nombre || '—'}</span>
          </div>
          <div className="ofc-meta__row">
            <span className="ofc-meta__lbl">Empresa</span>
            <span className="ofc-meta__val">{oferta.empresa_solicitante?.nombre || '—'}</span>
          </div>
          <div className="ofc-meta__row">
            <span className="ofc-meta__lbl">Período</span>
            <span className="ofc-meta__val">
              {fmt(oferta.fechas?.inicio)} — {fmt(oferta.fechas?.fin)}
            </span>
          </div>
        </div>

        <div className="ofc-cupos">
          <div className="ofc-cupos__labels">
            <span>Cupos</span>
            <span><b>{ocupados}</b> / {oferta.cupo_maximo}</span>
          </div>
          <div className="ofc-cupos__bar">
            <div className="ofc-cupos__fill" style={{
              width: `${pct}%`,
              background: pct > 90 ? '#ef4444' : pct > 60 ? '#f59e0b' : '#10b981',
            }}/>
          </div>
        </div>
      </div>

      <div className="ofc-card__foot">
        <button className="fd-btn fd-btn--ghost fd-btn--sm"
          disabled={descargando || !!actionLoading}
          onClick={() => onDescargar(oferta._id)}>
          {descargando ? <><Spinner/> ...</> : '↓ Excel'}
        </button>

        {puedeRevisar && (
          <button className="fd-btn fd-btn--primary fd-btn--sm"
            disabled={!!actionLoading}
            onClick={() => onRevisar(oferta._id)}>
            {actionLoading ? <><Spinner/> ...</> : '▶ Revisar'}
          </button>
        )}

        {/* EN PROCESO + MÍA: si fue corregida → solo Detalle (matricula desde adentro) */}
        {enProcesoMia && !corregida && (
          <>
            <button className="fd-btn fd-btn--warn fd-btn--sm"
              disabled={!!actionLoading}
              onClick={() => onCorreccion(oferta)}>
              ✎ Corrección
            </button>
            <button className="fd-btn fd-btn--success fd-btn--sm"
              disabled={!!actionLoading}
              onClick={() => onCrear(oferta._id)}>
              {actionLoading ? <><Spinner/> ...</> : '✓ Crear'}
            </button>
          </>
        )}

        {enProcesoMia && (
          <button className="fd-btn fd-btn--info fd-btn--sm"
            disabled={!!actionLoading}
            onClick={() => onDetalle(oferta)}>
            ⊙ Detalle
          </button>
        )}

        {puedeMatricula && (
          <button className="fd-btn fd-btn--primary fd-btn--sm"
            disabled={!!actionLoading}
            onClick={() => onMatricular(oferta)}>
            {actionLoading ? <><Spinner/> ...</> : '🎓 Matricular'}
          </button>
        )}

        {puedeCompletar && (
          <button className="fd-btn fd-btn--success fd-btn--sm"
            disabled={!!actionLoading}
            onClick={() => onCompletar(oferta._id)}>
            {actionLoading ? <><Spinner/> ...</> : '✅ Completar'}
          </button>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   MODAL DETALLE
══════════════════════════════════════════════════════════ */
const ModalDetalle = ({
  oferta, onClose, onSolicitarCorreccion, onCrear, onMatricular,
  actionLoading, motivoCorrec, setMotivoCorrec,
}) => {
  const [tab,        setTab]        = useState('info');
  const [aprendices, setAprendices] = useState([]);
  const [loadingAp,  setLoadingAp]  = useState(false);
  const [novedades,  setNovedades]  = useState({});

  const prog     = oferta?.programa_formacion || {};
  const inst     = oferta?.creado_por || {};
  const ocupados = (oferta?.cupo_maximo || 0) - (oferta?.cupos_disponibles || 0);
  const corregida = fueCorregida(oferta);

  useEffect(() => {
    if (!oferta) return;
    setLoadingAp(true);
    api.get(`/inscripciones/oferta/${oferta._id}`)
      .then(r => setAprendices((r.data.data || []).map(i => ({
        _id:              i._id,
        nombre_completo:  [i.nombres, i.apellidos].filter(Boolean).join(' ') || i.nombre || '',
        numero_documento: i.numero_documento || '',
        telefono:         i.telefono || '',
        correo:           i.correo || i.correo_electronico || '',
        completo:         !!(i.nombres && i.numero_documento && i.telefono
                            && (i.correo || i.correo_electronico)),
      }))))
      .catch(console.error)
      .finally(() => setLoadingAp(false));
  }, [oferta]);

  const toggleNov = (id, on, obs = '') =>
    setNovedades(p => {
      const n = { ...p };
      on ? n[id] = { on: true, obs: obs || 'Datos incorrectos' } : delete n[id];
      return n;
    });
  const setObs   = (id, obs) =>
    setNovedades(p => ({ ...p, [id]: { ...p[id], on: true, obs } }));
  const novCount = Object.values(novedades).filter(n => n?.on).length;

  const handleSolicitar = () => {
    if (!motivoCorrec.trim()) { alert('Escribe el motivo'); return; }
    const list = Object.entries(novedades)
      .filter(([, d]) => d?.on)
      .map(([id, d]) => ({
        aprendiz_id: id,
        nombre: aprendices.find(a => a._id === id)?.nombre_completo || '',
        observacion: d.obs || 'Datos incorrectos',
      }));
    onSolicitarCorreccion(oferta._id, motivoCorrec, list);
    onClose();
  };

  const TABS_M = [
    { id: 'info',       label: 'Información' },
    { id: 'aprendices', label: `Aprendices${aprendices.length ? ` (${aprendices.length})` : ''}` },
    { id: 'decision',   label: 'Decisión' },
  ];

  return (
    <div className="fd-overlay" onClick={onClose}>
      <div className="fd-modal fd-modal--lg" onClick={e => e.stopPropagation()}>

        {/* HEAD */}
        <div className="fd-modal__head fd-modal__head--dark">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div className="fd-modal__head-icon fd-modal__head-icon--dark">📋</div>
            <div style={{ minWidth: 0 }}>
              <h3 className="fd-modal__title fd-modal__title--light">Detalle de Oferta</h3>
              <p className="fd-modal__sub fd-modal__sub--light">
                {prog.codigo} · {prog.nombre_programa}
              </p>
            </div>
          </div>
          {corregida && (
            <span className="fd-modal__corregida-chip">✏ Instructor corrigió</span>
          )}
          <button className="fd-modal__close fd-modal__close--light" onClick={onClose}>✕</button>
        </div>

        {/* TABS */}
        <div className="fd-modal__tabs">
          {TABS_M.map(t => (
            <button key={t.id}
              className={`fd-modal__tab${tab === t.id ? ' fd-modal__tab--on' : ''}`}
              onClick={() => setTab(t.id)}>
              {t.label}
              {t.id === 'aprendices' && novCount > 0 && (
                <span className="fd-modal__tab-badge">⚠ {novCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* SCROLL BODY */}
        <div className="fd-modal__scroll">

          {/* ── Tab: INFORMACIÓN ── */}
          {tab === 'info' && (
            <div className="fd-detail-grid">
              <Section title="Instructor">
                <Field label="Nombre"    value={[inst.nombre, inst.apellido].filter(Boolean).join(' ') || '—'} />
                <Field label="Correo"    value={inst.correoElectronico || inst.correo || '—'} mono />
                <Field label="Documento" value={inst.numeroIdentificacion || '—'} mono />
                <Field label="Teléfono"  value={inst.telefono || '—'} />
              </Section>
              <Section title="Programa">
                <Field label="Código"  value={prog.codigo || '—'} mono />
                <Field label="Nombre"  value={prog.nombre_programa || '—'} wide />
                <Field label="Nivel"   value={prog.nivel || '—'} />
                <Field label="Horas"   value={prog.duracion_maxima ? `${prog.duracion_maxima} h` : '—'} />
              </Section>
              <Section title="Oferta">
                <Field label="Municipio" value={oferta.ubicacion?.municipio?.nombre || '—'} />
                <Field label="Empresa"   value={oferta.empresa_solicitante?.nombre || '—'} />
                <Field label="Inicio"    value={fmt(oferta.fechas?.inicio)} />
                <Field label="Fin"       value={fmt(oferta.fechas?.fin)} />
                <Field label="Cupos"     value={`${ocupados} / ${oferta.cupo_maximo}`} />
                <Field label="Campesena" value={oferta.es_campesena ? 'Sí' : 'No'} />
              </Section>
            </div>
          )}

          {/* ── Tab: APRENDICES ── */}
          {tab === 'aprendices' && (
            <div className="fd-ap-wrap">
              {loadingAp
                ? <div className="fd-spinner-wrap"><div className="fd-spinner"/></div>
                : aprendices.length === 0
                  ? <p className="fd-empty__sub" style={{ padding: '40px', textAlign: 'center' }}>
                      No hay aprendices inscritos.
                    </p>
                  : <>
                      {novCount > 0 && (
                        <div className="fd-nov-bar">⚠ {novCount} aprendiz(es) marcados con novedad</div>
                      )}
                      <div className="fd-table-wrap">
                        <table className="fd-table">
                          <thead><tr>
                            <th>Novedad</th><th>Nombre</th><th>Documento</th>
                            <th>Teléfono</th><th>Correo</th><th>Observación</th><th>Estado</th>
                          </tr></thead>
                          <tbody>
                            {aprendices.map(ap => {
                              const nov = novedades[ap._id]?.on || false;
                              const obs = novedades[ap._id]?.obs || '';
                              return (
                                <tr key={ap._id}
                                  className={nov ? 'fd-tr--nov' : !ap.completo ? 'fd-tr--inc' : ''}>
                                  <td className="fd-td--center">
                                    <input type="checkbox" checked={nov} className="fd-check"
                                      onChange={e => toggleNov(ap._id, e.target.checked, obs)}/>
                                  </td>
                                  <td>{ap.nombre_completo || <span style={{ color: '#ef4444' }}>(sin nombre)</span>}</td>
                                  <td><code className="fd-mono">{ap.numero_documento || '—'}</code></td>
                                  <td>{ap.telefono || '—'}</td>
                                  <td>{ap.correo || '—'}</td>
                                  <td>
                                    {nov && (
                                      <input value={obs} className="fd-obs-input"
                                        placeholder="Motivo del problema..."
                                        onChange={e => setObs(ap._id, e.target.value)}/>
                                    )}
                                  </td>
                                  <td>
                                    {nov
                                      ? <span className="fd-chip fd-chip--nov">⚠ Novedad</span>
                                      : ap.completo
                                        ? <span className="fd-chip fd-chip--ok">✓ OK</span>
                                        : <span className="fd-chip fd-chip--err">✗ Incompleto</span>
                                    }
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <p style={{ fontSize: 12, color: '#94a3b8', padding: '0 4px', fontStyle: 'italic' }}>
                        Marca los aprendices con problemas y añade una observación antes de solicitar corrección.
                      </p>
                    </>
              }
            </div>
          )}

          {/* ── Tab: DECISIÓN ── */}
          {tab === 'decision' && (
            <div className="fd-decision">
              <div className="fd-decision__strip">
                <div>
                  <p className="fd-detail-label">Programa</p>
                  <p className="fd-detail-val">{prog.nombre_programa || '—'}</p>
                </div>
                <div>
                  <p className="fd-detail-label">Cupos</p>
                  <p className="fd-detail-val" style={{ color: '#0f6e56' }}>
                    {ocupados}/{oferta.cupo_maximo}
                  </p>
                </div>
                <div>
                  <p className="fd-detail-label">Instructor</p>
                  <p className="fd-detail-val">
                    {[inst.nombre, inst.apellido].filter(Boolean).join(' ') || '—'}
                  </p>
                </div>
              </div>

              {/* ── CASO: oferta corregida → solo MATRICULAR (en_proceso → matriculada) ── */}
              {corregida ? (
                <div className="fd-decision__card fd-decision__card--corregida">
                  <div className="fd-decision__corregida-header">
                    <span className="fd-decision__corregida-icon">✅</span>
                    <div>
                      <h4 className="fd-decision__card-title">Instructor ya corrigió los datos</h4>
                      <p style={{ fontSize: 13, color: '#065f46', marginTop: 4 }}>
                        El instructor revisó y envió los datos corregidos. Verifica los aprendices
                        en la pestaña "Aprendices" y procede a confirmar la matrícula.
                      </p>
                    </div>
                  </div>
                  <div className="fd-decision__corregida-info">
                    <span>📋 Revisa la pestaña <strong>Aprendices</strong> para confirmar que los datos están correctos.</span>
                  </div>
                  {/* ✅ CAMBIO CLAVE: llama onMatricular(oferta) que usa aprobar-y-matricular */}
                  <button
                    className="fd-btn fd-btn--matricular"
                    style={{ width: '100%', marginTop: 4 }}
                    disabled={actionLoading === oferta._id}
                    onClick={() => onMatricular(oferta)}>
                    {actionLoading === oferta._id
                      ? <><Spinner/> Matriculando...</>
                      : '🎓 Confirmar matrícula'}
                  </button>
                </div>
              ) : (
                /* ── CASO NORMAL: solicitar corrección o crear ── */
                <>
                  <div className="fd-decision__card fd-decision__card--warn">
                    <h4 className="fd-decision__card-title">✎ Solicitar corrección</h4>
                    <label className="fd-label">
                      Motivo <span className="fd-required">*</span>
                    </label>
                    <textarea className="fd-textarea" rows={3}
                      value={motivoCorrec}
                      onChange={e => setMotivoCorrec(e.target.value)}
                      placeholder="Describe las inconsistencias..."/>
                    {novCount > 0 && (
                      <p className="fd-decision__note">
                        ⚠ {novCount} aprendiz(es) marcados se incluirán en la corrección.
                      </p>
                    )}
                    <button className="fd-btn fd-btn--danger"
                      style={{ width: '100%', marginTop: 8 }}
                      disabled={!motivoCorrec.trim() || actionLoading === oferta._id}
                      onClick={handleSolicitar}>
                      {actionLoading === oferta._id
                        ? <><Spinner/> Enviando...</>
                        : 'Solicitar corrección'}
                    </button>
                  </div>

                  <div className="fd-decision__card fd-decision__card--ok">
                    <h4 className="fd-decision__card-title">✓ Aprobar y crear oferta</h4>
                    <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
                      Si toda la información está correcta, aprueba la oferta.
                      Se generará la ficha de caracterización.
                    </p>
                    {novCount > 0 && (
                      <p className="fd-decision__note"
                        style={{ background: '#fffbeb', borderColor: '#fde68a', color: '#92400e' }}>
                        ⚠ Tienes {novCount} aprendiz(es) con novedad. Considera solicitar corrección primero.
                      </p>
                    )}
                    <button className="fd-btn fd-btn--success"
                      style={{ width: '100%', marginTop: 8 }}
                      disabled={actionLoading === oferta._id}
                      onClick={() => { onCrear(oferta._id); onClose(); }}>
                      {actionLoading === oferta._id
                        ? <><Spinner/> Procesando...</>
                        : '✓ Crear oferta'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── HELPERS ─────────────────────────────────────────────────────────────────*/
const Spinner = () => <span className="fd-btn-spin"/>;

const Section = ({ title, children }) => (
  <div className="fd-section">
    <p className="fd-section__title">{title}</p>
    <div className="fd-section__grid">{children}</div>
  </div>
);

const Field = ({ label, value, mono, wide }) => (
  <div className="fd-field" style={wide ? { gridColumn: '1/-1' } : {}}>
    <span className="fd-field__lbl">{label}</span>
    <span className={`fd-field__val${mono ? ' fd-field__val--mono' : ''}`}>{value}</span>
  </div>
);

/* ── CSS ─────────────────────────────────────────────────────────────────────*/
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --sena:#0a3d2e; --sena2:#0d5240; --green:#10b981;
  --ink:#0f172a; --muted:#64748b; --border:#e2e8f0;
  --bg:#f8fafc; --white:#ffffff; --radius:12px;
  --font:'Plus Jakarta Sans',sans-serif; --mono:'JetBrains Mono',monospace;
}
@keyframes spin  { to { transform:rotate(360deg); } }
@keyframes slide { from { opacity:0;transform:translateY(8px); } to { opacity:1;transform:translateY(0); } }
body { font-family:var(--font); background:var(--bg); color:var(--ink); }

.fd-shell { display:flex; height:100vh; overflow:hidden; }

/* SIDEBAR */
.fd-sidebar { width:240px; min-width:240px; background:var(--sena); display:flex; flex-direction:column; transition:width .25s,min-width .25s; }
.fd-sidebar--sm { width:60px; min-width:60px; }
.fd-brand { display:flex; align-items:center; gap:10px; padding:18px 14px; border-bottom:1px solid rgba(255,255,255,.08); }
.fd-brand__mark { width:32px; height:32px; flex-shrink:0; background:rgba(255,255,255,.12); border-radius:8px; display:flex; align-items:center; justify-content:center; }
.fd-brand__mark svg { width:18px; height:18px; }
.fd-brand__text { flex:1; overflow:hidden; }
.fd-brand__name { display:block; font-size:13px; font-weight:700; color:#fff; white-space:nowrap; }
.fd-brand__sub  { display:block; font-size:10px; color:rgba(255,255,255,.38); letter-spacing:.08em; white-space:nowrap; }
.fd-brand__toggle { flex-shrink:0; width:26px; height:26px; border:none; background:rgba(255,255,255,.07); border-radius:6px; color:rgba(255,255,255,.5); cursor:pointer; display:flex; align-items:center; justify-content:center; }
.fd-brand__toggle svg { width:14px; height:14px; }
.fd-brand__toggle:hover { background:rgba(255,255,255,.14); }
.fd-nav { padding:14px 10px; flex:1; }
.fd-nav__label { display:block; font-size:9px; font-weight:700; color:rgba(255,255,255,.3); letter-spacing:.12em; padding:0 8px 8px; text-transform:uppercase; }
.fd-nav__item { width:100%; display:flex; align-items:center; gap:10px; padding:9px 10px; border:none; border-radius:8px; background:transparent; color:rgba(255,255,255,.55); font-family:var(--font); font-size:13px; font-weight:500; cursor:pointer; transition:all .18s; }
.fd-nav__item svg { width:16px; height:16px; flex-shrink:0; }
.fd-nav__item:hover { background:rgba(255,255,255,.07); color:#fff; }
.fd-nav__item--active { background:rgba(255,255,255,.12); color:#fff; font-weight:600; }
.fd-nav__badge { margin-left:auto; font-size:10px; font-weight:700; background:rgba(16,185,129,.25); color:#6ee7b7; padding:1px 7px; border-radius:20px; }
.fd-sidebar__foot { padding:12px; border-top:1px solid rgba(255,255,255,.07); }
.fd-user { display:flex; align-items:center; gap:9px; padding:8px 10px; background:rgba(255,255,255,.06); border-radius:8px; margin-bottom:8px; overflow:hidden; }
.fd-user__av { width:30px; height:30px; background:var(--sena2); border-radius:7px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; color:#fff; flex-shrink:0; }
.fd-user__name { display:block; font-size:12px; font-weight:600; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.fd-user__role { display:block; font-size:10px; color:rgba(255,255,255,.4); }
.fd-logout { width:100%; display:flex; align-items:center; gap:6px; padding:7px 10px; background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.2); border-radius:7px; color:#fca5a5; font-family:var(--font); font-size:12px; font-weight:500; cursor:pointer; transition:all .2s; }
.fd-logout svg { width:13px; height:13px; flex-shrink:0; }
.fd-logout:hover { background:rgba(239,68,68,.22); color:#fff; }

/* MAIN */
.fd-main { flex:1; display:flex; flex-direction:column; overflow:hidden; min-width:0; }
.fd-topbar { background:var(--white); border-bottom:1px solid var(--border); padding:0 24px; height:58px; display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }
.fd-topbar__title { font-size:16px; font-weight:700; color:var(--ink); }
.fd-topbar__crumb { display:flex; align-items:center; gap:5px; font-size:11px; color:var(--muted); margin-top:2px; }
.fd-topbar__crumb svg { opacity:.5; }
.fd-topbar__crumb-current { color:var(--sena); font-weight:600; }
.fd-topbar__right { display:flex; align-items:center; gap:12px; }
.fd-tipo-pill { padding:4px 10px; background:#ecfdf5; border:1px solid #bbf7d0; border-radius:20px; font-size:11px; font-weight:600; color:#065f46; }
.fd-sena-logo { height:26px; filter:saturate(0) opacity(.45); }

/* STATS */
.fd-stats { display:flex; gap:1px; background:var(--border); border-bottom:1px solid var(--border); flex-shrink:0; }
.fd-stat { flex:1; background:var(--white); padding:14px 20px; display:flex; flex-direction:column; gap:2px; border-left:3px solid var(--accent,#6366f1); }
.fd-stat__val { font-size:22px; font-weight:800; color:var(--ink); line-height:1; }
.fd-stat__lbl { font-size:10px; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:.06em; }

/* FLUJO */
.fd-flujo { display:flex; align-items:center; gap:4px; padding:10px 24px; background:var(--white); border-bottom:1px solid var(--border); overflow-x:auto; flex-shrink:0; }
.fd-flujo__step { display:flex; align-items:center; gap:5px; white-space:nowrap; opacity:.5; transition:opacity .2s; }
.fd-flujo__step--active { opacity:1; }
.fd-flujo__dot  { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.fd-flujo__name { font-size:11px; font-weight:500; color:var(--muted); }
.fd-flujo__cnt  { font-size:10px; font-weight:700; padding:1px 6px; border-radius:10px; border:1px solid; }
.fd-flujo__arrow { color:var(--border); font-size:16px; }

/* ALERTAS */
.fd-alerts { padding:10px 24px 0; }
.fd-alert { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:10px 14px; border-radius:8px; font-size:12px; font-weight:500; margin-bottom:4px; animation:slide .2s; }
.fd-alert--err { background:#fef2f2; color:#b91c1c; border:1px solid #fecaca; }
.fd-alert--ok  { background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; }
.fd-alert button { background:none; border:none; cursor:pointer; font-size:16px; color:inherit; }

/* TABS */
.fd-tabs-bar { display:flex; gap:2px; border-bottom:2px solid var(--border); padding:12px 24px 0; background:var(--white); overflow-x:auto; flex-shrink:0; }
.fd-tab { display:flex; align-items:center; gap:5px; padding:8px 12px; border:none; background:transparent; font-family:var(--font); font-size:12px; font-weight:500; color:var(--muted); cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-2px; white-space:nowrap; transition:all .18s; }
.fd-tab__icon { font-size:13px; }
.fd-tab:hover { color:var(--sena); }
.fd-tab--on { color:var(--sena); border-bottom-color:var(--sena); font-weight:700; }
.fd-tab__cnt { font-size:10px; font-weight:700; padding:1px 5px; border-radius:10px; background:#e2e8f0; color:#475569; }
.fd-tab--on .fd-tab__cnt { background:#d1fae5; color:#065f46; }

/* CONTENT */
.fd-content { flex:1; overflow-y:auto; padding:20px 24px; }
.fd-spinner-wrap { display:flex; flex-direction:column; align-items:center; justify-content:center; height:240px; gap:14px; color:var(--muted); font-size:13px; }
.fd-spinner { width:30px; height:30px; border:3px solid var(--border); border-top-color:var(--sena); border-radius:50%; animation:spin .7s linear infinite; }
.fd-empty { display:flex; flex-direction:column; align-items:center; padding:60px 20px; text-align:center; }
.fd-empty__ico   { font-size:40px; margin-bottom:14px; }
.fd-empty__title { font-size:15px; font-weight:600; color:#334155; margin-bottom:6px; }
.fd-empty__sub   { font-size:13px; color:var(--muted); }
.fd-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(340px,1fr)); gap:14px; }

/* TARJETA */
.ofc-card { background:var(--white); border:1px solid var(--border); border-radius:var(--radius); overflow:hidden; transition:box-shadow .2s,transform .2s; animation:slide .2s; }
.ofc-card:hover { box-shadow:0 8px 28px rgba(10,61,46,.1); transform:translateY(-2px); }
.ofc-card--locked { opacity:.7; filter:grayscale(.3); }
.ofc-card__top { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:#fafbfc; border-bottom:1px solid var(--border); flex-wrap:wrap; gap:6px; }
.ofc-card__badges { display:flex; gap:5px; flex-wrap:wrap; }
.ofc-badge { display:inline-flex; align-items:center; padding:2px 8px; border-radius:20px; font-size:10px; font-weight:700; border:1px solid transparent; white-space:nowrap; }
.ofc-badge--tipo     { background:#dbeafe; color:#1e40af; border-color:#bfdbfe; }
.ofc-badge--camp     { background:#fef9c3; color:#854d0e; border-color:#fef08a; }
.ofc-badge--mia      { background:#d1fae5; color:#065f46; border-color:#a7f3d0; }
.ofc-badge--lock     { background:#f1f5f9; color:#64748b; border-color:#cbd5e1; }
.ofc-badge--corregida{ background:#ecfdf5; color:#065f46; border-color:#6ee7b7; }
.ofc-code { font-family:var(--mono); font-size:10px; color:#94a3b8; background:#f1f5f9; padding:2px 6px; border-radius:4px; }
.ofc-card__body { padding:14px; }
.ofc-card__title { font-size:13px; font-weight:700; color:var(--ink); margin-bottom:10px; line-height:1.4; }
.ofc-nota-correccion { display:flex; align-items:flex-start; gap:8px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:9px 12px; margin-bottom:12px; font-size:12px; color:#065f46; line-height:1.5; }
.ofc-nota-correccion__icon { flex-shrink:0; font-size:14px; }
.ofc-meta { display:flex; flex-direction:column; gap:5px; margin-bottom:12px; }
.ofc-meta__row { display:flex; align-items:baseline; gap:6px; }
.ofc-meta__lbl { font-size:10px; font-weight:600; color:#94a3b8; text-transform:uppercase; letter-spacing:.05em; min-width:60px; }
.ofc-meta__val { font-size:12px; color:#334155; font-weight:500; }
.ofc-cupos__labels { display:flex; justify-content:space-between; font-size:11px; color:var(--muted); margin-bottom:5px; }
.ofc-cupos__bar  { height:4px; background:#f1f5f9; border-radius:99px; overflow:hidden; }
.ofc-cupos__fill { height:100%; border-radius:99px; transition:width .5s; }
.ofc-card__foot { padding:10px 14px; border-top:1px solid var(--border); background:#fafbfc; display:flex; gap:6px; flex-wrap:wrap; }

/* BOTONES */
.fd-btn { display:inline-flex; align-items:center; justify-content:center; gap:5px; padding:7px 14px; border-radius:8px; border:none; font-family:var(--font); font-size:12px; font-weight:600; cursor:pointer; transition:all .18s; white-space:nowrap; }
.fd-btn--sm { padding:5px 10px; font-size:11px; }
.fd-btn--primary  { background:var(--sena); color:#fff; }
.fd-btn--primary:hover:not(:disabled)  { background:var(--sena2); }
.fd-btn--success  { background:#16a34a; color:#fff; }
.fd-btn--success:hover:not(:disabled)  { background:#15803d; }
.fd-btn--warn     { background:#f59e0b; color:#fff; }
.fd-btn--warn:hover:not(:disabled)     { background:#d97706; }
.fd-btn--danger   { background:#dc2626; color:#fff; }
.fd-btn--danger:hover:not(:disabled)   { background:#b91c1c; }
.fd-btn--info     { background:#3b82f6; color:#fff; }
.fd-btn--info:hover:not(:disabled)     { background:#2563eb; }
.fd-btn--ghost    { background:var(--white); color:#475569; border:1px solid var(--border); }
.fd-btn--ghost:hover:not(:disabled)    { background:var(--bg); }
.fd-btn--matricular { background:linear-gradient(135deg,#0d9488,#0f766e); color:#fff; font-size:14px; padding:12px 20px; border-radius:10px; box-shadow:0 4px 14px rgba(13,148,136,.35); }
.fd-btn--matricular:hover:not(:disabled) { background:linear-gradient(135deg,#0f766e,#115e59); box-shadow:0 6px 18px rgba(13,148,136,.45); transform:translateY(-1px); }
.fd-btn:disabled { opacity:.5; cursor:not-allowed; }
.fd-btn-spin { width:11px; height:11px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .6s linear infinite; display:inline-block; }

/* OVERLAY / MODAL */
.fd-overlay { position:fixed; inset:0; background:rgba(10,16,26,.55); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:1000; padding:20px; }
.fd-modal { background:var(--white); border-radius:14px; width:100%; max-width:480px; overflow:hidden; box-shadow:0 24px 60px rgba(0,0,0,.2); animation:slide .2s; }
.fd-modal--lg { max-width:900px; max-height:88vh; display:flex; flex-direction:column; }
.fd-modal__head { display:flex; align-items:center; gap:12px; padding:18px 20px; border-bottom:1px solid var(--border); }
.fd-modal__head--dark { background:linear-gradient(135deg,#0a3d2e,#0d5240); border-bottom:2px solid #10b981; }
.fd-modal__head-icon { width:36px; height:36px; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:17px; flex-shrink:0; }
.fd-modal__head-icon--warn { background:#fef3c7; }
.fd-modal__head-icon--ok   { background:#d1fae5; }
.fd-modal__head-icon--dark { background:rgba(255,255,255,.12); }
.fd-modal__title { font-size:15px; font-weight:700; color:var(--ink); }
.fd-modal__title--light { color:#fff; }
.fd-modal__sub { font-size:12px; color:var(--muted); margin-top:2px; }
.fd-modal__sub--light { color:rgba(255,255,255,.55); }
.fd-modal__corregida-chip { margin-left:auto; margin-right:12px; background:rgba(16,185,129,.2); color:#6ee7b7; border:1px solid rgba(16,185,129,.3); border-radius:20px; font-size:10px; font-weight:700; padding:3px 10px; white-space:nowrap; }
.fd-modal__close { background:none; border:none; font-size:18px; color:var(--muted); cursor:pointer; flex-shrink:0; }
.fd-modal__close--light { color:rgba(255,255,255,.6); }
.fd-modal__tabs { display:flex; border-bottom:1px solid var(--border); padding:0 20px; background:#fafbfc; flex-shrink:0; }
.fd-modal__tab { padding:12px 14px; border:none; background:transparent; font-family:var(--font); font-size:13px; font-weight:500; color:var(--muted); cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; display:flex; align-items:center; gap:6px; }
.fd-modal__tab--on { color:var(--sena); border-bottom-color:var(--sena); font-weight:700; }
.fd-modal__tab-badge { background:#fef2f2; color:#dc2626; font-size:10px; font-weight:700; padding:1px 6px; border-radius:20px; }
.fd-modal__scroll { flex:1; overflow-y:auto; }
.fd-modal__body { padding:18px 20px; }
.fd-modal__foot { padding:14px 20px; border-top:1px solid var(--border); display:flex; justify-content:flex-end; gap:8px; background:#fafbfc; }
.fd-modal__note { font-size:12px; color:#475569; margin-top:8px; line-height:1.5; }

/* DETAIL GRID */
.fd-detail-grid { display:flex; flex-direction:column; gap:16px; padding:20px; }
.fd-section { }
.fd-section__title { font-size:10px; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:.08em; margin-bottom:10px; }
.fd-section__grid  { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:8px; }
.fd-field { background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:10px 12px; display:flex; flex-direction:column; gap:3px; }
.fd-field__lbl { font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.05em; }
.fd-field__val { font-size:13px; font-weight:600; color:var(--ink); word-break:break-word; }
.fd-field__val--mono { font-family:var(--mono); color:#2563eb; font-size:12px; }

/* APRENDICES */
.fd-ap-wrap { padding:16px 20px; display:flex; flex-direction:column; gap:12px; }
.fd-nov-bar { background:#fef2f2; color:#dc2626; border:1px solid #fecaca; padding:8px 12px; border-radius:8px; font-size:12px; font-weight:500; }
.fd-table-wrap { overflow-x:auto; border:1px solid var(--border); border-radius:10px; }
.fd-table { width:100%; border-collapse:collapse; font-size:12px; min-width:700px; }
.fd-table thead tr { background:#fafbfc; }
.fd-table th { padding:10px; text-align:left; font-size:10px; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:.05em; border-bottom:1px solid var(--border); }
.fd-table td { padding:9px 10px; border-bottom:1px solid #f1f5f9; vertical-align:middle; }
.fd-td--center { text-align:center; }
.fd-tr--nov { background:#fffbeb; }
.fd-tr--inc { background:#fef2f2; }
.fd-check { width:15px; height:15px; cursor:pointer; accent-color:var(--sena); }
.fd-mono { font-family:var(--mono); font-size:11px; color:#2563eb; }
.fd-obs-input { width:100%; padding:5px 8px; font-size:11px; border:1px solid #f59e0b; border-radius:6px; background:#fffbeb; font-family:var(--font); outline:none; }
.fd-chip { display:inline-flex; align-items:center; font-size:10px; font-weight:700; padding:2px 8px; border-radius:20px; }
.fd-chip--ok  { background:#f0fdf4; color:#16a34a; }
.fd-chip--err { background:#fef2f2; color:#dc2626; }
.fd-chip--nov { background:#fffbeb; color:#d97706; }

/* DECISIÓN */
.fd-decision { padding:20px; display:flex; flex-direction:column; gap:16px; }
.fd-decision__strip { display:flex; gap:24px; background:var(--bg); border:1px solid var(--border); border-radius:10px; padding:16px 20px; }
.fd-decision__strip > div { flex:1; }
.fd-detail-label { font-size:10px; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:.06em; margin-bottom:4px; }
.fd-detail-val { font-size:14px; font-weight:700; color:var(--ink); }
.fd-decision__card { border:1px solid; border-radius:10px; padding:16px; display:flex; flex-direction:column; gap:10px; }
.fd-decision__card--warn       { background:#fff5f5; border-color:#fecaca; }
.fd-decision__card--ok         { background:#f0fdf4; border-color:#bbf7d0; }
.fd-decision__card--corregida  { background:#f0fdf4; border-color:#6ee7b7; border-width:2px; }
.fd-decision__card-title { font-size:13px; font-weight:700; color:var(--ink); }
.fd-decision__corregida-header { display:flex; gap:14px; align-items:flex-start; }
.fd-decision__corregida-icon   { font-size:28px; flex-shrink:0; }
.fd-decision__corregida-info { background:#dcfce7; border:1px solid #bbf7d0; border-radius:8px; padding:10px 14px; font-size:12px; color:#065f46; line-height:1.6; }
.fd-decision__note { font-size:12px; padding:8px 12px; border-radius:7px; border:1px solid #fecaca; background:#fff5f5; color:#b91c1c; }

/* FORM */
.fd-label { font-size:11px; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:.05em; display:block; margin-bottom:6px; }
.fd-required { color:#ef4444; }
.fd-textarea { width:100%; padding:10px 12px; border:1px solid var(--border); border-radius:8px; font-family:var(--font); font-size:13px; resize:vertical; outline:none; background:var(--white); }
.fd-textarea:focus { border-color:var(--sena); }
.fd-info-box { background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:12px 14px; display:flex; flex-direction:column; gap:6px; }
.fd-info-box__row { display:flex; justify-content:space-between; font-size:13px; color:#475569; }
`;

export default FuncionarioDashboard;