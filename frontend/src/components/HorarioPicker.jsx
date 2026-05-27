import React, { useState, useMemo, useEffect } from 'react';

const DIAS_SEMANA = [
  { key: 'Lunes',      corto: 'Lu', festivo: false },
  { key: 'Martes',     corto: 'Ma', festivo: false },
  { key: 'Miércoles',  corto: 'Mi', festivo: false },
  { key: 'Jueves',     corto: 'Ju', festivo: false },
  { key: 'Viernes',    corto: 'Vi', festivo: false },
  { key: 'Sábado',     corto: 'Sa', festivo: true  },
  { key: 'Domingo',    corto: 'Do', festivo: true  },
];

const NOMBRES_DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const HorarioPicker = ({ horario, onChange, fechaInicio, fechaFin }) => {
  const [modoActivo, setModoActivo] = useState(null);

  // Calcular los días únicos entre las fechas
  const diasEnRango = useMemo(() => {
    if (!fechaInicio || !fechaFin) {
      return DIAS_SEMANA; // Mostrar todos si no hay fechas
    }

    try {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);

      if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
        return DIAS_SEMANA;
      }

      const diasUnicos = new Set();
      const fechaActual = new Date(inicio);

      // Iterar desde la fecha de inicio hasta la fecha de fin
      while (fechaActual <= fin) {
        const nombreDia = NOMBRES_DIAS[fechaActual.getDay()];
        diasUnicos.add(nombreDia);
        fechaActual.setDate(fechaActual.getDate() + 1);
      }

      // Retornar solo los días que están en el rango, en el orden de DIAS_SEMANA
      return DIAS_SEMANA.filter(dia => diasUnicos.has(dia.key));
    } catch (error) {
      return DIAS_SEMANA;
    }
  }, [fechaInicio, fechaFin]);

  useEffect(() => {
    const diasValidos = (horario.dias || []).filter(d => diasEnRango.some(item => item.key === d));
    if (JSON.stringify(diasValidos) !== JSON.stringify(horario.dias)) {
      onChange({ ...horario, dias: diasValidos });
    }
  }, [diasEnRango, horario.dias, horario, onChange]);

  const toggleDia = (dia) => {
    const diasActuales = horario.dias || [];
    const nuevos = diasActuales.includes(dia)
      ? diasActuales.filter(d => d !== dia)
      : [...diasActuales, dia];
    setModoActivo(null);
    onChange({ ...horario, dias: nuevos });
  };

  const seleccionarHabiles = () => {
    if (modoActivo === 'habiles') {
      setModoActivo(null);
      onChange({ ...horario, dias: [] });
      return;
    }
    const diasHabiles = diasEnRango
      .filter(d => !d.festivo)
      .map(d => d.key);
    setModoActivo('habiles');
    onChange({ ...horario, dias: diasHabiles });
  };

  const seleccionarSabados = () => {
    if (modoActivo === 'sabados') {
      setModoActivo(null);
      onChange({ ...horario, dias: [] });
      return;
    }
    const diasFestivos = diasEnRango
      .filter(d => d.festivo)
      .map(d => d.key);
    setModoActivo('sabados');
    onChange({ ...horario, dias: diasFestivos });
  };

  const limpiar = () => {
    setModoActivo(null);
    onChange({ ...horario, dias: [] });
  };

  const diasSeleccionados = horario.dias || [];

  return (
    <>
      <style>{css}</style>
      <div className="hp-root">

        <div className="hp-times">
          <div className="hp-time-field">
            <label className="hp-label">Hora inicio</label>
            <div className="hp-time-wrap">
              <svg className="hp-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
              <input
                className="hp-time-input"
                type="time"
                value={horario.hora_inicio || '08:00'}
                onChange={e => onChange({ ...horario, hora_inicio: e.target.value })}
              />
            </div>
          </div>
          <div className="hp-time-field">
            <label className="hp-label">Hora fin</label>
            <div className="hp-time-wrap">
              <svg className="hp-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
              <input
                className="hp-time-input"
                type="time"
                value={horario.hora_fin || '16:00'}
                onChange={e => onChange({ ...horario, hora_fin: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="hp-quick-section">
          <p className="hp-sublabel">Selección rápida</p>
          <div className="hp-quick-row">
            <button
              type="button"
              className={`hp-quick-btn ${modoActivo === 'habiles' ? 'hp-quick-btn--on' : ''}`}
              onClick={seleccionarHabiles}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2M12 12v4M10 14h4"/></svg>
              Días hábiles
            </button>
            <button
              type="button"
              className={`hp-quick-btn ${modoActivo === 'sabados' ? 'hp-quick-btn--on' : ''}`}
              onClick={seleccionarSabados}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              Sábados y festivos
            </button>
            <button type="button" className="hp-clear-btn" onClick={limpiar}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              Limpiar
            </button>
          </div>
        </div>

        <div className="hp-days-section">
          <p className="hp-sublabel">Días</p>
          <div className="hp-days-grid">
            {diasEnRango.map(dia => {
              const activo = diasSeleccionados.includes(dia.key);
              return (
                <button
                  key={dia.key}
                  type="button"
                  className={`hp-day-btn ${activo ? 'hp-day-btn--on' : ''}`}
                  onClick={() => toggleDia(dia.key)}
                  aria-pressed={activo}
                  title={dia.key}
                >
                  <span className="hp-day-corto">{dia.corto}</span>
                </button>
              );
            })}
          </div>
        </div>

        {diasSeleccionados.length > 0 && (
          <div className="hp-resumen">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ color: '#16a34a', flexShrink: 0 }}><path d="M20 6L9 17l-5-5"/></svg>
            <span className="hp-resumen-txt">
              {diasSeleccionados.join(', ')} · {horario.hora_inicio || '08:00'} – {horario.hora_fin || '16:00'}
            </span>
          </div>
        )}
      </div>
    </>
  );
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

  .hp-root {
    font-family: 'DM Sans', sans-serif;
    display: flex; flex-direction: column; gap: 14px;
  }

  .hp-label {
    font-size: 11px; font-weight: 500;
    text-transform: uppercase; letter-spacing: .07em;
    color: #64748b; display: block; margin-bottom: 5px;
  }
  .hp-sublabel {
    font-size: 11px; font-weight: 500;
    text-transform: uppercase; letter-spacing: .07em;
    color: #94a3b8; margin: 0 0 8px;
  }

  .hp-times {
    display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
  }
  .hp-time-field { display: flex; flex-direction: column; }
  .hp-time-wrap { position: relative; }
  .hp-ico {
    position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
    width: 14px; height: 14px; color: #94a3b8; pointer-events: none;
  }
  .hp-time-input {
    width: 100%; padding: 8px 10px 8px 32px;
    border: 0.5px solid #d1d5db; border-radius: 8px;
    background: white; font-family: 'DM Sans', sans-serif;
    font-size: 13px; color: #0f172a; outline: none;
    box-sizing: border-box;
    transition: border-color .15s, box-shadow .15s;
  }
  .hp-time-input:focus {
    border-color: #0a3d2e;
    box-shadow: 0 0 0 2px rgba(10,61,46,.1);
  }

  .hp-quick-row {
    display: flex; gap: 7px; flex-wrap: wrap;
  }
  .hp-quick-btn {
    display: flex; align-items: center; gap: 5px;
    padding: 6px 12px; border-radius: 20px;
    border: 0.5px solid #d1d5db;
    background: #f8fafc;
    color: #64748b;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px; font-weight: 500;
    cursor: pointer; transition: all .15s;
  }
  .hp-quick-btn:hover { border-color: #0a3d2e; color: #0a3d2e; background: rgba(10,61,46,.04); }
  .hp-quick-btn--on {
    border-color: #0a3d2e !important;
    background: #0a3d2e !important;
    color: white !important;
  }
  .hp-clear-btn {
    display: flex; align-items: center; gap: 5px;
    padding: 6px 12px; border-radius: 20px;
    border: 0.5px solid #e2e8f0;
    background: transparent; color: #94a3b8;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px; font-weight: 500;
    cursor: pointer; transition: all .15s;
  }
  .hp-clear-btn:hover { color: #dc2626; border-color: rgba(220,38,38,.3); background: rgba(220,38,38,.04); }

  .hp-days-grid {
    display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px;
  }
  .hp-day-btn {
    border: 0.5px solid #e2e8f0;
    border-radius: 8px;
    background: white;
    cursor: pointer;
    display: flex; flex-direction: column; align-items: center;
    padding: 8px 4px; gap: 2px;
    font-family: 'DM Sans', sans-serif;
    transition: all .15s;
  }
  .hp-day-btn:hover { border-color: #0a3d2e; background: rgba(10,61,46,.04); }
  .hp-day-btn--on { border-color: #0a3d2e !important; background: #0a3d2e !important; }
  .hp-day-corto { font-size: 11px; font-weight: 500; color: #475569; }
  .hp-day-btn--on .hp-day-corto { color: white; }

  .hp-resumen {
    display: flex; align-items: center; gap: 8px;
    background: #f0fdf4; border: 0.5px solid #bbf7d0;
    border-radius: 8px; padding: 9px 12px;
  }
  .hp-resumen-txt { font-size: 12px; color: #166534; }

  @media (max-width: 400px) {
    .hp-times { grid-template-columns: 1fr; }
    .hp-days-grid { grid-template-columns: repeat(4, 1fr); }
  }
`;

export default HorarioPicker;