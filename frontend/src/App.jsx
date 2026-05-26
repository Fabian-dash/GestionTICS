import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/login';
import CrearOferta from './components/crear_oferta';
import SolicitarOferta from './components/solicitar_oferta';
import LinksInscripcion from './components/links_inscripcion';
import FormularioInscripcion from './components/formulario_inscripcion';
import { authService } from './services/api';
import Registro from './components/registro';
import VerInscritos from './components/ver_inscritos';
import MisInstructores from './components/mis_instructores';
import SolicitudesPendientes from './components/solicitudes_pendientes';
import MisOfertas from './components/mis_ofertas';
import FuncionarioDashboard from './components/funcionario_dashboard';

/* ─── Global styles ─── */
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'DM Sans', sans-serif;
    background: #f0f2f5;
    color: #1a1e2e;
    -webkit-font-smoothing: antialiased;
  }

  /* ── Root layout ── */
  .app-root {
    display: flex;
    height: 100vh;
    overflow: hidden;
  }

  /* ── Sidebar ── */
  .app-sidebar {
    width: 256px;
    min-width: 256px;
    background: #0a3d2e;
    display: flex;
    flex-direction: column;
    transition: width 0.28s cubic-bezier(.4,0,.2,1), min-width 0.28s cubic-bezier(.4,0,.2,1);
    position: relative;
    z-index: 20;
    flex-shrink: 0;
  }
  .app-sidebar--collapsed {
    width: 66px;
    min-width: 66px;
  }

  /* Brand */
  .app-brand {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 20px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
  }
  .app-brand__mark {
    flex-shrink: 0;
    width: 34px; height: 34px;
    background: rgba(255,255,255,0.12);
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
  }
  .app-brand__mark svg { width: 18px; height: 18px; }
  .app-brand__text { flex: 1; overflow: hidden; }
  .app-brand__name {
    display: block;
    font-size: 14px; font-weight: 700; color: white;
    white-space: nowrap; overflow: hidden;
  }
  .app-brand__sub {
    display: block;
    font-size: 10px; color: rgba(255,255,255,0.38);
    letter-spacing: .08em; white-space: nowrap;
  }
  .app-brand__toggle {
    flex-shrink: 0;
    width: 26px; height: 26px;
    background: rgba(255,255,255,0.07);
    border: none; border-radius: 6px;
    color: rgba(255,255,255,0.5);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background .2s;
    margin-left: auto;
  }
  .app-brand__toggle:hover { background: rgba(255,255,255,0.14); }
  .app-brand__toggle svg { transition: transform .28s; }
  .app-brand__toggle--flipped svg { transform: rotate(180deg); }

  /* Nav */
  .app-nav {
    flex: 1;
    padding: 14px 10px;
    overflow-y: auto;
    overflow-x: hidden;
  }
  .app-nav__group-label {
    display: block;
    font-size: 10px; font-weight: 600;
    color: rgba(255,255,255,0.28);
    letter-spacing: .1em;
    padding: 0 8px 8px;
    white-space: nowrap; overflow: hidden;
  }
  .app-nav__divider {
    height: 1px;
    background: rgba(255,255,255,0.06);
    margin: 10px 0;
  }

  .nav-btn {
    width: 100%;
    display: flex; align-items: center; gap: 10px;
    padding: 9px 10px;
    border: none; border-radius: 7px;
    background: transparent;
    color: rgba(255,255,255,0.55);
    font-family: 'DM Sans', sans-serif;
    font-size: 13.5px; font-weight: 500;
    cursor: pointer; text-align: left;
    transition: background .18s, color .18s;
    margin-bottom: 2px;
    white-space: nowrap; overflow: hidden;
    position: relative;
  }
  .nav-btn:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.85); }
  .nav-btn--active {
    background: rgba(255,255,255,0.11);
    color: white;
  }
  .nav-btn--active::before {
    content: '';
    position: absolute;
    left: 0; top: 25%; bottom: 25%;
    width: 3px;
    background: #4ade80;
    border-radius: 0 3px 3px 0;
  }
  .nav-btn__icon { flex-shrink: 0; width: 18px; height: 18px; }
  .nav-btn__label { flex: 1; }
  .nav-btn__pill {
    flex-shrink: 0;
    background: rgba(74,222,128,0.18);
    color: #4ade80;
    font-size: 10px; font-weight: 700;
    padding: 1px 6px; border-radius: 20px;
  }

  /* Role chip */
  .app-role-chip {
    margin: 0 10px 10px;
    padding: 8px 12px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    display: flex; align-items: center; gap: 8px;
  }
  .app-role-chip__dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #4ade80; flex-shrink: 0;
  }
  .app-role-chip__text {
    font-size: 11px; color: rgba(255,255,255,0.45);
    white-space: nowrap; overflow: hidden;
  }
  .app-role-chip__name {
    font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.7);
    display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  /* Profile & logout */
  .app-sidebar__footer {
    padding: 12px;
    border-top: 1px solid rgba(255,255,255,0.07);
  }
  .app-profile {
    display: flex; align-items: center; gap: 9px;
    padding: 9px 10px;
    background: rgba(255,255,255,0.05);
    border-radius: 8px;
    margin-bottom: 8px;
    overflow: hidden;
  }
  .app-profile__avatar {
    width: 32px; height: 32px;
    background: #005f3a;
    border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; color: white;
    flex-shrink: 0;
  }
  .app-profile__name {
    font-size: 13px; font-weight: 600; color: white;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .app-profile__role {
    font-size: 11px; color: rgba(255,255,255,0.4);
    text-transform: capitalize;
  }
  .app-logout {
    width: 100%;
    display: flex; align-items: center; gap: 4px;
    padding: 4px 6px;
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.18);
    border-radius: 7px;
    color: #fca5a5;
    font-family: 'DM Sans', sans-serif;
    font-size: 10px; font-weight: 500;
    cursor: pointer;
    transition: background .2s, color .2s;
    white-space: nowrap;
  }
  .app-logout svg {
    width: 14px;
    height: 14px;
  }
  .app-logout:hover { background: rgba(239,68,68,0.2); color: white; }

  /* ── Main ── */
  .app-main {
    flex: 1; display: flex; flex-direction: column;
    overflow: hidden;
    min-width: 0;
  }

  /* ── Topbar ── */
  .app-topbar {
    height: 60px;
    background: white;
    border-bottom: 1px solid #e8eaed;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 28px;
    flex-shrink: 0;
  }
  .app-topbar__left { }
  .app-topbar__title {
    font-size: 17px; font-weight: 700; color: #0f172a;
    line-height: 1;
  }
  .app-breadcrumb {
    display: flex; align-items: center; gap: 5px;
    margin-top: 3px;
    font-size: 11.5px; color: #94a3b8;
  }
  .app-breadcrumb__sep { opacity: .5; }
  .app-breadcrumb__current { color: #0a3d2e; font-weight: 500; }
  .app-topbar__right {
    display: flex; align-items: center; gap: 14px;
  }
  .app-sena-logo {
    height: 30px; width: auto;
    filter: saturate(0) opacity(.5);
  }
  .app-user-tag {
    display: flex; align-items: center; gap: 7px;
    padding: 5px 11px;
    background: #ecfdf5;
    border: 1px solid #bbf7d0;
    border-radius: 20px;
    font-size: 12px; font-weight: 600; color: #065f46;
  }
  .app-user-tag__dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #16a34a;
  }

  /* ── Content area ── */
  .app-content {
    flex: 1; overflow-y: auto;
    padding: 24px 28px;
    background: #f0f2f5;
  }

  /* ── Coordinator info card ── */
  .coord-info-card {
    margin-top: auto;
    padding: 12px 14px;
    background: rgba(74,222,128,0.07);
    border: 1px solid rgba(74,222,128,0.15);
    border-radius: 8px;
    overflow: hidden;
  }
  .coord-info-card__label {
    font-size: 10px; font-weight: 600;
    color: rgba(255,255,255,0.35);
    text-transform: uppercase; letter-spacing: .08em;
    margin-bottom: 4px;
    white-space: nowrap;
  }
  .coord-info-card__value {
    font-size: 13px; font-weight: 600;
    color: #4ade80;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
`;

/* ─── Icons ─── */
const Ic = {
  Logo: () => (
    <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="18" height="18" rx="4" fill="white" fillOpacity=".12"/>
      <path d="M4 9C4 6.239 6.239 4 9 4v0c2.761 0 5 2.239 5 5v5H9C6.239 14 4 11.761 4 9v0z" fill="white"/>
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 4v10M4 9h10"/>
    </svg>
  ),
  Clipboard: () => (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 4H5a1.5 1.5 0 00-1.5 1.5v9A1.5 1.5 0 005 16h8a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0013 4h-2M7 4a1.5 1.5 0 001.5 1.5h1A1.5 1.5 0 0011 4M7 4a1.5 1.5 0 011.5-1.5h1A1.5 1.5 0 0111 4"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3.5 9.5l3.5 3.5 7-7"/>
    </svg>
  ),
  Link: () => (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7.5 10.5a3 3 0 004.243 0l2.121-2.121a3 3 0 00-4.243-4.243L8.5 5.257"/>
      <path d="M10.5 7.5a3 3 0 00-4.243 0L4.136 9.621a3 3 0 004.243 4.243L9.5 12.743"/>
    </svg>
  ),
  Users: () => (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M13 14v-1a3 3 0 00-3-3H6a3 3 0 00-3 3v1M9 7a2 2 0 100-4 2 2 0 000 4zM15 14v-1a3 3 0 00-2-2.83M12 4.17a2 2 0 010 3.66"/>
    </svg>
  ),
  FileText: () => (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M10 2H5a1.5 1.5 0 00-1.5 1.5v11A1.5 1.5 0 005 16h8a1.5 1.5 0 001.5-1.5V7L10 2z"/>
      <path d="M10 2v5h4.5M6.5 10.5h5M6.5 13h3"/>
    </svg>
  ),
  Logout: () => (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12.5 12.5l3-3-3-3M15.5 9.5H7M10 13.5v1A1.5 1.5 0 018.5 16h-5A1.5 1.5 0 012 14.5v-11A1.5 1.5 0 013.5 2h5A1.5 1.5 0 0110 3.5v1"/>
    </svg>
  ),
  ChevronLeft: ({ flipped }) => (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2"
      style={{ transform: flipped ? 'rotate(180deg)' : 'none', transition: 'transform .28s' }}>
      <path d="M11 13l-4-4 4-4"/>
    </svg>
  ),
};

/* ─── Nav item definitions ─── */
const instructorNav = [
  { id: 'crear',     label: 'Crear Oferta',          icon: <Ic.Plus /> },
  { id: 'misofertas', label: 'Mis Ofertas',           icon: <Ic.Clipboard /> },
  { id: 'solicitar', label: 'Solicitar Validación',   icon: <Ic.FileText /> },
  { id: 'links',     label: 'Links de Inscripción',   icon: <Ic.Link /> },
  { id: 'inscritos', label: 'Ver Inscritos',          icon: <Ic.Users /> },
];

const coordinadorNav = [
  { id: 'solicitudes',  label: 'Solicitudes de Validación', icon: <Ic.Check /> },
  { id: 'instructores', label: 'Mis Instructores',          icon: <Ic.Users /> },
];

const labelMap = {
  crear: 'Crear Oferta',
  misofertas: 'Mis Ofertas',
  solicitar: 'Solicitar Validación',
  links: 'Links de Inscripción',
  inscritos: 'Ver Inscritos',
  solicitudes: 'Solicitudes de Validación',
  instructores: 'Mis Instructores',
};

/* ─── Dashboard ─── */
const Dashboard = () => {
  const [vistaActiva, setVistaActiva] = useState('crear');
  const [collapsed, setCollapsed] = useState(false);
  const user = authService.getCurrentUser();
  const userTipo = user?.tipo || 'instructor';
  const navItems = userTipo === 'instructor' ? instructorNav : coordinadorNav;

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  const initials = `${user?.nombre || ''}`.trim().charAt(0).toUpperCase() || 'U';
  const fullName = [user?.nombre, user?.apellido].filter(Boolean).join(' ');

  return (
    <>
      <style>{globalStyles}</style>
      <div className="app-root">
        {/* ── Sidebar ── */}
        <aside className={`app-sidebar${collapsed ? ' app-sidebar--collapsed' : ''}`}>
          {/* Brand */}
          <div className="app-brand">
            <div className="app-brand__mark"><Ic.Logo /></div>
            {!collapsed && (
              <div className="app-brand__text">
                <span className="app-brand__name">Gestion y TICS</span>
                <span className="app-brand__sub">SENA PORTAL</span>
              </div>
            )}
            <button
              className={`app-brand__toggle${collapsed ? ' app-brand__toggle--flipped' : ''}`}
              onClick={() => setCollapsed(c => !c)}
              title={collapsed ? 'Expandir' : 'Colapsar'}
            >
              <Ic.ChevronLeft flipped={collapsed} />
            </button>
          </div>

          {/* Nav */}
          <nav className="app-nav">
            {!collapsed && (
              <span className="app-nav__group-label">
                {userTipo === 'instructor' ? 'INSTRUCTOR' : 'COORDINADOR'}
              </span>
            )}
            {navItems.map(item => (
              <button
                key={item.id}
                className={`nav-btn${vistaActiva === item.id ? ' nav-btn--active' : ''}`}
                onClick={() => setVistaActiva(item.id)}
                title={collapsed ? item.label : ''}
              >
                <span className="nav-btn__icon">{item.icon}</span>
                {!collapsed && <span className="nav-btn__label">{item.label}</span>}
              </button>
            ))}

            {/* Coordinator info */}
            {!collapsed && userTipo === 'instructor' && user?.coordinadorAsignado?.nombre && (
              <>
                <div className="app-nav__divider" />
                <div className="coord-info-card">
                  <p className="coord-info-card__label">Coordinador asignado</p>
                  <p className="coord-info-card__value">{user.coordinadorAsignado.nombre}</p>
                </div>
              </>
            )}
          </nav>

          {/* Footer */}
          {!collapsed && (
            <div className="app-sidebar__footer">
              <div className="app-profile">
                <div className="app-profile__avatar">{initials}</div>
                <div style={{ overflow: 'hidden' }}>
                  <p className="app-profile__name">{fullName}</p>
                  <p className="app-profile__role">{userTipo}</p>
                </div>
              </div>
              <button className="app-logout" onClick={handleLogout}>
                <Ic.Logout />
                Cerrar sesión
              </button>
            </div>
          )}
        </aside>

        {/* ── Main ── */}
        <div className="app-main">
          {/* Topbar */}
          <header className="app-topbar">
            <div className="app-topbar__left">
              <h1 className="app-topbar__title">{labelMap[vistaActiva] || 'Panel de Control'}</h1>
              <div className="app-breadcrumb">
                <span>Gestion y TICS</span>
                <span className="app-breadcrumb__sep">/</span>
                <span className="app-breadcrumb__current">{labelMap[vistaActiva]}</span>
              </div>
            </div>
            <div className="app-topbar__right">
              <div className="app-user-tag">
                <span className="app-user-tag__dot" />
                {fullName} · <span style={{ textTransform: 'capitalize', opacity: .8 }}>{userTipo}</span>
              </div>
              <img
                src="https://www.sena.edu.co/Style%20Library/alayout/images/logoSena.png"
                alt="SENA"
                className="app-sena-logo"
              />
            </div>
          </header>

          {/* Content */}
          <main className="app-content">
            {userTipo === 'instructor' && (
              <>
                {vistaActiva === 'crear'      && <CrearOferta onOfertaCreada={() => setVistaActiva('links')} />}
                {vistaActiva === 'misofertas' && <MisOfertas />}
                {vistaActiva === 'solicitar'  && <SolicitarOferta />}
                {vistaActiva === 'links'      && <LinksInscripcion />}
                {vistaActiva === 'inscritos'  && <VerInscritos />}
              </>
            )}
            {userTipo === 'coordinador' && (
              <>
                {vistaActiva === 'solicitudes'  && <SolicitudesPendientes />}
                {vistaActiva === 'instructores' && <MisInstructores />}
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
};

/* ─── Protected route ─── */
const ProtectedRoute = ({ children }) => {
  if (!authService.isAuthenticated()) return <Navigate to="/login" />;
  return children;
};

/* ─── App ─── */
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/inscribirse/:codigo" element={<FormularioInscripcion />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/funcionario" element={<ProtectedRoute><FuncionarioDashboard /></ProtectedRoute>} />
        <Route path="/"  element={<Navigate to="/login" />} />
        <Route path="*"  element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;