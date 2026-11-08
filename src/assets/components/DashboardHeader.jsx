export default function DashboardHeader({ activeTab, onExport }) {
  const titles = {
    resumen: 'Resumen General del Proceso',
    oficinas: 'Avances de Oficinas Consulares',
    avances: 'Registro de Hitos Electorales',
    reportes: 'Módulo de Reportes Electorales',
  };

  return (
    <header className="content-header">
      <div>
        <span className="eyebrow">CONSEJO NACIONAL ELECTORAL · ECUADOR</span>
        <h1>{titles[activeTab] || 'Panel de Control'}</h1>
      </div>
      <button className="export-btn" onClick={onExport}>
        ⇩ Exportar CSV/Excel
      </button>
    </header>
  );
}