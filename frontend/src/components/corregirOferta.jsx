import React, { useState } from 'react';

/* ══════════════════════════════════════════════════════════
   DATOS MOCK — reemplazar con props / API reales
══════════════════════════════════════════════════════════ */
const MOCK_OFERTA = {
  _id: '3',
  programa_formacion: { nombre_programa: 'Producción agropecuaria', codigo: '722134' },
  empresa_solicitante: { nombre: 'AgroVerde' },
  cupo_maximo: 30,
  fechas: { inicio: '2026-04-01', fin: '2026-10-01' },
  motivo_correccion:
    'Faltan documentos de aprendices inscritos. Las columnas de número de documento y teléfono están incompletas en varios registros.',
  funcionario_asignado: { nombre: 'Carlos Func.' },
  tiempo_solicitud: 'hace 2 horas',
};

const MOCK_APRENDICES = [
  { _id: 'a1', nombre: '', documento: '', telefono: '', correo: '' },
  { _id: 'a2', nombre: 'Diego Hernández', documento: '102345678', telefono: '3101234567', correo: 'dh@correo.com' },
  { _id: 'a3', nombre: '', documento: '', telefono: '3209876543', correo: 'vru@correo.com' },
  { _id: 'a4', nombre: '', documento: '109876543', telefono: '', correo: 'aos@correo.com' },
  { _id: 'a5', nombre: 'Camila Torres', documento: '107654321', telefono: '3154567890', correo: 'cto@correo.com' },
];

const isCompleto = (a) =>
  a.nombre.trim() && a.documento.trim() && a.telefono.trim() && a.correo.trim();

/* ── Ícono SVG inline reutilizable ── */
const Icon = ({ d, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICONS = {
  alert: 'M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
  check: 'M20 6L9 17l-5-5',
  send:  'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  x:     'M18 6L6 18M6 6l12 12',
  info:  'M12 16v-4m0-4h.01M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
  user:  'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  clock: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2',
};

/* ══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════════════════ */
const CorregirOferta = ({
  oferta = MOCK_OFERTA,
  aprendicesIniciales = MOCK_APRENDICES,
  onCancelar = () => alert('Cancelado'),
  onReenviar = (data) => alert('Reenviado: ' + JSON.stringify(data)),
}) => {
  const [aprendices, setAprendices] = useState(aprendicesIniciales);
  const [datosGenerales, setDatosGenerales] = useState({
    programa:     oferta.programa_formacion.nombre_programa,
    codigo:       oferta.programa_formacion.codigo,
    empresa:      oferta.empresa_solicitante.nombre,
    cupo_maximo:  oferta.cupo_maximo,
    fecha_inicio: oferta.fechas.inicio,
    fecha_fin:    oferta.fechas.fin,
  });

  const incompletos = aprendices.filter((a) => !isCompleto(a));

  const updateAprendiz = (id, field, value) =>
    setAprendices((prev) => prev.map((a) => (a._id === id ? { ...a, [field]: value } : a)));

  const handleReenviar = () => {
    if (incompletos.length > 0) return;
    onReenviar({ datosGenerales, aprendices });
  };

  return (
    <>
      <style>{styles}</style>
      <div className="co-page">

        {/* ── Breadcrumb ── */}
        <div className="co-breadcrumb">
          <span className="co-breadcrumb__item">Gestion y TICS</span>
          <span className="co-breadcrumb__sep">/</span>
          <span className="co-breadcrumb__item co-breadcrumb__item--active">Corregir oferta</span>
        </div>

        {/* ── Título ── */}
        <div className="co-hero">
          <h1 className="co-hero__title">Corregir oferta</h1>
          <p className="co-hero__sub">
            El funcionario detectó inconsistencias. Corrige los datos indicados y reenvía la oferta.
          </p>
        </div>

        {/* ── Banner corrección ── */}
        <div className="co-banner">
          <div className="co-banner__left">
            <span className="co-banner__icon">
              <Icon d={ICONS.alert} size={15} />
            </span>
          </div>
          <div className="co-banner__right">
            <p className="co-banner__title">Corrección solicitada por el funcionario</p>
            <p className="co-banner__quote">"{oferta.motivo_correccion}"</p>
            <div className="co-banner__meta">
              <span><Icon d={ICONS.user} size={11} /> {oferta.funcionario_asignado.nombre}</span>
              <span className="co-banner__dot" />
              <span><Icon d={ICONS.clock} size={11} /> {oferta.tiempo_solicitud}</span>
              <span className="co-banner__dot" />
              <span>{oferta.programa_formacion.nombre_programa} ({oferta.programa_formacion.codigo})</span>
            </div>
          </div>
        </div>

        {/* ── Datos generales ── */}
        <div className="co-card">
          <div className="co-card__head">
            <span className="co-card__title">Datos generales de la oferta</span>
            <span className="co-badge co-badge--warn">A corregir</span>
          </div>
          <div className="co-form-grid">
            {[
              { label: 'Programa de formación', key: 'programa',     type: 'text'   },
              { label: 'Código',                key: 'codigo',       type: 'text'   },
              { label: 'Empresa solicitante',   key: 'empresa',      type: 'text'   },
              { label: 'Cupo máximo',           key: 'cupo_maximo',  type: 'number' },
              { label: 'Fecha inicio',          key: 'fecha_inicio', type: 'date'   },
              { label: 'Fecha fin',             key: 'fecha_fin',    type: 'date'   },
            ].map(({ label, key, type }) => (
              <div className="co-field" key={key}>
                <label className="co-field__label">{label}</label>
                <input
                  className="co-field__input"
                  type={type}
                  value={datosGenerales[key]}
                  onChange={(e) => setDatosGenerales({ ...datosGenerales, [key]: e.target.value })}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── Lista aprendices ── */}
        <div className="co-card">
          <div className="co-card__head">
            <span className="co-card__title">Lista de aprendices inscritos</span>
            {incompletos.length > 0 && (
              <span className="co-badge co-badge--error">
                {incompletos.length} registro{incompletos.length !== 1 ? 's' : ''} con datos incompletos
              </span>
            )}
          </div>

          <div className="co-table-wrap">
            <table className="co-table">
              <thead>
                <tr>
                  {['Nombre completo', 'N° Documento', 'Teléfono', 'Correo', ''].map((h, i) => (
                    <th key={i} className="co-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {aprendices.map((a) => {
                  const ok = isCompleto(a);
                  return (
                    <tr key={a._id} className={`co-tr${!ok ? ' co-tr--incomplete' : ''}`}>
                      {(['nombre', 'documento', 'telefono', 'correo']).map((field) => (
                        <td key={field} className="co-td">
                          <input
                            className={`co-cell-input${!a[field].trim() ? ' co-cell-input--error' : ''}`}
                            value={a[field]}
                            placeholder={field === 'correo' ? 'mail@correo.com' : field === 'nombre' ? 'Ej: Juan García' : field === 'documento' ? 'Ej: 1023456789' : 'Ej: 3101234567'}
                            onChange={(e) => updateAprendiz(a._id, field, e.target.value)}
                          />
                        </td>
                      ))}
                      <td className="co-td co-td--center">
                        {ok
                          ? <span className="co-chip co-chip--ok"><Icon d={ICONS.check} size={10} /> OK</span>
                          : <span className="co-chip co-chip--error"><Icon d={ICONS.x} size={10} /> Incompleto</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="co-footer">
          <div className="co-footer__hint">
            <Icon d={ICONS.info} size={13} />
            <span>Completa los campos en rojo antes de reenviar</span>
          </div>
          <div className="co-footer__actions">
            <button className="co-btn co-btn--ghost" onClick={onCancelar}>
              Cancelar
            </button>
            <button
              className="co-btn co-btn--primary"
              onClick={handleReenviar}
              disabled={incompletos.length > 0}
            >
              <Icon d={ICONS.send} size={12} />
              Corregir y reenviar
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

/* ══════════════════════════════════════════════════════════
   ESTILOS — tema claro, armonizado con el portal SENA
   Paleta: fondo #f4f6f9, cards #ffffff, bordes #e2e8f0,
   acento verde #1a7a5e, texto principal #1e293b, subtexto #64748b
══════════════════════════════════════════════════════════ */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .co-page {
    min-height: 100vh;
    background: #f4f6f9;
    font-family: 'DM Sans', system-ui, sans-serif;
    color: #1e293b;
    padding: 28px 32px 52px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 980px;
  }

  /* Breadcrumb */
  .co-breadcrumb {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    color: #94a3b8;
  }
  .co-breadcrumb__sep { color: #cbd5e1; }
  .co-breadcrumb__item--active { color: #64748b; }

  /* Hero */
  .co-hero__title {
    font-size: 1.6rem;
    font-weight: 700;
    letter-spacing: -0.025em;
    color: #0f172a;
    margin-bottom: 6px;
  }
  .co-hero__sub {
    font-size: 0.85rem;
    color: #64748b;
    line-height: 1.55;
  }

  /* Banner */
  .co-banner {
    display: flex;
    gap: 16px;
    background: #fff5f5;
    border: 1px solid #fecaca;
    border-left: 3px solid #ef4444;
    border-radius: 12px;
    padding: 18px 20px;
  }
  .co-banner__left {
    flex-shrink: 0;
    margin-top: 2px;
  }
  .co-banner__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    background: #fee2e2;
    border-radius: 8px;
    color: #ef4444;
  }
  .co-banner__title {
    font-size: 0.78rem;
    font-weight: 700;
    color: #dc2626;
    letter-spacing: 0.01em;
    margin-bottom: 8px;
    text-transform: uppercase;
  }
  .co-banner__quote {
    font-size: 0.875rem;
    color: #374151;
    line-height: 1.55;
    margin-bottom: 12px;
  }
  .co-banner__meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 0.72rem;
    color: #94a3b8;
  }
  .co-banner__meta span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .co-banner__dot {
    width: 3px;
    height: 3px;
    background: #cbd5e1;
    border-radius: 50%;
  }

  /* Cards */
  .co-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  .co-card__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-bottom: 1px solid #f1f5f9;
    gap: 12px;
    flex-wrap: wrap;
    background: #fafbfc;
  }
  .co-card__title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1e293b;
  }

  /* Badges */
  .co-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 0.68rem;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 20px;
    letter-spacing: 0.02em;
  }
  .co-badge--warn {
    background: #fffbeb;
    color: #b45309;
    border: 1px solid #fde68a;
  }
  .co-badge--error {
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }

  /* Form grid */
  .co-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
  }
  .co-field {
    padding: 16px 20px;
    border-right: 1px solid #f1f5f9;
    border-bottom: 1px solid #f1f5f9;
  }
  .co-field:nth-child(even) { border-right: none; }
  .co-field:nth-last-child(-n+2) { border-bottom: none; }
  .co-field__label {
    display: block;
    font-size: 0.68rem;
    font-weight: 600;
    color: #94a3b8;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    margin-bottom: 7px;
  }
  .co-field__input {
    width: 100%;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 9px 13px;
    font-size: 0.85rem;
    color: #1e293b;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    font-family: inherit;
  }
  .co-field__input:focus {
    border-color: #1a7a5e;
    box-shadow: 0 0 0 3px rgba(26,122,94,0.12);
    background: #fff;
  }

  /* Table */
  .co-table-wrap { overflow-x: auto; }
  .co-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 620px;
  }
  .co-th {
    padding: 11px 14px;
    font-size: 0.68rem;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    border-bottom: 1px solid #e2e8f0;
    text-align: left;
    background: #fafbfc;
    white-space: nowrap;
  }
  .co-tr {
    border-bottom: 1px solid #f1f5f9;
    transition: background 0.12s;
  }
  .co-tr:last-child { border-bottom: none; }
  .co-tr:hover { background: #f8fafc; }
  .co-tr--incomplete { background: #fff8f8; }
  .co-tr--incomplete:hover { background: #fff1f1; }
  .co-td {
    padding: 9px 10px;
    vertical-align: middle;
  }
  .co-td--center { text-align: center; }
  .co-cell-input {
    width: 100%;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 7px;
    padding: 7px 10px;
    font-size: 0.8rem;
    color: #1e293b;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    font-family: inherit;
  }
  .co-cell-input::placeholder { color: #cbd5e1; }
  .co-cell-input:focus {
    border-color: #1a7a5e;
    box-shadow: 0 0 0 2px rgba(26,122,94,0.12);
    background: #fff;
  }
  .co-cell-input--error {
    border-color: #fca5a5;
    background: #fff8f8;
  }
  .co-cell-input--error::placeholder { color: #fca5a5; }
  .co-cell-input--error:focus {
    border-color: #ef4444;
    box-shadow: 0 0 0 2px rgba(239,68,68,0.12);
  }

  /* Status chips */
  .co-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.68rem;
    font-weight: 700;
    padding: 3px 9px;
    border-radius: 20px;
    white-space: nowrap;
  }
  .co-chip--ok {
    background: #f0fdf4;
    color: #16a34a;
    border: 1px solid #bbf7d0;
  }
  .co-chip--error {
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }

  /* Footer */
  .co-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 14px 20px;
    flex-wrap: wrap;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }
  .co-footer__hint {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.78rem;
    color: #94a3b8;
  }
  .co-footer__actions {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  /* Buttons */
  .co-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 9px 20px;
    border-radius: 8px;
    font-family: inherit;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    border: none;
    line-height: 1;
  }
  .co-btn--ghost {
    background: transparent;
    color: #64748b;
    border: 1px solid #e2e8f0;
  }
  .co-btn--ghost:hover {
    background: #f1f5f9;
    color: #1e293b;
    border-color: #cbd5e1;
  }
  .co-btn--primary {
    background: #1a7a5e;
    color: #fff;
    box-shadow: 0 1px 4px rgba(26,122,94,0.3);
  }
  .co-btn--primary:hover:not(:disabled) {
    background: #15664f;
    box-shadow: 0 4px 10px rgba(26,122,94,0.35);
    transform: translateY(-1px);
  }
  .co-btn--primary:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .co-page { padding: 20px 16px 36px; }
    .co-form-grid { grid-template-columns: 1fr; }
    .co-field { border-right: none; }
    .co-field:nth-last-child(-n+2) { border-bottom: 1px solid #f1f5f9; }
    .co-field:last-child { border-bottom: none; }
    .co-footer { flex-direction: column; align-items: stretch; }
    .co-footer__actions { justify-content: flex-end; }
  }
`;

export default CorregirOferta;