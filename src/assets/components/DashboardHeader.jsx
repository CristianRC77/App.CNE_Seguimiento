export default function DashboardHeader({ activeTab }) {
  // Relaciona cada pestaña con el título que debe ver el usuario.
  const titles = {
    resumen: 'Resumen General de Zonas Electorales',
    oficinas: 'Avances por Zonas Electorales',
    avances: 'Registro de Avances de Zonas Electorales',
    reportes: 'Reportes Electorales',
  };

  // Si llega una pestaña desconocida, se muestra un título seguro por defecto.
  return (
    <header className="content-header">
      <div>
        <span className="eyebrow">CONSEJO NACIONAL ELECTORAL</span>
        <h1>{titles[activeTab] || 'Panel de Control'}</h1>
      </div>
    </header>
  );
}