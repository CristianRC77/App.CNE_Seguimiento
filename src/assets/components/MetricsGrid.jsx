const formatNumber = (value) => new Intl.NumberFormat('es-EC').format(value);

export default function MetricsGrid({ stats }) {
  return (
    <div className="stats-grid">
      <div className="stat-card">
        <span className="stat-icon">🏛️</span>
        <div className="metric-content">
          <h3> {stats.total}</h3>
          <p>Total de Zonas Electorales participantes </p>
        </div>
      </div>
      <div className="stat-card">
        <span className="stat-icon">👥</span>
        <div className="metric-content">
          <h3>{formatNumber(stats.electors)}</h3>
          <p>Electores ({stats.juntas} Juntas)</p>
        </div>
      </div>
      <div className="stat-card">
        <span className="stat-icon">📋</span>
        <div className="metric-content">
          <h3>{formatNumber(stats.totalScrutinyActs)}</h3>
          <p>Actas de escrutinio totales</p>
        </div>
      </div>
      <div className="stat-card">
        <span className="stat-icon">📄</span>
        <div className="metric-content">
          <h3>{formatNumber(stats.totalInstallationActs)}</h3>
          <p>Actas de instalación totales</p>
        </div>
      </div>
      <div className="stat-card">
        <span className="stat-icon">📈</span>
        <div className="metric-content">
          <h3>{stats.digitizedActsProgress}%</h3>
          <p>Escrutinio digitalizado</p>
          <small className="metric-detail">
            {formatNumber(stats.digitizedActs)} de {formatNumber(stats.totalScrutinyActs)} actas
          </small>
        </div>
      </div>
      <div className="stat-card">
        <span className="stat-icon">📈</span>
        <div className="metric-content">
          <h3>{stats.installationActsProgress}%</h3>
          <p>Instalación digitalizada</p>
          <small className="metric-detail">
            {formatNumber(stats.digitizedInstallationActs)} de {formatNumber(stats.totalInstallationActs)} actas
          </small>
        </div>
      </div>
      <div className="stat-card">
        <span className="stat-icon">✅</span>
        <div className="metric-content">
          <h3>{stats.completed}</h3>
          <p>Zonas Electorales Finalizadas</p>
        </div>
      </div>
      <div className="stat-card">
        <span className="stat-icon">🚫</span>
        <div className="metric-content">
          <h3>{stats.excludedGeneralPercentage}</h3>
          <p>Zonas Electorales no participan</p>
          <small className="metric-detail">La Habana, Caracas y Valencia</small>
        </div>
      </div>
    </div>
  );
}