import React from 'react';

const SeleccionarTipoOferta = ({ onSeleccionar }) => {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');

        .sto-wrap {
          font-family: 'DM Sans', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 60px - 48px);
          padding: 24px;
          box-sizing: border-box;
        }

        /* ── Header block ── */
        .sto-header {
          text-align: center;
          margin-bottom: 36px;
        }

        .sto-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: #ecfdf5;
          border: 1px solid #bbf7d0;
          border-radius: 20px;
          padding: 5px 14px;
          font-size: 11px;
          font-weight: 600;
          color: #065f46;
          letter-spacing: .06em;
          text-transform: uppercase;
          margin-bottom: 16px;
        }
        .sto-badge__dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #16a34a;
          flex-shrink: 0;
        }

        .sto-title {
          font-size: 26px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 10px 0;
          line-height: 1.25;
          letter-spacing: -.3px;
        }

        .sto-sub {
          font-size: 14px;
          color: #64748b;
          margin: 0;
          line-height: 1.6;
          max-width: 400px;
        }

        /* ── Cards row ── */
        .sto-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          width: 100%;
          max-width: 640px;
        }

        @media (max-width: 520px) {
          .sto-options { grid-template-columns: 1fr; }
          .sto-title { font-size: 22px; }
        }

        /* ── Card ── */
        .sto-card {
          background: white;
          border: 1px solid #e8eaed;
          border-radius: 14px;
          padding: 26px 22px 22px;
          cursor: pointer;
          text-align: left;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
          transition: box-shadow .2s, transform .2s, border-color .2s;
        }
        .sto-card:hover {
          box-shadow: 0 10px 30px rgba(10,61,46,0.12);
          transform: translateY(-3px);
        }
        .sto-card:active { transform: translateY(-1px); }

        /* accent bottom bar */
        .sto-card::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 3px;
          border-radius: 0;
          opacity: 0;
          transition: opacity .2s;
        }
        .sto-card:hover::after { opacity: 1; }
        .sto-card--regular::after  { background: #0a3d2e; }
        .sto-card--campesena::after { background: #b45309; }

        /* hover border */
        .sto-card--regular:hover  { border-color: #0a3d2e; }
        .sto-card--campesena:hover { border-color: #d97706; }

        /* ── Tag ── */
        .sto-tag {
          display: inline-block;
          font-size: 10px; font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          padding: 3px 9px;
          border-radius: 20px;
          margin-bottom: 16px;
        }
        .sto-tag--regular   { background: #ecfdf5; color: #065f46; }
        .sto-tag--campesena { background: #fffbeb; color: #92400e; }

        /* ── Icon ── */
        .sto-icon {
          width: 46px; height: 46px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px;
          margin-bottom: 16px;
        }
        .sto-icon--regular   { background: #f0fdf4; }
        .sto-icon--campesena { background: #fffbeb; }

        /* ── Text ── */
        .sto-card-title {
          font-size: 16px; font-weight: 700;
          color: #0f172a;
          margin: 0 0 8px 0;
          letter-spacing: -.1px;
        }
        .sto-card-desc {
          font-size: 13px;
          color: #64748b;
          line-height: 1.55;
          margin: 0 0 20px 0;
        }

        /* ── CTA row ── */
        .sto-cta {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .sto-cta-label {
          font-size: 12.5px; font-weight: 600;
          transition: color .2s;
        }
        .sto-card--regular  .sto-cta-label { color: #0a3d2e; }
        .sto-card--campesena .sto-cta-label { color: #b45309; }

        .sto-cta-arrow {
          width: 28px; height: 28px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          transition: transform .2s, background .2s;
        }
        .sto-card--regular  .sto-cta-arrow { background: #ecfdf5; color: #0a3d2e; }
        .sto-card--campesena .sto-cta-arrow { background: #fffbeb; color: #b45309; }
        .sto-card:hover .sto-cta-arrow { transform: translateX(3px); }

        /* ── Divider chips ── */
        .sto-meta {
          display: flex; gap: 6px; flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .sto-chip {
          font-size: 11px; font-weight: 500;
          padding: 3px 8px;
          border-radius: 6px;
          background: #f1f5f9;
          color: #475569;
          font-family: 'DM Mono', monospace;
        }

        /* ── Footer ── */
        .sto-footer {
          margin-top: 32px;
          font-size: 11.5px;
          color: #cbd5e1;
          letter-spacing: .02em;
        }
      `}</style>

      <div className="sto-wrap">
        {/* Header */}
        <div className="sto-header">
          <div className="sto-badge">
            <span className="sto-badge__dot" />
            Nueva oferta
          </div>
          <h2 className="sto-title">¿Qué tipo de oferta deseas crear?</h2>
          <p className="sto-sub">Selecciona el tipo de oferta según el programa que vas a registrar en la plataforma.</p>
        </div>

        {/* Cards */}
        <div className="sto-options">

          {/* Regular */}
          <button className="sto-card sto-card--regular" onClick={() => onSeleccionar('regular')}>
            <div className="sto-tag sto-tag--regular">Estándar</div>
            <div className="sto-icon sto-icon--regular">🌿</div>
            <h3 className="sto-card-title">Regular</h3>
            <div className="sto-meta">
              <span className="sto-chip">Duración flexible</span>
              <span className="sto-chip">1 instructor</span>
            </div>
            <p className="sto-card-desc">Formación estándar sin instructores adicionales. Duración flexible según programa.</p>
            <div className="sto-cta">
              <span className="sto-cta-label">Seleccionar</span>
              <span className="sto-cta-arrow">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5"/>
                </svg>
              </span>
            </div>
          </button>

          {/* Campesena */}
          <button className="sto-card sto-card--campesena" onClick={() => onSeleccionar('campesena')}>
            <div className="sto-tag sto-tag--campesena">Especial</div>
            <div className="sto-icon sto-icon--campesena">🌾</div>
            <h3 className="sto-card-title">Campesena</h3>
            <div className="sto-meta">
              <span className="sto-chip">5 meses</span>
              <span className="sto-chip">3 instructores</span>
            </div>
            <p className="sto-card-desc">Incluye 2 instructores adicionales. Duración fija de 5 meses para comunidades rurales.</p>
            <div className="sto-cta">
              <span className="sto-cta-label">Seleccionar</span>
              <span className="sto-cta-arrow">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5"/>
                </svg>
              </span>
            </div>
          </button>

        </div>

        <p className="sto-footer">© 2025 SENA · Servicio Nacional de Aprendizaje</p>
      </div>
    </>
  );
};

export default SeleccionarTipoOferta;