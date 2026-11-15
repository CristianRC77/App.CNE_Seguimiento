
import { useEffect, useState } from 'react';

const formatNumber = (value) => new Intl.NumberFormat('es-EC').format(value);
const formatUpdatedAt = (value) => new Intl.DateTimeFormat('es-EC', {
  dateStyle: 'short',
  timeStyle: 'short',
}).format(value);

const getWholePercentages = (counts, total) => {
  if (!total) return counts.map(() => 0);

  const percentages = counts.map((count) => {
    const exact = (count / total) * 100;
    return { value: Math.floor(exact), remainder: exact - Math.floor(exact) };
  });
  let pointsToDistribute = 100 - percentages.reduce((sum, item) => sum + item.value, 0);

  percentages
    .map((item, index) => ({ ...item, index }))
    .sort((a, b) => b.remainder - a.remainder)
    .slice(0, pointsToDistribute)
    .forEach(({ index }) => {
      percentages[index].value += 1;
    });

  return percentages.map((item) => item.value);
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

  const statusCounts = Object.keys(statusInfo).map((status) => ({
    ...statusInfo[status],
    count: offices.filter((office) => getOfficeStatus(office) === status).length,
  }));
  const wholePercentages = getWholePercentages(
    statusCounts.map((item) => item.count),
    offices.length
  );
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
      const statusItems = Object.keys(statusInfo).map((status) => ({
        status,
        ...statusInfo[status],
        count: circunscriptionOffices
          .filter((office) => getOfficeStatus(office) === status)
          .length,
      }));

      return {
        circunscription,
        ...getActaProgress(circunscriptionOffices),
        statuses: statusItems,
        statusPercentages: getWholePercentages(
          statusItems.map((item) => item.count),
          circunscriptionOffices.length
        ),
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
            {statusCounts.map((item, index) => (
              <div className="legend-row" key={item.label}>
                <span className="legend-label">
                  <i style={{ backgroundColor: item.color }} />
                  {item.label}
                </span>
                <b className="legend-value">
                  {item.count}/{offices.length}
                  <small>{wholePercentages[index]}%</small>
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
                {item.statuses.map((status, index) => (
                  <span className="circunscription-status" key={status.status}>
                    <i style={{ backgroundColor: status.color }} />
                    <span>{status.label}</span>
                    <b>{status.count}</b>
                    <small>{item.statusPercentages[index]}%</small>
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