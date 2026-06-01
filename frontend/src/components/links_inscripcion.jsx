import React, { useState, useEffect } from 'react';
import api from '../services/api';

/* ─── Paleta SENA institucional ─── */
const C = {
  navy:     '#0a1628',
  navyMid:  '#122040',
  navyLow:  '#1a2f5a',
  orange:   '#4caf82',
  orangeHov:'#3a9b6e',
  gold:     '#a8e6c8',
  white:    '#ffffff',
  offWhite: '#f4f5f7',
  border:   '#dde2ea',
  slate:    '#5a6478',
  slateLight:'#8a93a6',
  ink:      '#1c2435',
};

const LinksInscripcion = () => {
  const [ofertas, setOfertas]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [copiado, setCopiado]       = useState(null);
  const [selected, setSelected]     = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { cargarMisOfertas(); }, []);

  const cargarMisOfertas = async () => {
    try {
      const r = await api.get('/ofertas/mis-ofertas');
      const data = r.data.data || [];
      setOfertas(data);
      if (data.length) setSelected(data[0]._id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const copiarLink = (link) => {
    navigator.clipboard.writeText(`http://localhost:3000${link}`);
    setCopiado(link);
    setTimeout(() => setCopiado(null), 2000);
  };

  const abrirLink = (link) => window.open(`http://localhost:3000${link}`, '_blank');

  const descargarPDF = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const r = await api.get(`/ofertas/${id}/pdf`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` },
      });
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', `ficha-${id}.pdf`);
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      alert('Error al descargar el PDF');
    }
  };

  const eliminarOferta = async (id) => {
    try {
      await api.delete(`/ofertas/${id}`);
      const next = ofertas.filter(o => o._id !== id);
      setOfertas(next);
      setConfirmDelete(null);
      setSelected(next.length ? next[0]._id : null);
    } catch {
      alert('Error al eliminar la oferta');
    }
  };

  const ofertaActual = ofertas.find(o => o._id === selected) || null;

  /* ── totales ── */
  const totalDisp  = ofertas.reduce((a, o) => a + (o.cupos_disponibles || 0), 0);
  const totalMax   = ofertas.reduce((a, o) => a + (o.cupo_maximo || 0), 0);
  const pctOcupado = totalMax > 0 ? Math.round(((totalMax - totalDisp) / totalMax) * 100) : 0;

  const cuposColor = (disp, max) => {
    const r = disp / max;
    if (r > 0.5) return '#1a9e5c';
    if (r > 0.2) return C.gold;
    return '#d94040';
  };

  if (loading) return (
    <div style={{ ...st.center, minHeight: 300 }}>
      <div style={st.spinnerRing} />
      <p style={{ color: C.slateLight, fontFamily: 'Barlow, sans-serif', marginTop: 14 }}>
        Cargando ofertas…
      </p>
    </div>
  );

  return (
    <>
      <style>{css}</style>

      {/* Modal eliminar */}
      {confirmDelete && (
        <div style={st.overlay}>
          <div style={st.modal}>
            <div style={st.modalWarning}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.orange} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </div>
            <h3 style={st.modalH}>Confirmar eliminación</h3>
            <p style={st.modalP}>Esta acción es irreversible. Se eliminarán instructores e inscripciones asociadas.</p>
            <div style={st.modalRow}>
              <button className="btn-ghost" onClick={() => setConfirmDelete(null)} style={st.btnGhost}>Cancelar</button>
              <button className="btn-del" onClick={() => eliminarOferta(confirmDelete)} style={st.btnDel}>Eliminar definitivamente</button>
            </div>
          </div>
        </div>
      )}

      <div style={st.root}>

        {/* ── Barra superior institucional ── */}
        <header style={st.topBar}>
          <div style={st.topBarLeft}>
            <div style={st.logoBox}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.orange} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </div>
            <div>
              <p style={st.topLabel}>SENA · Gestión de Ofertas</p>
              <h1 style={st.topTitle}>Links de Inscripción</h1>
            </div>
          </div>
          <div style={st.topStats}>
            <Stat n={ofertas.length}  label="Ofertas" accent={C.orange} />
            <div style={st.statSep} />
            <Stat n={totalDisp}       label="Cupos libres" accent="#1a9e5c" />
            <div style={st.statSep} />
            <Stat n={`${pctOcupado}%`} label="Ocupación" accent={C.gold} />
          </div>
        </header>

        {ofertas.length === 0 ? (
          <div style={st.empty}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke={C.border} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
            <p style={{ color: C.slateLight, fontFamily: 'Barlow, sans-serif', marginTop: 16 }}>
              No hay ofertas registradas. Ve a «Crear Oferta» para comenzar.
            </p>
          </div>
        ) : (
          <div style={st.body}>

            {/* ── Panel izquierdo: lista ── */}
            <aside style={st.sidebar}>
              <p style={st.sideLabel}>Programas ({ofertas.length})</p>
              {ofertas.map(o => {
                const activo = o._id === selected;
                const cc = cuposColor(o.cupos_disponibles, o.cupo_maximo);
                return (
                  <button
                    key={o._id}
                    onClick={() => setSelected(o._id)}
                    style={{ ...st.sideItem, ...(activo ? st.sideItemActive : {}) }}
                    className="side-item"
                  >
                    <div style={{ ...st.sideDot, background: cc }} />
                    <div style={st.sideTexts}>
                      <span style={st.sideNombre}>
                        {o.programa_formacion?.nombre_programa || 'Sin nombre'}
                      </span>
                      <span style={st.sideCodigo}>
                        {o.programa_formacion?.codigo || '—'} · {o.cupos_disponibles}/{o.cupo_maximo} cupos
                      </span>
                    </div>
                    {activo && <div style={st.sideArrow}>›</div>}
                  </button>
                );
              })}
            </aside>

            {/* ── Panel derecho: detalle ── */}
            <main style={st.detail}>
              {ofertaActual ? (
                <>
                  {/* Encabezado del detalle */}
                  <div style={st.detailHeader}>
                    <div>
                      <span style={st.detailCodigo}>
                        {ofertaActual.programa_formacion?.codigo || 'SIN CÓDIGO'}
                      </span>
                      <h2 style={st.detailTitle}>
                        {ofertaActual.programa_formacion?.nombre_programa || 'Programa sin nombre'}
                      </h2>
                    </div>
                    <button
                      className="btn-del-sm"
                      onClick={() => setConfirmDelete(ofertaActual._id)}
                      style={st.delIconBtn}
                      title="Eliminar oferta"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                      Eliminar
                    </button>
                  </div>

                  {/* Cupos bar */}
                  <div style={st.cuposBlock}>
                    <div style={st.cuposRow}>
                      <span style={st.cuposLbl}>Disponibilidad de cupos</span>
                      <span style={{ ...st.cuposNum, color: cuposColor(ofertaActual.cupos_disponibles, ofertaActual.cupo_maximo) }}>
                        {ofertaActual.cupos_disponibles} disponibles de {ofertaActual.cupo_maximo}
                      </span>
                    </div>
                    <div style={st.track}>
                      <div style={{
                        ...st.fill,
                        width: `${Math.round((ofertaActual.cupos_disponibles / ofertaActual.cupo_maximo) * 100)}%`,
                        background: cuposColor(ofertaActual.cupos_disponibles, ofertaActual.cupo_maximo),
                      }} />
                    </div>
                  </div>

                  {/* Tabla de datos */}
                  <table style={st.table}>
                    <tbody>
                      {[
                        ['Fecha inicio',    new Date(ofertaActual.fechas?.inicio).toLocaleDateString('es-CO', { dateStyle: 'long' })],
                        ['Fecha fin',       new Date(ofertaActual.fechas?.fin).toLocaleDateString('es-CO', { dateStyle: 'long' })],
                        ['Municipio',       ofertaActual.ubicacion?.municipio?.nombre || '—'],
                        ['Coordinador',     ofertaActual.coordinador_asignado?.nombre || '—'],
                      ].map(([label, val]) => (
                        <tr key={label} style={st.tr}>
                          <td style={st.tdLabel}>{label}</td>
                          <td style={st.tdVal}>{val}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Link box */}
                  <div style={st.linkBlock}>
                    <p style={st.linkCaption}>URL de inscripción pública</p>
                    <div style={st.linkRow}>
                      <div style={st.linkPill}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.slateLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                        </svg>
                        <span style={st.linkText}>
                          localhost:3000{ofertaActual.link_inscripciones || '/inscribirse/error'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div style={st.actions}>
                    <button
                      className="btn-primary"
                      onClick={() => copiarLink(ofertaActual.link_inscripciones)}
                      style={{ ...st.btnPrimary, ...(copiado === ofertaActual.link_inscripciones ? st.btnCopied : {}) }}
                    >
                      {copiado === ofertaActual.link_inscripciones ? (
                        <><CheckIcon /> Copiado</>
                      ) : (
                        <><CopyIcon /> Copiar link</>
                      )}
                    </button>

                    <button
                      className="btn-secondary"
                      onClick={() => abrirLink(ofertaActual.link_inscripciones)}
                      style={st.btnSecondary}
                    >
                      <ExternalIcon /> Abrir
                    </button>

                    <button
                      className="btn-outline"
                      onClick={() => descargarPDF(ofertaActual._id)}
                      style={st.btnOutline}
                      title="Descargar ficha PDF"
                    >
                      <PdfIcon /> Ficha PDF
                    </button>
                  </div>
                </>
              ) : (
                <div style={st.center}>
                  <p style={{ color: C.slateLight, fontFamily: 'Barlow, sans-serif' }}>
                    Selecciona una oferta
                  </p>
                </div>
              )}
            </main>

          </div>
        )}
      </div>
    </>
  );
};

/* ─── Componentes auxiliares ─── */
const Stat = ({ n, label, accent }) => (
  <div style={{ textAlign: 'center', padding: '0 18px' }}>
    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", color: accent, lineHeight: 1 }}>{n}</div>
    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'Barlow', sans-serif" }}>{label}</div>
  </div>
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
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
  </svg>
);

/* ─── CSS global ─── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600&family=Barlow+Semi+Condensed:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin    { to { transform:rotate(360deg); } }
  @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
  @keyframes popIn   { from { opacity:0; transform:scale(0.94); } to { opacity:1; transform:scale(1); } }

  .side-item:hover { background: rgba(232,82,10,0.06) !important; }
  .btn-primary:hover { background: #c4430a !important; }
  .btn-secondary:hover { background: #e2e6f0 !important; }
  .btn-outline:hover { background: #f0f2f7 !important; }
  .btn-ghost:hover { background: #f0f2f7 !important; }
  .btn-del:hover { background: #b03208 !important; }
  .btn-del-sm:hover { background: #fff0eb !important; color: #c4430a !important; }
`;

/* ─── Estilos ─── */
const st = {
  root: {
    fontFamily: "'Barlow Semi Condensed', 'Barlow', sans-serif",
    background: C.offWhite,
    minHeight: '100vh',
    animation: 'fadeUp 0.35s ease both',
  },

  /* Top bar */
  topBar: {
    background: C.navy,
    padding: '0 28px',
    height: 72,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: `3px solid ${C.orange}`,
  },
  topBarLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  logoBox: {
    width: 38,
    height: 38,
    borderRadius: 6,
    border: `1.5px solid rgba(232,82,10,0.5)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(232,82,10,0.08)',
  },
  topLabel: {
    margin: 0,
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontFamily: "'Barlow', sans-serif",
    fontWeight: 500,
  },
  topTitle: {
    margin: '2px 0 0',
    fontSize: 18,
    fontWeight: 700,
    color: C.white,
    fontFamily: "'Barlow Condensed', sans-serif",
    letterSpacing: '0.02em',
  },
  topStats: { display: 'flex', alignItems: 'center' },
  statSep: { width: 1, height: 28, background: 'rgba(255,255,255,0.1)' },

  /* Body */
  body: {
    display: 'grid',
    gridTemplateColumns: '290px 1fr',
    minHeight: 'calc(100vh - 75px)',
  },

  /* Sidebar */
  sidebar: {
    background: C.white,
    borderRight: `1px solid ${C.border}`,
    padding: '20px 0',
    overflowY: 'auto',
  },
  sideLabel: {
    margin: '0 0 10px',
    padding: '0 18px',
    fontSize: 10,
    fontWeight: 600,
    color: C.slateLight,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontFamily: "'Barlow', sans-serif",
  },
  sideItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    border: 'none',
    background: 'transparent',
    padding: '10px 18px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.15s',
    borderLeft: '3px solid transparent',
  },
  sideItemActive: {
    background: 'rgba(232,82,10,0.05)',
    borderLeft: `3px solid ${C.orange}`,
  },
  sideDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  sideTexts: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 },
  sideNombre: {
    fontSize: 13,
    fontWeight: 600,
    color: C.ink,
    fontFamily: "'Barlow', sans-serif",
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  sideCodigo: {
    fontSize: 11,
    color: C.slateLight,
    fontFamily: "'Barlow', sans-serif",
  },
  sideArrow: {
    fontSize: 16,
    color: C.orange,
    fontWeight: 700,
    flexShrink: 0,
  },

  /* Detail */
  detail: {
    padding: '32px 36px',
    background: C.offWhite,
  },
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    gap: 16,
  },
  detailCodigo: {
    display: 'inline-block',
    background: '#e8f7f0',
    color: '#2a7a52',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.12em',
    padding: '4px 10px',
    borderRadius: 4,
    fontFamily: "'Barlow', sans-serif",
    marginBottom: 8,
  },
  detailTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    fontFamily: "'Barlow Condensed', sans-serif",
    color: C.ink,
    lineHeight: 1.2,
    letterSpacing: '0.01em',
  },
  delIconBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'transparent',
    border: `1px solid ${C.border}`,
    borderRadius: 6,
    padding: '7px 12px',
    cursor: 'pointer',
    fontSize: 12,
    color: C.slate,
    fontFamily: "'Barlow', sans-serif",
    fontWeight: 500,
    transition: 'all 0.15s',
    flexShrink: 0,
  },

  /* Cupos */
  cuposBlock: {
    background: C.white,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: '14px 18px',
    marginBottom: 16,
  },
  cuposRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cuposLbl: { fontSize: 12, color: C.slateLight, fontWeight: 500 },
  cuposNum: { fontSize: 13, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.02em' },
  track: { height: 6, background: C.offWhite, borderRadius: 99, overflow: 'hidden', border: `1px solid ${C.border}` },
  fill:  { height: '100%', borderRadius: 99, transition: 'width 0.5s ease' },

  /* Table */
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: C.white,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  tr: { borderBottom: `1px solid ${C.border}` },
  tdLabel: {
    padding: '10px 16px',
    fontSize: 12,
    color: C.slateLight,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    width: '36%',
    background: '#fafbfc',
    fontFamily: "'Barlow', sans-serif",
  },
  tdVal: {
    padding: '10px 16px',
    fontSize: 13,
    color: C.ink,
    fontWeight: 500,
    fontFamily: "'Barlow', sans-serif",
  },

  /* Link */
  linkBlock: {
    marginBottom: 20,
  },
  linkCaption: {
    fontSize: 11,
    fontWeight: 600,
    color: C.slateLight,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 8,
    fontFamily: "'Barlow', sans-serif",
  },
  linkRow: { display: 'flex', alignItems: 'center', gap: 10 },
  linkPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: C.white,
    border: `1px solid ${C.border}`,
    borderRadius: 6,
    padding: '9px 14px',
    flex: 1,
  },
  linkText: {
    fontSize: 12,
    color: C.slate,
    fontFamily: "'Barlow', monospace",
    wordBreak: 'break-all',
  },

  /* Actions */
  actions: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  btnPrimary: {
    display: 'flex', alignItems: 'center', gap: 7,
    background: C.orange,
    color: C.white,
    border: 'none',
    borderRadius: 6,
    padding: '10px 20px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Barlow', sans-serif",
    transition: 'background 0.15s',
    letterSpacing: '0.01em',
  },
  btnCopied: { background: '#1a9e5c' },
  btnSecondary: {
    display: 'flex', alignItems: 'center', gap: 7,
    background: '#e8edf5',
    color: C.navyLow,
    border: 'none',
    borderRadius: 6,
    padding: '10px 18px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Barlow', sans-serif",
    transition: 'background 0.15s',
  },
  btnOutline: {
    display: 'flex', alignItems: 'center', gap: 7,
    background: 'transparent',
    color: C.slate,
    border: `1px solid ${C.border}`,
    borderRadius: 6,
    padding: '10px 18px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Barlow', sans-serif",
    transition: 'background 0.15s',
  },

  /* Modal */
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(10,22,40,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999,
    animation: 'fadeIn 0.2s ease',
  },
  modal: {
    background: C.white,
    borderRadius: 10,
    padding: '28px 28px 22px',
    width: 380,
    borderTop: `4px solid ${C.orange}`,
    animation: 'popIn 0.2s ease',
  },
  modalWarning: {
    width: 44, height: 44,
    borderRadius: '50%',
    background: '#fff3ed',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  modalH: { margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.02em' },
  modalP: { margin: '0 0 22px', fontSize: 13, color: C.slate, lineHeight: 1.6, fontFamily: "'Barlow', sans-serif" },
  modalRow: { display: 'flex', gap: 10 },
  btnGhost: {
    flex: 1, padding: '10px', background: 'transparent',
    border: `1px solid ${C.border}`, borderRadius: 6,
    color: C.slate, fontSize: 13, fontWeight: 600, cursor: 'pointer',
    fontFamily: "'Barlow', sans-serif", transition: 'background 0.15s',
  },
  btnDel: {
    flex: 1, padding: '10px', background: C.orange,
    border: 'none', borderRadius: 6,
    color: C.white, fontSize: 13, fontWeight: 600, cursor: 'pointer',
    fontFamily: "'Barlow', sans-serif", transition: 'background 0.15s',
  },

  /* Utiles */
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60 },
  spinnerRing: {
    width: 32, height: 32,
    border: `3px solid ${C.border}`,
    borderTop: `3px solid ${C.orange}`,
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '80px 32px', textAlign: 'center',
  },
};

export default LinksInscripcion;