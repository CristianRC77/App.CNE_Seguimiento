const formatNumber = (value) => new Intl.NumberFormat('es-EC').format(value);

export default function MetricsGrid({ stats }) {
  return (
    <div className="stats-grid">
      <div className="stat-card">
        <span className="stat-icon">🏛️</span>
        <div className="metric-content">
          <h3>{stats.total}</h3>
          <p>Total Oficinas Consulares</p>
        </div>
      </div>
      <div className="stat-card">
        <span className="stat-icon">📈</span>
        <div className="metric-content">
          <h3>{stats.average}%</h3>
          <p>Avance Global De Oficinas Consulares</p>
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
        <span className="stat-icon">👥</span>
        <div className="metric-content">
          <h3>{formatNumber(stats.totalActs)}</h3>
          <p>Actas de Escrutinio Totales</p>
        </div>
      </div>
      <div className="stat-card">
        <span className="stat-icon">📈</span>
        <div className="metric-content">
          <h3>{stats.digitizedActsProgress}%</h3>
          <p>Porcentaje de actas digitalizadas</p>
          <small className="metric-detail">{formatNumber(stats.digitizedActs)} de {formatNumber(stats.totalActs)} actas</small>
        </div>
      </div>
      <div className="stat-card">
        <span className="stat-icon">✅</span>
        <div className="metric-content">
          <h3>{stats.completed}</h3>
          <p>Oficinas Finalizadas</p>
        </div>
      </div>
    </div>
  );
}