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
    bg: '#FAEEDA', color: '#854F0B', dot: '#EF9F27',
  },
  rechazada:    {
    label: 'Rechazada',
    descripcion: 'La oferta fue revisada y no fue aprobada. Revisa las observaciones.',
    bg: '#FCEBEB', color: '#A32D2D', dot: '#E24B4A',
  },
  aprobada:     {
    label: 'Aprobada',
    descripcion: 'La oferta fue aprobada por coordinación y está lista para continuar.',
    bg: '#EAF3DE', color: '#3B6D11', dot: '#639922',
  },
  ficha_creada: {
    label: 'Ficha creada',
    descripcion: 'Se generó la ficha de caracterización del grupo. Pendiente de apertura.',
    bg: '#E6F1FB', color: '#185FA5', dot: '#378ADD',
  },
  con_inscritos: {
    label: 'Con inscritos',
    descripcion: 'El programa tiene aprendices inscritos y está en proceso de formación.',
    bg: '#EEEDFE', color: '#3C3489', dot: '#7F77DD',
  },
  completada:   {
    label: 'Completada',
    descripcion: 'El programa de formación finalizó satisfactoriamente.',
    bg: '#E1F5EE', color: '#0F6E56', dot: '#1D9E75',
  },
};

// ── Utilidades ───────────────────────────────────────────────────────────────
const fmtFecha = (fecha) => {
  if (!fecha) return 'N/A';
  return new Date(fecha).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: '2-digit',
  });
};

// ── Sub-componentes ──────────────────────────────────────────────────────────
const StatCard = ({ label, value, accent }) => (
  <div style={styles.statCard}>
    <p style={styles.statLabel}>{label}</p>
    <p style={{ ...styles.statValue, color: accent || 'var(--color-text-primary, #1a1a1a)' }}>
      {value}
    </p>
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

// Barra basada en inscritos vs máximo (0 inscritos = barra vacía)
const CuposBar = ({ inscritos, maximo }) => {
  const pct = maximo ? Math.min(Math.round((inscritos / maximo) * 100), 100) : 0;
  const barColor = pct >= 100 ? '#E24B4A' : pct >= 70 ? '#EF9F27' : '#378ADD';
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
      <span style={styles.leyendaIcon}>ℹ</span>
      Estados de una oferta
      <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>{visible ? '▲' : '▼'}</span>
    </button>

    {visible && (
      <div style={styles.leyendaGrid}>
        {Object.entries(ESTADO_CONFIG).map(([codigo, cfg]) => (
          <div key={codigo} style={styles.leyendaItem}>
            <div style={styles.leyendaItemTop}>
              <span style={{ ...styles.badge, backgroundColor: cfg.bg, color: cfg.color, flexShrink: 0 }}>
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

// Paleta de color por estado para el header del modal
const ESTADO_HEADER = {
  borrador:      { from: '#E8E6DF', to: '#D3D1C7', titleColor: '#3a3a38', subColor: '#6b6a65' },
  pendiente:     { from: '#FDF3E3', to: '#FAE3B8', titleColor: '#6b3d08', subColor: '#9b6010' },
  rechazada:     { from: '#FDEAEA', to: '#F8CBCB', titleColor: '#8B1F1F', subColor: '#B33333' },
  aprobada:      { from: '#EBF5DC', to: '#CDDFA8', titleColor: '#2A5209', subColor: '#4A8215' },
  ficha_creada:  { from: '#E3EFF9', to: '#B8D5F2', titleColor: '#0C3D72', subColor: '#185FA5' },
  con_inscritos: { from: '#ECEAFA', to: '#D2CEF5', titleColor: '#2B2470', subColor: '#4E47A0' },
  completada:    { from: '#DDF2EA', to: '#AADFC8', titleColor: '#0A4E3B', subColor: '#1D9E75' },
};

// Íconos SVG simples por sección
const IconInfo   = () => <span style={{ fontSize: 14, marginRight: 6 }}>🏫</span>;
const IconFecha  = () => <span style={{ fontSize: 14, marginRight: 6 }}>📅</span>;
const IconCupos  = () => <span style={{ fontSize: 14, marginRight: 6 }}>👥</span>;
const IconEstado = () => <span style={{ fontSize: 14, marginRight: 6 }}>🔖</span>;
const IconObs    = () => <span style={{ fontSize: 14, marginRight: 6 }}>📝</span>;

// ── Modal de detalle ─────────────────────────────────────────────────────────
const ModalDetalle = ({ oferta, onClose }) => {
  if (!oferta) return null;

  const inscritos   = oferta.inscritos_count ?? 0;
  const maximo      = oferta.cupo_maximo ?? 0;
  const disponibles = Math.max(0, maximo - inscritos);
  const pct         = maximo ? Math.min(Math.round((inscritos / maximo) * 100), 100) : 0;
  const barColor    = pct >= 100 ? '#E24B4A' : pct >= 70 ? '#EF9F27' : '#378ADD';

  const estadoCfg   = ESTADO_CONFIG[oferta.estado?.codigo];
  const headerCfg   = ESTADO_HEADER[oferta.estado?.codigo] || ESTADO_HEADER.borrador;

  const handleOverlay = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Tarjetas de info con colores por sección
  const INFO_COLORS = {
    blue:   { bg: '#EBF3FD', label: '#185FA5', value: '#0C3D72', border: '#B8D5F2' },
    purple: { bg: '#EEEDFE', label: '#534AB7', value: '#3C3489', border: '#D2CEF5' },
    teal:   { bg: '#E2F5EF', label: '#1D9E75', value: '#0F6E56', border: '#A8DEC9' },
    amber:  { bg: '#FDF3E3', label: '#BA7517', value: '#6b3d08', border: '#FAE3B8' },
  };

  const ColorInfoItem = ({ label, value, palette }) => {
    const c = INFO_COLORS[palette] || INFO_COLORS.blue;
    return (
      <div style={{
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 8,
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}>
        <span style={{ fontSize: 11, color: c.label, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: c.value }}>{value}</span>
      </div>
    );
  };

  return (
    <div style={styles.overlay} onClick={handleOverlay}>
      <div style={styles.modal}>

        {/* Header coloreado según estado */}
        <div style={{
          ...styles.modalHeader,
          background: `linear-gradient(135deg, ${headerCfg.from} 0%, ${headerCfg.to} 100%)`,
          borderBottom: `1px solid ${headerCfg.to}`,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Chip de tipo */}
            <div style={{ marginBottom: 8 }}>
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: headerCfg.subColor,
                backgroundColor: 'rgba(255,255,255,0.55)',
                padding: '3px 8px',
                borderRadius: 20,
                border: `1px solid ${headerCfg.to}`,
              }}>
                {oferta.es_campesena ? 'Campesena' : 'Regular'} · {oferta.programa_formacion?.nivel || 'N/A'}
              </span>
            </div>
            <h2 style={{ ...styles.modalTitle, color: headerCfg.titleColor }}>
              {oferta.programa_formacion?.nombre_programa || 'N/A'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <code style={{ ...styles.code, backgroundColor: 'rgba(255,255,255,0.6)', color: headerCfg.subColor }}>
                {oferta.programa_formacion?.codigo || 'N/A'}
              </code>
              <Badge estado={oferta.estado?.codigo} />
            </div>
          </div>
          <button style={{ ...styles.btnClose, color: headerCfg.subColor }} onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        {/* Body */}
        <div style={styles.modalBody}>

          {/* Información general */}
          <p style={styles.sectionTitle}><IconInfo />Información general</p>
          <div style={styles.infoGrid}>
            <ColorInfoItem label="Municipio"     value={oferta.municipio || 'N/A'}        palette="blue" />
            <ColorInfoItem label="Jornada"       value={oferta.jornada || 'N/A'}          palette="purple" />
            <ColorInfoItem label="Horas totales" value={oferta.programa_formacion?.horas_totales ? `${oferta.programa_formacion.horas_totales} h` : 'N/A'} palette="teal" />
            <ColorInfoItem label="Instructor"    value={oferta.instructor || 'Sin asignar'} palette="amber" />
          </div>

          {/* Fechas */}
          <p style={styles.sectionTitle}><IconFecha />Fechas</p>
          <div style={{ ...styles.infoGrid, marginBottom: 20 }}>
            <ColorInfoItem label="Inicio" value={fmtFecha(oferta.fechas?.inicio)} palette="blue" />
            <ColorInfoItem label="Fin"    value={fmtFecha(oferta.fechas?.fin)}    palette="purple" />
          </div>

          {/* Cupos */}
          <p style={styles.sectionTitle}><IconCupos />Cupos</p>
          <div style={{
            ...styles.cuposBox,
            background: pct >= 100
              ? 'linear-gradient(135deg, #FDEAEA 0%, #F8CBCB 100%)'
              : pct >= 70
                ? 'linear-gradient(135deg, #FDF3E3 0%, #FAE3B8 100%)'
                : 'linear-gradient(135deg, #EBF3FD 0%, #C8DFFE 100%)',
            border: `1px solid ${pct >= 100 ? '#F8CBCB' : pct >= 70 ? '#FAD48A' : '#B8D5F2'}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, marginBottom: 10 }}>
              <span style={{ color: '#555', fontWeight: 500 }}>Inscritos / Máximo</span>
              <span style={{
                fontWeight: 700,
                fontSize: 18,
                color: pct >= 100 ? '#A32D2D' : pct >= 70 ? '#854F0B' : '#0C3D72',
              }}>{inscritos} <span style={{ fontWeight: 400, fontSize: 14, color: '#999' }}>/ {maximo}</span></span>
            </div>
            <div style={{ ...styles.barBg, height: 8, backgroundColor: 'rgba(255,255,255,0.6)' }}>
              <div style={{ ...styles.barFill, width: `${pct}%`, backgroundColor: barColor, height: 8 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12 }}>
              <span style={{ color: '#555', fontWeight: 500 }}>✅ {disponibles} disponibles</span>
              <span style={{ color: barColor, fontWeight: 700 }}>{pct}% ocupado</span>
            </div>
          </div>

          {/* Estado explicado */}
          {estadoCfg && (
            <>
              <p style={styles.sectionTitle}><IconEstado />Estado actual</p>
              <div style={{
                ...styles.estadoBox,
                backgroundColor: estadoCfg.bg,
                border: `1px solid ${estadoCfg.dot}33`,
                borderLeft: `4px solid ${estadoCfg.dot}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: estadoCfg.dot, flexShrink: 0, display: 'inline-block' }} />
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: estadoCfg.color }}>
                    {estadoCfg.label}
                  </p>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: '#555', lineHeight: 1.5 }}>
                  {estadoCfg.descripcion}
                </p>
              </div>
            </>
          )}

          {/* Observaciones */}
          {oferta.observaciones && (
            <>
              <p style={styles.sectionTitle}><IconObs />Observaciones</p>
              <div style={{
                ...styles.obsBox,
                backgroundColor: '#FFFBF0',
                border: '1px solid #FAE3B8',
                borderLeft: '4px solid #EF9F27',
              }}>{oferta.observaciones}</div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ ...styles.modalFooter, backgroundColor: '#f6f7f9', borderTop: '1px solid #e8e8e8' }}>
          <button style={styles.btnCerrar} onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};



// ── Componente principal ─────────────────────────────────────────────────────
const MisOfertas = () => {
  const [ofertas, setOfertas]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [busqueda, setBusqueda]         = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [ordenCol, setOrdenCol]         = useState(null);
  const [ordenAsc, setOrdenAsc]         = useState(true);
  const [ofertaDetalle, setOfertaDetalle] = useState(null);
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
        if (typeof va === 'string')  return ordenAsc ? va.localeCompare(vb) : vb.localeCompare(va);
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

  // Loading
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

      {/* Error */}
      {error && (
        <div style={styles.errorAlert}>
          <span>⚠ {error}</span>
          <button style={styles.btnReintentar} onClick={cargarOfertas}>Reintentar</button>
        </div>
      )}

      {/* Stats */}
      <div style={styles.statsRow}>
        <StatCard label="Total ofertas" value={stats.total} />
        <StatCard label="Activas"       value={stats.activas}     accent="#185FA5" />
        <StatCard label="Pendientes"    value={stats.pendientes}  accent="#854F0B" />
        <StatCard label="Completadas"   value={stats.completadas} accent="#0F6E56" />
      </div>

      {/* Leyenda de estados */}
      <LeyendaEstados
        visible={leyendaVisible}
        onToggle={() => setLeyendaVisible(v => !v)}
      />

      {/* Tabla */}
      <div style={styles.tableWrap}>

        {/* Filtros */}
        <div style={styles.filterBar}>
          <div style={styles.searchWrap}>
            <span style={styles.searchIcon}>🔍</span>
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

        {/* Tabla */}
        <div style={styles.tableScroll}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: '28%', cursor: 'pointer' }} onClick={() => toggleOrden('programa')}>
                  Programa <SortIcon col="programa" />
                </th>
                <th style={{ ...styles.th, width: '10%' }}>Código</th>
                <th style={{ ...styles.th, width: '9%' }}>Tipo</th>
                <th style={{ ...styles.th, width: '17%', cursor: 'pointer' }} onClick={() => toggleOrden('inicio')}>
                  Fechas <SortIcon col="inicio" />
                </th>
                <th style={{ ...styles.th, width: '14%', cursor: 'pointer' }} onClick={() => toggleOrden('cupos')}>
                  Cupos <SortIcon col="cupos" />
                </th>
                <th style={{ ...styles.th, width: '13%' }}>Estado</th>
                <th style={{ ...styles.th, width: '9%' }}></th>
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
                  <td style={{ ...styles.td, fontSize: 12 }}>
                    <div>{fmtFecha(oferta.fechas?.inicio)}</div>
                    <div style={{ color: '#999' }}>→ {fmtFecha(oferta.fechas?.fin)}</div>
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
    color: '#1a1a1a',
  },

  // Stats
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: 10,
    marginBottom: '1rem',
  },
  statCard: {
    backgroundColor: '#f6f7f9',
    borderRadius: 8,
    padding: '12px 16px',
  },
  statLabel: { margin: '0 0 4px', fontSize: 12, color: '#888' },
  statValue: { margin: 0, fontSize: 24, fontWeight: 600 },

  // Leyenda
  leyendaWrap: {
    marginBottom: '1.25rem',
    border: '1px solid #e8e8e8',
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
    background: '#fafafa',
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    color: '#444',
    textAlign: 'left',
    borderBottom: '1px solid transparent',
  },
  leyendaIcon: { fontSize: 15, color: '#185FA5' },
  leyendaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 1,
    backgroundColor: '#e8e8e8',
    borderTop: '1px solid #e8e8e8',
  },
  leyendaItem: {
    backgroundColor: '#fff',
    padding: '12px 16px',
  },
  leyendaItemTop: { marginBottom: 6 },
  leyendaDesc: {
    margin: 0,
    fontSize: 12,
    color: '#666',
    lineHeight: 1.5,
  },

  // Tabla wrapper
  tableWrap: {
    border: '1px solid #e8e8e8',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 16px',
    borderBottom: '1px solid #e8e8e8',
    backgroundColor: '#fafafa',
    flexWrap: 'wrap',
  },
  searchWrap: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    minWidth: 180,
    border: '1px solid #e0e0e0',
    borderRadius: 6,
    backgroundColor: '#fff',
    padding: '0 10px',
    gap: 6,
  },
  searchIcon: { fontSize: 13 },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: 13,
    padding: '6px 0',
    backgroundColor: 'transparent',
    color: '#1a1a1a',
  },
  select: {
    fontSize: 13,
    padding: '6px 10px',
    border: '1px solid #e0e0e0',
    borderRadius: 6,
    backgroundColor: '#fff',
    color: '#1a1a1a',
    cursor: 'pointer',
  },
  countBadge: { fontSize: 12, color: '#888', whiteSpace: 'nowrap' },
  tableScroll: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' },
  th: {
    padding: '10px 14px',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 600,
    color: '#666',
    backgroundColor: '#f6f7f9',
    borderBottom: '1px solid #e8e8e8',
    userSelect: 'none',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  td: {
    padding: '11px 14px',
    fontSize: 13,
    borderBottom: '1px solid #f0f0f0',
    verticalAlign: 'middle',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  row: { transition: 'background 0.1s' },
  sortIconInactive: { marginLeft: 4, opacity: 0.35, fontSize: 11 },
  sortIconActive:   { marginLeft: 4, color: '#185FA5', fontSize: 11 },

  // Badge
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 11,
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: 20,
  },
  badgeDot: { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },

  // Cupos
  cuposText: { fontSize: 12, display: 'block', marginBottom: 3, color: '#666' },
  barBg: {
    height: 5,
    borderRadius: 4,
    backgroundColor: '#eee',
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 4, transition: 'width 0.3s' },

  // Tipo
  tipoCampesena: { fontSize: 11, fontWeight: 600, color: '#3C3489' },
  tipoRegular:   { fontSize: 11, color: '#888' },

  // Código
  code: {
    fontSize: 11,
    backgroundColor: '#f0f0f0',
    padding: '2px 6px',
    borderRadius: 4,
    fontFamily: 'monospace',
    color: '#444',
  },

  // Botón ver
  btnVer: {
    fontSize: 12,
    fontWeight: 600,
    color: '#185FA5',
    backgroundColor: '#E6F1FB',
    border: 'none',
    padding: '5px 12px',
    borderRadius: 6,
    cursor: 'pointer',
  },

  // Error
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FCEBEB',
    color: '#A32D2D',
    padding: '10px 16px',
    borderRadius: 8,
    fontSize: 13,
    marginBottom: '1rem',
  },
  btnReintentar: {
    fontSize: 12,
    fontWeight: 600,
    color: '#A32D2D',
    backgroundColor: 'transparent',
    border: '1px solid #A32D2D',
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
    borderTop: '3px solid #185FA5',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: { fontSize: 14, color: '#888', margin: 0 },

  // Empty
  emptyCell:    { padding: '40px 0', textAlign: 'center' },
  emptyContent: { display: 'inline-block', textAlign: 'center', color: '#555' },

  // ── Modal ──────────────────────────────────────────────────────────────────
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    border: '1px solid #e8e8e8',
    width: '100%',
    maxWidth: 560,
    maxHeight: '90vh',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: '20px 20px 16px',
    borderBottom: '1px solid #f0f0f0',
    gap: 12,
  },
  modalTitle: {
    margin: 0,
    fontSize: 17,
    fontWeight: 600,
    color: '#1a1a1a',
    lineHeight: 1.4,
  },
  btnClose: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 18,
    color: '#888',
    lineHeight: 1,
    padding: 4,
    flexShrink: 0,
  },
  modalBody: { padding: '20px', flex: 1 },
  sectionTitle: {
    margin: '0 0 10px',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#aaa',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    marginBottom: 20,
  },
  infoItem: {
    backgroundColor: '#f6f7f9',
    borderRadius: 8,
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  infoLabel: { fontSize: 11, color: '#999' },
  infoValue: { fontSize: 13, fontWeight: 600, color: '#1a1a1a' },
  cuposBox: {
    backgroundColor: '#f6f7f9',
    borderRadius: 8,
    padding: '14px 16px',
    marginBottom: 20,
  },
  estadoBox: {
    borderRadius: 8,
    padding: '12px 14px',
    marginBottom: 20,
  },
  obsBox: {
    fontSize: 13,
    color: '#555',
    lineHeight: 1.6,
    backgroundColor: '#f6f7f9',
    borderRadius: 8,
    padding: '12px 14px',
  },
  modalFooter: {
    padding: '14px 20px',
    borderTop: '1px solid #f0f0f0',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  btnCerrar: {
    fontSize: 13,
    fontWeight: 600,
    color: '#444',
    backgroundColor: '#f0f0f0',
    border: 'none',
    padding: '7px 18px',
    borderRadius: 6,
    cursor: 'pointer',
  },
};

export default MisOfertas;