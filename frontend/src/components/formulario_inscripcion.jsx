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
      if (!formData.nombres)          throw new Error('Los nombres son obligatorios');
      if (!formData.apellidos)        throw new Error('Los apellidos son obligatorios');
      if (!formData.tipo_documento)   throw new Error('Seleccione un tipo de documento');
      if (!formData.numero_documento) throw new Error('El número de documento es obligatorio');
      if (!formData.caracterizacion)  throw new Error('Seleccione una caracterización');
      if (!formData.telefono)         throw new Error('El teléfono es obligatorio');
      if (!formData.correo)           throw new Error('El correo es obligatorio');
      if (!formData.pdf_cedula)       throw new Error('La cédula escaneada es obligatoria');

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

  if (loadingDatos) {
    return (
      <div style={s.page}>
        <style>{keyframes}</style>
        <div style={s.loadingWrap}>
          <div style={s.spinner} />
          <p style={s.loadingText}>Cargando información...</p>
        </div>
      </div>
    );
  }

  if (!oferta) {
    return (
      <div style={s.page}>
        <style>{keyframes}</style>
        <div style={s.invalidWrap}>
          <div style={s.invalidIcon}>⚠</div>
          <h2 style={s.invalidTitle}>Link no válido</h2>
          <p style={s.invalidDesc}>Este enlace de inscripción no existe o ha expirado.</p>
        </div>
      </div>
    );
  }

  const fInicio = oferta.fechas?.inicio
    ? new Date(oferta.fechas.inicio).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
  const fFin = oferta.fechas?.fin
    ? new Date(oferta.fechas.fin).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div style={s.page}>
      <style>{keyframes}</style>

      {/* Top bar */}
      <div style={s.topbar}>
        <div style={s.topbarBrand}>
          <div style={s.topbarMark}>
            <span style={s.topbarMarkText}>G</span>
          </div>
          <span style={s.topbarName}>GestionTICS</span>
          <span style={s.topbarSep}>·</span>
          <span style={s.topbarSub}>SENA</span>
        </div>
        <img
          src="https://www.sena.edu.co/Style%20Library/alayout/images/logoSena.png"
          alt="SENA"
          style={s.topbarLogo}
        />
      </div>

      <div style={s.body}>

        {/* Hero card */}
        <div style={s.heroCard}>
          <div style={s.heroStripe} />
          <div style={s.heroContent}>
            <div style={s.heroLeft}>
              <span style={s.heroBadge}>✓ Inscripción abierta</span>
              <h1 style={s.heroTitle}>{oferta.programa_formacion?.nombre_programa}</h1>
              <div style={s.heroPills}>
                <span style={s.pill}>📅 {fInicio} – {fFin}</span>
                <span style={s.pill}>📍 {oferta.ubicacion?.municipio?.nombre || '—'}</span>
                <span style={s.pill}>🏢 {oferta.empresa_solicitante?.nombre || '—'}</span>
                <span style={s.pill}>👥 {oferta.cupo_maximo} cupos</span>
                {oferta.es_campesena
                  ? <span style={{ ...s.pill, ...s.pillCamp }}>🌾 Campesena</span>
                  : <span style={{ ...s.pill, ...s.pillReg }}>🌿 Regular</span>}
              </div>
            </div>
            <div style={s.heroRight}>
              <span style={s.heroCodeLabel}>Código</span>
              <span style={s.heroCode}>{oferta.programa_formacion?.codigo}</span>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div style={s.alertError}>
            <span>⚠ {error}</span>
            <button style={s.alertClose} onClick={() => setError('')}>×</button>
          </div>
        )}
        {success && (
          <div style={s.alertSuccess}>
            <span>✓ {success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={s.form}>

          {/* Sección 1 */}
          <div style={s.card}>
            <div style={s.sectionHeader}>
              <div style={s.sectionNumBox}>01</div>
              <span style={s.sectionTitle}>Datos personales</span>
            </div>
            <div style={s.divider} />

            <div style={s.grid2}>
              <div style={s.field}>
                <label style={s.label}>Nombres <span style={s.req}>*</span></label>
                <input style={s.input} type="text" name="nombres"
                  value={formData.nombres} onChange={handleChange}
                  placeholder="Juan Carlos" required />
              </div>
              <div style={s.field}>
                <label style={s.label}>Apellidos <span style={s.req}>*</span></label>
                <input style={s.input} type="text" name="apellidos"
                  value={formData.apellidos} onChange={handleChange}
                  placeholder="Pérez González" required />
              </div>
            </div>

            <div style={s.grid2}>
              <div style={s.field}>
                <label style={s.label}>Tipo de documento <span style={s.req}>*</span></label>
                <div style={s.selectWrap}>
                  <select style={s.select} name="tipo_documento"
                    value={formData.tipo_documento} onChange={handleChange} required>
                    <option value="">Seleccione...</option>
                    {tiposDocumento.map(t => (
                      <option key={t._id} value={t._id}>{t.nombre}</option>
                    ))}
                  </select>
                  <span style={s.selectArrow}>▾</span>
                </div>
              </div>
              <div style={s.field}>
                <label style={s.label}>Número de documento <span style={s.req}>*</span></label>
                <input style={s.input} type="text" name="numero_documento"
                  value={formData.numero_documento} onChange={handleChange}
                  placeholder="1234567890" required />
              </div>
            </div>
          </div>

          {/* Sección 2 */}
          <div style={s.card}>
            <div style={s.sectionHeader}>
              <div style={s.sectionNumBox}>02</div>
              <span style={s.sectionTitle}>Contacto y caracterización</span>
            </div>
            <div style={s.divider} />

            <div style={{ ...s.field, marginBottom: '14px' }}>
              <label style={s.label}>Caracterización <span style={s.req}>*</span></label>
              <div style={s.selectWrap}>
                <select style={s.select} name="caracterizacion"
                  value={formData.caracterizacion} onChange={handleChange} required>
                  <option value="">Seleccione...</option>
                  {caracterizaciones.map(c => (
                    <option key={c._id} value={c._id}>{c.tipo_caracterizacion}</option>
                  ))}
                </select>
                <span style={s.selectArrow}>▾</span>
              </div>
            </div>

            <div style={s.grid2}>
              <div style={s.field}>
                <label style={s.label}>Teléfono <span style={s.req}>*</span></label>
                <input style={s.input} type="tel" name="telefono"
                  value={formData.telefono} onChange={handleChange}
                  placeholder="3001234567" required />
              </div>
              <div style={s.field}>
                <label style={s.label}>Correo electrónico <span style={s.req}>*</span></label>
                <input style={s.input} type="email" name="correo"
                  value={formData.correo} onChange={handleChange}
                  placeholder="correo@ejemplo.com" required />
              </div>
            </div>
          </div>

          {/* Sección 3 */}
          <div style={s.card}>
            <div style={s.sectionHeader}>
              <div style={s.sectionNumBox}>03</div>
              <span style={s.sectionTitle}>Documento adjunto</span>
            </div>
            <div style={s.divider} />

            <label style={s.fileZone}>
              <input type="file" name="pdf_cedula" accept=".pdf"
                onChange={handleFileChange} style={{ display: 'none' }} required />
              <div style={s.fileIconBox}>
                <span style={s.fileIconText}>PDF</span>
              </div>
              <div>
                <p style={s.fileTitle}>{fileName || 'Subir cédula escaneada'}</p>
                <p style={s.fileHint}>
                  {fileName ? 'Clic para cambiar el archivo' : 'Solo archivos .pdf · máx. 5 MB'}
                </p>
              </div>
            </label>
          </div>

          {/* Submit */}
          <div style={s.formFooter}>
            <span style={s.footerHint}>🔒 Tus datos están protegidos</span>
            <button
              type="submit"
              style={loading ? { ...s.btnPrimary, ...s.btnDisabled } : s.btnPrimary}
              disabled={loading}
            >
              {loading ? 'Procesando...' : 'Enviar inscripción →'}
            </button>
          </div>

        </form>

        <footer style={s.footer}>
          © 2025 SENA · Servicio Nacional de Aprendizaje
        </footer>
      </div>
    </div>
  );
};

const keyframes = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity:0; transform:translateY(-5px); } to { opacity:1; transform:none; } }
`;

/* Paleta SENA: blanco, verde (#39a900) y verde claro (#e8f5e0) */
const VERDE      = '#39a900';
const VERDE_OSC  = '#2d8600';
const VERDE_LITE = '#e8f5e0';
const VERDE_MID  = '#c5e8a0';
const GRIS_TEXT  = '#3a3a3a';
const GRIS_MUTED = '#7a7a7a';
const BORDE      = '#d6ecc4';

const s = {
  page: {
    minHeight: '100vh',
    background: '#f4f9f0',
    fontFamily: "'Segoe UI', 'DM Sans', sans-serif",
    display: 'flex',
    flexDirection: 'column'
  },
  /* Topbar */
  topbar: {
    background: VERDE,
    height: '52px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 28px',
    flexShrink: 0
  },
  topbarBrand: { display: 'flex', alignItems: 'center', gap: '10px' },
  topbarMark: {
    width: '28px', height: '28px', borderRadius: '7px',
    background: 'rgba(255,255,255,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  topbarMarkText: { fontSize: '13px', fontWeight: 700, color: 'white' },
  topbarName: { fontSize: '14px', fontWeight: 700, color: 'white' },
  topbarSep: { color: 'rgba(255,255,255,0.35)', fontSize: '14px' },
  topbarSub: { fontSize: '12px', color: 'rgba(255,255,255,0.6)' },
  topbarLogo: {
    height: '26px', width: 'auto',
    filter: 'brightness(0) invert(1) opacity(0.85)'
  },
  /* Body */
  body: {
    flex: 1,
    maxWidth: '700px',
    width: '100%',
    margin: '0 auto',
    padding: '28px 20px 48px'
  },
  /* Hero */
  heroCard: {
    background: 'white',
    border: `1px solid ${BORDE}`,
    borderRadius: '16px',
    marginBottom: '18px',
    overflow: 'hidden'
  },
  heroStripe: {
    height: '6px',
    background: `linear-gradient(90deg, ${VERDE} 0%, ${VERDE_MID} 100%)`
  },
  heroContent: {
    display: 'flex', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: '16px',
    padding: '20px 22px 18px'
  },
  heroLeft: { flex: 1 },
  heroBadge: {
    display: 'inline-block',
    background: VERDE_LITE,
    color: VERDE_OSC,
    border: `1px solid ${VERDE_MID}`,
    borderRadius: '99px',
    padding: '3px 11px',
    fontSize: '11px', fontWeight: 600,
    letterSpacing: '.04em',
    marginBottom: '10px'
  },
  heroTitle: {
    fontSize: '17px', fontWeight: 700,
    color: GRIS_TEXT, margin: '0 0 12px', lineHeight: 1.35
  },
  heroPills: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  pill: {
    display: 'inline-block',
    background: VERDE_LITE,
    color: GRIS_MUTED,
    border: `1px solid ${BORDE}`,
    borderRadius: '99px',
    padding: '3px 10px', fontSize: '11px'
  },
  pillCamp: { background: '#fff8e1', color: '#b45309', borderColor: '#fde68a' },
  pillReg:  { background: VERDE_LITE, color: VERDE_OSC, borderColor: VERDE_MID },
  heroRight: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'flex-end', gap: '4px', flexShrink: 0
  },
  heroCodeLabel: {
    fontSize: '10px', color: GRIS_MUTED,
    letterSpacing: '.08em', textTransform: 'uppercase'
  },
  heroCode: {
    fontFamily: 'monospace', fontSize: '13px', fontWeight: 600,
    color: VERDE_OSC,
    background: VERDE_LITE,
    border: `1px solid ${BORDE}`,
    padding: '4px 10px', borderRadius: '8px'
  },
  /* Alerts */
  alertError: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: '10px', padding: '10px 14px',
    fontSize: '13px', color: '#b91c1c',
    marginBottom: '14px', animation: 'fadeIn .2s ease'
  },
  alertSuccess: {
    background: VERDE_LITE, border: `1px solid ${VERDE_MID}`,
    borderRadius: '10px', padding: '10px 14px',
    fontSize: '13px', color: VERDE_OSC,
    marginBottom: '14px', animation: 'fadeIn .2s ease'
  },
  alertClose: {
    background: 'none', border: 'none',
    cursor: 'pointer', color: '#b91c1c',
    fontSize: '18px', lineHeight: 1, padding: 0
  },
  /* Form */
  form: { display: 'flex', flexDirection: 'column', gap: '14px' },
  card: {
    background: 'white',
    border: `1px solid ${BORDE}`,
    borderRadius: '14px',
    padding: '20px 22px'
  },
  sectionHeader: {
    display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px'
  },
  sectionNumBox: {
    width: '26px', height: '26px', borderRadius: '7px',
    background: VERDE_LITE,
    border: `1px solid ${VERDE_MID}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '11px', fontWeight: 700, color: VERDE_OSC,
    fontFamily: 'monospace', flexShrink: 0
  },
  sectionTitle: {
    fontSize: '14px', fontWeight: 700, color: GRIS_TEXT
  },
  divider: {
    height: '1px', background: VERDE_LITE, marginBottom: '16px'
  },
  grid2: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: '12px', marginBottom: '12px'
  },
  field: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '12px', fontWeight: 600, color: GRIS_TEXT },
  req: { color: '#ef4444' },
  input: {
    padding: '9px 13px',
    border: `1px solid ${BORDE}`,
    borderRadius: '9px',
    fontSize: '14px', color: GRIS_TEXT,
    background: '#fafffe',
    outline: 'none',
    width: '100%', boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color .15s, box-shadow .15s'
  },
  selectWrap: { position: 'relative' },
  select: {
    width: '100%',
    padding: '9px 32px 9px 13px',
    border: `1px solid ${BORDE}`,
    borderRadius: '9px',
    fontSize: '14px', color: GRIS_TEXT,
    background: '#fafffe',
    outline: 'none', appearance: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box'
  },
  selectArrow: {
    position: 'absolute', right: '11px', top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '13px', color: VERDE, pointerEvents: 'none'
  },
  /* File */
  fileZone: {
    display: 'flex', alignItems: 'center', gap: '14px',
    border: `1.5px dashed ${VERDE_MID}`,
    borderRadius: '10px', padding: '16px',
    cursor: 'pointer', background: VERDE_LITE,
    transition: 'border-color .15s, background .15s'
  },
  fileIconBox: {
    width: '42px', height: '42px', borderRadius: '9px',
    background: VERDE,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0
  },
  fileIconText: {
    fontSize: '10px', fontWeight: 800, color: 'white', letterSpacing: '.06em'
  },
  fileTitle: { fontSize: '13px', fontWeight: 600, color: GRIS_TEXT, margin: 0 },
  fileHint: { fontSize: '11px', color: GRIS_MUTED, margin: '3px 0 0' },
  /* Footer del form */
  formFooter: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: '12px',
    marginTop: '4px', flexWrap: 'wrap'
  },
  footerHint: { fontSize: '12px', color: GRIS_MUTED },
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    padding: '11px 28px',
    background: VERDE, color: 'white',
    border: 'none', borderRadius: '10px',
    fontSize: '14px', fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
    letterSpacing: '.01em'
  },
  btnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  /* Loading */
  loadingWrap: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: '14px', minHeight: '60vh'
  },
  spinner: {
    width: '30px', height: '30px',
    border: `2.5px solid ${VERDE_MID}`,
    borderTopColor: VERDE,
    borderRadius: '50%',
    animation: 'spin .7s linear infinite'
  },
  loadingText: { fontSize: '14px', color: GRIS_MUTED },
  /* Invalid */
  invalidWrap: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: '10px', minHeight: '60vh',
    textAlign: 'center', padding: '40px 20px'
  },
  invalidIcon: { fontSize: '36px' },
  invalidTitle: { fontSize: '18px', fontWeight: 700, color: GRIS_TEXT },
  invalidDesc: { fontSize: '14px', color: GRIS_MUTED },
  /* Footer */
  footer: {
    textAlign: 'center', padding: '24px 20px',
    fontSize: '11px', color: GRIS_MUTED
  }
};

export default FormularioInscripcion;