
import { useEffect, useState } from 'react';

const formatNumber = (value) => new Intl.NumberFormat('es-EC').format(value);
const formatUpdatedAt = (value) => new Intl.DateTimeFormat('es-EC', {
  dateStyle: 'short',
  timeStyle: 'short',
}).format(value);

const getCumulativeStatuses = (statuses, total) => {
  let cumulativeCount = 0;

  const cumulativeStatuses = statuses.reduceRight((result, status) => {
    cumulativeCount += status.count;

    result.unshift({
      ...status,
      count: cumulativeCount,
      percentage: total ? Math.round((cumulativeCount / total) * 100) : 0,
    });
    return result;
  }, []);

  if (!statuses.length) return cumulativeStatuses;

  cumulativeStatuses[0] = {
    ...cumulativeStatuses[0],
    count: statuses[0].count,
    percentage: total ? Math.round((statuses[0].count / total) * 100) : 0,
  };

  return cumulativeStatuses;
};

const getActaProgress = (offices) => {
  const totals = offices.reduce((result, office) => {
    const scrutiny = office.actasDigitalizadas?.escrutinio || {};
    const installation = office.actasDigitalizadas?.instalacion || {};
    const total = (office.juntasMen + office.juntasWomen) * 4;
    const digitalized = [
      ...(scrutiny.hombres || []),
      ...(scrutiny.mujeres || []),
      ...(installation.hombres || []),
      ...(installation.mujeres || []),
    ].filter(Boolean).length;

    return {
      total: result.total + total,
      digitalized: result.digitalized + digitalized,
    };
  }, { total: 0, digitalized: 0 });

  return {
    ...totals,
    pending: totals.total - totals.digitalized,
    percentage: totals.total ? Math.round((totals.digitalized / totals.total) * 100) : 0,
  };
};

export default function OverviewCharts({ offices, stats, statusInfo, getOfficeStatus }) {
  const [updatedAt, setUpdatedAt] = useState(() => new Date());

  useEffect(() => {
    const updateClock = () => setUpdatedAt(new Date());
    const intervalId = window.setInterval(updateClock, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const statusCounts = getCumulativeStatuses(Object.keys(statusInfo).map((status) => ({
    status,
    ...statusInfo[status],
    count: offices.filter((office) => getOfficeStatus(office) === status).length,
  })), offices.length);
  const notStartedCount = offices.filter((office) => getOfficeStatus(office) === 'sinEmpezar').length;
  const startedCount = offices.length - notStartedCount;
  const circunscriptionOrder = [
    'EUROPA, OCEANÍA Y ASIA',
    'CANADÁ Y ESTADOS UNIDOS',
    'LATINOAMÉRICA, EL CARIBE Y ÁFRICA',
  ];
  const circunscriptionProgress = [...new Set(offices.map((office) => office.circunscription))]
    .sort((a, b) => {
      const positionA = circunscriptionOrder.indexOf(a);
      const positionB = circunscriptionOrder.indexOf(b);
      return (positionA === -1 ? circunscriptionOrder.length : positionA)
        - (positionB === -1 ? circunscriptionOrder.length : positionB);
    })
    .map((circunscription) => {
      const circunscriptionOffices = offices
        .filter((office) => office.circunscription === circunscription);
      const statusItems = getCumulativeStatuses(Object.keys(statusInfo).map((status) => ({
        status,
        ...statusInfo[status],
        count: circunscriptionOffices
          .filter((office) => getOfficeStatus(office) === status)
          .length,
      })), circunscriptionOffices.length);

      return {
        circunscription,
        officeCount: circunscriptionOffices.length,
        ...getActaProgress(circunscriptionOffices),
        statuses: statusItems,
      };
    });
  const totalActasProgress = getActaProgress(offices);

  return (
    <section className="overview-grid">
      {/* Tarjeta de Donut / Progreso Ponderado */}
      <article className="panel progress-panel">
        <div className="panel-heading">
          <div>
            <h2>Avance general</h2>
            <p>Porcentaje ponderado según electores</p>
            <p>Faltan {formatNumber(notStartedCount)} por empezar y {formatNumber(startedCount)} empezadas de {formatNumber(offices.length)}</p>
          </div>
        </div>
        <div className="progress-content">
          <div className="donut" style={{ '--percent': `${stats.average * 3.6}deg` }}>
            <div>
              <strong>{stats.average}%</strong>
              <span>zonas consulares</span>
            </div>
          </div>
          <div className="legend">
            {statusCounts.map((item) => (
              <div className="legend-row" key={item.label}>
                <span className="legend-label">
                  <i style={{ backgroundColor: item.color }} />
                  {item.label}
                </span>
                <b className="legend-value">
                  {item.status === 'sinEmpezar'
                    ? (
                      <>
                        De <strong className="legend-highlight">{formatNumber(offices.length)}</strong>
                        Pendiente <strong className="legend-highlight">{formatNumber(item.count)}</strong>
                      </>
                    )
                    : (
                      <>
                        {item.count} / {offices.length}
                        <small>{item.percentage}%</small>
                      </>
                    )}
                </b>
              </div>
            ))}
          </div>
        </div>
        <div className="panel-footer">
          <span><i className="green-dot" /> Electores registrados: <b>{formatNumber(stats.electors)}</b></span>
          <span className="target">{formatNumber(stats.juntas)} juntas · {formatNumber(stats.totalActs)} actas</span>
          <span className="updated-at">Actualizado: {formatUpdatedAt(updatedAt)}</span>
        </div>
      </article>

      {/* Avance por circunscripción */}
      <article className="panel circunscription-progress-panel">
        <div className="panel-heading">
          <div>
            <h2>Avance por circunscripción</h2>
            <p>Digitalización de actas de escrutinio e instalación</p>
          </div>
          <strong className="circunscription-total-progress">{totalActasProgress.percentage}% general</strong>
        </div>
        <div className="circunscription-progress-list">
          {circunscriptionProgress.map((item) => (
            <div className="circunscription-progress-row" key={item.circunscription}>
              <div className="circunscription-progress-header">
                <strong>{item.circunscription}</strong>
                <b>{item.percentage}%</b>
              </div>
              <div className="circunscription-progress-track">
                <span style={{ width: `${item.percentage}%` }} />
              </div>
              <div className="circunscription-progress-details">
                <span>{formatNumber(item.digitalized)} digitalizadas</span>
                <span>{formatNumber(item.pending)} pendientes</span>
                <span>{formatNumber(item.total)} totales</span>
              </div>
              <div className="circunscription-status-list">
                {item.statuses.map((status) => (
                  <span className="circunscription-status" key={status.status}>
                    <i style={{ backgroundColor: status.color }} />
                    <span>{status.label}</span>
                    <b>
                      {status.status === 'sinEmpezar'
                        ? `De ${formatNumber(item.officeCount)}, pendiente ${formatNumber(status.count)}`
                        : status.count}
                    </b>
                    {status.status !== 'sinEmpezar' && <small>{status.percentage}%</small>}
                  </span>
                ))}
              </div>
            </div>
          ))}
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