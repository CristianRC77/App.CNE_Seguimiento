
export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="sidebar">
      <div className="logo-box">
        <div className="logo-badge">CNE</div>
        <div>
          <h2>Seguimiento</h2>
          <span>Oficinas Consulares</span>
        </div>
      </div>

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
          🏛️ Avance de Oficinas Consulares
        </button>
        <button 
          className={`nav-item ${activeTab === 'avances' ? 'active' : ''}`} 
          onClick={() => setActiveTab('avances')}
        >
          ✅ Marcar Avances Ejecutados
        </button>
        <button 
          className={`nav-item ${activeTab === 'reportes' ? 'active' : ''}`} 
          onClick={() => setActiveTab('reportes')}
        >
          📄 Reportes
        </button>
      </nav>

      <div className="sidebar-bottom">
        
        <div className="profile">
          <div className="avatar">CC</div>
          <div>
            <strong>Cristian Cancán</strong>
            <span>Administrador</span>
          </div>
        </div>
      </div>
    </aside>
  );
}