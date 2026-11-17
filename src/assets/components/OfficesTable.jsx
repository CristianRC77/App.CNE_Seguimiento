import { useMemo, useState } from 'react';

// Mantiene consistentes los números de electores y juntas en la tabla.
const formatNumber = (value) => new Intl.NumberFormat('es-EC').format(value);
const ROWS_PER_PAGE = 15;

export default function OfficesTable({ 
  filteredOffices, 
  filter, 
  setFilter, 
  circunscriptionFilter,
  setCircunscriptionFilter,
  circunscriptions,
  search, 
  setSearch, 
  selectedId, 
  setSelectedId, 
  statusInfo, 
  getOfficeStatus 
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredOffices.length / ROWS_PER_PAGE));
  const pageForDisplay = Math.min(currentPage, totalPages);

  // Solo se renderizan las 15 filas correspondientes a la página actual.
  const visibleOffices = useMemo(() => {
    const startIndex = (pageForDisplay - 1) * ROWS_PER_PAGE;
    return filteredOffices.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [pageForDisplay, filteredOffices]);

  // Los cambios de filtro reinician la paginación para mostrar el primer resultado.
  const changePageFilter = (updateFilter) => {
    setCurrentPage(1);
    updateFilter();
  };

  // Esta vista presenta los datos paginados; los filtros y la selección se controlan en App.
  return (
    <div className="tab-view table-section">
      <div className="table-controls">
        {/* Filtros de circunscripción y búsqueda textual. */}
        <div className="table-input-filters">
          <div className="table-filter-group">
            <label htmlFor="circunscription-filter">Circunscripciones:</label>
            <select
              id="circunscription-filter"
              className="circunscription-select table-circunscription-filter"
              value={circunscriptionFilter}
              onChange={(e) => changePageFilter(
                () => setCircunscriptionFilter(e.target.value)
              )}
            >
              <option value="Todas">Todas las circunscripciones</option>
              {circunscriptions.map((circunscription) => (
                <option key={circunscription} value={circunscription}>
                  {circunscription}
                </option>
              ))}
            </select>
          </div>
          <div className="table-filter-group">
            <label htmlFor="office-search">Buscar por:</label>
            <input
              id="office-search"
              type="text"
              className="search-input"
              placeholder="Oficina, país o zona..."
              value={search}
              onChange={(e) => changePageFilter(() => setSearch(e.target.value))}
            />
          </div>
        </div>
        <div className="filter-tabs">
          {/* Los estados disponibles se construyen desde la configuración central. */}
          {['Todas', ...Object.values(statusInfo).map(({ label }) => label)].map((tab) => (
            <button
              key={tab}
              className={`filter-btn ${filter === tab ? 'active' : ''}`}
              onClick={() => changePageFilter(() => setFilter(tab))}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* La tabla recibe únicamente las oficinas que ya pasaron los filtros. */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Oficina Consular</th>
              <th>Zona Electoral</th>
              <th>Electores</th>
              <th>Juntas</th>
              <th>No. Actas ESC</th>
              <th>Estado</th>
              <th>Avance</th>
            </tr>
          </thead>
          <tbody>
            {visibleOffices.map((office) => {
              // Se calcula una sola vez el estado para reutilizarlo en etiqueta y barra.
              const statusKey = getOfficeStatus(office);
              return (
                <tr
                  key={office.id}
                  className={selectedId === office.id ? 'selected-row' : ''}
                  onClick={() => setSelectedId(office.id)}
                >
                  <td>
                    <strong>{office.name}</strong>
                    <span className="subtext">{office.country} · {office.type}</span>
                  </td>
                  <td>{office.zone}</td>
                  <td>
                    <strong>{formatNumber(office.electors)}</strong>
                    <span className="subtext">{formatNumber(office.men)} H / {formatNumber(office.women)} M</span>
                  </td>
                  <td>
                    {office.juntas}
                    <span className="subtext">{office.juntasMen} H / {office.juntasWomen} M</span>
                  </td>
                  <td>
                    {office.juntas*3}
                    <span className="subtext">{office.juntasMen*3} H / {office.juntasWomen*3} M</span>
                  </td>
                  <td>
                    <span className={`status-pill ${statusKey}`}>
                      {statusInfo[statusKey].label}
                    </span>
                  </td>
                  <td>
                    <div className="progress-bar-container">
                      <div className="progress-track">
                        <div
                          className={`progress-bar-fill ${statusKey}`}
                          style={{ width: `${office.progress}%` }}
                        />
                      </div>
                      <span className="progress-text">{office.progress}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="table-pagination" aria-label="Paginación de zonas electorales">
        <span>
          {filteredOffices.length === 0
            ? 'Sin resultados'
            : `Página ${pageForDisplay} de ${totalPages} · ${filteredOffices.length} zonas`}
        </span>
        <div className="pagination-actions">
          <button
            type="button"
            className="pagination-btn"
            onClick={() => setCurrentPage(Math.max(1, pageForDisplay - 1))}
            disabled={pageForDisplay === 1}
          >
            Anterior
          </button>
          <button
            type="button"
            className="pagination-btn"
            onClick={() => setCurrentPage(Math.min(totalPages, pageForDisplay + 1))}
            disabled={pageForDisplay === totalPages}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}