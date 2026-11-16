import { useEffect, useMemo, useRef, useState } from 'react';
import { initialOfficesData } from './assets/data/initialOffices';
import { statusInfo, milestones } from './assets/constants/cneConstants';
import {
  getCachedSeguimiento,
  loadSeguimiento,
  saveSeguimiento,
  subscribeToSeguimiento,
} from './assets/data/seguimientoService';
import { exportOfficesToCSV } from './assets/utils/exportUtils';
import Sidebar from './assets/components/Sidebar';
import DashboardHeader from './assets/components/DashboardHeader';
import MetricsGrid from './assets/components/MetricsGrid';
import OverviewCharts from './assets/components/OverviewCharts';
import OfficesTable from './assets/components/OfficesTable';
import MilestoneEditor from './assets/components/MilestoneEditor';
import './App.css';

const getOfficeStatus = (office) => {
  const completed = Object.values(office.milestones || {}).filter(Boolean).length;
  if (completed >= 6 && areActasComplete(office, 'escrutinio') && areActasComplete(office, 'instalacion')) {
    return 'finalizado';
  }
  if (completed >= 5) return 'digitalizacion';
  if (completed >= 3) return 'cierre';
  if (completed === 0) return 'sinEmpezar';
  return 'instalacion';
};

const getDigitalizedScrutinyActs = (office) => {
  const scrutinyActs = office.actasDigitalizadas?.escrutinio || {};
  return [...(scrutinyActs.hombres || []), ...(scrutinyActs.mujeres || [])]
    .filter(Boolean)
    .length;
};

const getDigitalizedInstallationActs = (office) => {
  const installationActs = office.actasDigitalizadas?.instalacion || {};
  return [...(installationActs.hombres || []), ...(installationActs.mujeres || [])]
    .filter(Boolean)
    .length;
};

const getTotalActas = (office, type) => {
  const multiplier = type === 'escrutinio' ? 3 : 1;
  return (office.juntasMen + office.juntasWomen) * multiplier;
};

const getGeneralProgress = (office) => {
  const completedMilestones = Object.values(office.milestones || {}).filter(Boolean).length;
  const totalScrutinyActs = getTotalActas(office, 'escrutinio');
  const totalInstallationActs = getTotalActas(office, 'instalacion');
  const scrutinyProgress = totalScrutinyActs
    ? getDigitalizedScrutinyActs(office) / totalScrutinyActs
    : 0;
  const installationProgress = totalInstallationActs
    ? getDigitalizedInstallationActs(office) / totalInstallationActs
    : 0;
  const completedBeforeDigitalization = Math.min(completedMilestones, 4);

  return Math.round((
    completedBeforeDigitalization + scrutinyProgress + installationProgress
  ) / milestones.length * 100);
};

const areActasComplete = (office, type) => {
  const totalActas = getTotalActas(office, type);
  const digitalizedActas = type === 'escrutinio'
    ? getDigitalizedScrutinyActs(office)
    : getDigitalizedInstallationActs(office);
  return totalActas > 0 && digitalizedActas === totalActas;
};

const createInitialOffices = () => initialOfficesData.map((office) => ({
  ...office,
  actasDigitalizadas: {
    escrutinio: { hombres: [], mujeres: [] },
    instalacion: { hombres: [], mujeres: [] },
  },
  milestones: milestones.reduce((result, milestone, index) => {
    result[milestone.id] = office.progress === 100
      || index < Math.ceil((office.progress / 100) * milestones.length);
    return result;
  }, {}),
}));

const normalizeActas = (office) => {
  const normalizeType = (type, multiplier) => {
    const savedActas = office.actasDigitalizadas?.[type] || {};
    const totalHombres = office.juntasMen * multiplier;
    const totalMujeres = office.juntasWomen * multiplier;

    return {
      hombres: Array.from({ length: totalHombres }, (_, index) => Boolean(savedActas.hombres?.[index])),
      mujeres: Array.from({ length: totalMujeres }, (_, index) => Boolean(savedActas.mujeres?.[index])),
    };
  };

  return {
    escrutinio: normalizeType('escrutinio', 3),
    instalacion: normalizeType('instalacion', 1),
  };
};

const normalizeOffices = (offices) => offices.map((office) => {
  const actasDigitalizadas = normalizeActas(office);
  const normalizedMilestones = milestones.reduce((result, milestone, index) => {
    result[milestone.id] = Boolean(
      office.milestones?.[milestone.id]
      ?? (office.progress === 100 || index < Math.ceil((office.progress / 100) * milestones.length))
    );
    return result;
  }, {});

  normalizedMilestones.digitalizacionEscrutinio = areActasComplete(
    { ...office, actasDigitalizadas },
    'escrutinio'
  );
  normalizedMilestones.digitalizacionInstalacion = areActasComplete(
    { ...office, actasDigitalizadas },
    'instalacion'
  );

  const normalizedOffice = { ...office, actasDigitalizadas, milestones: normalizedMilestones };
  return { ...normalizedOffice, progress: getGeneralProgress(normalizedOffice) };
});

const getOfficeKey = (office) => `${office.country}|${office.zone}`;

const isExcludedFromGeneralPercentage = (office) => {
  const country = String(office.country || '').trim().toUpperCase();
  const zone = String(office.zone || '').trim().toUpperCase();

  return (country === 'CUBA' && zone.includes('HABANA'))
    || (country === 'VENEZUELA' && ['CARACAS', 'VALENCIA'].includes(zone));
};

const reconcileOffices = (offices) => {
  const initialByKey = new Map(initialOfficesData.map((office) => [getOfficeKey(office), office]));

  return normalizeOffices(offices.map((office, index) => ({
    ...(initialByKey.get(getOfficeKey(office)) || {}),
    ...office,
    id: office.id || index + 1,
  })));
};

export default function App() {
  const [activeTab, setActiveTab] = useState('resumen');
  const [filter, setFilter] = useState('Todas');
  const [circunscriptionFilter, setCircunscriptionFilter] = useState('Todas');
  const [reportFilter, setReportFilter] = useState('Todas');
  const [reportCircunscriptionFilter, setReportCircunscriptionFilter] = useState('Todas');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(2);
  const [selectedActaType, setSelectedActaType] = useState(null);
  const [offices, setOffices] = useState(() => {
    const cachedOffices = getCachedSeguimiento();
    return cachedOffices ? reconcileOffices(cachedOffices) : createInitialOffices();
  });
  const [syncStatus, setSyncStatus] = useState(() => (
    getCachedSeguimiento() ? 'Datos locales; verificando sincronización...' : 'Cargando datos...'
  ));
  const isSavingRef = useRef(false);
  const saveQueueRef = useRef(Promise.resolve());
  const saveSequenceRef = useRef(0);
  const participatingOffices = offices.filter((office) => !isExcludedFromGeneralPercentage(office));

  useEffect(() => {
    let active = true;

    const cachedOffices = getCachedSeguimiento();

    const unsubscribe = subscribeToSeguimiento(
      (savedOffices) => {
        if (active && !isSavingRef.current) {
          setOffices(reconcileOffices(savedOffices));
        }
      },
      (status) => {
        if (!active) return;
        if (status === 'SUBSCRIBED') setSyncStatus('Sincronizado en tiempo real');
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setSyncStatus('');
        }
      },
      (error) => {
        console.error('No se pudo consultar la API de seguimiento.', error);
        if (active) setSyncStatus('Guardado localmente');
      }
    );

    const loadData = async () => {
      try {
        const savedOffices = await loadSeguimiento();
        if (!active) return;
        if (savedOffices) {
          setOffices(reconcileOffices(savedOffices));
        } else if (cachedOffices) {
          await saveSeguimiento(reconcileOffices(cachedOffices));
        }
        setSyncStatus('');
      } catch (error) {
        console.error('No se pudo cargar el seguimiento desde MongoDB.', error);
        if (active) {
          setSyncStatus(cachedOffices
            ? 'Datos locales; no se pudo sincronizar'
            : 'Error de sincronización');
        }
      }
    };

    void loadData();

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const persistOffices = async (nextOffices, changedId, errorMessage) => {
    const operationId = saveSequenceRef.current + 1;
    saveSequenceRef.current = operationId;
    isSavingRef.current = true;
    setOffices(nextOffices);
    setSyncStatus('');

    const saveTask = saveQueueRef.current.then(async () => {
      try {
        const currentOffices = await loadSeguimiento();
        const changedOffice = nextOffices.find((office) => office.id === changedId);
        const currentOffice = currentOffices.find(
          (office) => office.zoneCode === changedOffice?.zoneCode
        );

        if (!changedOffice || !currentOffice) {
          throw new Error('No se encontró la oficina que se estaba actualizando.');
        }

        const officesToSave = currentOffices.map((office) => (
          office.zoneCode === changedOffice.zoneCode
            ? { ...changedOffice, dataVersion: currentOffice.dataVersion, id: currentOffice.id }
            : office
        ));
        const result = await saveSeguimiento(officesToSave, [currentOffice.id]);
        if (operationId === saveSequenceRef.current) {
          setOffices(reconcileOffices(result.offices));
        }
      } catch (error) {
        console.error(errorMessage, error);
        if (operationId !== saveSequenceRef.current) return;

        if (error.status === 409) {
          try {
            const currentOffices = await loadSeguimiento();
            setOffices(reconcileOffices(currentOffices));
            setSyncStatus('Se recargaron cambios centrales');
          } catch (reloadError) {
            console.error('No se pudo recargar la información central.', reloadError);
            setSyncStatus('Error de sincronización');
          }
        } else {
          setSyncStatus('Error al guardar');
        }
      } finally {
        if (operationId === saveSequenceRef.current) {
          isSavingRef.current = false;
        }
      }
    });

    saveQueueRef.current = saveTask.catch((error) => {
      console.error('La cola de guardado no pudo continuar.', error);
    });
    await saveTask;
  };

  const filteredOffices = useMemo(() => {
    return participatingOffices.filter((office) => {
      const matchesFilter = filter === 'Todas' || statusInfo[getOfficeStatus(office)].label === filter;
      const matchesCircunscription = circunscriptionFilter === 'Todas'
        || office.circunscription === circunscriptionFilter;
      const matchesSearch = `${office.name} ${office.country} ${office.zone} ${office.circunscription}`.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesCircunscription && matchesSearch;
    });
  }, [participatingOffices, filter, circunscriptionFilter, search]);

  const circunscriptions = useMemo(() => (
    [...new Set(participatingOffices.map((office) => office.circunscription).filter(Boolean))].sort()
  ), [participatingOffices]);

  const reportOffices = useMemo(() => {
    return participatingOffices.filter((office) => {
      const matchesStatus = reportFilter === 'Todas'
        || statusInfo[getOfficeStatus(office)].label === reportFilter;
      const matchesCircunscription = reportCircunscriptionFilter === 'Todas'
        || office.circunscription === reportCircunscriptionFilter;
      return matchesStatus && matchesCircunscription;
    });
  }, [participatingOffices, reportFilter, reportCircunscriptionFilter]);

  const reportStatusCounts = useMemo(() => (
    Object.entries(statusInfo).map(([status, info]) => ({
      status,
      label: info.label,
      count: participatingOffices.filter((office) => getOfficeStatus(office) === status).length,
    }))
  ), [participatingOffices]);

  const stats = useMemo(() => {
    const totalActs = participatingOffices.reduce((sum, office) => sum + office.juntas * 3, 0);
    const digitizedActs = participatingOffices.reduce((sum, office) => sum + getDigitalizedScrutinyActs(office), 0);

    return {
      total: participatingOffices.length,
      completed: participatingOffices.filter((office) => getOfficeStatus(office) === 'finalizado').length,
      excludedGeneralPercentage: offices.filter(isExcludedFromGeneralPercentage).length,
      average: participatingOffices.length
        ? Math.round(participatingOffices.reduce((sum, office) => sum + getGeneralProgress(office), 0) / participatingOffices.length)
        : 0,
      electors: participatingOffices.reduce((sum, office) => sum + office.electors, 0),
      juntas: participatingOffices.reduce((sum, office) => sum + office.juntas, 0),
      totalActs,
      digitizedZones: participatingOffices.filter(
        (office) => getDigitalizedScrutinyActs(office) === office.juntas * 3
      ).length,
      digitizedActs,
      digitizedActsProgress: totalActs ? Math.round((digitizedActs / totalActs) * 100) : 0,
    };
  }, [offices, participatingOffices]);

  const updateMilestone = (id, milestoneId) => {
    const office = offices.find((item) => item.id === id);
    if (!office) return;

    const milestoneIndex = milestones.findIndex((milestone) => milestone.id === milestoneId);
    const completedMilestones = milestones.map((milestone) => Boolean(office.milestones[milestone.id]));
    const isChecked = completedMilestones[milestoneIndex];
    const isDigitalization = milestoneIndex >= 4;
    const isNextToMark = !isChecked && (
      isDigitalization
        ? completedMilestones[3]
        : completedMilestones.slice(0, milestoneIndex).every(Boolean)
    );
    const isLastToUnmark = isChecked && (
      isDigitalization
        ? true
        : completedMilestones.slice(milestoneIndex + 1).every((completed) => !completed)
    );

    if (!isNextToMark && !isLastToUnmark) return;

    const nextMilestones = { ...office.milestones, [milestoneId]: !isChecked };
    const nextOffices = offices.map((item) => item.id === id
      ? {
          ...item,
          milestones: nextMilestones,
          updated: 'Justo ahora',
        }
      : item);
    const updatedOffice = nextOffices.find((item) => item.id === id);
    const officesWithProgress = nextOffices.map((item) => item.id === id
      ? { ...item, progress: getGeneralProgress(updatedOffice) }
      : item);

    void persistOffices(
      officesWithProgress,
      id,
      'No se pudo guardar el seguimiento en MongoDB.'
    );
  };

  const updateActa = (id, actaType, gender, actaIndex) => {
    const nextOffices = offices.map((office) => {
      if (office.id !== id) return office;

      const currentActas = office.actasDigitalizadas?.[actaType]?.[gender] || [];
      const nextActas = [...currentActas];
      nextActas[actaIndex] = !nextActas[actaIndex];
      const nextActasDigitalizadas = {
        ...office.actasDigitalizadas,
        [actaType]: {
          ...office.actasDigitalizadas[actaType],
          [gender]: nextActas,
        },
      };
      const nextOffice = {
        ...office,
        actasDigitalizadas: nextActasDigitalizadas,
        milestones: {
          ...office.milestones,
          [actaType === 'escrutinio'
            ? 'digitalizacionEscrutinio'
            : 'digitalizacionInstalacion']: false,
        },
        updated: 'Justo ahora',
      };
      nextOffice.milestones[actaType === 'escrutinio'
        ? 'digitalizacionEscrutinio'
        : 'digitalizacionInstalacion'] = areActasComplete(nextOffice, actaType);

      return { ...nextOffice, progress: getGeneralProgress(nextOffice) };
    });

    void persistOffices(
      nextOffices,
      id,
      'No se pudo guardar la digitalización de actas.'
    );
  };

  const markAllActas = (id, actaType) => {
    const nextOffices = offices.map((office) => {
      if (office.id !== id) return office;

      const multiplier = actaType === 'escrutinio' ? 3 : 1;
      const nextActas = {
        hombres: Array(office.juntasMen * multiplier).fill(true),
        mujeres: Array(office.juntasWomen * multiplier).fill(true),
      };
      const nextOffice = {
        ...office,
        actasDigitalizadas: {
          ...office.actasDigitalizadas,
          [actaType]: nextActas,
        },
        milestones: {
          ...office.milestones,
          [actaType === 'escrutinio'
            ? 'digitalizacionEscrutinio'
            : 'digitalizacionInstalacion']: true,
        },
        updated: 'Justo ahora',
      };

      return { ...nextOffice, progress: getGeneralProgress(nextOffice) };
    });

    void persistOffices(
      nextOffices,
      id,
      'No se pudo guardar la digitalización completa de actas.'
    );
  };

  const unmarkAllActas = (id, actaType) => {
    const nextOffices = offices.map((office) => {
      if (office.id !== id) return office;

      const multiplier = actaType === 'escrutinio' ? 3 : 1;
      const nextActas = {
        hombres: Array(office.juntasMen * multiplier).fill(false),
        mujeres: Array(office.juntasWomen * multiplier).fill(false),
      };
      const nextOffice = {
        ...office,
        actasDigitalizadas: {
          ...office.actasDigitalizadas,
          [actaType]: nextActas,
        },
        milestones: {
          ...office.milestones,
          [actaType === 'escrutinio'
            ? 'digitalizacionEscrutinio'
            : 'digitalizacionInstalacion']: false,
        },
        updated: 'Justo ahora',
      };

      return { ...nextOffice, progress: getGeneralProgress(nextOffice) };
    });

    void persistOffices(
      nextOffices,
      id,
      'No se pudo desmarcar la digitalización de actas.'
    );
  };

  const selectedOffice = participatingOffices.find((office) => office.id === selectedId)
    || participatingOffices[0];

  return (
    <div className="dashboard-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="main-content">
        <DashboardHeader activeTab={activeTab} />
        <MetricsGrid stats={stats} />

        {syncStatus && <div className="sync-status" role="status">{syncStatus}</div>}
        <section className="content-body">
          {/* Vista: RESUMEN GENERAL */}
          {activeTab === 'resumen' && (
            <>
              <OverviewCharts 
                offices={participatingOffices} 
                stats={stats} 
                statusInfo={statusInfo} 
                getOfficeStatus={getOfficeStatus} 
              />
            </>
          )}

          {/* Vista: ASIGNACIÓN / TABLA DE OFICINAS */}
          {activeTab === 'oficinas' && (
            <OfficesTable
              offices={participatingOffices}
              filteredOffices={filteredOffices}
              filter={filter}
              setFilter={setFilter}
              circunscriptionFilter={circunscriptionFilter}
              setCircunscriptionFilter={setCircunscriptionFilter}
              circunscriptions={circunscriptions}
              search={search}
              setSearch={setSearch}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              statusInfo={statusInfo}
              getOfficeStatus={getOfficeStatus}
            />
          )}

          {/* Vista: MARCAR AVANCES */}
          {activeTab === 'avances' && (
            <MilestoneEditor
              offices={participatingOffices}
              selectedOffice={selectedOffice}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              selectedActaType={selectedActaType}
              setSelectedActaType={setSelectedActaType}
              milestones={milestones}
              updateMilestone={updateMilestone}
              updateActa={updateActa}
              markAllActas={markAllActas}
              unmarkAllActas={unmarkAllActas}
              getOfficeStatus={getOfficeStatus}
              statusInfo={statusInfo}
            />
          )}

          {/* Vista: REPORTES */}
          {activeTab === 'reportes' && (
            <div className="tab-view reports-container">
              <h2>Reportes de seguimiento</h2>
              <p>Selecciona una circunscripción o estado para consultar y exportar únicamente las oficinas correspondientes.</p>

              <div className="filter-tabs report-filter-tabs">
                <div className="report-circunscription-filter">
                  <label htmlFor="report-circunscription-filter">Circunscripciones:</label>
                  <select
                    id="report-circunscription-filter"
                    className="circunscription-select"
                    value={reportCircunscriptionFilter}
                    onChange={(event) => setReportCircunscriptionFilter(event.target.value)}
                  >
                    <option value="Todas">Todas las circunscripciones</option>
                    {circunscriptions.map((circunscription) => (
                      <option key={circunscription} value={circunscription}>
                        {circunscription}
                      </option>
                    ))}
                  </select>
                </div>
                {['Todas', ...Object.values(statusInfo).map(({ label }) => label)].map((option) => (
                  <button
                    key={option}
                    className={`filter-btn ${reportFilter === option ? 'active' : ''}`}
                    onClick={() => setReportFilter(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <div className="report-total">
                <strong>{reportOffices.length}</strong>
                <span>
                  {reportFilter !== 'Todas'
                    ? `oficinas con estado "${reportFilter}"`
                    : reportCircunscriptionFilter !== 'Todas'
                      ? `oficinas de ${reportCircunscriptionFilter}`
                      : 'oficinas en total'}
                </span>
              </div>

              <div className="milestone-summary report-summary">
                {reportStatusCounts.map(({ status, label, count }) => (
                  <div key={status}>
                    <strong className={status}>{count}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              <button
                className="export-btn-large"
                onClick={() => exportOfficesToCSV(reportOffices)}
                disabled={!reportOffices.length}
              >
                📄 Exportar reporte ({reportOffices.length} oficinas)
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}