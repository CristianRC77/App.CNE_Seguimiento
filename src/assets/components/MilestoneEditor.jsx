import { useState } from 'react';

const formatNumber = (value) => new Intl.NumberFormat('es-EC').format(value);

export default function MilestoneEditor({
  offices,
  selectedOffice,
  selectedId,
  setSelectedId,
  milestones,
  updateMilestone,
  getOfficeStatus,
  statusInfo,
}) {
  const [selectedCircunscription, setSelectedCircunscription] = useState('Todas');
  const [zoneSearch, setZoneSearch] = useState('');
  const selectedStatus = getOfficeStatus(selectedOffice);
  const completedMilestones = Object.values(selectedOffice.milestones).filter(Boolean).length;
  const circunscriptions = [...new Set(offices.map((office) => office.circunscription))].sort();
  const normalizedSearch = zoneSearch.trim().toLowerCase();
  const filteredOffices = offices.filter((office) => {
    const matchesCircunscription = selectedCircunscription === 'Todas'
      || office.circunscription === selectedCircunscription;
    const matchesZone = !normalizedSearch
      || `${office.zone} ${office.name}`.toLowerCase().includes(normalizedSearch);
    return matchesCircunscription && matchesZone;
  });

  return (
    <div className="progress-workspace">
      <section className="tab-view offices-checklist-list">
        <div className="editor-section-heading">
          <div>
            <h2>Zonas Electorales</h2>
            <p>Selecciona una oficina para registrar sus avances.</p>
          </div>
          <span className="office-count">{filteredOffices.length}</span>
        </div>

        <div className="office-filters">
          <label className="field-label" htmlFor="circunscription-filter">Circunscripción</label>
          <select
            id="circunscription-filter"
            className="circunscription-select"
            value={selectedCircunscription}
            onChange={(event) => setSelectedCircunscription(event.target.value)}
          >
            <option value="Todas">Todas las circunscripciones</option>
            {circunscriptions.map((circunscription) => (
              <option key={circunscription} value={circunscription}>{circunscription}</option>
            ))}
          </select>

          <label className="field-label" htmlFor="zone-search">Buscar zona electoral</label>
          <div className="zone-search">
            <span aria-hidden="true">⌕</span>
            <input
              id="zone-search"
              type="search"
              value={zoneSearch}
              onChange={(event) => setZoneSearch(event.target.value)}
              placeholder="Ej. Berlín, Madrid..."
            />
          </div>
        </div>

        <div className="office-selector-list">
          {filteredOffices.map((office) => {
            const status = getOfficeStatus(office);
            return (
              <button
                key={office.id}
                className={`office-selector ${selectedId === office.id ? 'selected' : ''}`}
                onClick={() => setSelectedId(office.id)}
              >
                <span className="office-selector-code">{office.code}</span>
                <span className="office-selector-info">
                  <strong>{office.zone}</strong>
                  <small>{office.country} · {formatNumber(office.electors)} electores</small>
                </span>
                <span className="office-selector-progress">
                  <b>{office.progress}%</b>
                  <i className={`mini-status ${status}`} title={statusInfo[status].label} />
                </span>
              </button>
            );
          })}
          {filteredOffices.length === 0 && (
            <p className="empty-results">No hay zonas electorales para los filtros seleccionados.</p>
          )}
        </div>
      </section>

      <section className="tab-view milestone-editor-card">
        <div className="editor-section-heading">
          <div>
            <p className="editor-kicker">OFICINA SELECCIONADA</p>
            <h2>{selectedOffice.name}</h2>
            <p className="subtext">
              {selectedOffice.country} · {selectedOffice.zone} · Última actualización: {selectedOffice.updated}
            </p>
          </div>
          <span className={`status-pill ${selectedStatus}`}>{statusInfo[selectedStatus].label}</span>
        </div>

        <div className="milestone-summary">
          <div>
            <strong className={selectedStatus}>{selectedOffice.progress}%</strong>
            <span>avance de electores</span>
          </div>
          <div className="editor-progress-track">
            <span
              className={selectedStatus}
              style={{ width: `${selectedOffice.progress}%` }}
            />
          </div>
          <span className="milestone-count">{completedMilestones}/{milestones.length} hitos</span>
        </div>

        <div className="milestones-grid">
          {milestones.map((milestone) => {
            const milestoneIndex = milestones.findIndex((item) => item.id === milestone.id);
            const milestoneStates = milestones.map((item) => Boolean(selectedOffice.milestones[item.id]));
            const isChecked = milestoneStates[milestoneIndex];
            const canMark = !isChecked && milestoneStates.slice(0, milestoneIndex).every(Boolean);
            const canUnmark = isChecked && milestoneStates.slice(milestoneIndex + 1).every((completed) => !completed);
            const isEnabled = canMark || canUnmark;
            return (
              <button
                key={milestone.id}
                className={`milestone-btn ${isChecked ? 'checked' : ''} ${isEnabled ? '' : 'locked'}`}
                onClick={() => updateMilestone(selectedOffice.id, milestone.id)}
                disabled={!isEnabled}
                aria-pressed={isChecked}
                title={!isEnabled ? 'Debes completar los hitos anteriores en orden' : undefined}
              >
                <span className="checkbox">{isChecked ? '✓' : milestone.icon}</span>
                <span>{milestone.label}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
