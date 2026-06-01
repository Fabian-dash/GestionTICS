import React, { useState, useEffect } from 'react';
import api from '../services/api';

/* ─── Paleta ──────────────────────────────────────────────────── */
const G      = '#0f6e56';
const G_DARK = '#0d1f1a';
const G_LITE = '#e6f7f2';
const INK    = '#111827';
const MUTED  = '#6b7280';
const BORDER = '#e5e7eb';
const BG     = '#f4f6f5';
const WHITE  = '#ffffff';
const RED    = { bg: '#fef2f2', txt: '#991b1b', border: '#fecaca' };
const AMBER  = { bg: '#fef3c7', txt: '#92400e' };

const TIPO_LABEL = { instructor: 'Instructor', coordinador: 'Coordinador', funcionario: 'Funcionario' };
const TIPO_COLOR = {
  instructor:  { bg: '#eff6ff', txt: '#1e40af' },
  coordinador: { bg: G_LITE,    txt: '#065f46'  },
  funcionario: { bg: '#f5f3ff', txt: '#5b21b6'  },
};

const AdminPanel = () => {
  const [usuarios, setUsuarios]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [filtro, setFiltro]       = useState('pendiente'); // 'pendiente' | 'aprobado' | 'todos'
  const [tipoFiltro, setTipoFiltro] = useState('todos');
  const [accionando, setAccionando] = useState(null); // id del usuario en proceso

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/admin/usuarios');
      setUsuarios(res.data.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const aprobar = async (u) => {
    try {
      setAccionando(u._id);
      await api.put(`/admin/usuarios/${u.tipo}/${u._id}/aprobar`);
      setUsuarios(prev => prev.map(x => x._id === u._id ? { ...x, aprobado: true } : x));
    } catch (err) {
      alert(err?.response?.data?.message || 'Error al aprobar');
    } finally {
      setAccionando(null);
    }
  };

  const revocar = async (u) => {
    if (!confirm(`¿Revocar el acceso de ${u.nombre || u.nombreUsuario}?`)) return;
    try {
      setAccionando(u._id);
      await api.put(`/admin/usuarios/${u.tipo}/${u._id}/rechazar`);
      setUsuarios(prev => prev.map(x => x._id === u._id ? { ...x, aprobado: false } : x));
    } catch (err) {
      alert(err?.response?.data?.message || 'Error al revocar');
    } finally {
      setAccionando(null);
    }
  };

  const eliminar = async (u) => {
    if (!confirm(`¿Eliminar definitivamente a ${u.nombre || u.nombreUsuario}? Esta acción no se puede deshacer.`)) return;
    try {
      setAccionando(u._id);
      await api.delete(`/admin/usuarios/${u.tipo}/${u._id}`);
      setUsuarios(prev => prev.filter(x => x._id !== u._id));
    } catch (err) {
      alert(err?.response?.data?.message || 'Error al eliminar');
    } finally {
      setAccionando(null);
    }
  };

  const fmt = d => d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const filtrados = usuarios.filter(u => {
    const estadoOk = filtro === 'todos'
      ? true
      : filtro === 'pendiente'
        ? !u.aprobado
        : u.aprobado;
    const tipoOk = tipoFiltro === 'todos' || u.tipo === tipoFiltro;
    return estadoOk && tipoOk;
  });

  const countPendientes = usuarios.filter(u => !u.aprobado).length;
  const countAprobados  = usuarios.filter(u =>  u.aprobado).length;

  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .row-u { transition: background .12s; }
        .row-u:hover { background: #f9fafb !important; }
        .btn-sm { transition: background .13s, transform .1s; }
        .btn-sm:hover { filter: brightness(1.07); }
        .btn-sm:active { transform: scale(0.96); }
        .tab { transition: background .14s, color .14s; cursor: pointer; }
      `}</style>

      {/* ── HEADER ── */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <div style={s.headerLeft}>
            <span style={s.badge}>ADMINISTRADOR</span>
            <h1 style={s.title}>Panel de Control de Acceso</h1>
            <p style={s.subtitle}>Aprueba o rechaza el acceso de los usuarios al sistema</p>
          </div>
          <div style={s.statsRow}>
            <div style={s.statBox}>
              <span style={{ ...s.statNum, color: '#f59e0b' }}>{countPendientes}</span>
              <span style={s.statLabel}>Pendiente{countPendientes !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ ...s.statBox, borderLeft: '1px solid rgba(255,255,255,.1)' }}>
              <span style={{ ...s.statNum, color: '#6ee7c8' }}>{countAprobados}</span>
              <span style={s.statLabel}>Aprobado{countAprobados !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── BODY ── */}
      <main style={s.body}>

        {/* Error */}
        {error && (
          <div style={s.alertErr}>
            <span style={s.alertDot} />
            {error}
            <button onClick={cargar} style={s.retryBtn}>Reintentar</button>
          </div>
        )}

        {/* Aviso de pendientes */}
        {!loading && countPendientes > 0 && (
          <div style={s.alertAmber}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Hay <strong style={{ margin: '0 4px' }}>{countPendientes}</strong> usuario{countPendientes !== 1 ? 's' : ''} esperando aprobación.
          </div>
        )}

        {/* ── FILTROS ── */}
        <div style={s.filtersBar}>
          {/* Filtro estado */}
          <div style={s.tabGroup}>
            {[
              { key: 'pendiente', label: `Pendientes (${countPendientes})` },
              { key: 'aprobado',  label: `Aprobados (${countAprobados})`   },
              { key: 'todos',     label: `Todos (${usuarios.length})`      },
            ].map(({ key, label }) => (
              <button
                key={key}
                className="tab"
                onClick={() => setFiltro(key)}
                style={filtro === key ? s.tabActive : s.tabInactive}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Filtro tipo */}
          <select
            value={tipoFiltro}
            onChange={e => setTipoFiltro(e.target.value)}
            style={s.select}
          >
            <option value="todos">Todos los roles</option>
            <option value="instructor">Instructores</option>
            <option value="coordinador">Coordinadores</option>
            <option value="funcionario">Funcionarios</option>
          </select>

          <button onClick={cargar} style={s.refreshBtn}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Actualizar
          </button>
        </div>

        {/* ── LOADING ── */}
        {loading && (
          <div style={s.loadWrap}>
            <div style={s.spinner} />
            <span style={s.loadTxt}>Cargando usuarios...</span>
          </div>
        )}

        {/* ── TABLA ── */}
        {!loading && (
          <div style={s.tableWrap}>
            {/* Columnas */}
            <div style={s.colHead}>
              <span style={{ ...s.col, flex: '0 0 180px' }}>Usuario</span>
              <span style={{ ...s.col, flex: 1 }}>Correo</span>
              <span style={{ ...s.col, flex: '0 0 120px' }}>Rol</span>
              <span style={{ ...s.col, flex: '0 0 110px' }}>Registro</span>
              <span style={{ ...s.col, flex: '0 0 100px' }}>Estado</span>
              <span style={{ ...s.col, flex: '0 0 210px', textAlign: 'right' }}>Acciones</span>
            </div>

            {filtrados.length === 0 ? (
              <div style={s.emptyTable}>
                No hay usuarios en esta categoría.
              </div>
            ) : (
              filtrados.map((u, i) => {
                const tc    = TIPO_COLOR[u.tipo] || { bg: '#f3f4f6', txt: MUTED };
                const enCurso = accionando === u._id;
                return (
                  <div
                    key={u._id}
                    className="row-u"
                    style={{ ...s.row, background: i % 2 === 0 ? WHITE : '#fafcfb', animation: 'fadeUp .3s ease both', animationDelay: `${i * 0.035}s` }}
                  >
                    {/* Nombre */}
                    <div style={{ ...s.cell, flex: '0 0 180px', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                      <span style={s.nombreUser}>{u.nombre || '—'} {u.apellido || ''}</span>
                      <span style={s.userUser}>@{u.nombreUsuario || '—'}</span>
                    </div>

                    {/* Correo */}
                    <div style={{ ...s.cell, flex: 1 }}>
                      <span style={s.correo}>{u.correoElectronico}</span>
                    </div>

                    {/* Rol */}
                    <div style={{ ...s.cell, flex: '0 0 120px' }}>
                      <span style={{ ...s.rolBadge, background: tc.bg, color: tc.txt }}>
                        {TIPO_LABEL[u.tipo] || u.tipo}
                      </span>
                    </div>

                    {/* Fecha */}
                    <div style={{ ...s.cell, flex: '0 0 110px' }}>
                      <span style={s.fecha}>{fmt(u.createdAt)}</span>
                    </div>

                    {/* Estado */}
                    <div style={{ ...s.cell, flex: '0 0 100px' }}>
                      {u.aprobado
                        ? <span style={s.estadoOk}>✓ Activo</span>
                        : <span style={s.estadoPend}>● Pendiente</span>
                      }
                    </div>

                    {/* Acciones */}
                    <div style={{ ...s.cell, flex: '0 0 210px', justifyContent: 'flex-end', gap: 6 }}>
                      {enCurso ? (
                        <div style={s.spinner} />
                      ) : u.aprobado ? (
                        <>
                          <button className="btn-sm" onClick={() => revocar(u)} style={s.btnRevocar}>
                            Revocar acceso
                          </button>
                          <button className="btn-sm" onClick={() => eliminar(u)} style={s.btnEliminar} title="Eliminar usuario">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                            </svg>
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="btn-sm" onClick={() => aprobar(u)} style={s.btnAprobar}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}>
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            Aprobar
                          </button>
                          <button className="btn-sm" onClick={() => eliminar(u)} style={s.btnEliminar} title="Eliminar usuario">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            <div style={s.tableFoot}>
              {filtrados.length} usuario{filtrados.length !== 1 ? 's' : ''} mostrado{filtrados.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

/* ─── Estilos ──────────────────────────────────────────────────── */
const s = {
  root: { fontFamily: "'Sora','Segoe UI',sans-serif", background: BG, minHeight: '100vh' },

  header: { background: G_DARK, borderBottom: `3px solid ${G}`, padding: '36px 32px 32px' },
  headerInner: { maxWidth: 1160, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20 },
  headerLeft: { display: 'flex', flexDirection: 'column', gap: 8 },
  badge: { display: 'inline-block', background: '#7c3aed', color: WHITE, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', padding: '4px 10px', borderRadius: 3, width: 'fit-content' },
  title: { color: WHITE, fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: '-0.4px' },
  subtitle: { color: '#7a9e94', fontSize: 13.5, margin: 0 },
  statsRow: { display: 'flex', gap: 0, background: 'rgba(255,255,255,.06)', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,.1)' },
  statBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 24px', gap: 4 },
  statNum: { fontSize: 28, fontWeight: 700, lineHeight: 1 },
  statLabel: { color: '#7a9e94', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em' },

  body: { maxWidth: 1160, margin: '0 auto', padding: '28px 24px 56px' },

  alertErr: { display: 'flex', alignItems: 'center', gap: 10, background: RED.bg, color: RED.txt, border: `1px solid ${RED.border}`, borderRadius: 8, padding: '12px 16px', fontSize: 13.5, marginBottom: 20 },
  alertDot: { width: 8, height: 8, borderRadius: '50%', background: RED.txt, flexShrink: 0 },
  retryBtn: { marginLeft: 'auto', background: 'transparent', border: `1px solid ${RED.txt}`, color: RED.txt, borderRadius: 5, padding: '4px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 },
  alertAmber: { display: 'flex', alignItems: 'center', gap: 10, background: AMBER.bg, color: AMBER.txt, borderRadius: 8, padding: '12px 16px', fontSize: 13.5, marginBottom: 20 },

  filtersBar: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  tabGroup: { display: 'flex', background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 8, overflow: 'hidden' },
  tabActive: { background: G, color: WHITE, border: 'none', padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  tabInactive: { background: 'transparent', color: MUTED, border: 'none', padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  select: { background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 14px', fontSize: 13, color: INK, fontFamily: 'inherit', cursor: 'pointer', outline: 'none' },
  refreshBtn: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, background: WHITE, border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 8, padding: '8px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },

  loadWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '60px 20px' },
  spinner: { width: 26, height: 26, border: `3px solid ${BORDER}`, borderTopColor: G, borderRadius: '50%', animation: 'spin .7s linear infinite', flexShrink: 0 },
  loadTxt: { fontSize: 13.5, color: MUTED },

  tableWrap: { background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.05)' },
  colHead: { display: 'flex', padding: '9px 20px', background: '#f3f4f6', borderBottom: `1px solid ${BORDER}` },
  col: { fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em' },
  row: { display: 'flex', alignItems: 'center', padding: '13px 20px', borderBottom: `1px solid ${BORDER}` },
  cell: { display: 'flex', alignItems: 'center', paddingRight: 10, minWidth: 0 },

  nombreUser: { fontSize: 13.5, fontWeight: 600, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userUser: { fontSize: 11.5, color: MUTED },
  correo: { fontSize: 13, color: G, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  rolBadge: { fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20 },
  fecha: { fontSize: 12.5, color: MUTED, whiteSpace: 'nowrap' },
  estadoOk: { fontSize: 12, fontWeight: 700, color: '#065f46', background: G_LITE, padding: '3px 9px', borderRadius: 20 },
  estadoPend: { fontSize: 12, fontWeight: 700, color: AMBER.txt, background: AMBER.bg, padding: '3px 9px', borderRadius: 20 },

  btnAprobar: { display: 'flex', alignItems: 'center', background: G, color: WHITE, border: 'none', borderRadius: 7, padding: '7px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  btnRevocar: { background: WHITE, color: AMBER.txt, border: `1px solid ${AMBER.txt}44`, borderRadius: 7, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  btnEliminar: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: RED.bg, color: RED.txt, border: `1px solid ${RED.border}`, borderRadius: 7, padding: '7px 10px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 },

  emptyTable: { padding: '40px 20px', textAlign: 'center', fontSize: 14, color: MUTED },
  tableFoot: { padding: '10px 20px', fontSize: 12, color: MUTED, background: '#fafafa', borderTop: `1px solid ${BORDER}`, fontWeight: 500 },
};

export default AdminPanel;