import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

const FormularioInscripcion = () => {
  const { codigo } = useParams();
  const [loading, setLoading] = useState(false);
  const [loadingDatos, setLoadingDatos] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [caracterizaciones, setCaracterizaciones] = useState([]);
  const [oferta, setOferta] = useState(null);
  const [fileName, setFileName] = useState('');

  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    tipo_documento: '',
    numero_documento: '',
    caracterizacion: '',
    telefono: '',
    correo: '',
    pdf_cedula: null
  });

  const descargarPDF = async (ofertaId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/ofertas/${ofertaId}/pdf`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` }
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ficha-${ofertaId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error descargando PDF:', error);
    }
  };

  useEffect(() => {
    cargarDatosIniciales();
    cargarInfoOferta();
  }, [codigo]);

  const cargarDatosIniciales = async () => {
    try {
      const [tiposDocRes, caracterizacionesRes] = await Promise.all([
        api.get('/tipos-documento'),
        api.get('/caracterizaciones')
      ]);
      setTiposDocumento(Array.isArray(tiposDocRes.data.data) ? tiposDocRes.data.data : []);
      setCaracterizaciones(Array.isArray(caracterizacionesRes.data.data) ? caracterizacionesRes.data.data : []);
    } catch (error) {
      setError('Error al cargar datos del formulario');
    }
  };

  const cargarInfoOferta = async () => {
    try {
      const response = await api.get(`/ofertas/link/${codigo}`);
      setOferta(response.data.data);
    } catch (error) {
      setError('Link de inscripción no válido');
    } finally {
      setLoadingDatos(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData({ ...formData, pdf_cedula: file });
    setFileName(file ? file.name : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (!formData.nombres)         throw new Error('Los nombres son obligatorios');
      if (!formData.apellidos)       throw new Error('Los apellidos son obligatorios');
      if (!formData.tipo_documento)  throw new Error('Seleccione un tipo de documento');
      if (!formData.numero_documento) throw new Error('El número de documento es obligatorio');
      if (!formData.caracterizacion) throw new Error('Seleccione una caracterización');
      if (!formData.telefono)        throw new Error('El teléfono es obligatorio');
      if (!formData.correo)          throw new Error('El correo es obligatorio');
      if (!formData.pdf_cedula)      throw new Error('La cédula escaneada es obligatoria');

      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => fd.append(k, v));

      await api.post(`/inscripciones/oferta/${codigo}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess('¡Inscripción exitosa! Serás contactado pronto.');
      setFormData({ nombres:'', apellidos:'', tipo_documento:'', numero_documento:'', caracterizacion:'', telefono:'', correo:'', pdf_cedula: null });
      setFileName('');
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Loading state ── */
  if (loadingDatos) {
    return (
      <>
        <style>{css}</style>
        <div className="fi-page">
          <div className="fi-loading">
            <div className="fi-spinner" />
            <p>Cargando información de la oferta...</p>
          </div>
        </div>
      </>
    );
  }

  /* ── Invalid link ── */
  if (!oferta) {
    return (
      <>
        <style>{css}</style>
        <div className="fi-page">
          <div className="fi-invalid">
            <div className="fi-invalid__icon">
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
              </svg>
            </div>
            <h2 className="fi-invalid__title">Link no válido</h2>
            <p className="fi-invalid__desc">Este enlace de inscripción no existe o ha expirado.</p>
          </div>
        </div>
      </>
    );
  }

  const pct = oferta.cupo_maximo
    ? Math.round(((oferta.cupo_maximo - oferta.cupos_disponibles) / oferta.cupo_maximo) * 100)
    : 0;

  return (
    <>
      <style>{css}</style>
      <div className="fi-page">

        {/* ── Top brand bar ── */}
        <header className="fi-topbar">
          <div className="fi-topbar__brand">
            <div className="fi-topbar__mark">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect width="16" height="16" rx="4" fill="white" fillOpacity=".15"/>
                <path d="M3.5 8C3.5 5.515 5.515 3.5 8 3.5v0c2.485 0 4.5 2.015 4.5 4.5V12.5H8C5.515 12.5 3.5 10.485 3.5 8v0z" fill="white"/>
              </svg>
            </div>
            <span className="fi-topbar__name">Gestionytics</span>
            <span className="fi-topbar__sep">·</span>
            <span className="fi-topbar__sub">SENA Portal</span>
          </div>
          <img
            src="https://www.sena.edu.co/Style%20Library/alayout/images/logoSena.png"
            alt="SENA"
            className="fi-topbar__logo"
          />
        </header>

        <div className="fi-layout">

          {/* ── Left: oferta card ── */}
          <aside className="fi-aside">

            <div className="fi-aside__badge">
              <span className="fi-badge__dot" />
              Inscripción abierta
            </div>

            <h2 className="fi-aside__program">
              {oferta.programa_formacion?.nombre_programa}
            </h2>

            <div className="fi-aside__code">
              <span className="fi-code-label">Código</span>
              <span className="fi-code-value">{oferta.programa_formacion?.codigo}</span>
            </div>

            <div className="fi-aside__divider" />

            <div className="fi-meta-list">
              <MetaRow icon={<IcCalendar />} label="Inicio" value={new Date(oferta.fechas?.inicio).toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' })} />
              <MetaRow icon={<IcCalendar />} label="Fin"    value={new Date(oferta.fechas?.fin).toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' })} />
              <MetaRow icon={<IcPin />}      label="Municipio" value={oferta.ubicacion?.municipio?.nombre} />
              <MetaRow icon={<IcBuilding />} label="Empresa"   value={oferta.empresa_solicitante?.nombre} />
            </div>

            <div className="fi-aside__divider" />

            {/* Cupos bar */}
            <div className="fi-cupos">
              <div className="fi-cupos__labels">
                <span>Cupos disponibles</span>
                <strong>{oferta.cupos_disponibles} / {oferta.cupo_maximo}</strong>
              </div>
              <div className="fi-cupos__track">
                <div className="fi-cupos__fill" style={{ width: `${pct}%` }} />
              </div>
            </div>

            <div className={`fi-aside__tag ${oferta.es_campesena ? 'fi-aside__tag--campesena' : 'fi-aside__tag--regular'}`}>
              {oferta.es_campesena ? '🌾 Oferta Campesena' : '🌿 Oferta Regular'}
            </div>

          </aside>

          {/* ── Right: form ── */}
          <main className="fi-main">
            <div className="fi-form-header">
              <h1 className="fi-form-title">Formulario de Inscripción</h1>
              <p className="fi-form-sub">Completa todos los campos para registrar tu solicitud.</p>
            </div>

            {error   && <Alert type="error"   text={error}   onClose={() => setError('')} />}
            {success && <Alert type="success" text={success} />}

            <form onSubmit={handleSubmit} className="fi-form">

              <FieldRow>
                <Field label="Nombres" required>
                  <input className="fi-input" type="text" name="nombres" value={formData.nombres}
                    onChange={handleChange} placeholder="Juan Carlos" required />
                </Field>
                <Field label="Apellidos" required>
                  <input className="fi-input" type="text" name="apellidos" value={formData.apellidos}
                    onChange={handleChange} placeholder="Pérez González" required />
                </Field>
              </FieldRow>

              <FieldRow>
                <Field label="Tipo de Documento" required>
                  <select className="fi-select" name="tipo_documento" value={formData.tipo_documento}
                    onChange={handleChange} required>
                    <option value="">Seleccione...</option>
                    {tiposDocumento.map(t => (
                      <option key={t._id} value={t._id}>{t.nombre}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Número de Documento" required>
                  <input className="fi-input" type="text" name="numero_documento" value={formData.numero_documento}
                    onChange={handleChange} placeholder="123456789" required />
                </Field>
              </FieldRow>

              <Field label="Caracterización" required>
                <select className="fi-select" name="caracterizacion" value={formData.caracterizacion}
                  onChange={handleChange} required>
                  <option value="">Seleccione...</option>
                  {caracterizaciones.map(c => (
                    <option key={c._id} value={c._id}>{c.tipo_caracterizacion}</option>
                  ))}
                </select>
              </Field>

              <FieldRow>
                <Field label="Teléfono" required>
                  <input className="fi-input" type="tel" name="telefono" value={formData.telefono}
                    onChange={handleChange} placeholder="3001234567" required />
                </Field>
                <Field label="Correo Electrónico" required>
                  <input className="fi-input" type="email" name="correo" value={formData.correo}
                    onChange={handleChange} placeholder="correo@ejemplo.com" required />
                </Field>
              </FieldRow>

              {/* File upload */}
              <Field label="Cédula escaneada (PDF)" required>
                <label className="fi-file-drop">
                  <input type="file" name="pdf_cedula" accept=".pdf"
                    onChange={handleFileChange} style={{ display: 'none' }} required />
                  <div className="fi-file-drop__icon">
                    <IcUpload />
                  </div>
                  {fileName ? (
                    <div>
                      <p className="fi-file-drop__selected">{fileName}</p>
                      <p className="fi-file-drop__hint">Haz clic para cambiar el archivo</p>
                    </div>
                  ) : (
                    <div>
                      <p className="fi-file-drop__title">Seleccionar PDF</p>
                      <p className="fi-file-drop__hint">Solo archivos .pdf</p>
                    </div>
                  )}
                </label>
              </Field>

              <button type="submit" className={`fi-submit ${loading ? 'fi-submit--loading' : ''}`} disabled={loading}>
                {loading ? (
                  <><span className="fi-btn-spinner" /> Procesando...</>
                ) : (
                  <><IcCheck /> Inscribirme</>
                )}
              </button>

            </form>
          </main>
        </div>

        <footer className="fi-footer">
          © 2025 SENA · Servicio Nacional de Aprendizaje
        </footer>
      </div>
    </>
  );
};

/* ── Helper components ── */
const FieldRow = ({ children }) => <div className="fi-field-row">{children}</div>;

const Field = ({ label, required, children }) => (
  <div className="fi-field">
    <label className="fi-label">{label}{required && <span className="fi-required">*</span>}</label>
    {children}
  </div>
);

const Alert = ({ type, text, onClose }) => (
  <div className={`fi-alert fi-alert--${type}`}>
    {type === 'error' ? <IcError /> : <IcCheckCircle />}
    <span>{text}</span>
    {onClose && <button className="fi-alert__close" onClick={onClose}>×</button>}
  </div>
);

const MetaRow = ({ icon, label, value }) => (
  <div className="fi-meta-row">
    <span className="fi-meta-row__icon">{icon}</span>
    <div>
      <span className="fi-meta-row__label">{label}</span>
      <span className="fi-meta-row__value">{value || '—'}</span>
    </div>
  </div>
);

/* ── Icons ── */
const IcCalendar  = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
const IcPin       = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 21C12 21 5 13.5 5 8.5a7 7 0 1114 0C19 13.5 12 21 12 21z"/><circle cx="12" cy="8.5" r="2.5"/></svg>;
const IcBuilding  = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16M5 21h14M9 7h1m-1 4h1m4-4h1m-1 4h1M9 15h6"/></svg>;
const IcUpload    = () => <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M16 8l-4-4-4 4M12 4v12"/></svg>;
const IcCheck     = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>;
const IcCheckCircle = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
const IcError     = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>;

/* ── Styles ── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .fi-page {
    min-height: 100vh;
    background: #f0f2f5;
    font-family: 'DM Sans', sans-serif;
    display: flex;
    flex-direction: column;
  }

  /* ── Topbar ── */
  .fi-topbar {
    background: #0a3d2e;
    height: 52px;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 32px;
    flex-shrink: 0;
  }
  .fi-topbar__brand {
    display: flex; align-items: center; gap: 10px;
  }
  .fi-topbar__mark {
    width: 28px; height: 28px;
    background: rgba(255,255,255,0.12);
    border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
  }
  .fi-topbar__name {
    font-size: 14px; font-weight: 700; color: white;
  }
  .fi-topbar__sep { color: rgba(255,255,255,0.25); font-size: 14px; }
  .fi-topbar__sub {
    font-size: 12px; color: rgba(255,255,255,0.45); letter-spacing: .04em;
  }
  .fi-topbar__logo {
    height: 26px; width: auto;
    filter: brightness(0) invert(1) opacity(.6);
  }

  /* ── Layout ── */
  .fi-layout {
    flex: 1;
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 24px;
    max-width: 960px;
    width: 100%;
    margin: 28px auto;
    padding: 0 24px;
    align-items: start;
  }

  @media (max-width: 700px) {
    .fi-layout { grid-template-columns: 1fr; }
  }

  /* ── Aside ── */
  .fi-aside {
    background: white;
    border: 1px solid #e8eaed;
    border-radius: 14px;
    padding: 24px;
    position: sticky;
    top: 24px;
  }
  .fi-aside__badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: #ecfdf5; border: 1px solid #bbf7d0;
    border-radius: 20px; padding: 4px 11px;
    font-size: 11px; font-weight: 600; color: #065f46;
    letter-spacing: .05em;
    margin-bottom: 14px;
  }
  .fi-badge__dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #16a34a;
  }
  .fi-aside__program {
    font-size: 15px; font-weight: 700;
    color: #0f172a; line-height: 1.35;
    margin-bottom: 12px;
  }
  .fi-aside__code {
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 16px;
  }
  .fi-code-label {
    font-size: 10px; font-weight: 600;
    color: #94a3b8; text-transform: uppercase; letter-spacing: .07em;
  }
  .fi-code-value {
    font-family: 'DM Mono', monospace;
    font-size: 12px; font-weight: 500;
    background: #f1f5f9; color: #475569;
    padding: 2px 8px; border-radius: 5px;
  }
  .fi-aside__divider {
    height: 1px; background: #f1f5f9; margin: 16px 0;
  }
  .fi-meta-list { display: flex; flex-direction: column; gap: 10px; }
  .fi-meta-row {
    display: flex; align-items: flex-start; gap: 9px;
  }
  .fi-meta-row__icon { color: #94a3b8; flex-shrink: 0; margin-top: 2px; }
  .fi-meta-row__label {
    display: block; font-size: 10px; font-weight: 600;
    color: #94a3b8; text-transform: uppercase; letter-spacing: .06em;
  }
  .fi-meta-row__value {
    display: block; font-size: 13px; font-weight: 500; color: #334155;
  }
  .fi-cupos { margin-bottom: 16px; }
  .fi-cupos__labels {
    display: flex; justify-content: space-between;
    font-size: 12px; color: #64748b; margin-bottom: 6px;
  }
  .fi-cupos__track {
    height: 6px; background: #f1f5f9; border-radius: 99px; overflow: hidden;
  }
  .fi-cupos__fill {
    height: 100%;
    background: linear-gradient(90deg, #0a3d2e, #16a34a);
    border-radius: 99px;
    transition: width .6s ease;
    min-width: 4px;
  }
  .fi-aside__tag {
    display: inline-block;
    font-size: 12px; font-weight: 600;
    padding: 5px 12px; border-radius: 20px;
  }
  .fi-aside__tag--regular   { background: #f0fdf4; color: #166534; }
  .fi-aside__tag--campesena { background: #fffbeb; color: #92400e; }

  /* ── Form card ── */
  .fi-main {
    background: white;
    border: 1px solid #e8eaed;
    border-radius: 14px;
    padding: 28px 28px 32px;
  }
  .fi-form-header { margin-bottom: 22px; }
  .fi-form-title {
    font-size: 20px; font-weight: 700; color: #0f172a;
    margin-bottom: 5px;
  }
  .fi-form-sub { font-size: 13.5px; color: #64748b; }

  /* ── Alerts ── */
  .fi-alert {
    display: flex; align-items: center; gap: 9px;
    padding: 10px 13px; border-radius: 8px;
    font-size: 13px; font-weight: 500;
    margin-bottom: 18px;
    animation: fadeIn .25s ease;
  }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
  .fi-alert--error   { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
  .fi-alert--success { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
  .fi-alert__close {
    margin-left: auto; background: none; border: none;
    color: inherit; cursor: pointer; font-size: 18px; line-height: 1;
  }

  /* ── Form ── */
  .fi-form { display: flex; flex-direction: column; gap: 16px; }
  .fi-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  @media (max-width: 520px) { .fi-field-row { grid-template-columns: 1fr; } }

  .fi-field { display: flex; flex-direction: column; gap: 5px; }
  .fi-label {
    font-size: 12.5px; font-weight: 600;
    color: #374151; display: flex; align-items: center; gap: 3px;
  }
  .fi-required { color: #ef4444; font-size: 13px; }

  .fi-input, .fi-select {
    width: 100%;
    padding: 9px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13.5px;
    color: #0f172a;
    background: white;
    outline: none;
    transition: border-color .18s, box-shadow .18s;
    appearance: none;
  }
  .fi-input::placeholder { color: #94a3b8; }
  .fi-input:focus, .fi-select:focus {
    border-color: #0a3d2e;
    box-shadow: 0 0 0 3px rgba(10,61,46,0.08);
  }
  .fi-select {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 34px;
  }

  /* ── File upload ── */
  .fi-file-drop {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 16px;
    border: 1.5px dashed #cbd5e1;
    border-radius: 10px;
    cursor: pointer;
    background: #fafbfc;
    transition: border-color .18s, background .18s;
  }
  .fi-file-drop:hover { border-color: #0a3d2e; background: #f0fdf4; }
  .fi-file-drop__icon { color: #94a3b8; flex-shrink: 0; }
  .fi-file-drop:hover .fi-file-drop__icon { color: #0a3d2e; }
  .fi-file-drop__title { font-size: 13.5px; font-weight: 600; color: #334155; }
  .fi-file-drop__selected { font-size: 13px; font-weight: 600; color: #0a3d2e; font-family: 'DM Mono', monospace; }
  .fi-file-drop__hint { font-size: 11.5px; color: #94a3b8; margin-top: 2px; }

  /* ── Submit ── */
  .fi-submit {
    margin-top: 6px;
    width: 100%;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 12px 20px;
    background: #0a3d2e;
    color: white;
    border: none; border-radius: 9px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 600;
    cursor: pointer;
    transition: background .2s, transform .15s;
  }
  .fi-submit:hover:not(:disabled) { background: #0d5240; transform: translateY(-1px); }
  .fi-submit:active:not(:disabled) { transform: none; }
  .fi-submit--loading { opacity: .7; cursor: not-allowed; }
  .fi-btn-spinner {
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin .7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Loading ── */
  .fi-loading {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 14px;
    color: #64748b; font-size: 14px;
  }
  .fi-spinner {
    width: 34px; height: 34px;
    border: 3px solid #e2e8f0;
    border-top-color: #0a3d2e;
    border-radius: 50%;
    animation: spin .8s linear infinite;
  }

  /* ── Invalid ── */
  .fi-invalid {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 12px;
    text-align: center; padding: 60px 20px;
  }
  .fi-invalid__icon {
    width: 60px; height: 60px;
    background: #fef2f2; border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    color: #ef4444;
  }
  .fi-invalid__title { font-size: 18px; font-weight: 700; color: #0f172a; }
  .fi-invalid__desc  { font-size: 14px; color: #64748b; }

  /* ── Footer ── */
  .fi-footer {
    text-align: center;
    padding: 20px;
    font-size: 11.5px; color: #cbd5e1;
    letter-spacing: .02em;
  }
`;

export default FormularioInscripcion;