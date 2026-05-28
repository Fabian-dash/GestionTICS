import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';

// ── Configuración de estados ─────────────────────────────────────────────────
const ESTADO_CONFIG = {
  borrador:     {
    label: 'Borrador',
    descripcion: 'La oferta fue creada pero aún no ha sido enviada para revisión.',
    bg: '#F1EFE8', color: '#5F5E5A', dot: '#888780',
  },
  pendiente:    {
    label: 'Pendiente',
    descripcion: 'La oferta fue enviada y está esperando aprobación de coordinación.',
    bg: '#FAEEDA', color: '#7a4a0a', dot: '#EF9F27',
  },
  rechazada:    {
    label: 'Rechazada',
    descripcion: 'La oferta fue revisada y no fue aprobada. Revisa las observaciones.',
    bg: '#FCEBEB', color: '#9b1f1f', dot: '#E24B4A',
  },
  aprobada:     {
    label: 'Aprobada',
    descripcion: 'La oferta fue aprobada por coordinación y está lista para continuar.',
    bg: '#EAF3DE', color: '#2d5a0e', dot: '#639922',
  },
  ficha_creada: {
    label: 'Ficha creada',
    descripcion: 'Se generó la ficha de caracterización del grupo. Pendiente de apertura.',
    bg: '#E6F1FB', color: '#154e8e', dot: '#378ADD',
  },
  con_inscritos: {
    label: 'Con inscritos',
    descripcion: 'El programa tiene aprendices inscritos y está en proceso de formación.',
    bg: '#EEEDFE', color: '#3C3489', dot: '#7F77DD',
  },
  completada:   {
    label: 'Completada',
    descripcion: 'El programa de formación finalizó satisfactoriamente.',
    bg: '#e8f5e9', color: '#2e7d32', dot: '#43a047',
  },
};

// ── Paleta SENA ──────────────────────────────────────────────────────────────
const SENA = {
  dark:       '#1a2332',
  dark2:      '#243044',
  green:      '#2e7d32',
  greenLight: '#43a047',
  greenBg:    '#e8f5e9',
  greenMid:   '#c8e6c9',
  accent:     '#00897b',
};

// ── Utilidades ───────────────────────────────────────────────────────────────
const fmtFecha = (fecha) => {
  if (!fecha) return 'N/A';
  return new Date(fecha).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: '2-digit',
  });
};

// ── Sub-componentes ──────────────────────────────────────────────────────────
const StatCard = ({ label, value, accent, borderColor }) => (
  <div style={{ ...styles.statCard, borderTop: `3px solid ${borderColor || '#334155'}` }}>
    <p style={styles.statLabel}>{label}</p>
    <p style={{ ...styles.statValue, color: accent || '#0d1117' }}>{value}</p>
  </div>
);

const Badge = ({ estado }) => {
  const cfg = ESTADO_CONFIG[estado] || {
    label: estado, bg: '#F1EFE8', color: '#5F5E5A', dot: '#888780',
  };
  return (
    <span style={{ ...styles.badge, backgroundColor: cfg.bg, color: cfg.color }}>
      <span style={{ ...styles.badgeDot, backgroundColor: cfg.dot }} />
      {cfg.label}
    </span>
  );
};

const CuposBar = ({ inscritos, maximo }) => {
  const pct = maximo ? Math.min(Math.round((inscritos / maximo) * 100), 100) : 0;
  const barColor = pct >= 100 ? '#E24B4A' : pct >= 70 ? '#EF9F27' : SENA.greenLight;
  return (
    <div>
      <span style={styles.cuposText}>{inscritos}/{maximo} inscritos</span>
      <div style={styles.barBg}>
        <div style={{ ...styles.barFill, width: `${pct}%`, backgroundColor: barColor }} />
      </div>
    </div>
  );
};

// ── Leyenda de estados ────────────────────────────────────────────────────────
const LeyendaEstados = ({ visible, onToggle }) => (
  <div style={styles.leyendaWrap}>
    <button style={styles.leyendaToggle} onClick={onToggle}>
      <span style={{ color: SENA.green, fontSize: 15 }}>ℹ</span>
      Estados de una oferta
      <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.6 }}>{visible ? '▲' : '▼'}</span>
    </button>
    {visible && (
      <div style={styles.leyendaGrid}>
        {Object.entries(ESTADO_CONFIG).map(([codigo, cfg]) => (
          <div key={codigo} style={styles.leyendaItem}>
            <div style={{ marginBottom: 6 }}>
              <span style={{ ...styles.badge, backgroundColor: cfg.bg, color: cfg.color }}>
                <span style={{ ...styles.badgeDot, backgroundColor: cfg.dot }} />
                {cfg.label}
              </span>
            </div>
            <p style={styles.leyendaDesc}>{cfg.descripcion}</p>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ── Paleta de header del modal por estado ────────────────────────────────────
const ESTADO_HEADER = {
  borrador:      { titleColor: '#ffffff', subColor: '#94a3b8' },
  pendiente:     { titleColor: '#ffffff', subColor: '#94a3b8' },
  rechazada:     { titleColor: '#ffffff', subColor: '#94a3b8' },
  aprobada:      { titleColor: '#ffffff', subColor: '#94a3b8' },
  ficha_creada:  { titleColor: '#ffffff', subColor: '#94a3b8' },
  con_inscritos: { titleColor: '#ffffff', subColor: '#94a3b8' },
  completada:    { titleColor: '#ffffff', subColor: '#94a3b8' },
};

const INFO_COLORS = {
  blue:   { bg: '#e6f1fb', label: '#185FA5', value: '#0C3D72', border: '#B8D5F2' },
  purple: { bg: '#EEEDFE', label: '#534AB7', value: '#3C3489', border: '#D2CEF5' },
  green:  { bg: SENA.greenBg, label: SENA.green, value: '#1b5e20', border: SENA.greenMid },
  amber:  { bg: '#FDF3E3', label: '#BA7517', value: '#6b3d08', border: '#FAE3B8' },
};

// ── Modal de detalle ─────────────────────────────────────────────────────────
const ModalDetalle = ({ oferta, onClose }) => {
  if (!oferta) return null;

  const inscritos   = oferta.inscritos_count ?? 0;
  const maximo      = oferta.cupo_maximo ?? 0;
  const disponibles = Math.max(0, maximo - inscritos);
  const pct         = maximo ? Math.min(Math.round((inscritos / maximo) * 100), 100) : 0;
  const barColor    = pct >= 100 ? '#E24B4A' : pct >= 70 ? '#EF9F27' : SENA.greenLight;
  const estadoCfg   = ESTADO_CONFIG[oferta.estado?.codigo];

  const cuposBg     = pct >= 100
    ? 'linear-gradient(135deg,#FDEAEA,#F8CBCB)'
    : pct >= 70
      ? 'linear-gradient(135deg,#FDF3E3,#FAE3B8)'
      : `linear-gradient(135deg,${SENA.greenBg},${SENA.greenMid})`;
  const cuposBorder = pct >= 100 ? '#F8CBCB' : pct >= 70 ? '#FAD48A' : '#a5d6a7';
  const cuposNumCol = pct >= 100 ? '#9b1f1f' : pct >= 70 ? '#7a4a0a' : '#1b5e20';

  const handleOverlay = (e) => { if (e.target === e.currentTarget) onClose(); };

  const ColorInfoItem = ({ label, value, palette }) => {
    const c = INFO_COLORS[palette] || INFO_COLORS.blue;
    return (
      <div style={{
        backgroundColor: c.bg, border: `1px solid ${c.border}`,
        borderRadius: 8, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 3,
      }}>
        <span style={{ fontSize: 10, color: c.label, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: c.value }}>{value}</span>
      </div>
    );
  };

  return (
    <div style={styles.overlay} onClick={handleOverlay}>
      <div style={styles.modal}>

        {/* Header oscuro SENA */}
        <div style={styles.modalHeader}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ marginBottom: 8 }}>
              <span style={styles.modalChip}>
                {oferta.es_campesena ? 'Campesena' : 'Regular'} · {oferta.programa_formacion?.nivel || 'N/A'}
              </span>
            </div>
            <h2 style={styles.modalTitle}>
              {oferta.programa_formacion?.nombre_programa || 'N/A'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <code style={styles.modalCode}>{oferta.programa_formacion?.codigo || 'N/A'}</code>
              <Badge estado={oferta.estado?.codigo} />
            </div>
          </div>
          <button style={styles.btnClose} onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        {/* Body */}
        <div style={styles.modalBody}>

          <p style={styles.sectionTitle}>Información general</p>
          <div style={styles.infoGrid}>
            <ColorInfoItem label="Municipio"     value={oferta.ubicacion?.municipio?.nombre || 'N/A'}          palette="blue" />
            <ColorInfoItem label="Jornada"       value={oferta.horario?.dias?.join(', ') || 'N/A'}            palette="purple" />
            <ColorInfoItem label="Horas totales" value={oferta.programa_formacion?.duracion_maxima ? `${oferta.programa_formacion.duracion_maxima} h` : 'N/A'} palette="green" />
            <ColorInfoItem label="Instructor"    value={oferta.coordinador_asignado?.nombre || 'Sin asignar'} palette="amber" />
          </div>

          <p style={styles.sectionTitle}>Fechas</p>
          <div style={{ ...styles.infoGrid, marginBottom: 20 }}>
            <ColorInfoItem label="Inicio" value={fmtFecha(oferta.fechas?.inicio)} palette="blue" />
            <ColorInfoItem label="Fin"    value={fmtFecha(oferta.fechas?.fin)}    palette="purple" />
          </div>

          <p style={styles.sectionTitle}>Cupos</p>
          <div style={{ ...styles.cuposBox, background: cuposBg, border: `1px solid ${cuposBorder}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, marginBottom: 10 }}>
              <span style={{ color: '#555', fontWeight: 500 }}>Inscritos / Máximo</span>
              <span style={{ fontWeight: 700, fontSize: 18, color: cuposNumCol }}>
                {inscritos} <span style={{ fontWeight: 400, fontSize: 13, color: '#999' }}>/ {maximo}</span>
              </span>
            </div>
            <div style={{ ...styles.barBg, height: 7, backgroundColor: 'rgba(255,255,255,0.5)' }}>
              <div style={{ ...styles.barFill, width: `${pct}%`, backgroundColor: barColor, height: 7 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7, fontSize: 11 }}>
              <span style={{ color: '#555', fontWeight: 500 }}>✅ {disponibles} disponibles</span>
              <span style={{ color: barColor, fontWeight: 700 }}>{pct}% ocupado</span>
            </div>
          </div>

          {estadoCfg && (
            <>
              <p style={styles.sectionTitle}>Estado actual</p>
              <div style={{
                ...styles.estadoBox,
                backgroundColor: estadoCfg.bg,
                border: `1px solid ${estadoCfg.dot}33`,
                borderLeft: `4px solid ${estadoCfg.dot}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: estadoCfg.dot, flexShrink: 0, display: 'inline-block' }} />
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 12, color: estadoCfg.color }}>{estadoCfg.label}</p>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: '#555', lineHeight: 1.5 }}>{estadoCfg.descripcion}</p>
              </div>
            </>
          )}

          {oferta.observaciones && (
            <>
              <p style={styles.sectionTitle}>Observaciones</p>
              <div style={styles.obsBox}>{oferta.observaciones}</div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={styles.modalFooter}>
          <button style={styles.btnCerrar} onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

// ── Componente principal ─────────────────────────────────────────────────────
const MisOfertas = () => {
  const [ofertas, setOfertas]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');
  const [busqueda, setBusqueda]             = useState('');
  const [filtroEstado, setFiltroEstado]     = useState('');
  const [ordenCol, setOrdenCol]             = useState(null);
  const [ordenAsc, setOrdenAsc]             = useState(true);
  const [ofertaDetalle, setOfertaDetalle]   = useState(null);
  const [leyendaVisible, setLeyendaVisible] = useState(false);

  useEffect(() => { cargarOfertas(); }, []);

  const cargarOfertas = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/ofertas/mis-ofertas');
      setOfertas(response.data.data || []);
    } catch (err) {
      console.error('Error cargando ofertas:', err);
      setError('No se pudieron cargar las ofertas. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Stats derivadas
  const stats = useMemo(() => ({
    total:       ofertas.length,
    activas:     ofertas.filter(o => ['aprobada', 'ficha_creada', 'con_inscritos'].includes(o.estado?.codigo)).length,
    pendientes:  ofertas.filter(o => o.estado?.codigo === 'pendiente').length,
    completadas: ofertas.filter(o => o.estado?.codigo === 'completada').length,
    cuposLibres: ofertas.reduce((a, o) => a + Math.max(0, (o.cupo_maximo || 0) - (o.inscritos_count || 0)), 0),
    ocupacion:   (() => {
      const totalMax = ofertas.reduce((a, o) => a + (o.cupo_maximo || 0), 0);
      const totalIns = ofertas.reduce((a, o) => a + (o.inscritos_count || 0), 0);
      return totalMax ? Math.round(totalIns / totalMax * 100) : 0;
    })(),
  }), [ofertas]);

  // Filtrado y ordenamiento
  const ofertasFiltradas = useMemo(() => {
    let lista = [...ofertas];
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      lista = lista.filter(o =>
        o.programa_formacion?.nombre_programa?.toLowerCase().includes(q) ||
        o.programa_formacion?.codigo?.toLowerCase().includes(q)
      );
    }
    if (filtroEstado) {
      lista = lista.filter(o => o.estado?.codigo === filtroEstado);
    }
    if (ordenCol) {
      lista.sort((a, b) => {
        let va, vb;
        if (ordenCol === 'programa') { va = a.programa_formacion?.nombre_programa || ''; vb = b.programa_formacion?.nombre_programa || ''; }
        if (ordenCol === 'inicio')   { va = a.fechas?.inicio || ''; vb = b.fechas?.inicio || ''; }
        if (ordenCol === 'cupos')    { va = a.inscritos_count || 0; vb = b.inscritos_count || 0; }
        if (typeof va === 'string') return ordenAsc ? va.localeCompare(vb) : vb.localeCompare(va);
        return ordenAsc ? va - vb : vb - va;
      });
    }
    return lista;
  }, [ofertas, busqueda, filtroEstado, ordenCol, ordenAsc]);

  const toggleOrden = (col) => {
    if (ordenCol === col) setOrdenAsc(a => !a);
    else { setOrdenCol(col); setOrdenAsc(true); }
  };

  const SortIcon = ({ col }) => {
    if (ordenCol !== col) return <span style={styles.sortIconInactive}>↕</span>;
    return <span style={styles.sortIconActive}>{ordenAsc ? '↑' : '↓'}</span>;
  };

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Cargando ofertas...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>

      {/* Header oscuro SENA */}
      <div style={styles.pageHeader}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIcon}>📋</div>
          <div>
            <div style={styles.headerTitle}>Mis Ofertas</div>
            <div style={styles.headerSub}>SENA · Gestión de Ofertas</div>
          </div>
        </div>
        <div style={styles.headerMetrics}>
          <div style={styles.metric}>
            <div style={styles.metricValue}>{stats.total}</div>
            <div style={styles.metricLabel}>Ofertas</div>
          </div>
          <div style={styles.metric}>
            <div style={styles.metricValue}>{stats.cuposLibres}</div>
            <div style={styles.metricLabel}>Cupos libres</div>
          </div>
          <div style={styles.metric}>
            <div style={styles.metricValue}>{stats.ocupacion}%</div>
            <div style={styles.metricLabel}>Ocupación</div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={styles.errorAlert}>
          <span>⚠ {error}</span>
          <button style={styles.btnReintentar} onClick={cargarOfertas}>Reintentar</button>
        </div>
      )}

      {/* Stats */}
      <div style={styles.statsRow}>
        <StatCard label="Total ofertas" value={stats.total}       borderColor="#334155" />
        <StatCard label="Activas"       value={stats.activas}     accent={SENA.green}   borderColor={SENA.green} />
        <StatCard label="Pendientes"    value={stats.pendientes}  accent="#b45309"      borderColor="#e69519" />
        <StatCard label="Completadas"   value={stats.completadas} accent={SENA.accent}  borderColor={SENA.accent} />
      </div>

      {/* Leyenda de estados */}
      <LeyendaEstados
        visible={leyendaVisible}
        onToggle={() => setLeyendaVisible(v => !v)}
      />

      {/* Tabla */}
      <div style={styles.tableWrap}>
        <div style={styles.filterBar}>
          <div style={styles.searchWrap}>
            <span style={{ fontSize: 13, color: '#9aa0ab' }}>🔍</span>
            <input
              style={styles.searchInput}
              type="text"
              placeholder="Buscar por programa o código..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
          <select
            style={styles.select}
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
          >
            <option value="">Todos los estados</option>
            {Object.entries(ESTADO_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <span style={styles.countBadge}>
            {ofertasFiltradas.length} resultado{ofertasFiltradas.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div style={styles.tableScroll}>
          <table style={styles.table}>
            <thead>
              <tr style={{ backgroundColor: '#f0f4f8' }}>
                <th style={{ ...styles.th, width: '28%', cursor: 'pointer' }} onClick={() => toggleOrden('programa')}>
                  Programa <SortIcon col="programa" />
                </th>
                <th style={{ ...styles.th, width: '10%' }}>Código</th>
                <th style={{ ...styles.th, width: '8%' }}>Tipo</th>
                <th style={{ ...styles.th, width: '17%', cursor: 'pointer' }} onClick={() => toggleOrden('inicio')}>
                  Fechas <SortIcon col="inicio" />
                </th>
                <th style={{ ...styles.th, width: '14%', cursor: 'pointer' }} onClick={() => toggleOrden('cupos')}>
                  Cupos <SortIcon col="cupos" />
                </th>
                <th style={{ ...styles.th, width: '13%' }}>Estado</th>
                <th style={{ ...styles.th, width: '10%' }}></th>
              </tr>
            </thead>
            <tbody>
              {ofertasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} style={styles.emptyCell}>
                    <div style={styles.emptyContent}>
                      <span style={{ fontSize: 32 }}>📭</span>
                      <p style={{ margin: '8px 0 4px', fontWeight: 500 }}>
                        {ofertas.length === 0 ? 'No has creado ninguna oferta aún' : 'Sin resultados para este filtro'}
                      </p>
                      <p style={{ margin: 0, fontSize: 13, color: '#888' }}>
                        {ofertas.length === 0 ? 'Usa "Nueva oferta" para comenzar' : 'Prueba con otros términos o estado'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : ofertasFiltradas.map((oferta, i) => (
                <tr
                  key={oferta._id}
                  style={{ ...styles.row, backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f7fdf7'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)'}
                >
                  <td style={{ ...styles.td, fontWeight: 500 }}>
                    {oferta.programa_formacion?.nombre_programa || 'N/A'}
                  </td>
                  <td style={styles.td}>
                    <code style={styles.code}>{oferta.programa_formacion?.codigo || 'N/A'}</code>
                  </td>
                  <td style={styles.td}>
                    {oferta.es_campesena
                      ? <span style={styles.tipoCampesena}>Campesena</span>
                      : <span style={styles.tipoRegular}>Regular</span>
                    }
                  </td>
                  <td style={{ ...styles.td, fontSize: 11 }}>
                    <div>{fmtFecha(oferta.fechas?.inicio)}</div>
                    <div style={{ color: '#9aa0ab' }}>→ {fmtFecha(oferta.fechas?.fin)}</div>
                  </td>
                  <td style={styles.td}>
                    <CuposBar
                      inscritos={oferta.inscritos_count ?? 0}
                      maximo={oferta.cupo_maximo ?? 0}
                    />
                  </td>
                  <td style={styles.td}>
                    <Badge estado={oferta.estado?.codigo} />
                  </td>
                  <td style={styles.td}>
                    <button
                      style={styles.btnVer}
                      onClick={() => setOfertaDetalle(oferta)}
                    >
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {ofertaDetalle && (
        <ModalDetalle
          oferta={ofertaDetalle}
          onClose={() => setOfertaDetalle(null)}
        />
      )}
    </div>
  );
};

// ── Estilos ──────────────────────────────────────────────────────────────────
const styles = {
  container: {
    width: '100%',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: '#0d1117',
  },

  // ── Header oscuro SENA ──
  pageHeader: {
    background: `linear-gradient(135deg, ${SENA.dark} 0%, ${SENA.dark2} 100%)`,
    borderBottom: `3px solid ${SENA.green}`,
    color: '#fff',
    padding: '20px 24px 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: '10px 10px 0 0',
    marginBottom: 0,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  headerIcon: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: SENA.green,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18,
  },
  headerTitle: { fontSize: 17, fontWeight: 600, color: '#fff' },
  headerSub:   { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  headerMetrics: { display: 'flex', gap: 24 },
  metric:       { textAlign: 'center' },
  metricValue:  { fontSize: 22, fontWeight: 700, color: SENA.greenLight, lineHeight: 1 },
  metricLabel:  { fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 },

  // ── Stats ──
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: 10,
    margin: '14px 0',
  },
  statCard: {
    backgroundColor: '#fff',
    border: '1px solid #e4e7ec',
    borderRadius: 10,
    padding: '14px 16px',
  },
  statLabel: { margin: '0 0 4px', fontSize: 11, color: '#5a6270' },
  statValue: { margin: 0, fontSize: 26, fontWeight: 600, lineHeight: 1 },

  // ── Leyenda ──
  leyendaWrap: {
    marginBottom: '1rem',
    border: '1px solid #e4e7ec',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  leyendaToggle: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    background: '#f7f8fa',
    border: 'none',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    color: '#5a6270',
    textAlign: 'left',
  },
  leyendaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 1,
    backgroundColor: '#e4e7ec',
    borderTop: '1px solid #e4e7ec',
  },
  leyendaItem: {
    backgroundColor: '#fff',
    padding: '12px 16px',
  },
  leyendaDesc: {
    margin: 0, fontSize: 11, color: '#9aa0ab', lineHeight: 1.5,
  },

  // ── Tabla ──
  tableWrap: {
    border: '1px solid #e4e7ec',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    borderBottom: '1px solid #e4e7ec',
    backgroundColor: '#f7f8fa',
    flexWrap: 'wrap',
  },
  searchWrap: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    minWidth: 180,
    border: '1px solid #e4e7ec',
    borderRadius: 7,
    backgroundColor: '#fff',
    padding: '0 10px',
    gap: 6,
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: 13,
    padding: '7px 0',
    backgroundColor: 'transparent',
    color: '#0d1117',
  },
  select: {
    fontSize: 12,
    padding: '7px 10px',
    border: '1px solid #e4e7ec',
    borderRadius: 7,
    backgroundColor: '#fff',
    color: '#0d1117',
    cursor: 'pointer',
  },
  countBadge: {
    fontSize: 11,
    color: '#9aa0ab',
    whiteSpace: 'nowrap',
    background: '#f7f8fa',
    border: '1px solid #e4e7ec',
    padding: '4px 10px',
    borderRadius: 20,
  },
  tableScroll: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' },
  th: {
    padding: '9px 12px',
    textAlign: 'left',
    fontSize: 10,
    fontWeight: 700,
    color: '#5a6270',
    borderBottom: '1px solid #e4e7ec',
    userSelect: 'none',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  td: {
    padding: '10px 12px',
    fontSize: 12,
    borderBottom: '1px solid #f0f2f5',
    verticalAlign: 'middle',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: '#0d1117',
  },
  row: { transition: 'background 0.1s' },
  sortIconInactive: { marginLeft: 4, opacity: 0.35, fontSize: 11 },
  sortIconActive:   { marginLeft: 4, color: SENA.green, fontSize: 11 },

  // Badge
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 10,
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: 20,
  },
  badgeDot: { width: 5, height: 5, borderRadius: '50%', flexShrink: 0 },

  // Cupos
  cuposText: { fontSize: 11, display: 'block', marginBottom: 4, color: '#5a6270' },
  barBg: {
    height: 4,
    borderRadius: 4,
    backgroundColor: '#e9ecef',
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 4, transition: 'width 0.3s' },

  // Tipo
  tipoCampesena: { fontSize: 11, fontWeight: 600, color: '#3C3489', backgroundColor: '#eeedfe', padding: '2px 8px', borderRadius: 12 },
  tipoRegular:   { fontSize: 11, color: '#9aa0ab' },

  // Código
  code: {
    fontSize: 10,
    backgroundColor: '#f0f2f5',
    padding: '2px 6px',
    borderRadius: 4,
    fontFamily: 'monospace',
    color: '#444',
  },

  // Botón ver — verde SENA
  btnVer: {
    fontSize: 11,
    fontWeight: 600,
    color: SENA.green,
    backgroundColor: SENA.greenBg,
    border: `1px solid ${SENA.greenMid}`,
    padding: '5px 12px',
    borderRadius: 6,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },

  // Error
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FCEBEB',
    color: '#9b1f1f',
    padding: '10px 16px',
    borderRadius: 8,
    fontSize: 13,
    marginBottom: '1rem',
  },
  btnReintentar: {
    fontSize: 12,
    fontWeight: 600,
    color: '#9b1f1f',
    backgroundColor: 'transparent',
    border: '1px solid #9b1f1f',
    padding: '4px 10px',
    borderRadius: 6,
    cursor: 'pointer',
  },

  // Loading
  loadingWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '60px 20px',
    gap: 14,
  },
  spinner: {
    width: 32,
    height: 32,
    border: '3px solid #e0e0e0',
    borderTop: `3px solid ${SENA.green}`,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: { fontSize: 14, color: '#888', margin: 0 },

  // Empty
  emptyCell:    { padding: '40px 0', textAlign: 'center' },
  emptyContent: { display: 'inline-block', textAlign: 'center', color: '#5a6270' },

  // ── Modal ──
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(10,16,26,0.52)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    border: '1px solid #e4e7ec',
    width: '100%',
    maxWidth: 560,
    maxHeight: '90vh',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    background: `linear-gradient(135deg, ${SENA.dark} 0%, ${SENA.dark2} 100%)`,
    borderBottom: `2px solid ${SENA.green}`,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: '18px 20px 14px',
    gap: 12,
  },
  modalChip: {
    display: 'inline-block',
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: SENA.greenLight,
    backgroundColor: 'rgba(46,125,50,0.18)',
    padding: '3px 9px',
    borderRadius: 20,
    border: 'rgba(46,125,50,0.3)',
    marginBottom: 8,
  },
  modalTitle: {
    margin: 0,
    fontSize: 15,
    fontWeight: 600,
    color: '#fff',
    lineHeight: 1.4,
  },
  modalCode: {
    fontFamily: 'monospace',
    backgroundColor: 'rgba(255,255,255,0.12)',
    color: '#94a3b8',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 11,
  },
  btnClose: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 18,
    color: '#94a3b8',
    lineHeight: 1,
    padding: 4,
    flexShrink: 0,
  },
  modalBody: { padding: '18px 20px', flex: 1 },
  sectionTitle: {
    margin: '0 0 10px',
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#9aa0ab',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    marginBottom: 20,
  },
  cuposBox: {
    borderRadius: 8,
    padding: '14px 16px',
    marginBottom: 20,
  },
  estadoBox: {
    borderRadius: 8,
    padding: '12px 14px',
    marginBottom: 20,
    borderLeft: '4px solid',
    borderRadius: '0 8px 8px 0',
  },
  obsBox: {
    fontSize: 13,
    color: '#555',
    lineHeight: 1.6,
    backgroundColor: '#FFFBF0',
    borderRadius: '0 8px 8px 0',
    padding: '12px 14px',
    border: '1px solid #FAE3B8',
    borderLeft: '4px solid #EF9F27',
  },
  modalFooter: {
    padding: '12px 20px',
    borderTop: '1px solid #e4e7ec',
    backgroundColor: '#f7f8fa',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  btnCerrar: {
    fontSize: 12,
    fontWeight: 600,
    color: '#5a6270',
    backgroundColor: '#fff',
    border: '1px solid #e4e7ec',
    padding: '6px 18px',
    borderRadius: 6,
    cursor: 'pointer',
  },
};

export default MisOfertas;