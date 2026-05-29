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
  motivo_correccion: 'Faltan documentos de aprendices inscritos. Las columnas de número de documento y teléfono están incompletas en varios registros.',
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

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
const isCompleto = (a) =>
  a.nombre.trim() && a.documento.trim() && a.telefono.trim() && a.correo.trim();

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
    programa: oferta.programa_formacion.nombre_programa,
    codigo: oferta.programa_formacion.codigo,
    empresa: oferta.empresa_solicitante.nombre,
    cupo_maximo: oferta.cupo_maximo,
    fecha_inicio: oferta.fechas.inicio,
    fecha_fin: oferta.fechas.fin,
  });

  const incompletos = aprendices.filter((a) => !isCompleto(a));

  const updateAprendiz = (id, field, value) => {
    setAprendices((prev) =>
      prev.map((a) => (a._id === id ? { ...a, [field]: value } : a))
    );
  };

  const handleReenviar = () => {
    if (incompletos.length > 0) return;
    onReenviar({ datosGenerales, aprendices });
  };

  return (
    <>
      <style>{styles}</style>
      <div className="co-page">

        {/* ── Topbar breadcrumb ── */}
        <header className="co-topbar">
          <div className="co-topbar__left">
            <div className="co-topbar__logo">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="3" y="3" width="18" height="18" rx="4" />
                <path d="M8 12h8M12 8v8" />
              </svg>
            </div>
            <nav className="co-breadcrumb">
              <span>Mis ofertas</span>
              <span className="co-breadcrumb__sep">/</span>
              <span>Instructor</span>
              <span className="co-breadcrumb__sep">/</span>
              <span>Ofertas</span>
              <span className="co-breadcrumb__sep">/</span>
              <span className="co-breadcrumb__active">Producción agropecuaria</span>
            </nav>
          </div>
          <div className="co-topbar__user">
            <span className="co-topbar__username">Juan Pérez</span>
            <div className="co-topbar__avatar">JP</div>
          </div>
        </header>

        <div className="co-body">

          {/* ── Título ── */}
          <div className="co-hero">
            <h1 className="co-hero__title">Corregir oferta</h1>
            <p className="co-hero__sub">
              El funcionario detectó inconsistencias. Corrige los datos indicados y reenvía la oferta.
            </p>
          </div>

          {/* ── Banner corrección ── */}
          <div className="co-banner">
            <div className="co-banner__header">
              <span className="co-banner__icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                </svg>
              </span>
              <span className="co-banner__title">Corrección solicitada por el funcionario</span>
            </div>
            <div className="co-banner__quote">
              "{oferta.motivo_correccion}"
            </div>
            <p className="co-banner__meta">
              Solicitado por {oferta.funcionario_asignado.nombre} · {oferta.tiempo_solicitud} · Oferta: {oferta.programa_formacion.nombre_programa} ({oferta.programa_formacion.codigo})
            </p>
          </div>

          {/* ── Datos generales ── */}
          <div className="co-section">
            <div className="co-section__head">
              <span className="co-section__title">Datos generales de la oferta</span>
              <span className="co-badge co-badge--warn">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                </svg>
                A corregir
              </span>
            </div>

            <div className="co-form-grid">
              <div className="co-field">
                <label className="co-field__label">PROGRAMA DE FORMACIÓN</label>
                <input
                  className="co-field__input"
                  value={datosGenerales.programa}
                  onChange={(e) => setDatosGenerales({ ...datosGenerales, programa: e.target.value })}
                />
              </div>
              <div className="co-field">
                <label className="co-field__label">CÓDIGO</label>
                <input
                  className="co-field__input"
                  value={datosGenerales.codigo}
                  onChange={(e) => setDatosGenerales({ ...datosGenerales, codigo: e.target.value })}
                />
              </div>
              <div className="co-field">
                <label className="co-field__label">EMPRESA SOLICITANTE</label>
                <input
                  className="co-field__input"
                  value={datosGenerales.empresa}
                  onChange={(e) => setDatosGenerales({ ...datosGenerales, empresa: e.target.value })}
                />
              </div>
              <div className="co-field">
                <label className="co-field__label">CUPO MÁXIMO</label>
                <input
                  className="co-field__input"
                  type="number"
                  value={datosGenerales.cupo_maximo}
                  onChange={(e) => setDatosGenerales({ ...datosGenerales, cupo_maximo: e.target.value })}
                />
              </div>
              <div className="co-field">
                <label className="co-field__label">FECHA INICIO</label>
                <input
                  className="co-field__input"
                  type="date"
                  value={datosGenerales.fecha_inicio}
                  onChange={(e) => setDatosGenerales({ ...datosGenerales, fecha_inicio: e.target.value })}
                />
              </div>
              <div className="co-field">
                <label className="co-field__label">FECHA FIN</label>
                <input
                  className="co-field__input"
                  type="date"
                  value={datosGenerales.fecha_fin}
                  onChange={(e) => setDatosGenerales({ ...datosGenerales, fecha_fin: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* ── Lista de aprendices ── */}
          <div className="co-section">
            <div className="co-section__head">
              <span className="co-section__title">Lista de aprendices inscritos</span>
              {incompletos.length > 0 && (
                <span className="co-badge co-badge--error">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                  </svg>
                  {incompletos.length} registro{incompletos.length !== 1 ? 's' : ''} con datos incompletos
                </span>
              )}
            </div>

            <div className="co-table-wrap">
              <table className="co-table">
                <thead>
                  <tr>
                    <th className="co-th" style={{ width: '22%' }}>NOMBRE<br />COMPLETO</th>
                    <th className="co-th" style={{ width: '22%' }}>N°<br />DOCUMENTO</th>
                    <th className="co-th" style={{ width: '22%' }}>TELÉFONO</th>
                    <th className="co-th" style={{ width: '22%' }}>CORREO</th>
                    <th className="co-th" style={{ width: '12%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {aprendices.map((a) => {
                    const completo = isCompleto(a);
                    return (
                      <tr
                        key={a._id}
                        className={`co-tr${!completo ? ' co-tr--incomplete' : ''}`}
                      >
                        <td className="co-td">
                          <input
                            className={`co-cell-input${!a.nombre.trim() ? ' co-cell-input--empty' : ''}`}
                            value={a.nombre}
                            placeholder="Ej: Juan García"
                            onChange={(e) => updateAprendiz(a._id, 'nombre', e.target.value)}
                          />
                        </td>
                        <td className="co-td">
                          <input
                            className={`co-cell-input${!a.documento.trim() ? ' co-cell-input--empty' : ''}`}
                            value={a.documento}
                            placeholder="Ej: 1023456789"
                            onChange={(e) => updateAprendiz(a._id, 'documento', e.target.value)}
                          />
                        </td>
                        <td className="co-td">
                          <input
                            className={`co-cell-input${!a.telefono.trim() ? ' co-cell-input--empty' : ''}`}
                            value={a.telefono}
                            placeholder="Ej: 3101234567"
                            onChange={(e) => updateAprendiz(a._id, 'telefono', e.target.value)}
                          />
                        </td>
                        <td className="co-td">
                          <input
                            className={`co-cell-input${!a.correo.trim() ? ' co-cell-input--empty' : ''}`}
                            value={a.correo}
                            placeholder="Imail@correo.com"
                            onChange={(e) => updateAprendiz(a._id, 'correo', e.target.value)}
                          />
                        </td>
                        <td className="co-td co-td--status">
                          {completo ? (
                            <span className="co-status co-status--ok">OK</span>
                          ) : (
                            <span className="co-status co-status--error">Incompleto</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Footer acciones ── */}
          <div className="co-footer">
            <div className="co-footer__hint">
              <span className="co-footer__check">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                </svg>
              </span>
              <span>
                Completa los campos resaltados en rojo antes de reenviar
              </span>
            </div>
            <div className="co-footer__actions">
              <button className="co-btn co-btn--ghost" onClick={onCancelar}>
                Cancelar
              </button>
              <button
                className={`co-btn co-btn--primary${incompletos.length > 0 ? ' co-btn--disabled' : ''}`}
                onClick={handleReenviar}
                disabled={incompletos.length > 0}
              >
                <span className="co-footer__check">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                  </svg>
                </span>
                Corregir<br />y reenviar
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

/* ══════════════════════════════════════════════════════════
   ESTILOS — mismo sistema de diseño del dashboard existente
══════════════════════════════════════════════════════════ */
const styles = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .co-page {
    min-height: 100vh;
    background: #111827;
    font-family: 'Segoe UI', system-ui, sans-serif;
    color: #e2e8f0;
    display: flex;
    flex-direction: column;
  }

  /* ── Topbar ── */
  .co-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    height: 52px;
    background: #1a2332;
    border-bottom: 1px solid #2d3748;
    flex-shrink: 0;
  }
  .co-topbar__left { display: flex; align-items: center; gap: 12px; }
  .co-topbar__logo {
    width: 32px; height: 32px;
    background: #0a3d2e;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    color: #4ade80;
    flex-shrink: 0;
  }
  .co-breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #64748b; }
  .co-breadcrumb__sep { color: #374151; }
  .co-breadcrumb__active { color: #94a3b8; }
  .co-topbar__user { display: flex; align-items: center; gap: 10px; }
  .co-topbar__username { font-size: 13px; color: #94a3b8; }
  .co-topbar__avatar {
    width: 32px; height: 32px;
    background: #0a3d2e;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 600; color: #4ade80;
  }

  /* ── Body ── */
  .co-body {
    flex: 1;
    padding: 24px 20px 32px;
    max-width: 640px;
    width: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  /* ── Hero ── */
  .co-hero__title { font-size: 20px; font-weight: 700; color: #f1f5f9; margin-bottom: 6px; }
  .co-hero__sub { font-size: 13px; color: #94a3b8; line-height: 1.5; }

  /* ── Banner corrección ── */
  .co-banner {
    background: #1e0a0a;
    border: 1px solid #7f1d1d;
    border-radius: 12px;
    padding: 14px 16px;
  }
  .co-banner__header {
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 10px;
  }
  .co-banner__icon {
    width: 20px; height: 20px;
    background: #fee2e2;
    border: 1px solid #fca5a5;
    border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    color: #dc2626;
    flex-shrink: 0;
  }
  .co-banner__title { font-size: 13px; font-weight: 600; color: #fca5a5; }
  .co-banner__quote {
    font-size: 13px;
    color: #e2e8f0;
    background: #2d1212;
    border: 1px solid #7f1d1d;
    border-radius: 8px;
    padding: 10px 12px;
    line-height: 1.55;
    margin-bottom: 10px;
  }
  .co-banner__meta { font-size: 11px; color: #6b7280; line-height: 1.5; }

  /* ── Section card ── */
  .co-section {
    background: #1a2332;
    border: 1px solid #2d3748;
    border-radius: 12px;
    overflow: hidden;
  }
  .co-section__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid #2d3748;
    flex-wrap: wrap;
    gap: 8px;
  }
  .co-section__title { font-size: 13px; font-weight: 600; color: #e2e8f0; }

  /* ── Badges ── */
  .co-badge {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 600;
    padding: 3px 9px; border-radius: 20px;
  }
  .co-badge--warn {
    background: #1c1208; color: #fbbf24;
    border: 1px solid #92400e;
  }
  .co-badge--error {
    background: #1e0a0a; color: #fca5a5;
    border: 1px solid #7f1d1d;
  }

  /* ── Form grid ── */
  .co-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
    background: #2d3748;
    border-top: none;
  }
  .co-field {
    background: #1a2332;
    padding: 14px 16px;
  }
  .co-field__label {
    display: block;
    font-size: 10px;
    font-weight: 600;
    color: #6b7280;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 7px;
  }
  .co-field__input {
    width: 100%;
    background: #111827;
    border: 1px solid #374151;
    border-radius: 8px;
    padding: 9px 11px;
    font-size: 13px;
    color: #e2e8f0;
    outline: none;
    transition: border-color 0.2s;
    font-family: inherit;
  }
  .co-field__input:focus { border-color: #0a3d2e; }
  .co-field__input[type="date"] { color-scheme: dark; }

  /* ── Table wrap ── */
  .co-table-wrap { overflow-x: auto; }
  .co-table { width: 100%; border-collapse: collapse; min-width: 520px; }
  .co-th {
    padding: 10px 10px;
    font-size: 10px; font-weight: 700;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    border-bottom: 1px solid #2d3748;
    text-align: left;
    line-height: 1.3;
  }
  .co-tr { transition: background 0.15s; }
  .co-tr:not(:last-child) { border-bottom: 1px solid #2d3748; }
  .co-tr--incomplete { background: #1e0a0a; }
  .co-tr--incomplete:hover { background: #250e0e; }
  .co-tr:not(.co-tr--incomplete):hover { background: #1e2a3a; }

  .co-td {
    padding: 8px 10px;
    vertical-align: middle;
  }
  .co-td--status { text-align: center; }

  .co-cell-input {
    width: 100%;
    background: #111827;
    border: 1px solid #374151;
    border-radius: 7px;
    padding: 7px 9px;
    font-size: 12px;
    color: #e2e8f0;
    outline: none;
    font-family: inherit;
    transition: border-color 0.2s;
    min-width: 0;
  }
  .co-cell-input:focus { border-color: #0a3d2e; box-shadow: 0 0 0 2px rgba(10,61,46,0.25); }
  .co-cell-input--empty {
    border-color: #7f1d1d;
    background: #1a0808;
    color: #94a3b8;
  }
  .co-cell-input--empty::placeholder { color: #6b3a3a; }

  .co-status {
    display: inline-block;
    font-size: 10px; font-weight: 700;
    padding: 3px 8px; border-radius: 20px;
    white-space: nowrap;
  }
  .co-status--ok    { color: #4ade80; }
  .co-status--error {
    background: #1e0a0a; color: #fca5a5;
    border: 1px solid #7f1d1d;
    border-radius: 4px;
    padding: 2px 7px;
  }

  /* ── Footer ── */
  .co-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    background: #1a2332;
    border: 1px solid #2d3748;
    border-radius: 12px;
    padding: 14px 16px;
    flex-wrap: wrap;
  }
  .co-footer__hint {
    display: flex; align-items: flex-start; gap: 8px;
    font-size: 11px; color: #64748b;
    max-width: 200px; line-height: 1.45;
  }
  .co-footer__check {
    width: 16px; height: 16px;
    background: #1e293b;
    border: 1px solid #374151;
    border-radius: 3px;
    display: inline-flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    color: #4b5563;
  }
  .co-footer__actions { display: flex; gap: 10px; align-items: center; }

  /* ── Buttons ── */
  .co-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    padding: 10px 20px;
    border-radius: 8px; border: none;
    font-family: inherit; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all 0.2s;
    text-align: center; line-height: 1.35;
  }
  .co-btn--ghost {
    background: transparent;
    color: #94a3b8;
    border: 1px solid #374151;
  }
  .co-btn--ghost:hover { background: #1e293b; color: #e2e8f0; }
  .co-btn--primary {
    background: #0a3d2e;
    color: #fff;
    border: 1px solid #16a34a;
  }
  .co-btn--primary:hover:not(:disabled) { background: #0d5240; }
  .co-btn--disabled { opacity: 0.45; cursor: not-allowed; }

  @media (max-width: 600px) {
    .co-form-grid { grid-template-columns: 1fr; }
    .co-footer { flex-direction: column; align-items: stretch; }
    .co-footer__hint { max-width: 100%; }
    .co-footer__actions { justify-content: flex-end; }
  }
`;

export default CorregirOferta;