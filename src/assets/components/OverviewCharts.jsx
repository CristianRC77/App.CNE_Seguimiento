
import { useEffect, useState } from 'react';
import { getCompletionPercentage } from '../constants/cneConstants';

// Formatea cantidades con separadores usados en Ecuador.
const formatNumber = (value) => new Intl.NumberFormat('es-EC').format(value);
// Presenta la hora de actualización del panel según la configuración regional.
const formatUpdatedAt = (value) => new Intl.DateTimeFormat('es-EC', {
  dateStyle: 'short',
  timeStyle: 'short',
  hourCycle: 'h23',
}).format(value);

const getCumulativeStatuses = (statuses, total) => {
  let cumulativeCount = 0;

  // Cada estado muestra también la acumulación de los estados posteriores.
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

// Resume actas totales, digitalizadas y pendientes para una lista de zonas.
const getActaProgress = (offices) => {
  const totals = offices.reduce((result, office) => {
    const scrutiny = office.actasDigitalizadas?.escrutinio || {};
    const installation = office.actasDigitalizadas?.instalacion || {};
    // Cada junta aporta tres actas de escrutinio y una de instalación.
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
    percentage: getCompletionPercentage(totals.digitalized, totals.total),
  };
};

export default function OverviewCharts({ offices, stats, statusInfo, getOfficeStatus }) {
  // Se actualiza el reloj del panel cada minuto sin recargar los datos.
  const [updatedAt, setUpdatedAt] = useState(() => new Date());

  useEffect(() => {
    const updateClock = () => setUpdatedAt(new Date());
    const intervalId = window.setInterval(updateClock, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  // Cuenta zonas por estado para construir la leyenda del gráfico.
  const statusCounts = getCumulativeStatuses(Object.keys(statusInfo).map((status) => ({
    status,
    ...statusInfo[status],
    count: offices.filter((office) => getOfficeStatus(office) === status).length,
  })), offices.length);
  // Define el orden institucional en que se muestran las circunscripciones.
  const circunscriptionOrder = [
    'EUROPA, OCEANÍA Y ASIA',
    'CANADÁ Y ESTADOS UNIDOS',
    'LATINOAMÉRICA, EL CARIBE Y ÁFRICA',
  ];
  // Agrupa zonas por circunscripción y calcula su progreso de actas.
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
  // Calcula el indicador global de actas para el tercer panel.
  const totalActasProgress = getActaProgress(offices);

  return (
    <section className="overview-grid">
      {/* Tarjeta de Donut / Progreso Ponderado */}
      <article className="panel progress-panel">
        <div className="panel-heading">
          <div>
            <h2>Avance general</h2>
            <p>Porcentaje según electores</p>
          </div>
        </div>
        <div className="progress-content">
          <div className="donut" style={{ '--percent': `${stats.average * 3.6}deg` }}>
            <div>
              <strong>{stats.average}%</strong>
              <span>Zonas Consulares</span>
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
          <span className="text-muted">{formatNumber(stats.juntas)}  Juntas · {formatNumber(stats.totalScrutinyActs)} Actas de Escrutinio</span>
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
            <h2>Actas digitalizadas Escrutinio - Instalación</h2>
            <p>Progreso de actas digitalizadas en los procesos de escrutinio e instalación</p>
          </div>
        </div>
        <div className="acts-progress">
          <div className="acts-progress-number">
            <strong>{formatNumber(stats.digitizedActs)}</strong>
            <span>de {formatNumber(stats.totalScrutinyActs)} de escrutinio</span>
          </div>
          <div className="acts-progress-bar">
            <span style={{ width: `${stats.digitizedActsProgress}%` }} />
          </div>
          <strong className="acts-progress-percent">{stats.digitizedActsProgress}%</strong>
        </div>
        <div className="acts-progress">
          <div className="acts-progress-number">
            <strong>{formatNumber(stats.digitizedInstallationActs)}</strong>
            <span>de {formatNumber(stats.totalInstallationActs)} de instalación</span>
          </div>
          <div className="acts-progress-bar">
            <span style={{ width: `${stats.installationActsProgress}%` }} />
          </div>
          <strong className="acts-progress-percent">{stats.installationActsProgress}%</strong>
        </div>
        <div className="panel-footer">
          <span>{formatNumber(stats.digitizedZones)} de {formatNumber(stats.total)} zonas completadas</span>
          <b>{formatNumber(stats.totalActs)} actas totales</b>
        </div>
      </article>
    </section>
  );
}