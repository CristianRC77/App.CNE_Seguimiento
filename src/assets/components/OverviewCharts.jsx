
const formatNumber = (value) => new Intl.NumberFormat('es-EC').format(value);

export default function OverviewCharts({ offices, stats, statusInfo, getOfficeStatus }) {
  const statusCounts = Object.keys(statusInfo).map((status) => ({
    ...statusInfo[status],
    count: offices.filter((office) => getOfficeStatus(office) === status).length,
  }));

  return (
    <section className="overview-grid">
      {/* Tarjeta de Donut / Progreso Ponderado */}
      <article className="panel progress-panel">
        <div className="panel-heading">
          <div>
            <h2>Avance general</h2>
            <p>Porcentaje ponderado según electores</p>
          </div>
        </div>
        <div className="progress-content">
          <div className="donut" style={{ '--percent': `${stats.average * 3.6}deg` }}>
            <div>
              <strong>{stats.average}%</strong>
              <span>Electores cubiertos</span>
            </div>
          </div>
          <div className="legend">
            {statusCounts.map((item) => (
              <div className="legend-row" key={item.label}>
                <span className="legend-label">
                  <i style={{ backgroundColor: item.color }} />
                  {item.label}
                </span>
                <b>{item.count} <small>oficinas</small></b>
              </div>
            ))}
          </div>
        </div>
        <div className="panel-footer">
          <span><i className="green-dot" /> Electores registrados: <b>{formatNumber(stats.electors)}</b></span>
          <span className="target">{formatNumber(stats.juntas)} juntas · {formatNumber(stats.totalActs)} actas</span>
        </div>
      </article>

      {/* Tarjeta de Actividad Reciente */}
      <article className="panel activity-panel">
        <div className="panel-heading">
          <div>
            <h2>Actividad reciente</h2>
            <p>Últimos cambios registrados</p>
          </div>
        </div>
        <div className="activity-list">
          {offices.slice(0, 4).map((office) => {
            const officeStatus = getOfficeStatus(office);
            return (
              <div className="activity-row" key={office.id}>
                <div className={`activity-avatar ${officeStatus}`}>
                  {statusInfo[officeStatus].icon}
                </div>
                <div>
                  <strong>{office.name}</strong>
                  <span>Marcada como <b>{statusInfo[officeStatus].label.toLowerCase()}</b></span>
                </div>
                <time>{office.updated}</time>
              </div>
            );
          })}
        </div>
      </article>
      <article className="panel acts-progress-panel">
        <div className="panel-heading">
          <div>
            <h2>Actas de escrutinio digitalizadas</h2>
            <p>Actas asociadas a zonas digitalizadas</p>
          </div>
        </div>
        <div className="acts-progress">
          <div className="acts-progress-number">
            <strong>{formatNumber(stats.digitizedActs)}</strong>
            <span>de {formatNumber(stats.totalActs)} actas</span>
          </div>
          <div className="acts-progress-bar">
            <span style={{ width: `${stats.digitizedActsProgress}%` }} />
          </div>
          <strong className="acts-progress-percent">{stats.digitizedActsProgress}%</strong>
        </div>
        <div className="panel-footer">
          <span>{formatNumber(stats.digitizedZones)} de {formatNumber(stats.total)} zonas completadas</span>
          <b>{formatNumber(stats.totalActs)} actas totales</b>
        </div>
      </article>
    </section>
  );
}