
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
  // La barra lateral cambia la vista activa sin recargar la aplicación.
  return (
    <aside className="sidebar">
      <div className="logo-box">
        <div className="logo-badge">
          <img src="/images/logo-cne.png" alt="Logo CNE" className="cne-logo-img" />
        </div>
        <div>
          <h2>Consejo Nacional Electoral</h2>
          <span>Oficinas Consulares</span>
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
          🏛️ Avance de Zonas Electorales
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