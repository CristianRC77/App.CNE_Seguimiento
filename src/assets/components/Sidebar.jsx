
import { useState, useEffect } from 'react';
import { getBrandConfig } from '../constants/brandConfig.js';

const getCircunscriptionLabel = (circunscription) => ({
  EUROPA_OCEANIA_ASIA: 'Europa, Oceanía y Asia',
  CANADA_EEUU: 'Canadá y Estados Unidos',
  LATAM_CARIBE_AFRICA: 'Latinoamérica, el Caribe y África',
}[circunscription] || circunscription || 'Todas las circunscripciones');

export default function Sidebar({
  activeTab,
  setActiveTab,
  onProtectedTabClick,
  authSession,
  onLogout,
}) {
  const [brandConfig, setBrandConfig] = useState({
    organizationName: 'Consejo Nacional Electoral',
    subtitle: 'Oficinas Consulares',
    logoPath: '/images/logo-cne.png',
    logoAlt: 'Logo CNE',
  });

  useEffect(() => {
    getBrandConfig().then(setBrandConfig);
  }, []);

  // La barra lateral cambia la vista activa sin recargar la aplicación.
  return (
    <aside className="sidebar">
      <div className="logo-box">
        <div className="logo-badge">
          <img src={brandConfig.logoPath} alt={brandConfig.logoAlt} className="cne-logo-img" />
        </div>
        <div>
          <h2>{brandConfig.organizationName}</h2>
          <span>{brandConfig.subtitle}</span>
        </div>
      </div>

      {/* Cada botón representa una sección principal del seguimiento. */}
      <nav className="nav-menu">
        <button 
          className={`nav-item ${activeTab === 'resumen' ? 'active' : ''}`} 
          onClick={() => setActiveTab('resumen')}
        >
          📊 Resumen General
        </button>
        <button 
          className={`nav-item ${activeTab === 'oficinas' ? 'active' : ''}`} 
          onClick={() => setActiveTab('oficinas')}
        >
          🏛️ Avance por Zonas Electorales
        </button>
        <button 
          className={`nav-item ${activeTab === 'avances' ? 'active' : ''}`} 
          onClick={onProtectedTabClick}
        >
          {authSession ? '✅' : '🔒'} Marcar Avances Ejecutados
        </button>
        <button 
          className={`nav-item ${activeTab === 'reportes' ? 'active' : ''}`} 
          onClick={() => setActiveTab('reportes')}
        >
          📄 Reportes
        </button>
        
        {/* Botón de administración - Solo para ADMIN */}
        {authSession && authSession.user.rol === 'ADMIN' && (
          <button 
            className={`nav-item admin-nav-item ${activeTab === 'admin' ? 'active' : ''}`} 
            onClick={() => setActiveTab('admin')}
            title="Acceso exclusivo de administrador"
          >
            🔧 Administración
          </button>
        )}
      </nav>

      <div className="sidebar-bottom">
        
        {authSession ? (
          <div className="profile">
            <div className="avatar">{authSession.user.username.slice(0, 2).toUpperCase()}</div>
            <div className="profile-details">
              <strong>{authSession.user.nombreCompleto || authSession.user.username}</strong>
              <span>{getCircunscriptionLabel(authSession.user.circunscripcion)}</span>
              <button type="button" className="logout-btn" onClick={onLogout}>
                Cerrar sesión
              </button>
            </div>
          </div>
        ) : (
          <div className="profile">
            <div className="avatar">--</div>
            <div>
              <strong>Sesión no iniciada</strong>
              <span>Solo lectura</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}