import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';

// ── Colores y etiquetas de estado ────────────────────────────────────────────
const ESTADO_CONFIG = {
  borrador:     { label: 'Borrador',      bg: '#F1EFE8', color: '#5F5E5A', dot: '#888780' },
  pendiente:    { label: 'Pendiente',     bg: '#FAEEDA', color: '#854F0B', dot: '#EF9F27' },
  rechazada:    { label: 'Rechazada',     bg: '#FCEBEB', color: '#A32D2D', dot: '#E24B4A' },
  aprobada:     { label: 'Aprobada',      bg: '#EAF3DE', color: '#3B6D11', dot: '#639922' },
  ficha_creada: { label: 'Ficha creada',  bg: '#E6F1FB', color: '#185FA5', dot: '#378ADD' },
  con_inscritos:{ label: 'Con inscritos', bg: '#EEEDFE', color: '#3C3489', dot: '#7F77DD' },
  completada:   { label: 'Completada',    bg: '#E1F5EE', color: '#0F6E56', dot: '#1D9E75' },
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
  const cfg = ESTADO_CONFIG[estado] || { label: estado, bg: '#F1EFE8', color: '#5F5E5A', dot: '#888780' };
  return (
    <span style={{ ...styles.badge, backgroundColor: cfg.bg, color: cfg.color }}>
      <span style={{ ...styles.badgeDot, backgroundColor: cfg.dot }} />
      {cfg.label}
    </span>
  );
};

const CuposBar = ({ disponibles, maximo }) => {
  const pct = maximo ? Math.min(Math.round((disponibles / maximo) * 100), 100) : 0;
  const barColor = pct === 0 ? '#E24B4A' : pct < 30 ? '#EF9F27' : '#378ADD';
  return (
    <div>
      <span style={styles.cuposText}>{disponibles}/{maximo}</span>
      <div style={styles.barBg}>
        <div style={{ ...styles.barFill, width: `${pct}%`, backgroundColor: barColor }} />
      </div>
    </div>
  );
};

// ── Componente principal ─────────────────────────────────────────────────────
const MisOfertas = () => {
  const [ofertas, setOfertas]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [ordenCol, setOrdenCol] = useState(null);
  const [ordenAsc, setOrdenAsc] = useState(true);

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

  // ── Stats derivadas ─────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:      ofertas.length,
    activas:    ofertas.filter(o => ['aprobada', 'ficha_creada', 'con_inscritos'].includes(o.estado?.codigo)).length,
    pendientes: ofertas.filter(o => o.estado?.codigo === 'pendiente').length,
    completadas:ofertas.filter(o => o.estado?.codigo === 'completada').length,
  }), [ofertas]);

  // ── Filtrado y ordenamiento ─────────────────────────────────────────────
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
        if (ordenCol === 'programa')  { va = a.programa_formacion?.nombre_programa || ''; vb = b.programa_formacion?.nombre_programa || ''; }
        if (ordenCol === 'inicio')    { va = a.fechas?.inicio || ''; vb = b.fechas?.inicio || ''; }
        if (ordenCol === 'cupos')     { va = a.cupos_disponibles || 0; vb = b.cupos_disponibles || 0; }
        if (typeof va === 'string')   return ordenAsc ? va.localeCompare(vb) : vb.localeCompare(va);
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

  // ── Render ──────────────────────────────────────────────────────────────
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

      {/* Encabezado */}
      <div style={styles.header}>
      
      </div>

      {/* Alerta de error */}
      {error && (
        <div style={styles.errorAlert}>
          <span>⚠ {error}</span>
          <button style={styles.btnReintentar} onClick={cargarOfertas}>Reintentar</button>
        </div>
      )}

      {/* Tarjetas de resumen */}
      <div style={styles.statsRow}>
        <StatCard label="Total ofertas"  value={stats.total}       />
        <StatCard label="Activas"        value={stats.activas}     accent="#185FA5" />
        <StatCard label="Pendientes"     value={stats.pendientes}  accent="#854F0B" />
        <StatCard label="Completadas"    value={stats.completadas} accent="#3B6D11" />
      </div>

      {/* Tabla */}
      <div style={styles.tableWrap}>

        {/* Barra de filtros */}
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
                      disponibles={oferta.cupos_disponibles ?? 0}
                      maximo={oferta.cupo_maximo ?? 0}
                    />
                  </td>
                  <td style={styles.td}>
                    <Badge estado={oferta.estado?.codigo} />
                  </td>
                  <td style={styles.td}>
                    <button
                      style={styles.btnVer}
                      onClick={() => alert(`Ver detalle: ${oferta._id}`)}
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
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '1.25rem',
  },
  titulo: {
    margin: '0 0 4px',
    fontSize: 22,
    fontWeight: 600,
    color: '#1a1a1a',
  },
  subtitulo: {
    margin: 0,
    fontSize: 14,
    color: '#888',
  },
  btnNueva: {
    backgroundColor: '#185FA5',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  // Stats
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: 10,
    marginBottom: '1.25rem',
  },
  statCard: {
    backgroundColor: '#f6f7f9',
    borderRadius: 8,
    padding: '12px 16px',
  },
  statLabel: {
    margin: '0 0 4px',
    fontSize: 12,
    color: '#888',
  },
  statValue: {
    margin: 0,
    fontSize: 24,
    fontWeight: 600,
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
  countBadge: {
    fontSize: 12,
    color: '#888',
    whiteSpace: 'nowrap',
  },
  tableScroll: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
  },
  th: {
    padding: '10px 14px',
    textAlign: 'left',
    fontSize: 12,
    fontWeight: 600,
    color: '#666',
    backgroundColor: '#f6f7f9',
    borderBottom: '1px solid #e8e8e8',
    userSelect: 'none',
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
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    flexShrink: 0,
  },
  // Cupos
  cuposText: { fontSize: 12, display: 'block', marginBottom: 3 },
  barBg: {
    height: 5,
    borderRadius: 4,
    backgroundColor: '#eee',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.3s',
  },
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
    padding: '4px 10px',
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
  emptyCell: { padding: '40px 0', textAlign: 'center' },
  emptyContent: { display: 'inline-block', textAlign: 'center', color: '#555' },
};

export default MisOfertas;