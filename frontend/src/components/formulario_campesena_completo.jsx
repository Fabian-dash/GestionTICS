import React, { useState } from 'react';

/* ─── Tokens ──────────────────────────────────────────────────── */
const T = {
  verde:      '#0f6e56',
  verdeDark:  '#0a3d2e',
  verdeMid:   '#1d9e75',
  verdeLite:  '#e6f7f2',
  verdeGlow:  '#4ade80',
  ink:        '#0d1117',
  inkMid:     '#374151',
  muted:      '#6b7280',
  border:     '#e5e7eb',
  borderFocus:'#0f6e56',
  bg:         '#f4f6f5',
  white:      '#ffffff',
  red:        '#ef4444',
  redBg:      'rgba(239,68,68,.07)',
  redBorder:  'rgba(239,68,68,.18)',
  redTxt:     '#dc2626',
  amber:      '#f59e0b',
  amberBg:    '#fef3c7',
  amberTxt:   '#92400e',
  blue:       '#3b82f6',
  blueBg:     '#eff6ff',
  blueTxt:    '#1e40af',
  purple:     '#8b5cf6',
  purpleBg:   '#f5f3ff',
  purpleTxt:  '#5b21b6',
};

const TIPO_CONF = {
  'Técnico':     { bg: T.verdeLite,  txt: '#065f46',    border: '#6ee7b7', dot: T.verdeMid  },
  'Empresarial': { bg: T.blueBg,     txt: T.blueTxt,    border: '#93c5fd', dot: T.blue      },
  'Popular':     { bg: T.purpleBg,   txt: T.purpleTxt,  border: '#c4b5fd', dot: T.purple    },
};

/* ─── Icons ──────────────────────────────────────────────────── */
const Ic = {
  Users:    () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  Calendar: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  Plus:     () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>,
  Trash:    () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>,
  X:        () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  Check:    () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>,
  Clock:    () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  ChevronDown: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>,
};

/* ─── Field wrapper ───────────────────────────────────────────── */
const Field = ({ label, children, hint }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    <label style={{ fontSize: 11.5, fontWeight: 700, color: T.inkMid, letterSpacing: '0.03em' }}>
      {label}
    </label>
    {children}
    {hint && <span style={{ fontSize: 11, color: T.muted }}>{hint}</span>}
  </div>
);

/* ─── Main component ──────────────────────────────────────────── */
const FormularioCampesenaCompleto = ({ formData, setFormData }) => {
  const [instructores, setInstructores] = useState([{
    id: Date.now(),
    tipo: 'Técnico', tipo_identificacion: 'CC',
    identificacion: '', nombre: '', correo: '', celular: '',
    programacion: [], collapsed: false,
  }]);

  const sync = (nuevos) => {
    setInstructores(nuevos);
    setFormData({ ...formData, instructores: nuevos });
  };

  const agregarInstructor = () => sync([...instructores, {
    id: Date.now() + Math.random(),
    tipo: 'Técnico', tipo_identificacion: 'CC',
    identificacion: '', nombre: '', correo: '', celular: '',
    programacion: [], collapsed: false,
  }]);

  const eliminarInstructor    = id    => sync(instructores.filter(i => i.id !== id));
  const toggleCollapse        = id    => sync(instructores.map(i => i.id === id ? { ...i, collapsed: !i.collapsed } : i));
  const actualizarCampo       = (id, campo, valor) => sync(instructores.map(i => i.id === id ? { ...i, [campo]: valor } : i));

  const agregarMes = id => sync(instructores.map(i => {
    if (i.id !== id) return i;
    return { ...i, programacion: [...i.programacion, { mes: i.programacion.length + 1, rangos: [] }] };
  }));
  const eliminarMes = (id, mIdx) => sync(instructores.map(i => {
    if (i.id !== id) return i;
    const prog = i.programacion.filter((_, idx) => idx !== mIdx).map((m, idx) => ({ ...m, mes: idx + 1 }));
    return { ...i, programacion: prog };
  }));
  const agregarRango = (id, mIdx) => sync(instructores.map(i => {
    if (i.id !== id) return i;
    const prog = i.programacion.map((m, idx) =>
      idx === mIdx ? { ...m, rangos: [...m.rangos, { desde: '', hasta: '', hora_inicio: '08:00', hora_fin: '16:00' }] } : m
    );
    return { ...i, programacion: prog };
  }));
  const eliminarRango = (id, mIdx, rIdx) => sync(instructores.map(i => {
    if (i.id !== id) return i;
    const prog = i.programacion.map((m, idx) =>
      idx === mIdx ? { ...m, rangos: m.rangos.filter((_, ri) => ri !== rIdx) } : m
    );
    return { ...i, programacion: prog };
  }));
  const actualizarRango = (id, mIdx, rIdx, campo, valor) => sync(instructores.map(i => {
    if (i.id !== id) return i;
    const prog = i.programacion.map((m, idx) => {
      if (idx !== mIdx) return m;
      const rangos = m.rangos.map((r, ri) => ri === rIdx ? { ...r, [campo]: valor } : r);
      return { ...m, rangos };
    });
    return { ...i, programacion: prog };
  }));

  const validarProgramacion = () => {
    const errores = [];
    instructores.forEach((inst, idx) => {
      if (!inst.programacion.length) errores.push(`Instructor ${idx + 1}: Agrega al menos un mes`);
      inst.programacion.forEach(mes => {
        if (!mes.rangos.length) errores.push(`Instructor ${idx + 1}, Mes ${mes.mes}: Agrega al menos un rango`);
        mes.rangos.forEach((r, rIdx) => {
          if (!r.desde || !r.hasta) errores.push(`Instructor ${idx + 1}, Mes ${mes.mes}, Rango ${rIdx + 1}: Fechas incompletas`);
          if (r.desde && r.hasta && new Date(r.hasta) <= new Date(r.desde))
            errores.push(`Instructor ${idx + 1}, Mes ${mes.mes}: "Hasta" debe ser posterior a "Desde"`);
          const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
          const ini = toMin(r.hora_inicio), fin = toMin(r.hora_fin);
          if (fin <= ini) errores.push(`Instructor ${idx + 1}, Mes ${mes.mes}: Hora fin debe ser mayor a hora inicio`);
          if (fin - ini < 60)  errores.push(`Instructor ${idx + 1}, Mes ${mes.mes}: Duración mínima 1 hora`);
          if (fin - ini > 600) errores.push(`Instructor ${idx + 1}, Mes ${mes.mes}: Duración máxima 10 horas`);
          if (ini < 360)  errores.push(`Instructor ${idx + 1}, Mes ${mes.mes}: Inicio no puede ser antes de las 06:00`);
          if (fin > 1320) errores.push(`Instructor ${idx + 1}, Mes ${mes.mes}: Fin no puede ser después de las 22:00`);
        });
        if (mes.rangos.length > 1) {
          const ord = [...mes.rangos].sort((a, b) => new Date(a.desde) - new Date(b.desde));
          for (let i = 0; i < ord.length - 1; i++)
            if (new Date(ord[i + 1].desde) <= new Date(ord[i].hasta))
              errores.push(`Instructor ${idx + 1}, Mes ${mes.mes}: Los rangos no pueden solaparse`);
        }
      });
    });
    return errores;
  };

  const totalMeses  = instructores.reduce((a, i) => a + i.programacion.length, 0);
  const totalRangos = instructores.reduce((a, i) => a + i.programacion.reduce((b, m) => b + m.rangos.length, 0), 0);

  return (
    <>
      <style>{CSS}</style>
      <div className="fc-root">

        {/* ── ENCABEZADO ── */}
        <div className="fc-header">
          <div className="fc-header-left">
            <div className="fc-header-icon">
              <Ic.Users />
            </div>
            <div>
              <h3 className="fc-header-title">Instructores Campesena</h3>
              <p className="fc-header-sub">Registra los instructores y su programación mensual</p>
            </div>
          </div>
          <div className="fc-header-stats">
            <div className="fc-stat">
              <span className="fc-stat-num">{instructores.length}</span>
              <span className="fc-stat-lbl">instructor{instructores.length !== 1 ? 'es' : ''}</span>
            </div>
            <div className="fc-stat-div" />
            <div className="fc-stat">
              <span className="fc-stat-num">{totalMeses}</span>
              <span className="fc-stat-lbl">mes{totalMeses !== 1 ? 'es' : ''}</span>
            </div>
            <div className="fc-stat-div" />
            <div className="fc-stat">
              <span className="fc-stat-num">{totalRangos}</span>
              <span className="fc-stat-lbl">rango{totalRangos !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* ── INSTRUCTORES ── */}
        {instructores.map((inst, idx) => {
          const tc = TIPO_CONF[inst.tipo] || TIPO_CONF['Técnico'];
          const completo = inst.nombre && inst.correo && inst.identificacion && inst.celular;

          return (
            <div key={inst.id} className="fc-card" style={{ animationDelay: `${idx * 0.06}s` }}>

              {/* Card top bar */}
              <div className="fc-card-bar" style={{ background: tc.bg, borderBottom: `1px solid ${tc.border}` }}>
                <div className="fc-card-bar-left">
                  <div className="fc-num-badge" style={{ background: tc.dot }}>{idx + 1}</div>
                  <div>
                    <div className="fc-card-name">
                      {inst.nombre || <span style={{ opacity: .45, fontStyle: 'italic' }}>Sin nombre</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                      <span className="fc-tipo-pill" style={{ background: 'white', color: tc.txt, border: `1px solid ${tc.border}` }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: tc.dot, display: 'inline-block', marginRight: 5 }} />
                        {inst.tipo}
                      </span>
                      {completo && (
                        <span className="fc-completo-pill">✓ Completo</span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {instructores.length > 1 && (
                    <button className="fc-btn-del" onClick={() => eliminarInstructor(inst.id)}>
                      <Ic.Trash />
                    </button>
                  )}
                  <button
                    className="fc-btn-collapse"
                    style={{ borderColor: tc.border, color: tc.txt }}
                    onClick={() => toggleCollapse(inst.id)}
                  >
                    <span style={{ transform: inst.collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform .2s', display: 'flex' }}>
                      <Ic.ChevronDown />
                    </span>
                    {inst.collapsed ? 'Expandir' : 'Colapsar'}
                  </button>
                </div>
              </div>

              {/* Card body */}
              {!inst.collapsed && (
                <div className="fc-card-body">

                  {/* Tipo */}
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
                            borderColor: conf.dot, boxShadow: `0 0 0 3px ${conf.dot}22`
                          } : {}}
                          onClick={() => actualizarCampo(inst.id, 'tipo', tipo)}
                        >
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: inst.tipo === tipo ? conf.dot : T.border, transition: 'background .2s' }} />
                          {tipo}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Datos personales */}
                  <div className="fc-section">
                    <div className="fc-section-title">
                      <span className="fc-section-line" style={{ background: T.verde }} />
                      Datos personales
                    </div>
                    <div className="fc-grid-2">
                      <Field label="Tipo de identificación">
                        <div className="fc-select-wrap">
                          <select
                            className="fc-select"
                            value={inst.tipo_identificacion}
                            onChange={e => actualizarCampo(inst.id, 'tipo_identificacion', e.target.value)}
                          >
                            {['CC','CE','TI','PAP','NIT'].map(v => <option key={v}>{v}</option>)}
                          </select>
                          <span className="fc-select-chevron"><Ic.ChevronDown /></span>
                        </div>
                      </Field>
                      <Field label="Número de identificación">
                        <input
                          className="fc-input"
                          type="text"
                          value={inst.identificacion}
                          placeholder="12345678"
                          onChange={e => actualizarCampo(inst.id, 'identificacion', e.target.value)}
                        />
                      </Field>
                    </div>
                    <Field label="Nombre completo">
                      <input
                        className="fc-input"
                        type="text"
                        value={inst.nombre}
                        placeholder="Nombre completo del instructor"
                        onChange={e => actualizarCampo(inst.id, 'nombre', e.target.value)}
                      />
                    </Field>
                    <div className="fc-grid-2">
                      <Field label="Correo electrónico">
                        <input
                          className="fc-input"
                          type="email"
                          value={inst.correo}
                          placeholder="correo@ejemplo.com"
                          onChange={e => actualizarCampo(inst.id, 'correo', e.target.value)}
                        />
                      </Field>
                      <Field label="Celular">
                        <input
                          className="fc-input"
                          type="tel"
                          value={inst.celular}
                          placeholder="3001234567"
                          onChange={e => actualizarCampo(inst.id, 'celular', e.target.value)}
                        />
                      </Field>
                    </div>
                  </div>

                  {/* Programación */}
                  <div className="fc-section">
                    <div className="fc-prog-header">
                      <div className="fc-section-title" style={{ margin: 0 }}>
                        <span className="fc-section-line" style={{ background: T.amber }} />
                        Programación mensual
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="fc-badge-count">{inst.programacion.length} mes{inst.programacion.length !== 1 ? 'es' : ''}</span>
                      </div>
                    </div>

                    {inst.programacion.length === 0 ? (
                      <div className="fc-empty-prog">
                        <div className="fc-empty-icon"><Ic.Calendar /></div>
                        <p className="fc-empty-txt">Sin meses programados</p>
                        <p className="fc-empty-sub">Haz clic en "Agregar mes" para comenzar</p>
                      </div>
                    ) : (
                      inst.programacion.map((mes, mIdx) => (
                        <div key={mIdx} className="fc-mes">
                          {/* Mes header */}
                          <div className="fc-mes-header">
                            <div className="fc-mes-title">
                              <div className="fc-mes-num">{mes.mes}</div>
                              <div>
                                <span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>Mes {mes.mes}</span>
                                <span style={{ fontSize: 12, color: T.muted, marginLeft: 8 }}>
                                  {mes.rangos.length} rango{mes.rangos.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                            <button className="fc-btn-del-sm" onClick={() => eliminarMes(inst.id, mIdx)}>
                              <Ic.X /> Eliminar mes
                            </button>
                          </div>

                          {/* Rangos */}
                          <div className="fc-rangos-wrap">
                            {mes.rangos.length === 0 && (
                              <p className="fc-empty-rangos">Agrega al menos un rango de fechas para este mes</p>
                            )}
                            {mes.rangos.map((rango, rIdx) => (
                              <div key={rIdx} className="fc-rango">
                                <div className="fc-rango-header">
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                    <span className="fc-rango-num">{rIdx + 1}</span>
                                    <span style={{ fontSize: 11.5, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                      Rango {rIdx + 1}
                                    </span>
                                  </div>
                                  <button className="fc-btn-del-icon" onClick={() => eliminarRango(inst.id, mIdx, rIdx)}>
                                    <Ic.X />
                                  </button>
                                </div>
                                <div className="fc-rango-grid">
                                  <Field label="Desde">
                                    <input className="fc-input" type="date" value={rango.desde}
                                      onChange={e => actualizarRango(inst.id, mIdx, rIdx, 'desde', e.target.value)} />
                                  </Field>
                                  <Field label="Hasta">
                                    <input className="fc-input" type="date" value={rango.hasta}
                                      onChange={e => actualizarRango(inst.id, mIdx, rIdx, 'hasta', e.target.value)} />
                                  </Field>
                                  <Field label="Hora inicio">
                                    <div style={{ position: 'relative' }}>
                                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.muted, pointerEvents: 'none' }}>
                                        <Ic.Clock />
                                      </span>
                                      <input className="fc-input fc-input--time" type="time" value={rango.hora_inicio}
                                        onChange={e => actualizarRango(inst.id, mIdx, rIdx, 'hora_inicio', e.target.value)} />
                                    </div>
                                  </Field>
                                  <Field label="Hora fin">
                                    <div style={{ position: 'relative' }}>
                                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.muted, pointerEvents: 'none' }}>
                                        <Ic.Clock />
                                      </span>
                                      <input className="fc-input fc-input--time" type="time" value={rango.hora_fin}
                                        onChange={e => actualizarRango(inst.id, mIdx, rIdx, 'hora_fin', e.target.value)} />
                                    </div>
                                  </Field>
                                </div>
                              </div>
                            ))}
                            <button className="fc-btn-add-rango" type="button" onClick={() => agregarRango(inst.id, mIdx)}>
                              <Ic.Plus /> Agregar rango de fechas
                            </button>
                          </div>
                        </div>
                      ))
                    )}

                    <button className="fc-btn-add-mes" type="button" onClick={() => agregarMes(inst.id)}>
                      <Ic.Calendar /> Agregar mes
                    </button>
                  </div>

                </div>
              )}
            </div>
          );
        })}

        {/* ── ACCIONES ── */}
        <div className="fc-footer">
          <button className="fc-btn-add-inst" type="button" onClick={agregarInstructor}>
            <Ic.Plus /> Agregar instructor
          </button>
          <button className="fc-btn-validate" type="button" onClick={() => {
            const errores = validarProgramacion();
            if (errores.length > 0) alert('Errores encontrados:\n\n• ' + errores.join('\n• '));
            else alert('✅ Programación válida. Todos los datos están correctos.');
          }}>
            <Ic.Check /> Validar programación
          </button>
        </div>

      </div>
    </>
  );
};

/* ─── CSS ─────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

  @keyframes fcFadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fcPop {
    from { opacity: 0; transform: scale(.97); }
    to   { opacity: 1; transform: scale(1); }
  }

  .fc-root {
    font-family: 'Sora', 'Segoe UI', sans-serif;
    width: 100%;
    padding-bottom: 10px;
    color: #0f172a;
  }

  /* ── Header ── */
  .fc-header {
    display: flex; align-items: center; justify-content: space-between;
    background: linear-gradient(135deg, #0f766e 0%, #2563eb 100%);
    border-radius: 18px;
    padding: 22px 26px;
    margin-bottom: 22px;
    gap: 18px;
    flex-wrap: wrap;
    box-shadow: 0 20px 60px rgba(15,118,110,.12);
  }
  .fc-header-left { display: flex; align-items: center; gap: 16px; }
  .fc-header-icon {
    width: 52px; height: 52px; border-radius: 14px;
    background: rgba(255,255,255,.16);
    color: #ffffff;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .fc-header-title { font-size: 18px; font-weight: 700; color: #ffffff; margin: 0 0 4px; }
  .fc-header-sub   { font-size: 13px; color: rgba(255,255,255,.9); margin: 0; }
  .fc-header-stats { display: flex; align-items: center; gap: 0; }
  .fc-stat { display: flex; flex-direction: column; align-items: center; padding: 0 18px; }
  .fc-stat-num  { font-family: 'IBM Plex Mono', monospace; font-size: 24px; font-weight: 700; color: rgba(255,255,255,.95); line-height: 1; }
  .fc-stat-lbl  { font-size: 10.5px; color: rgba(255,255,255,.75); letter-spacing: .08em; margin-top: 2px; white-space: nowrap; }
  .fc-stat-div  { width: 1px; height: 32px; background: rgba(255,255,255,.18); }

  /* ── Card ── */
  .fc-card {
    background: #ffffff;
    border: 1px solid rgba(15,23,42,.06);
    border-radius: 18px;
    margin-bottom: 18px;
    overflow: hidden;
    box-shadow: 0 12px 32px rgba(15,23,42,.06);
    animation: fcFadeUp .35s ease both;
    transition: transform .25s, box-shadow .25s;
  }
  .fc-card:hover { transform: translateY(-1px); box-shadow: 0 18px 36px rgba(15,23,42,.1); }

  .fc-card-bar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 22px;
    gap: 16px;
    border-bottom: 1px solid rgba(15,23,42,.05);
  }
  .fc-card-bar-left { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; }
  .fc-num-badge {
    width: 36px; height: 36px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px; font-weight: 700; color: white;
    flex-shrink: 0;
  }
  .fc-card-name {
    font-size: 15px; font-weight: 700; color: #0f172a;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .fc-tipo-pill {
    display: inline-flex; align-items: center;
    font-size: 11px; font-weight: 700; letter-spacing: .06em;
    padding: 3px 10px; border-radius: 999px;
    background: rgba(243,244,246,.9);
    color: #334155;
    white-space: nowrap;
  }
  .fc-completo-pill {
    font-size: 11px; font-weight: 700; letter-spacing: .05em;
    padding: 3px 10px; border-radius: 999px;
    background: rgba(22,163,74,.12); color: #134e4a;
    border: 1px solid rgba(22,163,74,.2);
  }

  .fc-btn-del {
    width: 34px; height: 34px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(248,113,113,.14);
    border: 1px solid rgba(248,113,113,.2);
    border-radius: 10px; color: #b91c1c;
    cursor: pointer; flex-shrink: 0;
    transition: background .15s, transform .15s;
  }
  .fc-btn-del:hover { background: rgba(248,113,113,.24); transform: translateY(-1px); }

  .fc-btn-collapse {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 14px;
    background: #f8fafc; border: 1px solid rgba(15,23,42,.12);
    border-radius: 12px;
    font-family: 'Sora', sans-serif;
    font-size: 12px; font-weight: 600;
    color: #0f172a;
    cursor: pointer; flex-shrink: 0;
    transition: background .15s, transform .15s;
  }
  .fc-btn-collapse:hover { background: #eef2ff; transform: translateY(-1px); }

  /* ── Card body ── */
  .fc-card-body {
    padding: 20px;
    display: flex; flex-direction: column; gap: 20px;
  }

  /* ── Section ── */
  .fc-section { display: flex; flex-direction: column; gap: 12px; }
  .fc-section-title {
    display: flex; align-items: center; gap: 8px;
    font-size: 11px; font-weight: 700; color: #6b7280;
    text-transform: uppercase; letter-spacing: .09em;
    margin-bottom: 4px;
  }
  .fc-section-line { width: 3px; height: 14px; border-radius: 2px; flex-shrink: 0; }

  /* ── Tipo buttons ── */
  .fc-tipo-row { display: flex; gap: 8px; flex-wrap: wrap; }
  .fc-tipo-btn {
    display: flex; align-items: center; gap: 7px;
    padding: 7px 16px; border-radius: 8px;
    border: 1.5px solid #e5e7eb;
    background: #f9fafb; color: #6b7280;
    font-family: 'Sora', sans-serif;
    font-size: 12.5px; font-weight: 500;
    cursor: pointer; transition: all .18s;
  }
  .fc-tipo-btn:hover { border-color: #0f6e56; color: #0d1117; background: #f0fdf4; }
  .fc-tipo-btn--active { font-weight: 700; }

  /* ── Grid ── */
  .fc-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  /* ── Inputs ── */
  .fc-input {
    width: 100%; padding: 12px 14px;
    border: 1.5px solid #e2e8f0; border-radius: 14px;
    font-family: 'Sora', sans-serif;
    font-size: 14px; color: #0f172a; background: #ffffff;
    outline: none; transition: border-color .18s, box-shadow .18s;
  }
  .fc-input::placeholder { color: #94a3b8; }
  .fc-input:focus {
    border-color: #14b8a6;
    box-shadow: 0 0 0 4px rgba(20,184,166,.12);
  }
  .fc-input--time { padding-left: 34px; }

  .fc-select-wrap { position: relative; }
  .fc-select {
    width: 100%; padding: 12px 34px 12px 14px;
    border: 1.5px solid #e2e8f0; border-radius: 14px;
    font-family: 'Sora', sans-serif;
    font-size: 14px; color: #0f172a; background: #ffffff;
    outline: none; appearance: none;
    transition: border-color .18s, box-shadow .18s;
    cursor: pointer;
  }
  .fc-select:focus {
    border-color: #14b8a6;
    box-shadow: 0 0 0 4px rgba(20,184,166,.12);
  }
  .fc-select-chevron {
    position: absolute; right: 12px; top: 50%;
    transform: translateY(-50%);
    color: #64748b; pointer-events: none;
  }

  /* ── Prog header ── */
  .fc-prog-header {
    display: flex; align-items: center; justify-content: space-between;
  }
  .fc-badge-count {
    font-size: 11px; font-weight: 700;
    background: #f3f4f6; color: #6b7280;
    padding: 3px 9px; border-radius: 20px;
    font-family: 'IBM Plex Mono', monospace;
  }

  /* ── Empty prog ── */
  .fc-empty-prog {
    display: flex; flex-direction: column; align-items: center;
    padding: 28px 20px; gap: 6px;
    background: #fafbfc; border: 1.5px dashed #e5e7eb;
    border-radius: 10px; text-align: center;
  }
  .fc-empty-icon {
    width: 36px; height: 36px; border-radius: 10px;
    background: #f3f4f6; color: #9ca3af;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 4px;
  }
  .fc-empty-txt  { font-size: 13.5px; font-weight: 600; color: #374151; margin: 0; }
  .fc-empty-sub  { font-size: 12px; color: #9ca3af; margin: 0; }

  /* ── Mes ── */
  .fc-mes {
    border: 1px solid #e5e7eb; border-radius: 10px;
    overflow: hidden; margin-bottom: 10px;
  }
  .fc-mes-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 11px 16px;
    background: #f8fafc; border-bottom: 1px solid #f1f3f5;
  }
  .fc-mes-title { display: flex; align-items: center; gap: 10px; }
  .fc-mes-num {
    width: 26px; height: 26px; border-radius: 7px;
    background: #0d1f1a; color: #6ee7b7;
    display: flex; align-items: center; justify-content: center;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px; font-weight: 700; flex-shrink: 0;
  }
  .fc-btn-del-sm {
    display: flex; align-items: center; gap: 4px;
    padding: 4px 9px;
    background: rgba(239,68,68,.07);
    border: 1px solid rgba(239,68,68,.15);
    border-radius: 6px; color: #dc2626;
    font-family: 'Sora', sans-serif;
    font-size: 11px; font-weight: 600;
    cursor: pointer; transition: background .15s;
  }
  .fc-btn-del-sm:hover { background: rgba(239,68,68,.15); }

  .fc-rangos-wrap { padding: 12px 14px; display: flex; flex-direction: column; gap: 0; }
  .fc-empty-rangos {
    font-size: 12px; color: #9ca3af; font-style: italic;
    padding: 6px 2px; margin-bottom: 8px;
  }

  /* ── Rango ── */
  .fc-rango {
    background: #fafbfc; border: 1px solid #e5e7eb;
    border-radius: 9px; padding: 13px;
    margin-bottom: 10px; animation: fcPop .2s ease;
  }
  .fc-rango-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 12px;
  }
  .fc-rango-num {
    width: 20px; height: 20px; border-radius: 5px;
    background: #e5e7eb; color: #374151;
    display: flex; align-items: center; justify-content: center;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px; font-weight: 700;
  }
  .fc-rango-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .fc-btn-del-icon {
    width: 24px; height: 24px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(239,68,68,.08);
    border: 1px solid rgba(239,68,68,.15);
    border-radius: 5px; color: #dc2626;
    cursor: pointer; transition: background .15s;
  }
  .fc-btn-del-icon:hover { background: rgba(239,68,68,.18); }

  /* ── Add buttons ── */
  .fc-btn-add-rango {
    width: 100%;
    display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 8px;
    background: white; border: 1.5px dashed #d1d5db;
    border-radius: 8px; color: #6b7280;
    font-family: 'Sora', sans-serif;
    font-size: 12.5px; font-weight: 600;
    cursor: pointer; margin-top: 2px;
    transition: all .15s;
  }
  .fc-btn-add-rango:hover {
    border-color: #0f6e56; color: #0f6e56; background: #f0fdf4;
  }

  .fc-btn-add-mes {
    width: 100%; margin-top: 8px;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 12px;
    background: #eff6ff; border: 1.5px dashed #93c5fd;
    border-radius: 14px; color: #1d4ed8;
    font-family: 'Sora', sans-serif;
    font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all .18s;
  }
  .fc-btn-add-mes:hover { background: #dbeafe; border-color: #60a5fa; }

  /* ── Footer ── */
  .fc-footer {
    display: flex; gap: 14px; margin-top: 10px;
  }
  .fc-btn-add-inst {
    flex: 1;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 14px 20px;
    background: #ffffff; border: 1.5px solid #e2e8f0;
    border-radius: 16px; color: #334155;
    font-family: 'Sora', sans-serif;
    font-size: 14px; font-weight: 600;
    cursor: pointer; transition: all .18s, transform .18s;
  }
  .fc-btn-add-inst:hover {
    border-color: #14b8a6; color: #0f172a; background: #ecfeff; transform: translateY(-1px);
  }
  .fc-btn-validate {
    flex: 1;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 14px 20px;
    background: #0f172a; border: none;
    border-radius: 16px; color: white;
    font-family: 'Sora', sans-serif;
    font-size: 14px; font-weight: 600;
    cursor: pointer; transition: background .18s, transform .18s;
  }
  .fc-btn-validate:hover { background: #0f4f6e; transform: translateY(-1px); }

  @media (max-width: 680px) {
    .fc-grid-2, .fc-rango-grid { grid-template-columns: 1fr; }
    .fc-footer { flex-direction: column; }
    .fc-header-stats { display: none; }
    .fc-card-bar { flex-direction: column; align-items: stretch; }
  }
`;

export default FormularioCampesenaCompleto;