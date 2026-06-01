import React, { useState } from 'react';
import HorarioPicker from './HorarioPicker';

/* ─── Tokens ────────────────────────────────────────────────── */
const T = {
  verde:      '#0f6e56',
  verdeDark:  '#064e3b',
  verdeMid:   '#10b981',
  verdeLite:  '#ecfdf5',
  ink:        '#0f172a',
  inkMid:     '#334155',
  muted:      '#64748b',
  border:     '#e2e8f0',
  bg:         '#f8fafc',
  white:      '#ffffff',
  red:        '#ef4444',
  amber:      '#f59e0b',
  blue:       '#3b82f6',
  blueBg:     '#eff6ff',
  blueTxt:    '#1e3a8a',
  purple:     '#8b5cf6',
  purpleBg:   '#f5f3ff',
  purpleTxt:  '#4c1d95',
};

const TIPO_CONF = {
  'Técnico':     { bg: T.verdeLite, txt: '#065f46', border: '#a7f3d0', dot: T.verdeMid },
  'Empresarial': { bg: T.blueBg,    txt: T.blueTxt, border: '#bfdbfe', dot: T.blue     },
  'Popular':     { bg: T.purpleBg,  txt: T.purpleTxt, border: '#ddd6fe', dot: T.purple },
};

const TIPOS_IDENTIFICACION = ['CC', 'CE', 'TI', 'PAP', 'NIT'];

/* ─── Icons ─────────────────────────────────────────────────── */
const Ic = {
  Users: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  Trash: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
    </svg>
  ),
  Plus: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
};

/* ─── Field wrapper ──────────────────────────────────────────── */
const Field = ({ label, children, hint, required }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: T.inkMid, letterSpacing: '0.02em' }}>
      {label}{required && <span style={{ color: T.red, marginLeft: 2 }}>*</span>}
    </label>
    {children}
    {hint && <span style={{ fontSize: 11.5, color: T.muted, marginTop: 2 }}>{hint}</span>}
  </div>
);

const inputStyle = {
  padding: '10px 14px',
  border: `1.5px solid ${T.border}`,
  borderRadius: 10,
  fontSize: 14,
  color: T.ink,
  backgroundColor: T.white,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color 0.2s',
};

const selectStyle = {
  ...inputStyle,
  cursor: 'pointer',
  backgroundColor: T.white,
};

/* ─── Instructor vacío / pre-llenado ─────────────────────────── */
const nuevoInstructor = (datos = {}) => ({
  id:                  Date.now() + Math.random(),
  tipo:                'Técnico',
  tipo_identificacion: datos.tipoIdentificacion || '',
  identificacion:      datos.numeroIdentificacion || '',
  nombre:              datos.nombre
                         ? `${datos.nombre} ${datos.apellido || ''}`.trim()
                         : '',
  correo:              datos.correoElectronico || '',
  celular:             datos.celular || '',
  horario:             { hora_inicio: '08:00', hora_fin: '12:00', dias: [] },
});

/* ─── Componente principal ───────────────────────────────────── */
const FormularioCampesenaCompleto = ({ formData, setFormData, instructorLogueado }) => {
  const [instructores, setInstructores] = useState([
    nuevoInstructor(instructorLogueado || {})
  ]);

  const sync = (nuevos) => {
    setInstructores(nuevos);
    setFormData({ ...formData, instructores: nuevos });
  };

  const agregarInstructor  = ()  => sync([...instructores, nuevoInstructor()]);
  const eliminarInstructor = (id) => sync(instructores.filter(i => i.id !== id));

  const actualizarCampo  = (id, campo, valor) =>
    sync(instructores.map(i => i.id === id ? { ...i, [campo]: valor } : i));

  const actualizarHorario = (id, nuevoHorario) =>
    sync(instructores.map(i => i.id === id ? { ...i, horario: nuevoHorario } : i));

  return (
    <>
      <style>{CSS}</style>
      <div className="fc-root">

        {/* ── ENCABEZADO ── */}
        <div className="fc-header">
          <div className="fc-header-left">
            <div className="fc-header-icon"><Ic.Users /></div>
            <div>
              <h3 className="fc-header-title">Instructores Campesena</h3>
              <p className="fc-header-sub">Registra los instructores, sus datos y horario semanal</p>
            </div>
          </div>
          <div className="fc-header-stats">
            <span className="fc-stat-num">{instructores.length}</span>
            <span className="fc-stat-lbl">instructor{instructores.length !== 1 ? 'es' : ''}</span>
          </div>
        </div>

        {/* ── LISTA DE INSTRUCTORES ── */}
        {instructores.map((inst, idx) => {
          const tc = TIPO_CONF[inst.tipo] || TIPO_CONF['Técnico'];
          const completo = inst.horario.dias.length > 0 && inst.nombre && inst.correo && inst.identificacion;

          return (
            <div key={inst.id} className="fc-card" style={{ animationDelay: `${idx * 0.08}s` }}>

              {/* Barra superior */}
              <div className="fc-card-bar" style={{ background: tc.bg, borderBottom: `1px solid ${tc.border}` }}>
                <div className="fc-card-bar-left">
                  <div className="fc-num-badge" style={{ background: tc.dot }}>{idx + 1}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                    <span className="fc-tipo-pill" style={{ background: 'white', color: tc.txt, border: `1px solid ${tc.border}` }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: tc.dot, display: 'inline-block', marginRight: 6 }} />
                      {inst.tipo}
                    </span>
                    {completo && <span className="fc-completo-pill">✓ Completo</span>}
                    {!completo && <span className="fc-incompleto-pill">⚠ Faltan datos</span>}
                  </div>
                </div>
                {instructores.length > 1 && (
                  <button className="fc-btn-del" type="button" onClick={() => eliminarInstructor(inst.id)}>
                    <Ic.Trash />
                  </button>
                )}
              </div>

              <div className="fc-card-body">

                {/* ── TIPO DE INSTRUCTOR ── */}
                <div className="fc-section">
                  <div className="fc-section-title">
                    <span className="fc-section-line" style={{ background: tc.dot }} />
                    Tipo de instructor
                  </div>
                  <div className="fc-tipo-row">
                    {Object.entries(TIPO_CONF).map(([tipo, conf]) => (
                      <button
                        key={tipo}
                        type="button"
                        className={`fc-tipo-btn ${inst.tipo === tipo ? 'fc-tipo-btn--active' : ''}`}
                        style={inst.tipo === tipo ? {
                          background: conf.bg, color: conf.txt,
                          borderColor: conf.dot, boxShadow: `0 0 0 2px ${conf.dot}33`
                        } : {}}
                        onClick={() => actualizarCampo(inst.id, 'tipo', tipo)}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: inst.tipo === tipo ? conf.dot : T.border, transition: 'background 0.2s' }} />
                        {tipo}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── DATOS PERSONALES ── */}
                <div className="fc-section">
                  <div className="fc-section-title">
                    <span className="fc-section-line" style={{ background: T.blue }} />
                    Datos del instructor
                  </div>

                  <div className="fc-grid-2">
                    <Field label="Nombre completo" required>
                      <input
                        type="text"
                        value={inst.nombre}
                        onChange={e => actualizarCampo(inst.id, 'nombre', e.target.value)}
                        placeholder="Nombre y apellido"
                        style={inputStyle}
                      />
                    </Field>

                    <Field label="Correo electrónico" required>
                      <input
                        type="email"
                        value={inst.correo}
                        onChange={e => actualizarCampo(inst.id, 'correo', e.target.value)}
                        placeholder="correo@ejemplo.com"
                        style={inputStyle}
                      />
                    </Field>

                    <Field label="Tipo de identificación" required>
                      <select
                        value={inst.tipo_identificacion}
                        onChange={e => actualizarCampo(inst.id, 'tipo_identificacion', e.target.value)}
                        style={selectStyle}
                      >
                        <option value="">Seleccione...</option>
                        {TIPOS_IDENTIFICACION.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Número de identificación" required>
                      <input
                        type="text"
                        value={inst.identificacion}
                        onChange={e => actualizarCampo(inst.id, 'identificacion', e.target.value)}
                        placeholder="Ej: 1234567890"
                        style={inputStyle}
                      />
                    </Field>

                    <Field label="Celular" required>
                      <input
                        type="text"
                        value={inst.celular}
                        onChange={e => actualizarCampo(inst.id, 'celular', e.target.value)}
                        placeholder="Ej: 3001234567"
                        style={inputStyle}
                      />
                    </Field>
                  </div>
                </div>

                {/* ── HORARIO ── */}
                <div className="fc-section">
                  <div className="fc-section-title">
                    <span className="fc-section-line" style={{ background: T.amber }} />
                    Horario semanal
                  </div>
                  <div className="fc-horario-wrapper">
                    <HorarioPicker
                      horario={inst.horario}
                      onChange={(nuevoHorario) => actualizarHorario(inst.id, nuevoHorario)}
                    />
                  </div>
                </div>

              </div>
            </div>
          );
        })}

      </div>
    </>
  );
};

/* ─── CSS ────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  @keyframes fcFadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .fc-root {
    font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
    width: 100%;
    max-width: 880px;
    margin: 0 auto;
    padding: 8px 0 24px;
    color: #0f172a;
  }

  .fc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(145deg, #0b5e4a 0%, #1e3a5f 100%);
    border-radius: 28px;
    padding: 24px 32px;
    margin-bottom: 28px;
    gap: 20px;
    flex-wrap: wrap;
    box-shadow: 0 20px 35px -12px rgba(11, 94, 74, 0.25);
  }

  .fc-header-left {
    display: flex;
    align-items: center;
    gap: 18px;
  }

  .fc-header-right {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .fc-header-icon {
    width: 56px;
    height: 56px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .fc-header-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: white;
    margin: 0 0 4px;
  }

  .fc-header-sub {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.85);
    margin: 0;
  }

  .fc-header-stats {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: rgba(255, 255, 255, 0.12);
    border-radius: 60px;
    padding: 6px 20px;
  }

  .fc-stat-num {
    font-size: 28px;
    font-weight: 700;
    color: white;
    line-height: 1.1;
  }

  .fc-stat-lbl {
    font-size: 11px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.75);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin-top: 2px;
  }

  .fc-btn-add {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: rgba(255, 255, 255, 0.15);
    border: 1.5px solid rgba(255, 255, 255, 0.35);
    border-radius: 60px;
    color: white;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .fc-btn-add:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateY(-1px);
  }

  .fc-btn-add-bottom {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 14px;
    background: white;
    border: 2px dashed #cbd5e1;
    border-radius: 20px;
    color: #64748b;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 8px;
  }

  .fc-btn-add-bottom:hover {
    border-color: #0f6e56;
    color: #0f6e56;
    background: #f0fdf4;
  }

  .fc-card {
    background: white;
    border: 1px solid rgba(0, 0, 0, 0.04);
    border-radius: 28px;
    margin-bottom: 24px;
    overflow: hidden;
    box-shadow: 0 12px 30px -12px rgba(0, 0, 0, 0.08);
    transition: all 0.3s cubic-bezier(0.2, 0, 0, 1);
    animation: fcFadeUp 0.4s ease both;
  }

  .fc-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 24px 42px -16px rgba(0, 0, 0, 0.14);
  }

  .fc-card-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 28px;
    gap: 16px;
  }

  .fc-card-bar-left {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
  }

  .fc-num-badge {
    width: 42px;
    height: 42px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    font-weight: 700;
    color: white;
    flex-shrink: 0;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .fc-tipo-pill {
    display: inline-flex;
    align-items: center;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 5px 14px;
    border-radius: 40px;
    white-space: nowrap;
  }

  .fc-completo-pill {
    font-size: 0.7rem;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 40px;
    background: rgba(16, 185, 129, 0.12);
    color: #065f46;
    border: 1px solid rgba(16, 185, 129, 0.25);
  }

  .fc-incompleto-pill {
    font-size: 0.7rem;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 40px;
    background: rgba(245, 158, 11, 0.12);
    color: #92400e;
    border: 1px solid rgba(245, 158, 11, 0.3);
  }

  .fc-btn-del {
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 14px;
    color: #b91c1c;
    cursor: pointer;
    transition: all 0.2s;
  }

  .fc-btn-del:hover {
    background: rgba(239, 68, 68, 0.2);
    transform: scale(0.96);
  }

  .fc-card-body {
    padding: 28px;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  .fc-section {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .fc-section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.7rem;
    font-weight: 700;
    color: #5b6e8c;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .fc-section-line {
    width: 4px;
    height: 18px;
    border-radius: 4px;
    flex-shrink: 0;
  }

  .fc-tipo-row {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .fc-tipo-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 20px;
    border-radius: 60px;
    border: 1.5px solid #e2e8f0;
    background: white;
    color: #475569;
    font-family: 'Inter', sans-serif;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .fc-tipo-btn:hover {
    border-color: #0f6e56;
    color: #0f172a;
    background: #f0fdf4;
    transform: translateY(-1px);
  }

  .fc-tipo-btn--active {
    font-weight: 600;
  }

  .fc-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .fc-horario-wrapper {
    background: #fefefe;
    border-radius: 20px;
    padding: 4px 0;
  }

  input:focus, select:focus {
    border-color: #0f6e56 !important;
    box-shadow: 0 0 0 3px rgba(15, 110, 86, 0.12) !important;
    outline: none;
  }

  @media (max-width: 680px) {
    .fc-root { padding: 0 12px 24px; }
    .fc-header { padding: 20px 24px; flex-direction: column; align-items: flex-start; }
    .fc-card-bar { padding: 16px 20px; flex-wrap: wrap; }
    .fc-card-body { padding: 20px; }
    .fc-tipo-btn { flex: 1; justify-content: center; }
    .fc-grid-2 { grid-template-columns: 1fr; }
  }
`;

export default FormularioCampesenaCompleto;