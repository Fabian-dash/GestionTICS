import React, { useState, useEffect } from 'react';
import api from '../services/api';

const SolicitarOferta = () => {
  const [ofertas, setOfertas] = useState([]);
  const [ofertaSeleccionada, setOfertaSeleccionada] = useState(null);
  const [coordinador, setCoordinador] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [inscritos, setInscritos] = useState([]);

  useEffect(() => {
    cargarOfertas();
    cargarCoordinador();
  }, []);

  const cargarOfertas = async () => {
    try {
      const response = await api.get('/ofertas/mis-ofertas');
      setOfertas(response.data.data || []);
    } catch (error) {
      console.error('Error cargando ofertas:', error);
      setError('Error al cargar las ofertas');
    }
  };

  const cargarCoordinador = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.coordinadorAsignado) {
        setCoordinador(user.coordinadorAsignado);
      } else {
        const response = await api.get('/usuarios/coordinador');
        setCoordinador(response.data.data);
      }
    } catch (error) {
      console.error('Error cargando coordinador:', error);
    }
  };

  const cargarInscritos = async (ofertaId) => {
    try {
      const response = await api.get(`/inscripciones/oferta/${ofertaId}`);
      setInscritos(response.data.data || []);
    } catch (error) {
      console.error('Error cargando inscritos:', error);
    }
  };

  const handleOfertaChange = async (e) => {
    const ofertaId = e.target.value;
    if (!ofertaId) {
      setOfertaSeleccionada(null);
      setInscritos([]);
      return;
    }
    const oferta = ofertas.find(o => o._id === ofertaId);
    setOfertaSeleccionada(oferta);
    await cargarInscritos(ofertaId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ofertaSeleccionada) {
      setError('Debe seleccionar una oferta');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/solicitudes/validacion', {
        oferta_id: ofertaSeleccionada._id,
        mensaje: mensaje
      });
      setSuccess('Solicitud enviada exitosamente al coordinador');
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Error enviando solicitud:', error);
      setError(error.response?.data?.message || 'Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  const documentos = [
    {
      icon: '📄',
      titulo: 'Ficha de Caracterización',
      desc: 'PDF generado automáticamente con la información de la oferta.',
      disponible: true,
      estado: 'Disponible',
    },
    {
      icon: '📋',
      titulo: 'Carta de Presentación',
      desc: 'Documento PDF con la carta de presentación.',
      disponible: !!ofertaSeleccionada?.carta_pdf,
      estado: ofertaSeleccionada?.carta_pdf ? 'Adjunta' : 'No disponible',
    },
    {
      icon: '📊',
      titulo: 'Listado de Cédulas (Excel)',
      desc: 'Archivo Excel con el listado de aspirantes inscritos.',
      disponible: inscritos.length > 0,
      estado: inscritos.length > 0 ? `${inscritos.length} inscritos` : 'Sin inscritos',
    },
    {
      icon: '📑',
      titulo: 'Cédulas Escaneadas (PDF)',
      desc: 'Documento PDF combinado con todas las cédulas de los aspirantes.',
      disponible: inscritos.length > 0,
      estado: inscritos.length > 0 ? 'Disponible' : 'Sin cédulas',
    },
  ];

  return (
    <div style={s.root}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerInner}>
          <div style={s.headerBadge}>VALIDACIÓN</div>
          <h1 style={s.headerTitle}>Solicitar Validación de Oferta</h1>
          <p style={s.headerSub}>
            Envía los documentos de la oferta para revisión por tu coordinador asignado
          </p>
        </div>
      </div>

      <div style={s.body}>

        {/* Alertas */}
        {error && (
          <div style={s.alertError}>
            <span style={s.alertDot} />
            {error}
          </div>
        )}
        {success && (
          <div style={s.alertSuccess}>
            <span style={{ ...s.alertDot, background: '#0f6e56' }} />
            {success}
          </div>
        )}

        {/* Grid superior: Coordinador + Selección */}
        <div style={s.topGrid}>

          {/* Coordinador */}
          {coordinador && (
            <div style={s.card}>
              <div style={s.cardHeader}>
                <div style={s.cardIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <span style={s.cardTitle}>Coordinador asignado</span>
              </div>
              <div style={s.divider} />
              <div style={s.coordGrid}>
                {[
                  { label: 'Nombre', val: coordinador.nombre || 'Jose Alirio Cobo Lemos' },
                  { label: 'Email', val: coordinador.email || 'jcobo@sena.edu.co' },
                  { label: 'Teléfono', val: coordinador.telefono || '3226784590' },
                  { label: 'Identificación', val: coordinador.identificacion || '10671330' },
                ].map(({ label, val }) => (
                  <div key={label} style={s.coordItem}>
                    <span style={s.coordLabel}>{label}</span>
                    <span style={s.coordVal}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selección de oferta */}
          <div style={s.card}>
            <div style={s.cardHeader}>
              <div style={s.cardIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <span style={s.cardTitle}>Seleccionar oferta</span>
            </div>
            <div style={s.divider} />
            <label style={s.label}>Oferta a enviar</label>
            <select onChange={handleOfertaChange} style={s.select} required>
              <option value="">— Seleccione una oferta —</option>
              {ofertas.map(oferta => (
                <option key={oferta._id} value={oferta._id}>
                  {oferta.programa_formacion?.nombre_programa} · {oferta.programa_formacion?.codigo}
                </option>
              ))}
            </select>

            {/* Detalle oferta */}
            {ofertaSeleccionada && (
              <div style={s.ofertaDetail}>
                {[
                  { label: 'Código', val: ofertaSeleccionada.programa_formacion?.codigo },
                  { label: 'Programa', val: ofertaSeleccionada.programa_formacion?.nombre_programa },
                  { label: 'Tipo programa', val: ofertaSeleccionada.es_campesena ? 'Campesena' : 'Regular' },
                  { label: 'Tipo oferta', val: ofertaSeleccionada.tipo_oferta?.nombre || 'N/A' },
                  { label: 'Estado', val: ofertaSeleccionada.estado?.nombre || ofertaSeleccionada.estado?.codigo || 'Pendiente' },
                  { label: 'Fecha inicio', val: formatDate(ofertaSeleccionada.fechas?.inicio) },
                ].map(({ label, val }) => (
                  <div key={label} style={s.detailRow}>
                    <span style={s.detailLabel}>{label}</span>
                    <span style={s.detailVal}>{val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Documentos */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <div style={s.cardIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
            </div>
            <span style={s.cardTitle}>Documentos a enviar</span>
          </div>
          <div style={s.divider} />
          <div style={s.docList}>
            {documentos.map((doc, i) => (
              <div key={i} style={s.docRow}>
                <div style={s.docEmoji}>{doc.icon}</div>
                <div style={s.docInfo}>
                  <span style={s.docTitulo}>{doc.titulo}</span>
                  <span style={s.docDesc}>{doc.desc}</span>
                </div>
                <span style={doc.disponible ? s.tagOk : s.tagNo}>
                  {doc.disponible ? '✓' : '✗'} {doc.estado}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Mensaje + envío */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <div style={s.cardIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <span style={s.cardTitle}>Mensaje para el coordinador</span>
          </div>
          <div style={s.divider} />
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            style={s.textarea}
            rows={4}
            placeholder="Escriba un mensaje adicional (opcional)..."
          />

          <div style={s.footer}>
            <div style={s.destinatario}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Destinatario: <strong style={{ marginLeft: 4 }}>{coordinador?.nombre || 'Coordinador asignado'}</strong>
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading || !ofertaSeleccionada}
              style={loading || !ofertaSeleccionada ? { ...s.btn, ...s.btnDisabled } : s.btn}
            >
              {loading ? (
                <>
                  <span style={s.spinner} /> Enviando...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  Enviar solicitud
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

/* ─── Estilos ────────────────────────────────────────────────────────────── */
const TEAL = '#0f6e56';
const TEAL_LIGHT = '#e1f5ee';
const TEAL_MID = '#1d9e75';
const INK = '#1a1f2e';
const INK_MID = '#3d4459';
const INK_SOFT = '#6b7280';
const BORDER = '#e4e7ed';
const BG = '#f5f6f8';
const WHITE = '#ffffff';
const RED_BG = '#fff0ee';
const RED_TXT = '#993c1d';

const s = {
  root: {
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    background: BG,
    minHeight: '100vh',
  },

  /* Header */
  header: {
    background: INK,
    padding: '40px 32px 36px',
  },
  headerInner: {
    maxWidth: 860,
    margin: '0 auto',
  },
  headerBadge: {
    display: 'inline-block',
    background: TEAL_MID,
    color: WHITE,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.12em',
    padding: '4px 10px',
    borderRadius: 4,
    marginBottom: 14,
  },
  headerTitle: {
    color: WHITE,
    fontSize: 26,
    fontWeight: 700,
    margin: '0 0 8px',
    letterSpacing: '-0.3px',
  },
  headerSub: {
    color: '#9aa3b5',
    fontSize: 14,
    margin: 0,
    lineHeight: 1.6,
  },

  /* Body */
  body: {
    maxWidth: 860,
    margin: '0 auto',
    padding: '28px 24px 48px',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },

  /* Alertas */
  alertError: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: RED_BG,
    color: RED_TXT,
    border: `1px solid #f5c4b3`,
    borderRadius: 8,
    padding: '12px 16px',
    fontSize: 14,
  },
  alertSuccess: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: TEAL_LIGHT,
    color: '#085041',
    border: `1px solid #9fe1cb`,
    borderRadius: 8,
    padding: '12px 16px',
    fontSize: 14,
  },
  alertDot: {
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: RED_TXT,
    flexShrink: 0,
  },

  /* Grid superior */
  topGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 20,
  },

  /* Card */
  card: {
    background: WHITE,
    borderRadius: 12,
    border: `1px solid ${BORDER}`,
    padding: '22px 24px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    background: TEAL_LIGHT,
    color: TEAL,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: INK,
    letterSpacing: '-0.1px',
  },
  divider: {
    height: 1,
    background: BORDER,
    marginBottom: 18,
  },

  /* Coordinador */
  coordGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px 16px',
  },
  coordItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  coordLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: INK_SOFT,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  coordVal: {
    fontSize: 14,
    color: INK,
    fontWeight: 500,
  },

  /* Select */
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: INK_SOFT,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 8,
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    fontSize: 14,
    color: INK,
    background: WHITE,
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7280' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center',
    paddingRight: 36,
  },

  /* Detalle oferta */
  ofertaDetail: {
    marginTop: 16,
    borderRadius: 8,
    background: BG,
    border: `1px solid ${BORDER}`,
    overflow: 'hidden',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '9px 14px',
    borderBottom: `1px solid ${BORDER}`,
    fontSize: 13,
  },
  detailLabel: {
    color: INK_SOFT,
    fontWeight: 500,
  },
  detailVal: {
    color: INK,
    fontWeight: 600,
    textAlign: 'right',
    maxWidth: '60%',
  },

  /* Documentos */
  docList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    borderRadius: 8,
    overflow: 'hidden',
    border: `1px solid ${BORDER}`,
  },
  docRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '13px 16px',
    background: WHITE,
    borderBottom: `1px solid ${BORDER}`,
  },
  docEmoji: {
    fontSize: 22,
    width: 36,
    textAlign: 'center',
    flexShrink: 0,
  },
  docInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  docTitulo: {
    fontSize: 14,
    fontWeight: 600,
    color: INK,
  },
  docDesc: {
    fontSize: 12,
    color: INK_SOFT,
    lineHeight: 1.5,
  },
  tagOk: {
    fontSize: 12,
    fontWeight: 600,
    color: '#085041',
    background: TEAL_LIGHT,
    padding: '4px 10px',
    borderRadius: 20,
    whiteSpace: 'nowrap',
  },
  tagNo: {
    fontSize: 12,
    fontWeight: 600,
    color: RED_TXT,
    background: RED_BG,
    padding: '4px 10px',
    borderRadius: 20,
    whiteSpace: 'nowrap',
  },

  /* Textarea */
  textarea: {
    width: '100%',
    padding: '12px 14px',
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    fontSize: 14,
    color: INK,
    background: WHITE,
    resize: 'vertical',
    fontFamily: 'inherit',
    outline: 'none',
    lineHeight: 1.6,
    boxSizing: 'border-box',
  },

  /* Footer */
  footer: {
    marginTop: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
  },
  destinatario: {
    display: 'flex',
    alignItems: 'flex-start',
    fontSize: 13,
    color: INK_SOFT,
    flex: 1,
  },

  /* Botón */
  btn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: TEAL,
    color: WHITE,
    border: 'none',
    borderRadius: 8,
    padding: '12px 24px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    letterSpacing: '-0.1px',
    transition: 'background 0.2s',
  },
  btnDisabled: {
    background: '#c5ccd8',
    cursor: 'not-allowed',
  },
  spinner: {
    display: 'inline-block',
    width: 14,
    height: 14,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: WHITE,
    borderRadius: '50%',
    marginRight: 8,
    animation: 'spin 0.7s linear infinite',
  },
};

export default SolicitarOferta;