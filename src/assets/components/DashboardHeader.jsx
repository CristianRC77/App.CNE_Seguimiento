export default function DashboardHeader({ activeTab }) {
  const titles = {
    resumen: 'Resumen General del Proceso',
    oficinas: 'Avances de Oficinas Consulares',
    avances: 'Registro de Hitos Electorales',
    reportes: 'Reportes Electorales',
  };

  return (
    <header className="content-header">
      <div>
        <span className="eyebrow">CONSEJO NACIONAL ELECTORAL</span>
        <h1>{titles[activeTab] || 'Panel de Control'}</h1>
      </div>
    </header>
  );
}