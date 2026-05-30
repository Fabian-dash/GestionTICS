import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

// ─── helpers ────────────────────────────────────────────────────────────────
const isCompleto = (a) =>
  a.nombres?.trim() &&
  a.apellidos?.trim() &&
  a.numero_documento?.trim() &&
  a.telefono?.trim() &&
  a.correo?.trim();

const Icon = ({ d, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
  arrow: 'M5 12h14M12 5l7 7-7 7',
};

// ─── Spinner ─────────────────────────────────────────────────────────────────
const Spinner = () => <span className="co-spin" />;

// ═════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═════════════════════════════════════════════════════════════════════════════
const CorregirOferta = ({
  oferta: ofertaProp = null,
  onCancelar = null,
  onReenviar = null,
}) => {
  const { solicitudId } = useParams();
  const navigate        = useNavigate();

  const [loading,        setLoading]        = useState(!ofertaProp);
  const [sending,        setSending]        = useState(false);
  const [error,          setError]          = useState(null);
  const [oferta,         setOferta]         = useState(ofertaProp || null);
  const [aprendices,     setAprendices]     = useState([]);
  const [novedadesInfo,  setNovedadesInfo]  = useState({});
  const [comentario,     setComentario]     = useState('');
  const [datosGenerales, setDatosGenerales] = useState({
    programa:     '',
    codigo:       '',
    empresa:      '',
    cupo_maximo:  '',
    fecha_inicio: '',
    fecha_fin:    '',
  });

  // ── Cargar datos ────────────────────────────────────────────────────────
  useEffect(() => {
    if (ofertaProp) {
      setOferta(ofertaProp);
      poblarDatosGenerales(ofertaProp);
      cargarInscritosYNovedades(ofertaProp._id);
      return;
    }
    if (solicitudId) cargarPorSolicitud();
  }, [solicitudId, ofertaProp]);

  const poblarDatosGenerales = (o) => {
    setDatosGenerales({
      programa:     o.programa_formacion?.nombre_programa || '',
      codigo:       o.programa_formacion?.codigo          || '',
      empresa:      o.empresa_solicitante?.nombre || o.empresa_solicitante || '',
      cupo_maximo:  o.cupo_maximo  || '',
      fecha_inicio: o.fechas?.inicio ? o.fechas.inicio.split('T')[0] : '',
      fecha_fin:    o.fechas?.fin   ? o.fechas.fin.split('T')[0]     : '',
    });
  };

  // Carga inscritos + novedades marcadas por el funcionario
  // NOTA: si tu ruta de inscripciones es distinta, cambia solo esta URL
  const cargarInscritosYNovedades = async (ofertaId) => {
    try {
      setLoading(true);

      // 1. Novedades del funcionario: { inscripcionId: 'observacion' }
      let novedadesMap = {};
      try {
        const respNov = await api.get(`/funcionarios/novedades-aprendices/${ofertaId}`);
        novedadesMap  = respNov.data.data || {};
      } catch {
        // Sin novedades registradas — continuar igual
      }
      setNovedadesInfo(novedadesMap);

      // 2. Solo cargar inscritos si hay novedades (optimización)
      const hayNovedades = Object.keys(novedadesMap).length > 0;
      if (!hayNovedades) {
        setAprendices([]);
        return;
      }

      // 3. Intentar cargar inscritos con las rutas más comunes
      //    Ajusta la URL según tu router de Express
      let inscritos = [];
      try {
        // Intento 1: /inscripciones/oferta/:id
        const r = await api.get(`/inscripciones/oferta/${ofertaId}`);
        inscritos = r.data.data || r.data || [];
      } catch {
        try {
          // Intento 2: /inscripciones?oferta_id=:id
          const r = await api.get(`/inscripciones?oferta_id=${ofertaId}`);
          inscritos = r.data.data || r.data || [];
        } catch {
          // Si no hay ruta de inscripciones accesible,
          // mostramos solo los IDs de las novedades sin datos extra
          const ids = Object.keys(novedadesMap);
          setAprendices(ids.map(id => ({
            _id:              id,
            nombres:          '',
            apellidos:        '',
            numero_documento: '',
            telefono:         '',
            correo:           '',
            tieneNovedad:     true,
          })));
          return;
        }
      }

      // 4. Mapear y filtrar solo los que tienen novedad
      const conNovedad = inscritos
        .filter(insc => !!novedadesMap[insc._id?.toString()])
        .map(insc => ({
          _id:              insc._id,
          nombres:          insc.nombres   || '',
          apellidos:        insc.apellidos || '',
          numero_documento: insc.numero_documento || '',
          telefono:         insc.telefono  || '',
          correo:           insc.correo    || insc.correo_electronico || '',
          tieneNovedad:     true,
        }));

      setAprendices(conNovedad);
    } catch (err) {
      console.error('Error cargando inscritos/novedades:', err);
      setError(err.response?.data?.message || err.message || 'Error cargando aprendices');
    } finally {
      setLoading(false);
    }
  };

  const cargarPorSolicitud = async () => {
    try {
      setLoading(true);
      const respSol   = await api.get(`/solicitudes/${solicitudId}`);
      const solicitud = respSol.data.data;
      if (!solicitud?.oferta_id) throw new Error('Solicitud u oferta no encontrada');

      const ofertaData = solicitud.oferta_id;
      setOferta(ofertaData);
      poblarDatosGenerales(ofertaData);
      await cargarInscritosYNovedades(ofertaData._id);
    } catch (err) {
      console.error('Error cargando solicitud:', err);
      setError(err.response?.data?.message || err.message || 'Error cargando la oferta');
    } finally {
      setLoading(false);
    }
  };

  // ── Edición de aprendices ───────────────────────────────────────────────
  const updateAprendiz = (id, field, value) =>
    setAprendices(prev => prev.map(a => (a._id === id ? { ...a, [field]: value } : a)));

  // ── Reenvío ─────────────────────────────────────────────────────────────
  const incompletos = aprendices.filter(a => !isCompleto(a));

  const handleReenviar = async () => {
    if (incompletos.length > 0) {
      alert('Por favor completa todos los campos requeridos antes de reenviar');
      return;
    }

    if (!oferta?._id) {
      alert('No se encontró el ID de la oferta');
      return;
    }

    try {
      setSending(true);

      // Si hay aprendices con datos editados, actualizarlos primero
      if (aprendices.length > 0) {
        await Promise.allSettled(
          aprendices.map(a =>
            api.put(`/inscripciones/${a._id}`, {
              nombres:          a.nombres,
              apellidos:        a.apellidos,
              numero_documento: a.numero_documento,
              telefono:         a.telefono,
              correo:           a.correo,
            })
          )
        );
      }

      // Reenviar oferta: a_corregir → en_proceso
      // Usa el endpoint que ya tienes en solicitudesController.js
      await api.post('/solicitudes/reenviar-corregida', {
        oferta_id: oferta._id,
        mensaje:   comentario.trim() || 'Oferta corregida y reenviada al funcionario',
      });

      if (onReenviar) {
        onReenviar();
        return;
      }

      alert('✅ Oferta reenviada correctamente. El funcionario puede continuar la revisión.');
      navigate('/instructor/mis-ofertas');
    } catch (err) {
      console.error('Error al reenviar:', err);
      alert(err.response?.data?.message || 'Error al reenviar la oferta');
    } finally {
      setSending(false);
    }
  };

  // ── Estados de carga ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontFamily: 'DM Sans, sans-serif' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#1a7a5e', borderRadius: '50%', animation: 'spin .7s linear infinite', margin: '0 auto 14px' }} />
        Cargando datos de la oferta...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444', fontFamily: 'DM Sans, sans-serif' }}>
        <p style={{ fontSize: 15, marginBottom: 12 }}>⚠ {error}</p>
        <button
          onClick={onCancelar ? onCancelar : () => navigate(-1)}
          style={{ padding: '8px 18px', cursor: 'pointer', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff' }}
        >
          Volver
        </button>
      </div>
    );
  }

  if (!oferta) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No se encontró la oferta</div>;
  }

  // ── UI ───────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{styles}</style>
      <div className="co-page">

        {/* Breadcrumb */}
        <div className="co-breadcrumb">
          <span>Gestion y TICS</span>
          <span className="co-breadcrumb__sep">/</span>
          <span>Mis Ofertas</span>
          <span className="co-breadcrumb__sep">/</span>
          <span style={{ color: '#1a7a5e', fontWeight: 600 }}>Corregir oferta</span>
        </div>

        {/* Hero */}
        <div className="co-hero">
          <h1 className="co-hero__title">Corregir oferta</h1>
          <p className="co-hero__sub">
            El funcionario detectó inconsistencias. Corrige los datos indicados y reenvía la oferta para continuar el proceso.
          </p>
        </div>

        {/* Flujo visual */}
        <div className="co-flujo">
          {[
            { label: 'A corregir',  active: true,  done: false, color: '#ef4444' },
            { label: 'En proceso',  active: false, done: false, color: '#3b82f6' },
            { label: 'Aprobada',    active: false, done: false, color: '#7c3aed' },
            { label: 'Matriculada', active: false, done: false, color: '#14b8a6' },
          ].map((step, i, arr) => (
            <React.Fragment key={step.label}>
              <div className="co-flujo__step">
                <div
                  className="co-flujo__dot"
                  style={{
                    background:   step.active ? step.color : '#e2e8f0',
                    boxShadow:    step.active ? `0 0 0 4px ${step.color}22` : 'none',
                  }}
                />
                <span className="co-flujo__label" style={{ color: step.active ? step.color : '#94a3b8', fontWeight: step.active ? 700 : 400 }}>
                  {step.label}
                </span>
              </div>
              {i < arr.length - 1 && (
                <div className="co-flujo__line" style={{ background: step.active ? '#e2e8f0' : '#e2e8f0' }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Banner motivo de corrección */}
        <div className="co-banner">
          <div className="co-banner__icon">
            <Icon d={ICONS.alert} size={18} />
          </div>
          <div className="co-banner__content">
            <p className="co-banner__tag">Corrección solicitada por el funcionario</p>
            <p className="co-banner__quote">
              "{oferta.motivo_correccion || 'Revisa los datos de la oferta y los aprendices marcados'}"
            </p>
            <div className="co-banner__meta">
              <span className="co-banner__chip">
                {oferta.programa_formacion?.codigo}
              </span>
              <span style={{ fontSize: 12, color: '#6b7280' }}>
                {oferta.programa_formacion?.nombre_programa}
              </span>
            </div>
          </div>
        </div>

        {/* Datos generales */}
        <div className="co-card">
          <div className="co-card__head">
            <div className="co-card__head-left">
              <span className="co-card__icon">📋</span>
              <span className="co-card__title">Datos generales de la oferta</span>
            </div>
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
                  onChange={e => setDatosGenerales({ ...datosGenerales, [key]: e.target.value })}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Aprendices con novedades */}
        <div className="co-card">
          <div className="co-card__head">
            <div className="co-card__head-left">
              <span className="co-card__icon">👥</span>
              <div>
                <span className="co-card__title">Aprendices con novedades reportadas</span>
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                  Solo aparecen los aprendices que el funcionario marcó. Corrige sus datos.
                </p>
              </div>
            </div>
            {aprendices.length > 0 && (
              <span className="co-badge co-badge--warn">
                ⚠ {aprendices.length} con novedad
              </span>
            )}
          </div>

          {aprendices.length === 0 ? (
            <div className="co-empty">
              <span style={{ fontSize: 36 }}>✅</span>
              <p style={{ fontWeight: 600, color: '#334155', marginTop: 8 }}>
                No hay aprendices con novedades
              </p>
              <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                El funcionario no marcó ningún aprendiz. Puedes reenviar directamente.
              </p>
            </div>
          ) : (
            <div className="co-table-wrap">
              <table className="co-table">
                <thead>
                  <tr>
                    <th className="co-th">#</th>
                    <th className="co-th">Nombres</th>
                    <th className="co-th">Apellidos</th>
                    <th className="co-th">N° Documento</th>
                    <th className="co-th">Teléfono</th>
                    <th className="co-th">Correo</th>
                    <th className="co-th">Observación del funcionario</th>
                    <th className="co-th">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {aprendices.map((a, idx) => {
                    const ok        = isCompleto(a);
                    const observacion = novedadesInfo[a._id?.toString()] || 'Datos incorrectos o incompletos';
                    return (
                      <tr key={a._id} className={`co-tr${!ok ? ' co-tr--err' : ''}`}>
                        <td className="co-td co-td--center">
                          <span className="co-num">{idx + 1}</span>
                        </td>

                        {/* Nombres */}
                        <td className="co-td">
                          <input
                            className={`co-input${!a.nombres?.trim() ? ' co-input--err' : ''}`}
                            value={a.nombres}
                            placeholder="Nombres *"
                            onChange={e => updateAprendiz(a._id, 'nombres', e.target.value)}
                          />
                        </td>

                        {/* Apellidos */}
                        <td className="co-td">
                          <input
                            className={`co-input${!a.apellidos?.trim() ? ' co-input--err' : ''}`}
                            value={a.apellidos}
                            placeholder="Apellidos *"
                            onChange={e => updateAprendiz(a._id, 'apellidos', e.target.value)}
                          />
                        </td>

                        {/* Documento */}
                        <td className="co-td">
                          <input
                            className={`co-input${!a.numero_documento?.trim() ? ' co-input--err' : ''}`}
                            value={a.numero_documento}
                            placeholder="Documento *"
                            onChange={e => updateAprendiz(a._id, 'numero_documento', e.target.value)}
                          />
                        </td>

                        {/* Teléfono */}
                        <td className="co-td">
                          <input
                            className={`co-input${!a.telefono?.trim() ? ' co-input--err' : ''}`}
                            value={a.telefono}
                            placeholder="Teléfono *"
                            onChange={e => updateAprendiz(a._id, 'telefono', e.target.value)}
                          />
                        </td>

                        {/* Correo */}
                        <td className="co-td">
                          <input
                            className={`co-input${!a.correo?.trim() ? ' co-input--err' : ''}`}
                            value={a.correo}
                            placeholder="Correo *"
                            onChange={e => updateAprendiz(a._id, 'correo', e.target.value)}
                          />
                        </td>

                        {/* Observación */}
                        <td className="co-td">
                          <div className="co-observacion">
                            📝 {observacion}
                          </div>
                        </td>

                        {/* Estado */}
                        <td className="co-td co-td--center">
                          {ok
                            ? <span className="co-chip co-chip--ok"><Icon d={ICONS.check} size={9} /> OK</span>
                            : <span className="co-chip co-chip--err"><Icon d={ICONS.x} size={9} /> Incompleto</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Comentario opcional */}
        <div className="co-card">
          <div className="co-card__head">
            <div className="co-card__head-left">
              <span className="co-card__icon">💬</span>
              <span className="co-card__title">Comentario al funcionario (opcional)</span>
            </div>
          </div>
          <div style={{ padding: '16px 20px' }}>
            <textarea
              className="co-textarea"
              rows={3}
              placeholder="Describe brevemente qué corregiste o añade una aclaración para el funcionario..."
              value={comentario}
              onChange={e => setComentario(e.target.value)}
            />
          </div>
        </div>

        {/* Footer con acciones */}
        <div className="co-footer">
          <div className="co-footer__hint">
            <Icon d={ICONS.info} size={13} />
            <span>
              {incompletos.length > 0
                ? `Completa los ${incompletos.length} campo(s) en rojo antes de reenviar`
                : aprendices.length === 0
                ? 'Sin aprendices con novedad — puedes reenviar directamente'
                : `Todos los datos están completos (${aprendices.length} aprendiz${aprendices.length !== 1 ? 'ces' : ''} corregido${aprendices.length !== 1 ? 's' : ''})`
              }
            </span>
          </div>
          <div className="co-footer__actions">
            <button
              className="co-btn co-btn--ghost"
              onClick={onCancelar ? onCancelar : () => navigate(-1)}
              disabled={sending}
            >
              Cancelar
            </button>
            <button
              className="co-btn co-btn--primary"
              onClick={handleReenviar}
              disabled={incompletos.length > 0 || sending}
            >
              {sending
                ? <><Spinner /> Enviando...</>
                : <><Icon d={ICONS.send} size={12} /> Corregir y reenviar</>
              }
            </button>
          </div>
        </div>

      </div>
    </>
  );
};

// ─── Estilos ─────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');
  @keyframes spin  { to { transform: rotate(360deg); } }
  @keyframes slide { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .co-page {
    min-height: 100vh;
    background: #f4f6f9;
    font-family: 'DM Sans', sans-serif;
    color: #1e293b;
    padding: 28px 32px 64px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    max-width: 1120px;
    margin: 0 auto;
    animation: slide .25s ease;
  }

  /* ── Breadcrumb ── */
  .co-breadcrumb {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; color: #94a3b8;
  }
  .co-breadcrumb__sep { opacity: .5; }

  /* ── Hero ── */
  .co-hero__title { font-size: 1.65rem; font-weight: 700; color: #0f172a; margin-bottom: 5px; }
  .co-hero__sub   { font-size: 13px; color: #64748b; line-height: 1.6; }

  /* ── Flujo visual ── */
  .co-flujo {
    display: flex; align-items: center; gap: 0;
    background: #fff; border: 1px solid #e2e8f0;
    border-radius: 12px; padding: 14px 20px;
  }
  .co-flujo__step  { display: flex; align-items: center; gap: 7px; }
  .co-flujo__dot   { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; transition: all .3s; }
  .co-flujo__label { font-size: 12px; white-space: nowrap; }
  .co-flujo__line  { flex: 1; height: 2px; background: #e2e8f0; margin: 0 10px; min-width: 24px; }

  /* ── Banner ── */
  .co-banner {
    display: flex; gap: 14px; align-items: flex-start;
    background: #fff5f5; border: 1px solid #fecaca;
    border-left: 4px solid #ef4444; border-radius: 12px; padding: 18px 20px;
  }
  .co-banner__icon {
    width: 34px; height: 34px; flex-shrink: 0;
    background: #fee2e2; border-radius: 9px;
    display: flex; align-items: center; justify-content: center; color: #ef4444;
  }
  .co-banner__content { flex: 1; min-width: 0; }
  .co-banner__tag {
    font-size: 10px; font-weight: 700; color: #dc2626;
    text-transform: uppercase; letter-spacing: .08em; margin-bottom: 6px;
  }
  .co-banner__quote { font-size: 14px; color: #374151; margin-bottom: 10px; line-height: 1.5; }
  .co-banner__meta  { display: flex; align-items: center; gap: 8px; }
  .co-banner__chip {
    display: inline-block; background: #fee2e2; color: #dc2626;
    border: 1px solid #fca5a5; border-radius: 6px;
    font-size: 11px; font-weight: 700; padding: 2px 8px;
    font-family: monospace;
  }

  /* ── Card ── */
  .co-card {
    background: #fff; border: 1px solid #e2e8f0;
    border-radius: 14px; overflow: hidden;
  }
  .co-card__head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 13px 20px; border-bottom: 1px solid #f1f5f9;
    background: #fafbfc; flex-wrap: wrap; gap: 10px;
  }
  .co-card__head-left { display: flex; align-items: center; gap: 10px; }
  .co-card__icon  { font-size: 16px; }
  .co-card__title { font-size: 13px; font-weight: 600; color: #1e293b; }

  /* ── Badge ── */
  .co-badge {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 11px; font-weight: 600;
    padding: 3px 10px; border-radius: 20px; border: 1px solid transparent;
  }
  .co-badge--warn { background: #fffbeb; color: #b45309; border-color: #fde68a; }
  .co-badge--ok   { background: #f0fdf4; color: #16a34a; border-color: #bbf7d0; }

  /* ── Form grid ── */
  .co-form-grid { display: grid; grid-template-columns: 1fr 1fr; }
  .co-field {
    padding: 16px 20px;
    border-right: 1px solid #f1f5f9;
    border-bottom: 1px solid #f1f5f9;
  }
  .co-field:nth-child(even)      { border-right: none; }
  .co-field:nth-last-child(-n+2) { border-bottom: none; }
  .co-field__label {
    display: block; font-size: 10px; font-weight: 700;
    color: #94a3b8; text-transform: uppercase;
    letter-spacing: .06em; margin-bottom: 7px;
  }
  .co-field__input {
    width: 100%; background: #f8fafc; border: 1px solid #e2e8f0;
    border-radius: 8px; padding: 9px 13px;
    font-size: 13px; font-family: inherit; color: #1e293b;
    transition: border-color .18s;
  }
  .co-field__input:focus { border-color: #1a7a5e; outline: none; }

  /* ── Empty ── */
  .co-empty {
    padding: 48px 20px; text-align: center;
    display: flex; flex-direction: column; align-items: center;
  }

  /* ── Tabla ── */
  .co-table-wrap { overflow-x: auto; }
  .co-table { width: 100%; border-collapse: collapse; min-width: 860px; }
  .co-th {
    padding: 10px 11px; font-size: 10px; font-weight: 700;
    color: #94a3b8; text-transform: uppercase; letter-spacing: .05em;
    background: #fafbfc; border-bottom: 1px solid #e2e8f0; text-align: left;
  }
  .co-tr           { border-bottom: 1px solid #f1f5f9; transition: background .15s; }
  .co-tr:hover     { background: #f8fafc; }
  .co-tr--err      { background: #fff8f8; }
  .co-tr--err:hover{ background: #fff2f2; }
  .co-td           { padding: 8px 10px; vertical-align: middle; }
  .co-td--center   { text-align: center; }

  .co-num {
    display: inline-flex; align-items: center; justify-content: center;
    width: 22px; height: 22px; border-radius: 6px;
    background: #f1f5f9; color: #64748b; font-size: 11px; font-weight: 700;
  }

  .co-input {
    width: 100%; background: #f8fafc; border: 1px solid #e2e8f0;
    border-radius: 7px; padding: 7px 10px;
    font-size: 12px; font-family: inherit; color: #1e293b;
    transition: border-color .18s;
  }
  .co-input--err   { border-color: #fca5a5; background: #fff8f8; }
  .co-input:focus  { border-color: #1a7a5e; outline: none; box-shadow: 0 0 0 3px #1a7a5e18; }

  .co-observacion {
    background: #fef2f2; border: 1px solid #fecaca;
    border-radius: 7px; padding: 6px 9px;
    font-size: 11px; color: #dc2626; line-height: 1.4;
  }

  .co-chip {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 10px; font-weight: 700;
    padding: 3px 9px; border-radius: 20px;
  }
  .co-chip--ok  { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
  .co-chip--err { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }

  /* ── Textarea ── */
  .co-textarea {
    width: 100%; background: #f8fafc; border: 1px solid #e2e8f0;
    border-radius: 9px; padding: 11px 14px;
    font-size: 13px; font-family: inherit; color: #1e293b;
    resize: vertical; outline: none; transition: border-color .18s;
  }
  .co-textarea:focus { border-color: #1a7a5e; box-shadow: 0 0 0 3px #1a7a5e18; }
  .co-textarea::placeholder { color: #cbd5e1; }

  /* ── Footer ── */
  .co-footer {
    display: flex; align-items: center; justify-content: space-between;
    background: #fff; border: 1px solid #e2e8f0;
    border-radius: 12px; padding: 14px 20px; flex-wrap: wrap; gap: 12px;
    position: sticky; bottom: 16px;
    box-shadow: 0 4px 24px rgba(0,0,0,.08);
  }
  .co-footer__hint {
    display: flex; align-items: center; gap: 7px;
    font-size: 12px; color: #94a3b8;
  }
  .co-footer__actions { display: flex; gap: 10px; }

  /* ── Botones ── */
  .co-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 9px 20px; border-radius: 9px;
    font-family: inherit; font-size: 13px; font-weight: 600;
    cursor: pointer; border: none; transition: all .18s;
  }
  .co-btn--ghost {
    background: transparent; color: #64748b;
    border: 1px solid #e2e8f0;
  }
  .co-btn--ghost:hover:not(:disabled) { background: #f1f5f9; }
  .co-btn--primary {
    background: linear-gradient(135deg, #1a7a5e, #0d5240);
    color: #fff; box-shadow: 0 2px 8px rgba(26,122,94,.3);
  }
  .co-btn--primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #15694f, #0a3d2e);
    box-shadow: 0 4px 14px rgba(26,122,94,.4);
    transform: translateY(-1px);
  }
  .co-btn:disabled { opacity: .45; cursor: not-allowed; transform: none !important; }

  /* ── Spinner ── */
  .co-spin {
    width: 13px; height: 13px;
    border: 2px solid rgba(255,255,255,.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin .6s linear infinite;
    display: inline-block;
  }

  @media (max-width: 640px) {
    .co-page      { padding: 18px 14px 48px; }
    .co-form-grid { grid-template-columns: 1fr; }
    .co-flujo     { flex-wrap: wrap; gap: 8px; }
    .co-flujo__line { display: none; }
    .co-footer    { flex-direction: column; align-items: stretch; }
    .co-footer__actions { justify-content: flex-end; }
  }
`;

export default CorregirOferta;