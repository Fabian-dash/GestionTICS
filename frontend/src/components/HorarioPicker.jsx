import React, { useMemo } from 'react';
import { calcularFechaFin } from './horarioUtils';

/**
 * HorarioPicker
 *
 * Props:
 *  - horario        : { hora_inicio, hora_fin, dias[] }
 *  - fechaInicio    : 'YYYY-MM-DD'
 *  - fechaFin       : 'YYYY-MM-DD'  (calculada por el padre, solo para mostrar)
 *  - duracionHoras  : number | null  — duración total del programa en horas
 *  - onChange       : (nuevoHorario) => void
 */

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const HorarioPicker = ({ horario, fechaInicio, fechaFin, duracionHoras, onChange }) => {

  // Calcular estadísticas en tiempo real
  const stats = useMemo(() => {
    const [hIni, mIni] = (horario.hora_inicio || '00:00').split(':').map(Number);
    const [hFin, mFin] = (horario.hora_fin   || '00:00').split(':').map(Number);
    const minutosPorSesion = (hFin * 60 + mFin) - (hIni * 60 + mIni);
    const horasPorSesion   = minutosPorSesion > 0 ? minutosPorSesion / 60 : 0;
    const diasCount        = horario.dias?.length || 0;
    const horasPorSemana   = horasPorSesion * diasCount;

    let semanasNecesarias = null;
    let mesesEstimados    = null;
    if (duracionHoras && horasPorSemana > 0) {
      semanasNecesarias = Math.ceil(duracionHoras / horasPorSemana);
      mesesEstimados    = (semanasNecesarias / 4.33).toFixed(1);
    }

    return { horasPorSesion, horasPorSemana, semanasNecesarias, mesesEstimados, minutosPorSesion };
  }, [horario.hora_inicio, horario.hora_fin, horario.dias, duracionHoras]);

  const handleDiaToggle = (dia) => {
    const diasActuales = horario.dias || [];
    const nuevoDias = diasActuales.includes(dia)
      ? diasActuales.filter(d => d !== dia)
      : [...diasActuales, dia];

    // Mantener orden canónico
    const ordenados = DIAS_SEMANA.filter(d => nuevoDias.includes(d));
    onChange({ ...horario, dias: ordenados });
  };

  const handleHoraChange = (campo, valor) => {
    onChange({ ...horario, [campo]: valor });
  };

  // Formatear fecha para mostrar
  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return null;
    const [y, m, d] = fechaISO.split('-');
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${d} ${meses[parseInt(m, 10) - 1]} ${y}`;
  };

  const horaValida = stats.minutosPorSesion > 0;
  const hayDias    = (horario.dias?.length || 0) > 0;

  return (
    <div style={s.root}>

      {/* ── FRANJA HORARIA ── */}
      <div style={s.bloqueHorario}>
        <div style={s.bloqueLabel}>
          <span style={s.bloqueLabelIcon}>🕐</span>
          Franja horaria
        </div>
        <div style={s.horaRow}>
          <div style={s.horaGroup}>
            <label style={s.horaLabel}>Hora inicio</label>
            <input
              type="time"
              value={horario.hora_inicio || '08:00'}
              onChange={e => handleHoraChange('hora_inicio', e.target.value)}
              style={s.timeInput}
            />
          </div>
          <div style={s.horaSep}>→</div>
          <div style={s.horaGroup}>
            <label style={s.horaLabel}>Hora fin</label>
            <input
              type="time"
              value={horario.hora_fin || '12:00'}
              onChange={e => handleHoraChange('hora_fin', e.target.value)}
              style={s.timeInput}
            />
          </div>
          {horaValida && (
            <div style={s.duracionSesion}>
              <span style={s.duracionNum}>{stats.horasPorSesion % 1 === 0 ? stats.horasPorSesion : stats.horasPorSesion.toFixed(1)}</span>
              <span style={s.duracionUnit}>h/sesión</span>
            </div>
          )}
          {!horaValida && horario.hora_inicio && horario.hora_fin && (
            <div style={s.errorHora}>⚠ La hora fin debe ser mayor a la hora inicio</div>
          )}
        </div>
      </div>

      {/* ── DÍAS ── */}
      <div style={s.bloqueDias}>
        <div style={s.bloqueLabel}>
          <span style={s.bloqueLabelIcon}>📅</span>
          Días de la semana
        </div>
        <div style={s.diasGrid}>
          {DIAS_SEMANA.map(dia => {
            const activo = horario.dias?.includes(dia);
            const esFinDeSemana = dia === 'Sábado' || dia === 'Domingo';
            return (
              <button
                key={dia}
                type="button"
                onClick={() => handleDiaToggle(dia)}
                style={{
                  ...s.diaBtn,
                  ...(activo ? s.diaBtnActivo : {}),
                  ...(esFinDeSemana && !activo ? s.diaBtnFinde : {})
                }}
              >
                <span style={s.diaBtnAbrev}>{dia.substring(0, 2)}</span>
                <span style={s.diaBtnNombre}>{dia}</span>
                {activo && <span style={s.diaBtnCheck}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── PANEL DE CÁLCULO ── */}
      {(horaValida || hayDias) && (
        <div style={s.panelCalculo}>
          <div style={s.panelCalculoTitle}>📊 Resumen de carga horaria</div>

          <div style={s.panelCalculoGrid}>
            <div style={s.statBox}>
              <span style={s.statBoxNum}>{hayDias ? stats.horasPorSemana.toFixed(1) : '—'}</span>
              <span style={s.statBoxLabel}>horas / semana</span>
            </div>

            {duracionHoras ? (
              <>
                <div style={s.statBox}>
                  <span style={s.statBoxNum}>{duracionHoras}</span>
                  <span style={s.statBoxLabel}>horas totales del programa</span>
                </div>
                <div style={s.statBox}>
                  <span style={s.statBoxNum}>
                    {hayDias && horaValida && stats.semanasNecesarias ? stats.semanasNecesarias : '—'}
                  </span>
                  <span style={s.statBoxLabel}>semanas estimadas</span>
                </div>
                <div style={{ ...s.statBox, ...s.statBoxDestacado }}>
                  <span style={{ ...s.statBoxNum, color: '#0369a1' }}>
                    {hayDias && horaValida && stats.mesesEstimados ? `~${stats.mesesEstimados}` : '—'}
                  </span>
                  <span style={{ ...s.statBoxLabel, color: '#0c4a6e' }}>meses estimados</span>
                </div>
              </>
            ) : null}
          </div>

          {/* Flecha de resultado: fechas */}
          {fechaInicio && fechaFin && duracionHoras && hayDias && horaValida && (
            <div style={s.fechasResultado}>
              <div style={s.fechaChip}>
                <span style={s.fechaChipLabel}>Inicio</span>
                <span style={s.fechaChipVal}>{formatearFecha(fechaInicio)}</span>
              </div>
              <div style={s.fechaArrow}>→</div>
              <div style={{ ...s.fechaChip, ...s.fechaChipFin }}>
                <span style={s.fechaChipLabel}>Fin estimado</span>
                <span style={s.fechaChipVal}>{formatearFecha(fechaFin)}</span>
              </div>
            </div>
          )}

          {/* Mensaje de guía si falta algo */}
          {duracionHoras && !fechaInicio && (
            <p style={s.guiaMensaje}>👆 Ingresa la fecha de inicio para que se calcule la fecha fin automáticamente.</p>
          )}
          {duracionHoras && fechaInicio && !hayDias && (
            <p style={s.guiaMensaje}>👆 Selecciona al menos un día para calcular la fecha fin.</p>
          )}

        </div>
      )}

    </div>
  );
};

// ── ESTILOS ──
const s = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  bloqueHorario: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '18px 20px'
  },
  bloqueDias: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '18px 20px'
  },
  bloqueLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    marginBottom: '14px'
  },
  bloqueLabelIcon: { fontSize: '16px' },
  horaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flexWrap: 'wrap'
  },
  horaGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  horaLabel: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.06em'
  },
  timeInput: {
    padding: '12px 16px',
    border: '1.5px solid #cbd5e1',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 700,
    color: '#0f172a',
    backgroundColor: 'white',
    outline: 'none',
    cursor: 'pointer',
    minWidth: '130px'
  },
  horaSep: {
    fontSize: '20px',
    color: '#94a3b8',
    fontWeight: 300,
    paddingTop: '18px'
  },
  duracionSesion: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: '#dbeafe',
    border: '1px solid #93c5fd',
    borderRadius: '12px',
    padding: '8px 16px',
    marginTop: '18px'
  },
  duracionNum: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#1d4ed8',
    lineHeight: 1
  },
  duracionUnit: {
    fontSize: '11px',
    color: '#3b82f6',
    fontWeight: 600
  },
  errorHora: {
    fontSize: '12px',
    color: '#dc2626',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '6px 12px',
    marginTop: '18px'
  },
  diasGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '8px'
  },
  diaBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '10px 4px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '12px',
    background: 'white',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    position: 'relative',
    gap: '2px'
  },
  diaBtnActivo: {
    background: '#1d4ed8',
    borderColor: '#1d4ed8',
    boxShadow: '0 4px 14px rgba(29,78,216,0.25)',
    transform: 'translateY(-1px)'
  },
  diaBtnFinde: {
    background: '#fefce8',
    borderColor: '#fde68a'
  },
  diaBtnAbrev: {
    fontSize: '13px',
    fontWeight: 800,
    color: 'inherit',
    lineHeight: 1
  },
  diaBtnNombre: {
    fontSize: '9px',
    fontWeight: 600,
    color: 'inherit',
    opacity: 0.7,
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    maxWidth: '100%'
  },
  diaBtnCheck: {
    position: 'absolute',
    top: '4px',
    right: '5px',
    fontSize: '9px',
    color: '#93c5fd'
  },
  panelCalculo: {
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
    border: '1px solid #7dd3fc',
    borderRadius: '18px',
    padding: '20px'
  },
  panelCalculoTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0369a1',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    marginBottom: '16px'
  },
  panelCalculoGrid: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'stretch'
  },
  statBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'white',
    border: '1px solid #bae6fd',
    borderRadius: '12px',
    padding: '12px 18px',
    minWidth: '90px',
    flex: 1
  },
  statBoxDestacado: {
    background: '#e0f2fe',
    border: '1.5px solid #38bdf8',
    boxShadow: '0 4px 14px rgba(56,189,248,0.15)'
  },
  statBoxNum: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#0369a1',
    lineHeight: 1
  },
  statBoxLabel: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#64748b',
    textAlign: 'center',
    marginTop: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  fechasResultado: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '18px',
    flexWrap: 'wrap'
  },
  fechaChip: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    background: 'white',
    border: '1px solid #cbd5e1',
    borderRadius: '12px',
    padding: '10px 18px'
  },
  fechaChipFin: {
    background: '#f0fdf4',
    border: '1.5px solid #86efac',
    boxShadow: '0 2px 8px rgba(134,239,172,0.3)'
  },
  fechaChipLabel: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.06em'
  },
  fechaChipVal: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#0f172a'
  },
  fechaArrow: {
    fontSize: '22px',
    color: '#94a3b8'
  },
  guiaMensaje: {
    fontSize: '13px',
    color: '#0369a1',
    background: 'rgba(255,255,255,0.7)',
    borderRadius: '10px',
    padding: '10px 14px',
    marginTop: '14px',
    marginBottom: 0
  }
};

export default HorarioPicker;