import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const Registro = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [coordinadores, setCoordinadores] = useState([]);
  const [modalidades, setModalidades] = useState([]);

  const [formData, setFormData] = useState({
    rol: 'instructor',
    nombreUsuario: '',
    tipoIdentificacion: '',
    numeroIdentificacion: '',
    nombre: '',
    apellido: '',
    telefono: '',
    correoElectronico: '',
    coordinadorAsignado: '',
    modalidades: [],
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [tiposRes, coordRes, modalRes] = await Promise.all([
        api.get('/tipos-documento'),
        api.get('/coordinadores'),
        api.get('/modalidades')
      ]);
      setTiposDocumento(tiposRes.data.data || []);
      setCoordinadores(coordRes.data.data || []);
      setModalidades(modalRes.data.data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleModalidad = (id) => {
    setFormData(prev => ({
      ...prev,
      modalidades: prev.modalidades.includes(id)
        ? prev.modalidades.filter(m => m !== id)
        : [...prev.modalidades, id]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (formData.password !== formData.confirmPassword)
        throw new Error('Las contraseñas no coinciden');
      if (formData.password.length < 6)
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      if (formData.rol === 'instructor' && !formData.coordinadorAsignado)
        throw new Error('Selecciona un coordinador');
      if (formData.rol === 'funcionario' && formData.modalidades.length === 0)
        throw new Error('Selecciona al menos una modalidad');

      const { confirmPassword, ...datos } = formData;
      await api.post('/auth/register', datos);

      setSuccess('¡Registro exitoso! Redirigiendo al login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&display=swap');
        .r-page { font-family:'Sora',sans-serif; background:#f4f7f5; min-height:100vh; display:flex; align-items:flex-start; justify-content:center; padding:40px 24px; box-sizing:border-box; }
        .r-card { background:#fff; border:1px solid #e0ebe4; border-radius:20px; width:100%; max-width:580px; padding:44px 40px; position:relative; box-sizing:border-box; }
        .r-card::before { content:''; position:absolute; top:-1px; left:50%; transform:translateX(-50%); width:160px; height:3px; background:#00643C; border-radius:0 0 4px 4px; }
        .r-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:32px; }
        .r-logo { background:#00643C; border-radius:10px; padding:8px 14px; font-size:15px; font-weight:600; color:white; letter-spacing:2px; }
        .r-badge { font-size:11px; color:#7a8f82; background:#f0f7f3; border:1px solid #dce8e1; border-radius:20px; padding:4px 12px; font-weight:500; }
        .r-heading { font-size:20px; font-weight:600; color:#111; margin:0 0 4px 0; }
        .r-sub { font-size:13px; color:#7a8f82; margin:0 0 28px 0; }
        .r-section { font-size:10px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:#00643C; margin:20px 0 14px 0; display:flex; align-items:center; gap:8px; }
        .r-section::after { content:''; flex:1; height:1px; background:#e8f0eb; }
        .r-row { display:flex; gap:14px; margin-bottom:14px; }
        .r-half { flex:1; }
        .r-full { width:100%; margin-bottom:14px; }
        .r-label { display:block; font-size:11px; font-weight:500; letter-spacing:.8px; text-transform:uppercase; color:#7a8f82; margin-bottom:6px; }
        .r-input, .r-select { width:100%; padding:11px 14px; background:#f8faf9; border:1px solid #dce8e1; border-radius:10px; font-size:13px; font-family:'Sora',sans-serif; color:#111; outline:none; box-sizing:border-box; transition:border-color .2s,box-shadow .2s; }
        .r-input:focus, .r-select:focus { border-color:#00643C; background:white; box-shadow:0 0 0 3px rgba(0,100,60,.08); }
        .r-select { appearance:none; cursor:pointer; }
        .r-rol-group { display:flex; gap:10px; margin-bottom:14px; }
        .r-rol-btn { flex:1; padding:10px; border:1px solid #dce8e1; border-radius:10px; background:#f8faf9; font-family:'Sora',sans-serif; font-size:13px; font-weight:500; color:#7a8f82; cursor:pointer; transition:all .2s; text-align:center; }
        .r-rol-btn--active { border-color:#00643C; background:#f0f7f3; color:#00643C; font-weight:600; }
        .r-check-group { display:flex; flex-direction:column; gap:8px; }
        .r-check-item { display:flex; align-items:center; gap:10px; padding:10px 14px; background:#f8faf9; border:1px solid #dce8e1; border-radius:10px; cursor:pointer; transition:all .2s; }
        .r-check-item--active { border-color:#00643C; background:#f0f7f3; }
        .r-check-box { width:16px; height:16px; border:2px solid #dce8e1; border-radius:4px; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all .2s; }
        .r-check-box--active { background:#00643C; border-color:#00643C; }
        .r-check-mark { color:white; font-size:10px; font-weight:700; }
        .r-error { background:#fef2f2; border:1px solid #fca5a5; border-radius:8px; padding:10px 14px; font-size:13px; color:#b91c1c; margin-bottom:16px; }
        .r-success { background:#f0fdf4; border:1px solid #86efac; border-radius:8px; padding:10px 14px; font-size:13px; color:#166534; margin-bottom:16px; }
        .r-btn-row { display:flex; gap:12px; margin-top:28px; }
        .r-btn-primary { flex:2; padding:13px; background:#00643C; color:white; border:none; border-radius:10px; font-size:14px; font-weight:600; font-family:'Sora',sans-serif; cursor:pointer; transition:background .2s; }
        .r-btn-primary:hover:not(:disabled) { background:#004d2e; }
        .r-btn-primary:disabled { background:#a3c4b5; cursor:not-allowed; }
        .r-btn-secondary { flex:1; padding:13px; background:transparent; color:#00643C; border:1px solid #dce8e1; border-radius:10px; font-size:14px; font-weight:500; font-family:'Sora',sans-serif; cursor:pointer; }
        .r-btn-secondary:hover { background:#f0f7f3; }
        .r-footer { margin-top:28px; padding-top:18px; border-top:1px solid #e8f0eb; text-align:center; font-size:11px; color:#b8ccc0; }
        @media(max-width:560px) { .r-card{padding:36px 20px;} .r-row{flex-direction:column;gap:0;} .r-half{margin-bottom:14px;} .r-btn-row{flex-direction:column;} .r-rol-group{flex-direction:column;} }
      `}</style>

      <div className="r-page">
        <div className="r-card">
          <div className="r-top">
            <div className="r-logo">SENA</div>
            <div className="r-badge">Registro de usuario</div>
          </div>

          <h2 className="r-heading">Crea tu cuenta</h2>
          <p className="r-sub">Completa los datos para registrarte en la plataforma.</p>

          {error && <div className="r-error">{error}</div>}
          {success && <div className="r-success">{success}</div>}

          <form onSubmit={handleSubmit}>

            {/* ── Rol ── */}
            <div className="r-section">Tipo de usuario</div>
            <div className="r-rol-group">
              {['instructor', 'coordinador', 'funcionario'].map(rol => (
                <button
                  key={rol}
                  type="button"
                  className={`r-rol-btn${formData.rol === rol ? ' r-rol-btn--active' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, rol }))}
                >
                  {rol.charAt(0).toUpperCase() + rol.slice(1)}
                </button>
              ))}
            </div>

            {/* ── Acceso ── */}
            <div className="r-section">Información de acceso</div>
            <div className="r-full">
              <label className="r-label">Nombre de usuario</label>
              <input className="r-input" type="text" name="nombreUsuario" value={formData.nombreUsuario} onChange={handleChange} placeholder="Carlos Rodriguez" required />
            </div>
            <div className="r-row">
              <div className="r-half">
                <label className="r-label">Contraseña</label>
                <input className="r-input" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="******" required />
              </div>
              <div className="r-half">
                <label className="r-label">Confirmar contraseña</label>
                <input className="r-input" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="******" required />
              </div>
            </div>

            {/* ── Datos personales ── */}
            <div className="r-section">Datos personales</div>
            <div className="r-row">
              <div className="r-half">
                <label className="r-label">Nombres</label>
                <input className="r-input" type="text" name="nombre" value={formData.nombre} onChange={handleChange} placeholder=" Carlos" required />
              </div>
              {formData.rol === 'instructor' && (
                <div className="r-half">
                  <label className="r-label">Apellidos</label>
                  <input className="r-input" type="text" name="apellido" value={formData.apellido} onChange={handleChange} placeholder="Rodriguez Alvarez" required />
                </div>
              )}
            </div>
            <div className="r-row">
              {formData.rol === 'instructor' && (
                <div className="r-half">
                  <label className="r-label">Tipo de identificación</label>
                  <select className="r-select" name="tipoIdentificacion" value={formData.tipoIdentificacion} onChange={handleChange} required>
                    <option value="">Seleccione...</option>
                    {tiposDocumento.map(t => <option key={t._id} value={t._id}>{t.nombre}</option>)}
                  </select>
                </div>
              )}
              <div className="r-half">
                <label className="r-label">Número de identificación</label>
                <input className="r-input" type="text" name="numeroIdentificacion" value={formData.numeroIdentificacion} onChange={handleChange} placeholder="102678952" required />
              </div>
            </div>
            <div className="r-row">
              <div className="r-half">
                <label className="r-label">Correo electrónico</label>
                <input className="r-input" type="email" name="correoElectronico" value={formData.correoElectronico} onChange={handleChange} placeholder="correo@sena.edu.co" required />
              </div>
              <div className="r-half">
                <label className="r-label">Teléfono</label>
                <input className="r-input" type="tel" name="telefono" value={formData.telefono} onChange={handleChange} placeholder="32014585962" required />
              </div>
            </div>

            {/* ── Campos según rol ── */}
            {formData.rol === 'instructor' && (
              <>
                <div className="r-section">Asignación</div>
                <div className="r-full">
                  <label className="r-label">Coordinador asignado</label>
                  <select className="r-select" name="coordinadorAsignado" value={formData.coordinadorAsignado} onChange={handleChange} required>
                    <option value="">Seleccione un coordinador...</option>
                    {coordinadores.map(c => <option key={c._id} value={c._id}>{c.nombre}</option>)}
                  </select>
                </div>
              </>
            )}

            {formData.rol === 'funcionario' && (
              <>
                <div className="r-section">Modalidades</div>
                <div className="r-check-group">
                  {modalidades.map(m => (
                    <div
                      key={m._id}
                      className={`r-check-item${formData.modalidades.includes(m._id) ? ' r-check-item--active' : ''}`}
                      onClick={() => handleModalidad(m._id)}
                    >
                      <div className={`r-check-box${formData.modalidades.includes(m._id) ? ' r-check-box--active' : ''}`}>
                        {formData.modalidades.includes(m._id) && <span className="r-check-mark">✓</span>}
                      </div>
                      <span style={{ fontSize: '13px', color: '#111' }}>{m.nombre}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="r-btn-row">
              <button type="submit" className="r-btn-primary" disabled={loading}>
                {loading ? 'Registrando...' : 'Registrarse'}
              </button>
              <button type="button" className="r-btn-secondary" onClick={() => navigate('/login')}>
                Volver al login
              </button>
            </div>

          </form>

          <div className="r-footer">© 2026 SENA · Servicio Nacional de Aprendizaje</div>
        </div>
      </div>
    </>
  );
};

export default Registro;