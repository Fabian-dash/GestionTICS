import React, { useState } from 'react';

const FormularioCampesenaCompleto = ({ formData, setFormData }) => {
  const [instructores, setInstructores] = useState([
    {
      id: Date.now(),
      tipo: 'Técnico',
      tipo_identificacion: 'CC',
      identificacion: '',
      nombre: '',
      correo: '',
      celular: '',
      programacion: []
    }
  ]);

  const sync = (nuevos) => {
    setInstructores(nuevos);
    setFormData({ ...formData, instructores: nuevos });
  };

  const agregarInstructor = () => sync([...instructores, {
    id: Date.now() + Math.random(),
    tipo: 'Técnico', tipo_identificacion: 'CC',
    identificacion: '', nombre: '', correo: '', celular: '', programacion: []
  }]);

  const eliminarInstructor = (id) => sync(instructores.filter(i => i.id !== id));

  const actualizarCampo = (id, campo, valor) =>
    sync(instructores.map(i => i.id === id ? { ...i, [campo]: valor } : i));

  const agregarMes = (id) => sync(instructores.map(i => {
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
      if (!inst.programacion.length) errores.push(`Instructor ${idx + 1}: Debe agregar al menos un mes`);
      inst.programacion.forEach((mes) => {
        if (!mes.rangos.length) errores.push(`Instructor ${idx + 1}, Mes ${mes.mes}: Agregue al menos un rango`);
        mes.rangos.forEach((r, rIdx) => {
          if (!r.desde || !r.hasta) errores.push(`Instructor ${idx + 1}, Mes ${mes.mes}, Rango ${rIdx + 1}: Fechas incompletas`);
          if (r.desde && r.hasta && new Date(r.hasta) <= new Date(r.desde))
            errores.push(`Instructor ${idx + 1}, Mes ${mes.mes}: "Hasta" debe ser posterior a "Desde"`);
          const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
          const ini = toMin(r.hora_inicio), fin = toMin(r.hora_fin);
          if (fin <= ini) errores.push(`Instructor ${idx + 1}, Mes ${mes.mes}: Hora fin debe ser mayor a hora inicio`);
          if (fin - ini < 60) errores.push(`Instructor ${idx + 1}, Mes ${mes.mes}: Duración mínima 1 hora`);
          if (fin - ini > 600) errores.push(`Instructor ${idx + 1}, Mes ${mes.mes}: Duración máxima 10 horas`);
          if (ini < 360) errores.push(`Instructor ${idx + 1}, Mes ${mes.mes}: Hora inicio no puede ser antes de las 06:00`);
          if (fin > 1320) errores.push(`Instructor ${idx + 1}, Mes ${mes.mes}: Hora fin no puede ser después de las 22:00`);
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

  const tipoColors = {
    'Técnico':    { bg: '#ecfdf5', color: '#065f46', border: '#bbf7d0' },
    'Empresarial':{ bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
    'Popular':    { bg: '#faf5ff', color: '#6b21a8', border: '#e9d5ff' },
  };

  return (
    <>
      <style>{css}</style>
      <div className="fc-root">

        {/* Header */}
        <div className="fc-header">
          <div className="fc-header__left">
            <div className="fc-header__icon">
              <IcUsers />
            </div>
            <div>
              <h3 className="fc-header__title">Instructores Campesena</h3>
              <p className="fc-header__sub">Agrega los instructores y su programación por meses</p>
            </div>
          </div>
          <div className="fc-header__count">
            <span className="fc-count-num">{instructores.length}</span>
            <span className="fc-count-label">instructor{instructores.length !== 1 ? 'es' : ''}</span>
          </div>
        </div>

        {/* Instructores */}
        {instructores.map((instructor, idx) => {
          const tc = tipoColors[instructor.tipo] || tipoColors['Técnico'];
          return (
            <div key={instructor.id} className="fc-instructor">

              {/* Instructor header */}
              <div className="fc-inst-header">
                <div className="fc-inst-header__left">
                  <div className="fc-inst-num">{idx + 1}</div>
                  <div>
                    <p className="fc-inst-label">Instructor {idx + 1}</p>
                    <span className="fc-inst-tipo-tag" style={{ background: tc.bg, color: tc.color, borderColor: tc.border }}>
                      {instructor.tipo}
                    </span>
                  </div>
                </div>
                {instructores.length > 1 && (
                  <button type="button" className="fc-btn-remove-inst" onClick={() => eliminarInstructor(instructor.id)}>
                    <IcTrash /> Eliminar
                  </button>
                )}
              </div>

              {/* Tipo */}
              <div className="fc-inst-body">
                <div className="fc-section-label">Tipo de instructor</div>
                <div className="fc-tipo-row">
                  {['Técnico', 'Empresarial', 'Popular'].map(t => (
                    <button
                      key={t} type="button"
                      className={`fc-tipo-chip ${instructor.tipo === t ? 'fc-tipo-chip--active' : ''}`}
                      style={instructor.tipo === t ? { background: tipoColors[t].bg, color: tipoColors[t].color, borderColor: tipoColors[t].color } : {}}
                      onClick={() => actualizarCampo(instructor.id, 'tipo', t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* Datos personales */}
                <div className="fc-section-label" style={{ marginTop: 16 }}>Datos personales</div>
                <div className="fc-grid-2">
                  <Field label="Tipo ID">
                    <select className="fc-select" value={instructor.tipo_identificacion}
                      onChange={e => actualizarCampo(instructor.id, 'tipo_identificacion', e.target.value)}>
                      {['CC','CE','TI','PAP','NIT'].map(v => <option key={v}>{v}</option>)}
                    </select>
                  </Field>
                  <Field label="Número de identificación">
                    <input className="fc-input" type="text" value={instructor.identificacion} placeholder="12345678"
                      onChange={e => actualizarCampo(instructor.id, 'identificacion', e.target.value)} />
                  </Field>
                </div>
                <Field label="Nombre completo">
                  <input className="fc-input" type="text" value={instructor.nombre} placeholder="Nombre completo del instructor"
                    onChange={e => actualizarCampo(instructor.id, 'nombre', e.target.value)} />
                </Field>
                <div className="fc-grid-2" style={{ marginTop: 10 }}>
                  <Field label="Correo electrónico">
                    <input className="fc-input" type="email" value={instructor.correo} placeholder="correo@ejemplo.com"
                      onChange={e => actualizarCampo(instructor.id, 'correo', e.target.value)} />
                  </Field>
                  <Field label="Celular">
                    <input className="fc-input" type="tel" value={instructor.celular} placeholder="3001234567"
                      onChange={e => actualizarCampo(instructor.id, 'celular', e.target.value)} />
                  </Field>
                </div>

                {/* Programación */}
                <div className="fc-prog-header">
                  <div className="fc-section-label" style={{ margin: 0 }}>
                    <IcCalendar style={{ display: 'inline', marginRight: 6 }} />
                    Programación por meses
                  </div>
                  <span className="fc-prog-badge">{instructor.programacion.length} mes{instructor.programacion.length !== 1 ? 'es' : ''}</span>
                </div>

                {instructor.programacion.length === 0 && (
                  <div className="fc-empty-prog">
                    <IcCalendar />
                    <p>Sin meses programados. Agrega el primero.</p>
                  </div>
                )}

                {instructor.programacion.map((mes, mIdx) => (
                  <div key={mIdx} className="fc-mes">
                    <div className="fc-mes-header">
                      <div className="fc-mes-title">
                        <span className="fc-mes-dot" />
                        Mes {mes.mes}
                      </div>
                      <button type="button" className="fc-btn-remove-sm" onClick={() => eliminarMes(instructor.id, mIdx)}>
                        <IcX /> Eliminar mes
                      </button>
                    </div>

                    {mes.rangos.length === 0 && (
                      <p className="fc-empty-rangos">Sin rangos. Agrega uno abajo.</p>
                    )}

                    {mes.rangos.map((rango, rIdx) => (
                      <div key={rIdx} className="fc-rango">
                        <div className="fc-rango-header">
                          <span className="fc-rango-label">Rango {rIdx + 1}</span>
                          <button type="button" className="fc-btn-icon-remove" onClick={() => eliminarRango(instructor.id, mIdx, rIdx)}>
                            <IcX />
                          </button>
                        </div>
                        <div className="fc-grid-2">
                          <Field label="Desde">
                            <input className="fc-input" type="date" value={rango.desde}
                              onChange={e => actualizarRango(instructor.id, mIdx, rIdx, 'desde', e.target.value)} />
                          </Field>
                          <Field label="Hasta">
                            <input className="fc-input" type="date" value={rango.hasta}
                              onChange={e => actualizarRango(instructor.id, mIdx, rIdx, 'hasta', e.target.value)} />
                          </Field>
                        </div>
                        <div className="fc-grid-2">
                          <Field label="Hora inicio">
                            <input className="fc-input" type="time" value={rango.hora_inicio}
                              onChange={e => actualizarRango(instructor.id, mIdx, rIdx, 'hora_inicio', e.target.value)} />
                          </Field>
                          <Field label="Hora fin">
                            <input className="fc-input" type="time" value={rango.hora_fin}
                              onChange={e => actualizarRango(instructor.id, mIdx, rIdx, 'hora_fin', e.target.value)} />
                          </Field>
                        </div>
                      </div>
                    ))}

                    <button type="button" className="fc-btn-add-rango" onClick={() => agregarRango(instructor.id, mIdx)}>
                      <IcPlus /> Agregar rango de fechas
                    </button>
                  </div>
                ))}

                <button type="button" className="fc-btn-add-mes" onClick={() => agregarMes(instructor.id)}>
                  <IcCalendar /> Agregar mes
                </button>
              </div>
            </div>
          );
        })}

        {/* Actions */}
        <div className="fc-actions">
          <button type="button" className="fc-btn-add-inst" onClick={agregarInstructor}>
            <IcPlus /> Agregar instructor
          </button>
          <button type="button" className="fc-btn-validate" onClick={() => {
            const errores = validarProgramacion();
            if (errores.length > 0) alert('Errores:\n• ' + errores.join('\n• '));
            else alert('✅ Validación exitosa');
          }}>
            <IcCheck /> Validar programación
          </button>
        </div>

      </div>
    </>
  );
};

/* ── Helpers ── */
const Field = ({ label, children }) => (
  <div className="fc-field">
    <label className="fc-label">{label}</label>
    {children}
  </div>
);

/* ── Icons ── */
const IcUsers    = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>;
const IcCalendar = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
const IcPlus     = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>;
const IcTrash    = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>;
const IcX        = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>;
const IcCheck    = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>;

/* ── Styles ── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');

  .fc-root {
    font-family: 'DM Sans', sans-serif;
    width: 100%;
    padding-bottom: 8px;
  }

  /* ── Header ── */
  .fc-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 20px;
  }
  .fc-header__left { display: flex; align-items: center; gap: 12px; }
  .fc-header__icon {
    width: 40px; height: 40px;
    background: #ecfdf5; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    color: #065f46; flex-shrink: 0;
  }
  .fc-header__title { font-size: 17px; font-weight: 700; color: #0f172a; margin: 0 0 2px; }
  .fc-header__sub   { font-size: 12.5px; color: #64748b; margin: 0; }
  .fc-header__count {
    text-align: right;
  }
  .fc-count-num   { display: block; font-size: 24px; font-weight: 700; color: #0a3d2e; font-family: 'DM Mono', monospace; line-height: 1; }
  .fc-count-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: .06em; }

  /* ── Instructor card ── */
  .fc-instructor {
    background: white;
    border: 1px solid #e8eaed;
    border-radius: 12px;
    margin-bottom: 16px;
    overflow: hidden;
  }
  .fc-inst-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 18px;
    background: #fafbfc;
    border-bottom: 1px solid #f1f5f9;
  }
  .fc-inst-header__left { display: flex; align-items: center; gap: 12px; }
  .fc-inst-num {
    width: 32px; height: 32px;
    background: #0a3d2e; color: white;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 700;
    flex-shrink: 0;
  }
  .fc-inst-label { font-size: 13px; font-weight: 600; color: #0f172a; margin: 0 0 4px; }
  .fc-inst-tipo-tag {
    display: inline-block;
    font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
    padding: 2px 8px; border-radius: 20px; border: 1px solid;
  }
  .fc-btn-remove-inst {
    display: flex; align-items: center; gap: 5px;
    padding: 6px 11px;
    background: rgba(239,68,68,.08);
    border: 1px solid rgba(239,68,68,.18);
    border-radius: 7px;
    color: #dc2626;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px; font-weight: 600;
    cursor: pointer;
    transition: background .18s;
  }
  .fc-btn-remove-inst:hover { background: rgba(239,68,68,.16); }

  /* ── Instructor body ── */
  .fc-inst-body { padding: 18px; display: flex; flex-direction: column; gap: 10px; }

  /* ── Section label ── */
  .fc-section-label {
    font-size: 10.5px; font-weight: 700;
    color: #94a3b8; text-transform: uppercase; letter-spacing: .09em;
    margin-bottom: 8px;
    display: flex; align-items: center; gap: 6px;
  }

  /* ── Tipo chips ── */
  .fc-tipo-row { display: flex; gap: 8px; flex-wrap: wrap; }
  .fc-tipo-chip {
    padding: 6px 14px;
    border-radius: 20px;
    border: 1.5px solid #e2e8f0;
    background: #f8fafc;
    color: #64748b;
    font-family: 'DM Sans', sans-serif;
    font-size: 12.5px; font-weight: 500;
    cursor: pointer;
    transition: all .18s;
  }
  .fc-tipo-chip:hover { border-color: #94a3b8; color: #334155; }
  .fc-tipo-chip--active { font-weight: 700; }

  /* ── Fields ── */
  .fc-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .fc-field  { display: flex; flex-direction: column; gap: 4px; }
  .fc-label  { font-size: 11.5px; font-weight: 600; color: #374151; }
  .fc-input, .fc-select {
    width: 100%; padding: 8px 11px;
    border: 1px solid #e2e8f0; border-radius: 7px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; color: #0f172a; background: white;
    outline: none;
    transition: border-color .15s, box-shadow .15s;
    appearance: none;
  }
  .fc-input::placeholder { color: #94a3b8; }
  .fc-input:focus, .fc-select:focus {
    border-color: #0a3d2e;
    box-shadow: 0 0 0 3px rgba(10,61,46,.08);
  }
  .fc-select {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 10px center;
    padding-right: 30px;
  }

  /* ── Programación section ── */
  .fc-prog-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: 16px; margin-bottom: 10px;
    padding-top: 14px;
    border-top: 1px solid #f1f5f9;
  }
  .fc-prog-badge {
    font-size: 11px; font-weight: 600;
    background: #f1f5f9; color: #64748b;
    padding: 2px 8px; border-radius: 20px;
  }
  .fc-empty-prog {
    display: flex; align-items: center; gap: 8px;
    padding: 12px 14px;
    background: #f8fafc; border: 1px dashed #e2e8f0;
    border-radius: 8px; color: #94a3b8;
    font-size: 12.5px;
    margin-bottom: 10px;
  }

  /* ── Mes ── */
  .fc-mes {
    background: #fafbfc;
    border: 1px solid #e8eaed;
    border-radius: 9px;
    padding: 14px;
    margin-bottom: 10px;
  }
  .fc-mes-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 12px;
  }
  .fc-mes-title {
    display: flex; align-items: center; gap: 7px;
    font-size: 13px; font-weight: 700; color: #0f172a;
  }
  .fc-mes-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #0a3d2e;
  }
  .fc-btn-remove-sm {
    display: flex; align-items: center; gap: 4px;
    padding: 4px 9px;
    background: rgba(239,68,68,.07);
    border: 1px solid rgba(239,68,68,.15);
    border-radius: 6px;
    color: #dc2626;
    font-family: 'DM Sans', sans-serif;
    font-size: 11px; font-weight: 600;
    cursor: pointer;
    transition: background .15s;
  }
  .fc-btn-remove-sm:hover { background: rgba(239,68,68,.14); }
  .fc-empty-rangos {
    font-size: 12px; color: #94a3b8; font-style: italic;
    margin-bottom: 8px;
  }

  /* ── Rango ── */
  .fc-rango {
    background: white;
    border: 1px solid #e8eaed;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 8px;
  }
  .fc-rango-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 10px;
  }
  .fc-rango-label {
    font-size: 11px; font-weight: 700;
    color: #64748b; text-transform: uppercase; letter-spacing: .07em;
  }
  .fc-btn-icon-remove {
    width: 24px; height: 24px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(239,68,68,.08);
    border: 1px solid rgba(239,68,68,.15);
    border-radius: 5px;
    color: #dc2626; cursor: pointer;
    transition: background .15s;
  }
  .fc-btn-icon-remove:hover { background: rgba(239,68,68,.16); }

  /* ── Add buttons ── */
  .fc-btn-add-rango {
    width: 100%;
    display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 7px;
    background: white;
    border: 1.5px dashed #cbd5e1;
    border-radius: 7px;
    color: #64748b;
    font-family: 'DM Sans', sans-serif;
    font-size: 12.5px; font-weight: 600;
    cursor: pointer;
    transition: border-color .15s, color .15s, background .15s;
    margin-top: 4px;
  }
  .fc-btn-add-rango:hover { border-color: #0a3d2e; color: #0a3d2e; background: #f0fdf4; }

  .fc-btn-add-mes {
    width: 100%;
    display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 8px;
    background: #f0fdf4;
    border: 1.5px dashed #86efac;
    border-radius: 7px;
    color: #166534;
    font-family: 'DM Sans', sans-serif;
    font-size: 12.5px; font-weight: 600;
    cursor: pointer;
    margin-top: 4px;
    transition: background .15s, border-color .15s;
  }
  .fc-btn-add-mes:hover { background: #dcfce7; border-color: #4ade80; }

  /* ── Bottom actions ── */
  .fc-actions {
    display: flex; gap: 12px; margin-top: 4px;
  }
  .fc-btn-add-inst {
    flex: 1;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    padding: 11px 16px;
    background: white;
    border: 1.5px solid #e2e8f0;
    border-radius: 9px;
    color: #334155;
    font-family: 'DM Sans', sans-serif;
    font-size: 13.5px; font-weight: 600;
    cursor: pointer;
    transition: all .18s;
  }
  .fc-btn-add-inst:hover { border-color: #0a3d2e; color: #0a3d2e; background: #f0fdf4; }

  .fc-btn-validate {
    flex: 1;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    padding: 11px 16px;
    background: #0a3d2e;
    border: none; border-radius: 9px;
    color: white;
    font-family: 'DM Sans', sans-serif;
    font-size: 13.5px; font-weight: 600;
    cursor: pointer;
    transition: background .18s;
  }
  .fc-btn-validate:hover { background: #0d5240; }

  @media (max-width: 520px) {
    .fc-grid-2 { grid-template-columns: 1fr; }
    .fc-actions { flex-direction: column; }
  }
`;

export default FormularioCampesenaCompleto;