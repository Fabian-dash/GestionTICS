import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';

const Login = () => {
  const [formData, setFormData] = useState({
    correoElectronico: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await authService.login(
        formData.correoElectronico,
        formData.password
      );
      if (response.user.tipo === 'funcionario') {
        navigate('/funcionario');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      setError(error.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&display=swap');

        .l-page {
          font-family: 'Sora', sans-serif;
          background: #f4f7f5;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          box-sizing: border-box;
        }

        .l-card {
          background: #ffffff;
          border: 1px solid #e0ebe4;
          border-radius: 20px;
          width: 100%;
          max-width: 420px;
          padding: 44px 40px;
          position: relative;
          overflow: hidden;
          box-sizing: border-box;
        }

        .l-card::before {
          content: '';
          position: absolute;
          top: -1px;
          left: 50%;
          transform: translateX(-50%);
          width: 160px;
          height: 3px;
          background: #00643C;
          border-radius: 0 0 4px 4px;
        }

        .l-card::after {
          content: '';
          position: absolute;
          top: -80px;
          right: -80px;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: rgba(0,100,60,0.04);
          pointer-events: none;
        }

        .l-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 36px;
        }

        .l-logo-box {
          background: #00643C;
          border-radius: 10px;
          padding: 8px 14px;
          font-size: 15px;
          font-weight: 600;
          color: white;
          letter-spacing: 2px;
        }

        .l-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #00643C;
          font-weight: 500;
        }

        .l-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #00a661;
          animation: lpulse 2s infinite;
        }

        @keyframes lpulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .l-heading {
          font-size: 22px;
          font-weight: 600;
          color: #111;
          margin: 0 0 6px 0;
          line-height: 1.2;
        }

        .l-sub {
          font-size: 13px;
          color: #7a8f82;
          margin: 0 0 32px 0;
          line-height: 1.5;
        }

        .l-error {
          background: #fef2f2;
          border: 1px solid #fca5a5;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
          color: #b91c1c;
          margin-bottom: 20px;
        }

        .l-field {
          margin-bottom: 16px;
        }

        .l-label {
          display: block;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #7a8f82;
          margin-bottom: 8px;
        }

        .l-input {
          width: 100%;
          padding: 13px 16px;
          background: #f8faf9;
          border: 1px solid #dce8e1;
          border-radius: 10px;
          font-size: 14px;
          font-family: 'Sora', sans-serif;
          color: #111;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }

        .l-input::placeholder {
          color: #b8ccc0;
        }

        .l-input:focus {
          border-color: #00643C;
          background: white;
          box-shadow: 0 0 0 3px rgba(0,100,60,0.08);
        }

        .l-forgot {
          display: block;
          text-align: right;
          font-size: 12px;
          color: #00643C;
          text-decoration: none;
          font-weight: 500;
          margin-top: -4px;
          margin-bottom: 28px;
        }

        .l-forgot:hover {
          text-decoration: underline;
        }

        .l-btn {
          width: 100%;
          padding: 14px;
          background: #00643C;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'Sora', sans-serif;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
        }

        .l-btn:hover:not(:disabled) {
          background: #004d2e;
        }

        .l-btn:active:not(:disabled) {
          transform: scale(0.99);
        }

        .l-btn:disabled {
          background: #a3c4b5;
          cursor: not-allowed;
        }

        .l-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 24px 0;
          font-size: 11px;
          color: #b8ccc0;
        }

        .l-divider::before,
        .l-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e8f0eb;
        }

        .l-register {
          text-align: center;
          font-size: 13px;
          color: #7a8f82;
        }

        .l-register a {
          color: #00643C;
          font-weight: 600;
          text-decoration: none;
        }

        .l-register a:hover {
          text-decoration: underline;
        }

        .l-footer {
          margin-top: 32px;
          padding-top: 20px;
          border-top: 1px solid #e8f0eb;
          text-align: center;
          font-size: 11px;
          color: #b8ccc0;
          letter-spacing: 0.3px;
        }

        @media (max-width: 480px) {
          .l-card { padding: 36px 24px; }
        }
      `}</style>

      <div className="l-page">
        <div className="l-card">

          <div className="l-top">
            <div className="l-logo-box">SENA</div>
            <div className="l-status">
              <div className="l-status-dot" />
              Sistema activo
            </div>
          </div>

          <h2 className="l-heading">Bienvenido de nuevo</h2>
          <p className="l-sub">Ingresa tus credenciales para continuar a la plataforma.</p>

          {error && <div className="l-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="l-field">
              <label className="l-label">Correo electrónico</label>
              <input
                className="l-input"
                type="email"
                name="correoElectronico"
                value={formData.correoElectronico}
                onChange={handleChange}
                placeholder="correo@sena.edu.co"
                required
              />
            </div>

            <div className="l-field">
              <label className="l-label">Contraseña</label>
              <input
                className="l-input"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>

            <Link to="/recuperar-password" className="l-forgot">
              ¿Olvidaste tu contraseña?
            </Link>

            <button type="submit" className="l-btn" disabled={loading}>
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>

          <div className="l-divider">o</div>

          <div className="l-register">
            ¿No tienes cuenta?{' '}
            <Link to="/registro">Regístrate aquí</Link>
          </div>

          <div className="l-footer">
            © 2026 SENA · Servicio Nacional de Aprendizaje
          </div>

        </div>
      </div>
    </>
  );
};

export default Login;