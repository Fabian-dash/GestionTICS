import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';

// ── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  teal:        '#0f6e56',
  tealMid:     '#1d9e75',
  tealLight:   '#e1f5ee',
  tealBorder:  '#9fe1cb',
  ink:         '#111827',
  inkSoft:     '#6b7280',
  inkMute:     '#9ca3af',
  bg:          '#f3f4f6',
  white:       '#ffffff',
  border:      '#e5e7eb',
  borderHover: '#d1d5db',
  redBg:       '#fef2f0',
  redText:     '#991b1b',
  redBorder:   '#fca5a5',
  blueBg:      '#eff6ff',
  blueText:    '#1e40af',
  purpleBg:    '#f5f3ff',
  purpleText:  '#4c1d95',
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtFecha = (f) => f
  ? new Date(f).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })
  : 'N/A';

const pct = (o) => o.cupo_maximo
  ? Math.min(Math.round(((o.cupo_maximo - (o.cupos_disponibles || 0)) / o.cupo_maximo) * 100), 100)
  : 0;

const cuposStatus = (o) => {
  const d = o.cupos_disponibles || 0;
  if (d === 0)  return { label: 'Agotado',        bg: T.redBg,    txt: T.redText,    dot: '#ef4444' };
  if (d < 5)    return { label: `Últimos ${d}`,   bg: '#fffbeb',  txt: '#92400e',    dot: '#f59e0b' };
  return         { label: `${d} disponibles`,     bg: T.tealLight, txt: T.teal,      dot: T.tealMid };
};

// ── Sub-componentes ──────────────────────────────────────────────────────────
const Pill = ({ label, bg, txt, dot }) => (
  <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:600,
    padding:'3px 9px', borderRadius:20, backgroundColor:bg, color:txt, whiteSpace:'nowrap' }}>
    {dot && <span style={{ width:6, height:6, borderRadius:'50%', backgroundColor:dot, flexShrink:0 }} />}
    {label}
  </span>
);

const StatStrip = ({ items }) => (
  <div style={{ display:'flex', borderTop:`1px solid ${T.border}` }}>
    {items.map(({ label, val }, i) => (
      <div key={label} style={{ flex:1, padding:'12px 18px',
        borderRight: i < items.length - 1 ? `1px solid ${T.border}` : 'none' }}>
        <p style={{ margin:'0 0 3px', fontSize:11, fontWeight:600, color:T.inkSoft,
          textTransform:'uppercase', letterSpacing:'0.07em' }}>{label}</p>
        <p style={{ margin:0, fontSize:17, fontWeight:700, color:T.ink }}>{val ?? '—'}</p>
      </div>
    ))}
  </div>
);

const ActionBtn = ({ onClick, disabled, color, icon, label, loading }) => (
  <button onClick={onClick} disabled={disabled}
    style={{ display:'flex', alignItems:'center', gap:7, width:'100%',
      padding:'9px 14px', borderRadius:8, border:'none', fontSize:13, fontWeight:600,
      cursor: disabled ? 'not-allowed' : 'pointer', transition:'opacity .15s',
      color: disabled ? T.inkMute : T.white,
      backgroundColor: disabled ? T.border : color,
      opacity: disabled ? 0.7 : 1 }}>
    {icon}
    {loading || label}
  </button>
);

const ChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const TableIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <path d="M3 9h18M9 21V9"/>
  </svg>
);

const MergeIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
    <polyline points="13 2 13 9 20 9"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

// ── Componente principal ─────────────────────────────────────────────────────
const VerInscritos = () => {
  const [ofertas, setOfertas]               = useState([]);
  const [inscritos, setInscritos]           = useState([]);
  const [loading, setLoading]               = useState(true);
  const [loadingInscritos, setLI]           = useState(false);
  const [error, setError]                   = useState('');
  const [success, setSuccess]               = useState('');
  const [ofertaSeleccionada, setOferta]     = useState(null);
  const [mostrarDetalle, setDetalle]        = useState(false);
  const [exportando, setExportando]         = useState(false);
  const [fusionando, setFusionando]         = useState(false);
  const [busqueda, setBusqueda]             = useState('');

  useEffect(() => { cargarOfertas(); }, []);

  const cargarOfertas = async () => {
    try { setLoading(true); setError('');
      const r = await api.get('/ofertas/mis-ofertas');
      setOfertas(r.data.data || []);
    } catch { setError('No se pudieron cargar las ofertas.'); }
    finally { setLoading(false); }
  };

  const cargarInscritos = async (ofertaId) => {
    try { setLI(true); setError('');
      const r = await api.get(`/inscripciones/oferta/${ofertaId}`);
      setInscritos(r.data.data || []);
      setOferta(ofertas.find(o => o._id === ofertaId));
      setDetalle(true);
    } catch { setError('Error al cargar los inscritos.'); }
    finally { setLI(false); }
  };

  const descargar = (blob, nombre) => {
    const url = window.URL.createObjectURL(new Blob([blob]));
    const a = document.createElement('a'); a.href = url; a.setAttribute('download', nombre);
    document.body.appendChild(a); a.click(); a.remove();
  };

  const exportarCompleto = async () => {
    try { setExportando(true);
      const r = await api.get(`/inscripciones/oferta/${ofertaSeleccionada._id}/exportar/completo`, { responseType:'blob' });
      descargar(r.data, `inscripciones_${ofertaSeleccionada.programa_formacion?.codigo}.xlsx`);
      notify('Excel de datos completos descargado');
    } catch { setError('Error al exportar.'); }
    finally { setExportando(false); }
  };

  const exportarCedulas = async () => {
    try { setExportando(true);
      const r = await api.get(`/inscripciones/oferta/${ofertaSeleccionada._id}/exportar/cedulas`, { responseType:'blob' });
      descargar(r.data, `cedulas_${ofertaSeleccionada.programa_formacion?.codigo}.xlsx`);
      notify('Excel de cédulas descargado');
    } catch { setError('Error al exportar cédulas.'); }
    finally { setExportando(false); }
  };

  const fusionarPDFs = async () => {
    try { setFusionando(true); setError('');
      const r = await api.post(`/inscripciones/oferta/${ofertaSeleccionada._id}/fusionar-pdfs`);
      if (r.data.success) notify(`PDFs fusionados · ${r.data.data.totalPaginas} páginas`);
      else setError(r.data.message || 'Error al fusionar PDFs');
    } catch (e) { setError(e.response?.data?.message || 'Error al fusionar PDFs'); }
    finally { setFusionando(false); }
  };

  const notify = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 4000); };

  const volver = () => { setDetalle(false); setOferta(null); setInscritos([]); setBusqueda(''); };

  const inscritosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return inscritos;
    const q = busqueda.toLowerCase();
    return inscritos.filter(i =>
      `${i.nombres} ${i.apellidos}`.toLowerCase().includes(q) ||
      i.numero_documento?.includes(q) ||
      i.correo?.toLowerCase().includes(q)
    );
  }, [inscritos, busqueda]);

  // Stats de la oferta seleccionada
  const inscritosCount = ofertaSeleccionada
    ? (ofertaSeleccionada.cupo_maximo || 0) - (ofertaSeleccionada.cupos_disponibles || 0)
    : 0;

  // ── Loading inicial ─────────────────────────────────────────────────────
  if (loading) return (
    <div style={st.root}>
      <PageHeader title="Estado de cupos" sub="Consulta inscritos y exporta documentos" />
      <div style={st.body}>
        <div style={st.loadingWrap}>
          <div style={st.spinner} />
          <p style={{ margin:0, fontSize:14, color:T.inkSoft }}>Cargando ofertas...</p>
        </div>
      </div>
    </div>
  );

  return (
    <div style={st.root}>
      {/* ── Header ── */}
      <div style={st.headerBar}>
        <div>
          <span style={st.badge}>Instructores</span>
          <h1 style={st.pageTitle}>
            {mostrarDetalle ? 'Lista de inscritos' : 'Estado de cupos por oferta'}
          </h1>
          <p style={st.pageSub}>
            {mostrarDetalle
              ? `${ofertaSeleccionada?.programa_formacion?.nombre_programa} · ${inscritos.length} inscritos`
              : 'Consulta los inscritos y exporta documentos por programa'}
          </p>
        </div>
        {mostrarDetalle && (
          <button style={st.backBtn} onClick={volver}>
            <ChevronLeft /> Volver a ofertas
          </button>
        )}
      </div>

      <div style={st.body}>
        {/* Alertas */}
        {error && (
          <div style={{ ...st.alert, background:T.redBg, color:T.redText, borderColor:T.redBorder }}>
            <span style={{ ...st.alertDot, background:'#ef4444' }} />
            {error}
            <button style={st.alertClose} onClick={() => setError('')}>✕</button>
          </div>
        )}
        {success && (
          <div style={{ ...st.alert, background:T.tealLight, color:T.teal, borderColor:T.tealBorder }}>
            <span style={{ ...st.alertDot, background:T.tealMid }} />
            {success}
          </div>
        )}

        {!mostrarDetalle ? (
          /* ════════════ VISTA: LISTADO DE OFERTAS ════════════ */
          ofertas.length === 0 ? (
            <EmptyState icon="📋" title="Sin ofertas creadas" desc="No tienes ofertas registradas aún" />
          ) : (
            <div style={st.card}>
              <div style={st.cardHead}>
                <span style={st.cardHeadTitle}>
                  Ofertas · <span style={{ color:T.inkSoft, fontWeight:400 }}>{ofertas.length} registros</span>
                </span>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={st.table}>
                  <thead>
                    <tr>
                      {['Programa', 'Código', 'Periodo', 'Ocupación', 'Disponibles', 'Acciones'].map(c => (
                        <th key={c} style={st.th}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ofertas.map((o, i) => {
                      const p = pct(o);
                      const st2 = cuposStatus(o);
                      const barColor = p >= 100 ? '#ef4444' : p > 75 ? '#f59e0b' : T.tealMid;
                      return (
                        <tr key={o._id} style={{ backgroundColor: i%2===0 ? T.white : '#fafafa' }}>
                          <td style={{ ...st.td, fontWeight:500, color:T.ink, maxWidth:260,
                            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {o.programa_formacion?.nombre_programa || 'N/A'}
                          </td>
                          <td style={st.td}>
                            <code style={st.code}>{o.programa_formacion?.codigo || '—'}</code>
                          </td>
                          <td style={{ ...st.td, fontSize:12, color:T.inkSoft, whiteSpace:'nowrap' }}>
                            {fmtFecha(o.fechas?.inicio)}<br/>
                            <span style={{ color:T.inkMute }}>→ {fmtFecha(o.fechas?.fin)}</span>
                          </td>
                          <td style={{ ...st.td, minWidth:140 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <div style={{ flex:1, height:6, background:T.border, borderRadius:99, overflow:'hidden' }}>
                                <div style={{ height:'100%', width:`${p}%`, borderRadius:99,
                                  backgroundColor:barColor, transition:'width .3s' }} />
                              </div>
                              <span style={{ fontSize:11, color:T.inkSoft, whiteSpace:'nowrap' }}>{p}%</span>
                            </div>
                            <span style={{ fontSize:11, color:T.inkMute }}>
                              {o.cupo_maximo - (o.cupos_disponibles||0)} / {o.cupo_maximo} inscritos
                            </span>
                          </td>
                          <td style={st.td}>
                            <Pill {...st2} />
                          </td>
                          <td style={st.td}>
                            <button style={st.btnPrimary} onClick={() => cargarInscritos(o._id)}
                              disabled={loadingInscritos}>
                              <UsersIcon />
                              {loadingInscritos ? 'Cargando...' : 'Ver inscritos'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          /* ════════════ VISTA: DETALLE DE INSCRITOS ════════════ */
          <>
            {/* Fila superior: info oferta + acciones */}
            <div style={st.detalleGrid}>
              {/* Info oferta */}
              <div style={st.card}>
                <div style={st.cardHead}>
                  <span style={st.cardHeadTitle}>{ofertaSeleccionada?.programa_formacion?.nombre_programa}</span>
                  <code style={st.code}>{ofertaSeleccionada?.programa_formacion?.codigo}</code>
                </div>
                <StatStrip items={[
                  { label:'Inscritos',    val: inscritosCount },
                  { label:'Cupo total',   val: ofertaSeleccionada?.cupo_maximo },
                  { label:'Disponibles',  val: ofertaSeleccionada?.cupos_disponibles },
                  { label:'Tipo',         val: ofertaSeleccionada?.es_campesena ? 'Campesena' : 'Regular' },
                ]} />
              </div>

              {/* Panel de acciones */}
              <div style={{ ...st.card, padding:'18px 18px 20px' }}>
                <p style={st.actLabel}>Exportar y procesar</p>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  <ActionBtn
                    onClick={exportarCompleto}
                    disabled={exportando || inscritos.length === 0}
                    color={T.teal}
                    icon={<DownloadIcon />}
                    label={exportando ? 'Exportando...' : 'Datos completos (.xlsx)'}
                  />
                  <ActionBtn
                    onClick={exportarCedulas}
                    disabled={exportando || inscritos.length === 0}
                    color="#1e40af"
                    icon={<TableIcon />}
                    label={exportando ? 'Exportando...' : 'Excel cédulas (.xlsx)'}
                  />
                  <ActionBtn
                    onClick={fusionarPDFs}
                    disabled={fusionando || inscritos.length === 0}
                    color="#5b21b6"
                    icon={<MergeIcon />}
                    label={fusionando ? 'Fusionando PDFs...' : 'Fusionar PDFs'}
                  />
                </div>
              </div>
            </div>

            {/* Tabla inscritos */}
            {inscritos.length === 0 ? (
              <EmptyState icon="👥" title="Sin inscritos" desc="No hay inscritos para esta oferta aún" />
            ) : (
              <div style={st.card}>
                <div style={{ ...st.cardHead, flexWrap:'wrap', gap:10 }}>
                  <span style={st.cardHeadTitle}>
                    Inscritos · <span style={{ color:T.inkSoft, fontWeight:400 }}>{inscritosFiltrados.length} de {inscritos.length}</span>
                  </span>
                  <div style={st.searchWrap}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.inkMute}
                      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                      style={st.searchInput}
                      placeholder="Buscar por nombre, documento o correo..."
                      value={busqueda}
                      onChange={e => setBusqueda(e.target.value)}
                    />
                  </div>
                </div>
                <div style={{ overflowX:'auto' }}>
                  <table style={st.table}>
                    <thead>
                      <tr>
                        {['#', 'Nombre completo', 'Tipo doc.', 'Documento', 'Correo', 'Teléfono', 'Caracterización'].map(c => (
                          <th key={c} style={st.th}>{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {inscritosFiltrados.length === 0 ? (
                        <tr><td colSpan={7} style={{ padding:'32px', textAlign:'center', color:T.inkSoft, fontSize:13 }}>
                          Sin resultados para "{busqueda}"
                        </td></tr>
                      ) : inscritosFiltrados.map((ins, i) => (
                        <tr key={ins._id} style={{ backgroundColor: i%2===0 ? T.white : '#fafafa' }}>
                          <td style={{ ...st.td, color:T.inkMute, fontSize:12, width:36 }}>{i+1}</td>
                          <td style={{ ...st.td, fontWeight:500, color:T.ink }}>
                            {ins.nombres} {ins.apellidos}
                          </td>
                          <td style={{ ...st.td, color:T.inkSoft, fontSize:12 }}>
                            {ins.tipo_documento?.nombre || '—'}
                          </td>
                          <td style={{ ...st.td }}>
                            <code style={st.code}>{ins.numero_documento}</code>
                          </td>
                          <td style={{ ...st.td, color:'#1e40af', fontSize:12 }}>{ins.correo}</td>
                          <td style={{ ...st.td, fontSize:13 }}>{ins.telefono || '—'}</td>
                          <td style={st.td}>
                            {ins.caracterizacion?.tipo_caracterizacion
                              ? <Pill label={ins.caracterizacion.tipo_caracterizacion}
                                  bg={T.purpleBg} txt={T.purpleText} />
                              : <span style={{ color:T.inkMute, fontSize:12 }}>—</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={st.tableFooter}>
                  <span style={{ fontSize:13, color:T.inkSoft }}>
                    {inscritosCount} inscritos de {ofertaSeleccionada?.cupo_maximo} cupos disponibles
                  </span>
                  <Pill label={`${Math.round((inscritosCount/(ofertaSeleccionada?.cupo_maximo||1))*100)}% ocupado`}
                    bg={T.tealLight} txt={T.teal} dot={T.tealMid} />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ── Componentes auxiliares ───────────────────────────────────────────────────
const PageHeader = ({ title, sub }) => (
  <div style={st.headerBar}>
    <div>
      <span style={st.badge}>Instructores</span>
      <h1 style={st.pageTitle}>{title}</h1>
      <p style={st.pageSub}>{sub}</p>
    </div>
  </div>
);

const EmptyState = ({ icon, title, desc }) => (
  <div style={{ textAlign:'center', padding:'56px 20px', background:T.white,
    borderRadius:12, border:`1px dashed ${T.border}` }}>
    <span style={{ fontSize:36 }}>{icon}</span>
    <p style={{ margin:'14px 0 6px', fontSize:16, fontWeight:600, color:T.ink }}>{title}</p>
    <p style={{ margin:0, fontSize:14, color:T.inkSoft }}>{desc}</p>
  </div>
);

// ── Estilos ──────────────────────────────────────────────────────────────────
const st = {
  root: {
    fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
    background: T.bg,
    minHeight: '100vh',
    color: T.ink,
  },
  headerBar: {
    background: T.ink,
    padding: '36px 32px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 16,
  },
  badge: {
    display: 'inline-block',
    background: T.tealMid,
    color: T.white,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    padding: '3px 9px',
    borderRadius: 4,
    marginBottom: 12,
  },
  pageTitle: {
    margin: '0 0 6px',
    fontSize: 24,
    fontWeight: 700,
    color: T.white,
    letterSpacing: '-0.3px',
  },
  pageSub: {
    margin: 0,
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 1.5,
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(255,255,255,0.08)',
    color: T.white,
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: 8,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  body: {
    maxWidth: 1280,
    margin: '0 auto',
    padding: '28px 24px 52px',
  },
  loadingWrap: {
    display: 'flex', flexDirection:'column', alignItems:'center', gap:14, padding:'80px 0',
  },
  spinner: {
    width: 30, height: 30,
    border: `3px solid ${T.border}`,
    borderTopColor: T.teal,
    borderRadius: '50%',
    animation: 'spin 0.75s linear infinite',
  },
  alert: {
    display: 'flex', alignItems: 'center', gap: 10,
    border: '1px solid',
    borderRadius: 8, padding: '11px 14px',
    fontSize: 13, marginBottom: 18,
  },
  alertDot: {
    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
  },
  alertClose: {
    marginLeft: 'auto', background: 'none', border: 'none',
    cursor: 'pointer', fontSize: 13, color: 'inherit', opacity: 0.6,
    padding: '0 2px',
  },
  card: {
    background: T.white,
    borderRadius: 12,
    border: `1px solid ${T.border}`,
    marginBottom: 18,
    overflow: 'hidden',
  },
  cardHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 18px',
    borderBottom: `1px solid ${T.border}`,
    gap: 12,
    flexWrap: 'wrap',
  },
  cardHeadTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: T.ink,
  },
  actLabel: {
    margin: '0 0 12px',
    fontSize: 11,
    fontWeight: 700,
    color: T.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  detalleGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 260px',
    gap: 18,
    marginBottom: 0,
    alignItems: 'start',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '10px 14px',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 700,
    color: T.white,
    background: T.ink,
    whiteSpace: 'nowrap',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  td: {
    padding: '10px 14px',
    fontSize: 13,
    color: T.inkSoft,
    borderBottom: `1px solid ${T.border}`,
    verticalAlign: 'middle',
  },
  code: {
    display: 'inline-block',
    fontSize: 11,
    backgroundColor: '#f3f4f6',
    color: '#374151',
    padding: '2px 7px',
    borderRadius: 5,
    fontFamily: 'monospace',
    border: `1px solid ${T.border}`,
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: T.teal,
    color: T.white,
    border: 'none',
    borderRadius: 7,
    padding: '7px 12px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  searchWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    border: `1px solid ${T.border}`,
    borderRadius: 7,
    padding: '6px 10px',
    backgroundColor: T.bg,
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: 13,
    color: T.ink,
    width: 260,
  },
  tableFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 18px',
    borderTop: `1px solid ${T.border}`,
    backgroundColor: '#fafafa',
  },
};

export default VerInscritos;
// dfghjklñ