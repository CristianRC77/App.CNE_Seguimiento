import { useMemo, useState } from 'react';
import { initialOfficesData } from './assets/data/initialOffices';
import { statusInfo, milestones } from './assets/constants/cneConstants';
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
  if (completed >= 5) return 'finalizado';
  if (completed === 4) return 'escrutinio';
  if (completed >= 3) return 'cierre';
  if (completed === 0) return 'sinEmpezar';
  if (completed === 1) return 'instalacion';
  return 'inicio';
};

const getElectorWeightedProgress = (offices) => {
  const totalElectors = offices.reduce((sum, office) => sum + office.electors, 0);
  if (!totalElectors) return 0;
  return Math.round(offices.reduce((sum, office) => sum + office.electors * office.progress, 0) / totalElectors);
};

export default function App() {
  const [activeTab, setActiveTab] = useState('resumen');
  const [filter, setFilter] = useState('Todas');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(2);

  const [offices, setOffices] = useState(
    initialOfficesData.map((office) => ({
      ...office,
      milestones: milestones.reduce((result, milestone, index) => {
        result[milestone.id] = office.progress === 100 || index < Math.ceil((office.progress / 100) * milestones.length);
        return result;
      }, {}),
    }))
  );

  const filteredOffices = useMemo(() => {
    return offices.filter((office) => {
      const matchesFilter = filter === 'Todas' || statusInfo[getOfficeStatus(office)].label === filter;
      const matchesSearch = `${office.name} ${office.country} ${office.zone} ${office.circunscription}`.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [offices, filter, search]);

  const stats = useMemo(() => ({
    total: offices.length,
    completed: offices.filter((office) => getOfficeStatus(office) === 'finalizado').length,
    average: getElectorWeightedProgress(offices),
    electors: offices.reduce((sum, office) => sum + office.electors, 0),
    juntas: offices.reduce((sum, office) => sum + office.juntas, 0),
    totalActs: offices.reduce((sum, office) => sum + office.juntas * 3, 0),
    digitizedZones: offices.filter((office) => office.milestones.digitalizacionEscrutinio).length,
    digitizedActs: offices.reduce(
      (sum, office) => sum + (office.milestones.digitalizacionEscrutinio ? office.juntas * 3 : 0),
      0
    ),
    digitizedActsProgress: offices.reduce((sum, office) => sum + office.juntas * 3, 0)
      ? Math.round(offices.reduce(
        (sum, office) => sum + (office.milestones.digitalizacionEscrutinio ? office.juntas * 3 : 0),
        0
      ) / offices.reduce((sum, office) => sum + office.juntas * 3, 0) * 100)
      : 0,
  }), [offices]);

  const updateMilestone = (id, milestoneId) => {
    setOffices((current) =>
      current.map((office) =>
        office.id === id
          ? (() => {
              const milestoneIndex = milestones.findIndex((milestone) => milestone.id === milestoneId);
              const completedMilestones = milestones.map((milestone) => Boolean(office.milestones[milestone.id]));
              const isChecked = completedMilestones[milestoneIndex];
              const isNextToMark = !isChecked
                && completedMilestones.slice(0, milestoneIndex).every(Boolean);
              const isLastToUnmark = isChecked
                && completedMilestones.slice(milestoneIndex + 1).every((completed) => !completed);

              if (!isNextToMark && !isLastToUnmark) return office;

              const nextMilestones = { ...office.milestones, [milestoneId]: !office.milestones[milestoneId] };
              return {
                ...office,
                milestones: nextMilestones,
                progress: Math.round((Object.values(nextMilestones).filter(Boolean).length / milestones.length) * 100),
                updated: 'Justo ahora',
              };
            })()
          : office
      )
    );
  };

  const selectedOffice = offices.find((office) => office.id === selectedId) || offices[0];

  return (
    <div className="dashboard-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="main-content">
        <DashboardHeader activeTab={activeTab} onExport={() => exportOfficesToCSV(offices)} />
        <MetricsGrid stats={stats} />

        <section className="content-body">
          {/* Vista: RESUMEN GENERAL */}
          {activeTab === 'resumen' && (
            <>
              <OverviewCharts 
                offices={offices} 
                stats={stats} 
                statusInfo={statusInfo} 
                getOfficeStatus={getOfficeStatus} 
              />
              <OfficesTable
                offices={offices}
                filteredOffices={filteredOffices}
                filter={filter}
                setFilter={setFilter}
                search={search}
                setSearch={setSearch}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                statusInfo={statusInfo}
                getOfficeStatus={getOfficeStatus}
              />
            </>
          )}

          {/* Vista: ASIGNACIÓN / TABLA DE OFICINAS */}
          {activeTab === 'oficinas' && (
            <OfficesTable
              offices={offices}
              filteredOffices={filteredOffices}
              filter={filter}
              setFilter={setFilter}
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
              offices={offices}
              selectedOffice={selectedOffice}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              milestones={milestones}
              updateMilestone={updateMilestone}
              getOfficeStatus={getOfficeStatus}
              statusInfo={statusInfo}
            />
          )}

          {/* Vista: REPORTES */}
          {activeTab === 'reportes' && (
            <div className="tab-view reports-container">
              <h2>Módulo de Exportación de Datos</h2>
              <p>Descarga el estado completo consolidado de las oficinas consulares en formato estándar CSV / Excel.</p>
              <br />
              <button className="export-btn-large" onClick={() => exportOfficesToCSV(offices)}>
                📄 Exportar Listado Consolidado (CSV / Excel)
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}