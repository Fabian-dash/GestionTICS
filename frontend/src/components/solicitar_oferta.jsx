import React, { useState, useEffect } from 'react';
import api from '../services/api';

const C = {
  navy:       '#0a1628',
  green:      '#4caf82',
  greenHov:   '#3a9b6e',
  greenLight: '#e8f7f0',
  greenDark:  '#2a7a52',
  white:      '#ffffff',
  offWhite:   '#f4f5f7',
  border:     '#dde2ea',
  slate:      '#5a6478',
  slateLight: '#8a93a6',
  ink:        '#1c2435',
  redBg:      '#fff1f0',
  redTxt:     '#8b2020',
  redBorder:  '#f5c4c4',
};

const F = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const SolicitarOferta = () => {
  const [ofertas, setOfertas]                       = useState([]);
  const [ofertaSeleccionada, setOfertaSeleccionada] = useState(null);
  const [coordinador, setCoordinador]               = useState(null);
  const [mensaje, setMensaje]                       = useState('');
  const [loading, setLoading]                       = useState(false);
  const [error, setError]                           = useState('');
  const [success, setSuccess]                       = useState('');
  const [inscritos, setInscritos]                   = useState([]);
  const [step, setStep]                             = useState(1);
  const [misSolicitudes, setMisSolicitudes]         = useState([]);

  useEffect(() => {
    cargarOfertas();
    cargarCoordinador();
    cargarMisSolicitudes();
  }, []);

  const cargarMisSolicitudes = async () => {
    try {
      const r = await api.get('/solicitudes/mis-solicitudes');
      setMisSolicitudes(r.data.data || []);
    } catch { console.error('Error cargando mis solicitudes'); }
  };

  const cargarOfertas = async () => {
    try {
      const r = await api.get('/ofertas/mis-ofertas');
      setOfertas(r.data.data || []);
    } catch { setError('Error al cargar las ofertas'); }
  };

  const cargarCoordinador = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.coordinadorAsignado) { setCoordinador(user.coordinadorAsignado); return; }
      const r = await api.get('/usuarios/coordinador');
      setCoordinador(r.data.data);
    } catch { console.error('Error cargando coordinador'); }
  };

  const cargarInscritos = async (id) => {
    try {
      const r = await api.get(`/inscripciones/oferta/${id}`);
      setInscritos(r.data.data || []);
    } catch { console.error('Error cargando inscritos'); }
  };

  const handleOfertaChange = async (e) => {
    const id = e.target.value;
    if (!id) { setOfertaSeleccionada(null); setInscritos([]); return; }
    const o = ofertas.find(x => x._id === id);
    setOfertaSeleccionada(o);
    await cargarInscritos(id);
  };

  const handleSubmit = async () => {
    if (!ofertaSeleccionada) { setError('Debe seleccionar una oferta'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.post('/solicitudes/validacion', {
        oferta_id: ofertaSeleccionada._id,
        mensaje,
      });
      setSuccess('Solicitud enviada exitosamente al coordinador');
      setTimeout(() => setSuccess(''), 5000);
      // Recargar solicitudes después del envío exitoso
      await cargarMisSolicitudes();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al enviar la solicitud');
    } finally { setLoading(false); }
  };

  // ===== FUNCIÓN AUXILIAR: obtener estado de solicitud de una oferta =====
  const getEstadoSolicitud = (ofertaId) => {
    const solicitud = misSolicitudes.find(s => s.oferta_id?._id === ofertaId);
    if (!solicitud) return null;
    return {
      estado: solicitud.estado,
      fecha: solicitud.fecha_solicitud,
      comentarios: solicitud.comentarios
    };
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('es-CO') : '—';

  const documentos = [
    { titulo: 'Ficha de Caracterización',   desc: 'PDF generado automáticamente con la información de la oferta.', ok: true,                           estado: 'Disponible' },
    { titulo: 'Carta de Presentación',      desc: 'Documento PDF con la carta de presentación.',                   ok: !!ofertaSeleccionada?.carta_pdf, estado: ofertaSeleccionada?.carta_pdf ? 'Adjunta' : 'No disponible' },
    { titulo: 'Listado de Cédulas (Excel)', desc: 'Archivo Excel con el listado de aspirantes inscritos.',         ok: inscritos.length > 0,            estado: inscritos.length > 0 ? `${inscritos.length} inscritos` : 'Sin inscritos' },
    { titulo: 'Cédulas Escaneadas (PDF)',   desc: 'PDF combinado con todas las cédulas de los aspirantes.',        ok: inscritos.length > 0,            estado: inscritos.length > 0 ? 'Disponible' : 'Sin cédulas' },
  ];

  const steps = ['Seleccionar oferta', 'Revisar documentos', 'Enviar solicitud'];

  return (
    <>
      <style>{css}</style>
      <div style={{ ...st.root, fontFamily: F }}>

        {/* Top bar */}
        <header style={st.topBar}>
          <div style={st.topBarInner}>
            <div style={st.topLeft}>
              <div style={st.topIconBox}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </div>
              <div>
                <p style={st.topLabel}>SENA · Gestión de Ofertas</p>
                <h1 style={st.topTitle}>Solicitar Validación</h1>
              </div>
            </div>
            {coordinador && (
              <div style={st.coordPill}>
                <div style={st.coordAvatar}>
                  {(coordinador.nombre || 'C').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={st.coordName}>{coordinador.nombre || 'Coordinador'}</p>
                  <p style={st.coordRole}>Coordinador asignado</p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Stepper */}
        <div style={st.stepperWrap}>
          <div style={st.stepper}>
            {steps.map((label, i) => {
              const n = i + 1;
              const done   = step > n;
              const active = step === n;
              return (
                <div key={n} style={{ display: 'contents' }}>
                  <div
                    style={st.stepItem}
                    onClick={() => n < step && setStep(n)}
                    className={n < step ? 'step-clickable' : ''}
                  >
                    <div style={{ ...st.stepCircle, ...(active ? st.stepActive : done ? st.stepDone : {}) }}>
                      {done
                        ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        : n
                      }
                    </div>
                    <span style={{ ...st.stepLabel, ...(active ? { color: C.ink, fontWeight: 600 } : done ? { color: C.greenDark } : {}) }}>
                      {label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{ ...st.stepLine, ...(step > n ? { background: C.green } : {}) }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={st.body}>

          {/* Alertas */}
          {error && (
            <div style={st.alertErr}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.redTxt} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}
          {success && (
            <div style={st.alertOk}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.greenDark} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {success}
            </div>
          )}

          {/* PASO 1 */}
          {step === 1 && (
            <div style={st.stepPanel}>
              <SectionTitle n="01" title="Oferta a validar" sub="Selecciona el programa que deseas enviar a revisión" />
              <div style={st.twoCol}>
                <div style={st.card}>
                  <FieldLabel>Programa de formación</FieldLabel>
                  <select onChange={handleOfertaChange} style={{ ...st.select, fontFamily: F }} defaultValue="">
                    <option value="" disabled>— Seleccione una oferta —</option>
                    {ofertas.map(o => {
                      const estadoSol = getEstadoSolicitud(o._id);
                      const disabled = estadoSol?.estado === 'pendiente' || estadoSol?.estado === 'aprobada';
                      return (
                        <option key={o._id} value={o._id} disabled={disabled}>
                          {o.programa_formacion?.nombre_programa} · {o.programa_formacion?.codigo}
                          {estadoSol && estadoSol.estado === 'pendiente' ? ' (⏳ Pendiente)' : ''}
                          {estadoSol && estadoSol.estado === 'aprobada' ? ' (✓ Aprobada)' : ''}
                          {estadoSol && estadoSol.estado === 'rechazada' ? ' (✗ Rechazada)' : ''}
                        </option>
                      );
                    })}
                  </select>
                  {ofertaSeleccionada && (
                    <>
                      <div style={st.detailBox}>
                        {[
                          ['Código',       ofertaSeleccionada.programa_formacion?.codigo],
                          ['Programa',     ofertaSeleccionada.programa_formacion?.nombre_programa],
                          ['Tipo',         ofertaSeleccionada.es_campesena ? 'Campesena' : 'Regular'],
                          ['Tipo oferta',  ofertaSeleccionada.tipo_oferta?.nombre || 'N/A'],
                          ['Estado',       ofertaSeleccionada.estado?.nombre || ofertaSeleccionada.estado?.codigo || 'Pendiente'],
                          ['Fecha inicio', fmt(ofertaSeleccionada.fechas?.inicio)],
                        ].map(([label, val]) => (
                          <div key={label} style={st.detailRow}>
                            <span style={st.detailLabel}>{label}</span>
                            <span style={st.detailVal}>{val}</span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Mostrar estado de solicitud anterior si existe */}
                      {(() => {
                        const estadoSol = getEstadoSolicitud(ofertaSeleccionada._id);
                        if (!estadoSol) return null;
                        
                        const bgColor = estadoSol.estado === 'rechazada' ? C.redBg : estadoSol.estado === 'aprobada' ? '#e8f7f0' : '#fdf3e3';
                        const txtColor = estadoSol.estado === 'rechazada' ? C.redTxt : estadoSol.estado === 'aprobada' ? C.greenDark : '#7a4a0a';
                        const ico = estadoSol.estado === 'rechazada' ? '✗' : estadoSol.estado === 'aprobada' ? '✓' : '⏳';
                        
                        return (
                          <div style={{ ...st.statusBox, background: bgColor, borderColor: txtColor + '33' }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: txtColor }}>
                              {ico} {estadoSol.estado.charAt(0).toUpperCase() + estadoSol.estado.slice(1)}
                            </span>
                            <span style={{ fontSize: 11, color: txtColor, opacity: 0.7, display: 'block', marginTop: 4 }}>
                              {fmt(estadoSol.fecha)}
                            </span>
                            {estadoSol.comentarios && (
                              <span style={{ fontSize: 11, color: txtColor, display: 'block', marginTop: 8, fontStyle: 'italic' }}>
                                Comentarios: {estadoSol.comentarios}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>

                {coordinador && (
                  <div style={st.card}>
                    <FieldLabel>Destinatario</FieldLabel>
                    <div style={st.coordCard}>
                      <div style={st.coordBig}>
                        {(coordinador.nombre || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={st.coordBigName}>{coordinador.nombre || 'Jose Alirio Cobo Lemos'}</p>
                        <p style={st.coordBigRole}>Coordinador de Formación</p>
                      </div>
                    </div>
                    <div style={st.coordFields}>
                      {[
                        ['Email',          coordinador.email          || 'jcobo@sena.edu.co'],
                        ['Teléfono',       coordinador.telefono       || '3226784590'],
                        ['Identificación', coordinador.identificacion || '10671330'],
                      ].map(([label, val]) => (
                        <div key={label} style={st.coordField}>
                          <span style={st.coordFieldLabel}>{label}</span>
                          <span style={st.coordFieldVal}>{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div style={st.stepFooter}>
                <div />
                <button
                  className="btn-primary"
                  onClick={() => ofertaSeleccionada && setStep(2)}
                  disabled={!ofertaSeleccionada}
                  style={{ ...st.btnPrimary, fontFamily: F, ...(!ofertaSeleccionada ? st.btnDisabled : {}) }}
                >
                  Continuar
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* PASO 2 */}
          {step === 2 && (
            <div style={st.stepPanel}>
              <SectionTitle n="02" title="Documentos a enviar" sub="Verifica que todos los documentos necesarios estén disponibles" />
              <div style={st.card}>
                {documentos.map((doc, i) => (
                  <div key={i} style={{ ...st.docRow, ...(i < documentos.length - 1 ? { borderBottom: `1px solid ${C.border}` } : {}) }}>
                    <div style={{ ...st.docIconBox, background: doc.ok ? C.greenLight : '#fef3f3' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={doc.ok ? C.greenDark : C.redTxt} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                      </svg>
                    </div>
                    <div style={st.docTexts}>
                      <span style={st.docTitle}>{doc.titulo}</span>
                      <span style={st.docDesc}>{doc.desc}</span>
                    </div>
                    <span style={doc.ok ? st.tagOk : st.tagNo}>
                      {doc.ok
                        ? <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><polyline points="20 6 9 17 4 12"/></svg>{doc.estado}</>
                        : <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>{doc.estado}</>
                      }
                    </span>
                  </div>
                ))}
              </div>
              <div style={st.stepFooter}>
                <button className="btn-ghost" onClick={() => setStep(1)} style={{ ...st.btnGhost, fontFamily: F }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                  Volver
                </button>
                <button className="btn-primary" onClick={() => setStep(3)} style={{ ...st.btnPrimary, fontFamily: F }}>
                  Continuar
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* PASO 3 */}
          {step === 3 && (
            <div style={st.stepPanel}>
              <SectionTitle n="03" title="Mensaje y envío" sub="Añade un mensaje opcional y confirma el envío al coordinador" />
              <div style={st.twoCol}>
                <div style={st.card}>
                  <FieldLabel>Resumen de la solicitud</FieldLabel>
                  <div style={st.resumenBox}>
                    <span style={st.resumenCodigo}>{ofertaSeleccionada?.programa_formacion?.codigo || '—'}</span>
                    <p style={st.resumenNombre}>{ofertaSeleccionada?.programa_formacion?.nombre_programa || '—'}</p>
                    <div style={st.resumenMeta}>
                      <span>{fmt(ofertaSeleccionada?.fechas?.inicio)}</span>
                      <span style={{ color: C.border }}>·</span>
                      <span>{ofertaSeleccionada?.ubicacion?.municipio?.nombre || '—'}</span>
                    </div>
                    <div style={st.resumenDocs}>
                      <span style={st.resumenDocCount}>{documentos.filter(d => d.ok).length}</span>
                      <span style={st.resumenDocLabel}> de {documentos.length} documentos disponibles</span>
                    </div>
                  </div>
                </div>
                <div style={st.card}>
                  <FieldLabel>Mensaje para el coordinador (opcional)</FieldLabel>
                  <textarea
                    value={mensaje}
                    onChange={e => setMensaje(e.target.value)}
                    style={{ ...st.textarea, fontFamily: F }}
                    rows={5}
                    placeholder="Escriba observaciones o información adicional..."
                  />
                  <div style={st.destinatarioRow}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.slateLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span style={{ fontSize: 12, color: C.slateLight }}>
                      Para: <strong style={{ color: C.ink }}>{coordinador?.nombre || 'Coordinador asignado'}</strong>
                    </span>
                  </div>
                </div>
              </div>
              <div style={st.stepFooter}>
                <button className="btn-ghost" onClick={() => setStep(2)} style={{ ...st.btnGhost, fontFamily: F }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                  Volver
                </button>
                <button
                  className="btn-primary"
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{ ...st.btnPrimary, fontFamily: F, ...(loading ? st.btnDisabled : {}) }}
                >
                  {loading
                    ? <><span style={st.spinner} /> Enviando...</>
                    : <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                        </svg>
                        Enviar solicitud
                      </>
                  }
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

/* ── Helpers ── */
const SectionTitle = ({ n, title, sub }) => (
  <div style={{ marginBottom: 22 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#4caf82', letterSpacing: '0.1em' }}>PASO {n}</span>
      <div style={{ flex: 1, height: 1, background: '#dde2ea' }} />
    </div>
    <h2 style={{ margin: '8px 0 4px', fontSize: 18, fontWeight: 600, color: '#1c2435' }}>{title}</h2>
    <p style={{ margin: 0, fontSize: 13, color: '#8a93a6' }}>{sub}</p>
  </div>
);

const FieldLabel = ({ children }) => (
  <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 600, color: '#8a93a6', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
    {children}
  </p>
);

const css = `
  *, *::before, *::after { box-sizing: border-box; }
  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes fadeUp  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  .btn-primary:hover:not(:disabled) { background: #3a9b6e !important; }
  .btn-ghost:hover { background: #eaecf0 !important; }
  .step-clickable:hover > div:first-child { opacity: 0.75; }
`;

const st = {
  root: {
    background: '#f4f5f7',
    minHeight: '100vh',
    animation: 'fadeUp 0.35s ease both',
  },
  topBar: {
    background: '#0a1628',
    borderBottom: '3px solid #4caf82',
    padding: '0 28px',
  },
  topBarInner: {
    maxWidth: 960, margin: '0 auto', height: 72,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
  },
  topLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  topIconBox: {
    width: 38, height: 38, borderRadius: 6,
    border: '1.5px solid rgba(76,175,130,0.45)',
    background: 'rgba(76,175,130,0.08)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  topLabel: { margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' },
  topTitle: { margin: '2px 0 0', fontSize: 17, fontWeight: 600, color: '#ffffff' },
  coordPill: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, padding: '8px 14px',
  },
  coordAvatar: {
    width: 32, height: 32, borderRadius: '50%',
    background: '#4caf82', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700, flexShrink: 0,
  },
  coordName: { margin: 0, fontSize: 13, fontWeight: 600, color: '#fff' },
  coordRole: { margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.4)' },

  stepperWrap: { background: '#fff', borderBottom: '1px solid #dde2ea', padding: '0 28px' },
  stepper: {
    maxWidth: 960, margin: '0 auto', height: 56,
    display: 'flex', alignItems: 'center',
  },
  stepItem: { display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 },
  stepCircle: {
    width: 24, height: 24, borderRadius: '50%',
    background: '#dde2ea', color: '#8a93a6',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700, transition: 'all 0.2s',
  },
  stepActive: { background: '#4caf82', color: '#fff' },
  stepDone:   { background: '#e8f7f0', color: '#2a7a52' },
  stepLabel:  { fontSize: 12, fontWeight: 500, color: '#8a93a6', whiteSpace: 'nowrap' },
  stepLine:   { flex: 1, height: 1, background: '#dde2ea', margin: '0 10px', transition: 'background 0.3s', minWidth: 20 },

  body: { maxWidth: 960, margin: '0 auto', padding: '28px 24px 48px' },

  alertErr: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: '#fff1f0', color: '#8b2020', border: '1px solid #f5c4c4',
    borderRadius: 8, padding: '11px 16px', fontSize: 13, marginBottom: 16,
  },
  alertOk: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: '#e8f7f0', color: '#2a7a52', border: '1px solid #9fe1cb',
    borderRadius: 8, padding: '11px 16px', fontSize: 13, marginBottom: 16,
  },

  stepPanel: { animation: 'fadeUp 0.25s ease both' },
  twoCol: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 },

  card: { background: '#fff', border: '1px solid #dde2ea', borderRadius: 10, padding: '18px 20px', marginBottom: 16 },

  select: {
    width: '100%', padding: '9px 32px 9px 12px',
    border: '1px solid #dde2ea', borderRadius: 7,
    fontSize: 13, color: '#1c2435', background: '#fff',
    cursor: 'pointer', outline: 'none', appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238a93a6' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
  },

  detailBox: { marginTop: 12, borderRadius: 7, border: '1px solid #dde2ea', overflow: 'hidden' },
  detailRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #dde2ea' },
  detailLabel: { fontSize: 12, color: '#8a93a6', fontWeight: 500 },
  detailVal:   { fontSize: 12, color: '#1c2435', fontWeight: 600, textAlign: 'right', maxWidth: '60%' },

  statusBox: { marginTop: 12, borderRadius: 7, border: '1px solid', padding: '12px 14px', fontSize: 12 },

  coordCard: { display: 'flex', alignItems: 'center', gap: 12, background: '#f4f5f7', borderRadius: 8, padding: '12px 14px', marginBottom: 14 },
  coordBig: {
    width: 42, height: 42, borderRadius: '50%',
    background: '#4caf82', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, fontWeight: 700, flexShrink: 0,
  },
  coordBigName: { margin: 0, fontSize: 14, fontWeight: 600, color: '#1c2435' },
  coordBigRole: { margin: '2px 0 0', fontSize: 11, color: '#8a93a6' },
  coordFields:  { display: 'flex', flexDirection: 'column', gap: 8 },
  coordField:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  coordFieldLabel: { fontSize: 10, color: '#8a93a6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' },
  coordFieldVal:   { fontSize: 12, color: '#1c2435', fontWeight: 500 },

  docRow:     { display: 'flex', alignItems: 'center', gap: 14, padding: '13px 4px' },
  docIconBox: { width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  docTexts:   { flex: 1, display: 'flex', flexDirection: 'column', gap: 2 },
  docTitle:   { fontSize: 13, fontWeight: 600, color: '#1c2435' },
  docDesc:    { fontSize: 11, color: '#8a93a6', lineHeight: 1.5 },
  tagOk: { display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 600, color: '#2a7a52', background: '#e8f7f0', padding: '4px 10px', borderRadius: 20, whiteSpace: 'nowrap' },
  tagNo:  { display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 600, color: '#8b2020', background: '#fff1f0', padding: '4px 10px', borderRadius: 20, whiteSpace: 'nowrap' },

  resumenBox:      { background: '#f4f5f7', borderRadius: 8, padding: 16, border: '1px solid #dde2ea' },
  resumenCodigo:   { display: 'inline-block', background: '#e8f7f0', color: '#2a7a52', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', padding: '3px 8px', borderRadius: 4, marginBottom: 8 },
  resumenNombre:   { margin: '0 0 6px', fontSize: 14, fontWeight: 600, color: '#1c2435' },
  resumenMeta:     { display: 'flex', gap: 8, fontSize: 12, color: '#8a93a6', marginBottom: 12 },
  resumenDocs:     { display: 'flex', alignItems: 'baseline', gap: 4 },
  resumenDocCount: { fontSize: 24, fontWeight: 700, color: '#4caf82' },
  resumenDocLabel: { fontSize: 12, color: '#8a93a6' },

  textarea: {
    width: '100%', padding: '10px 12px',
    border: '1px solid #dde2ea', borderRadius: 7,
    fontSize: 13, color: '#1c2435', background: '#fff',
    resize: 'vertical', outline: 'none', lineHeight: 1.6,
    boxSizing: 'border-box', marginBottom: 10,
  },
  destinatarioRow: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 10px', background: '#f4f5f7',
    borderRadius: 6, border: '1px solid #dde2ea',
  },

  stepFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 },
  btnPrimary: {
    display: 'flex', alignItems: 'center', gap: 7,
    background: '#4caf82', color: '#fff',
    border: 'none', borderRadius: 7,
    padding: '10px 22px', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', transition: 'background 0.15s',
  },
  btnGhost: {
    display: 'flex', alignItems: 'center', gap: 7,
    background: 'transparent', color: '#5a6478',
    border: '1px solid #dde2ea', borderRadius: 7,
    padding: '10px 18px', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', transition: 'background 0.15s',
  },
  btnDisabled: { background: '#c5ccd8', cursor: 'not-allowed' },
  spinner: {
    display: 'inline-block', width: 13, height: 13,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff', borderRadius: '50%',
    marginRight: 6, animation: 'spin 0.7s linear infinite',
  },
};

export default SolicitarOferta;
