const formatNumber = (value) => new Intl.NumberFormat('es-EC').format(value);

export default function OfficesTable({ 
  filteredOffices, 
  filter, 
  setFilter, 
  search, 
  setSearch, 
  selectedId, 
  setSelectedId, 
  statusInfo, 
  getOfficeStatus 
}) {
  return (
    <div className="tab-view table-section">
      <div className="table-controls">
        <input
          type="text"
          className="search-input"
          placeholder="Buscar por oficina, país o zona..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="filter-tabs">
          {['Todas', ...Object.values(statusInfo).map(({ label }) => label)].map((tab) => (
            <button
              key={tab}
              className={`filter-btn ${filter === tab ? 'active' : ''}`}
              onClick={() => setFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

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
            {filteredOffices.map((office) => {
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
    </div>
  );
}