import { useState } from 'react';
import { getCompletionPercentage } from '../constants/cneConstants';

// Formatea los electores en cada elemento de la lista de zonas.
const formatNumber = (value) => new Intl.NumberFormat('es-EC').format(value);

export default function MilestoneEditor({
  offices,
  selectedOffice,
  selectedId,
  setSelectedId,
  selectedActaType,
  setSelectedActaType,
  milestones,
  updateMilestone,
  updateActa,
  markAllActas,
  unmarkAllActas,
  getOfficeStatus,
  statusInfo,
}) {
  // Estos estados pertenecen únicamente a los filtros internos del editor.
  const [selectedCircunscription, setSelectedCircunscription] = useState('Todas');
  const [zoneSearch, setZoneSearch] = useState('');
  // Los valores siguientes alimentan el resumen de la zona seleccionada.
  const selectedStatus = getOfficeStatus(selectedOffice);
  const completedMilestones = Object.values(selectedOffice.milestones).filter(Boolean).length;
  const actas = selectedOffice.actasDigitalizadas?.[selectedActaType] || { hombres: [], mujeres: [] };
  const actaMultiplier = selectedActaType === 'escrutinio' ? 3 : 1;
  const totalActasHombres = selectedOffice.juntasMen * actaMultiplier;
  const totalActasMujeres = selectedOffice.juntasWomen * actaMultiplier;
  const digitalizadasHombres = actas.hombres.filter(Boolean).length;
  const digitalizadasMujeres = actas.mujeres.filter(Boolean).length;
  const totalActas = totalActasHombres + totalActasMujeres;
  const digitalizadasActas = digitalizadasHombres + digitalizadasMujeres;
  const actasProgress = getCompletionPercentage(digitalizadasActas, totalActas);
  // Los filtros reducen la lista de selección sin alterar los datos originales.
  const circunscriptions = [...new Set(offices.map((office) => office.circunscription))].sort();
  const normalizedSearch = zoneSearch.trim().toLowerCase();
  // Permite localizar rápidamente una zona sin modificar la colección original.
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
            <p>Selecciona una zona electoral para registrar su avance.</p>
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
                onClick={() => {
                  setSelectedActaType(null);
                  setSelectedId(office.id);
                }}
              >
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
            <p className="editor-kicker">ZONA ELECTORAL SELECCIONADA</p>
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
            // Cada botón representa un hito y determina si puede marcarse o revertirse.
            const milestoneIndex = milestones.findIndex((item) => item.id === milestone.id);
            const milestoneStates = milestones.map((item) => Boolean(selectedOffice.milestones[item.id]));
            const isChecked = milestoneStates[milestoneIndex];
            const isDigitalization = milestoneIndex >= 4;
            const actaType = milestoneIndex === 4 ? 'escrutinio' : 'instalacion';
            const isActaComplete = isDigitalization
              ? [selectedOffice.actasDigitalizadas?.[actaType]?.hombres || [],
                selectedOffice.actasDigitalizadas?.[actaType]?.mujeres || []]
                .flat()
                .every(Boolean)
              : isChecked;
            const isSelected = isDigitalization && selectedActaType === actaType;
            const canMark = !isChecked && (
              isDigitalization
                ? milestoneStates[3]
                : milestoneStates.slice(0, milestoneIndex).every(Boolean)
            );
            const canUnmark = isChecked && (
              isDigitalization
                ? true
                : milestoneStates.slice(milestoneIndex + 1).every((completed) => !completed)
            );
            const isEnabled = canMark || canUnmark;
            return (
              <button
                key={milestone.id}
                className={`milestone-btn ${isDigitalization && isActaComplete ? 'completed' : ''} ${isDigitalization && !isActaComplete ? 'pending' : ''} ${!isDigitalization && isChecked ? 'checked' : ''} ${isSelected ? 'selected' : ''} ${isEnabled ? '' : 'locked'}`}
                onClick={() => {
                  if (isDigitalization) {
                    setSelectedActaType(actaType);
                    return;
                  }
                  updateMilestone(selectedOffice.id, milestone.id);
                }}
                disabled={!isEnabled}
                aria-pressed={isDigitalization ? isSelected : isChecked}
                title={!isEnabled
                  ? isDigitalization
                    ? 'Debes seleccionar Inicio de escrutinio'
                    : 'Debes completar los hitos anteriores en orden'
                  : undefined}
              >
                <span className="checkbox">{isActaComplete ? '✓' : milestone.icon}</span>
                <span>{milestone.label}</span>
              </button>
            );
          })}
        </div>

        {/* Las actas aparecen después de iniciar el escrutinio. */}
        {selectedActaType && selectedOffice.milestones.inicioEscrutinio && (
        <section className="acts-checklist">
          <div className="acts-checklist-heading">
            <div>
              <h3>
                Digitalización de actas de {selectedActaType === 'escrutinio' ? 'escrutinio' : 'instalación'}
              </h3>
              <p>Marca cada acta conforme se complete su digitalización.</p>
            </div>
            <strong>
              {digitalizadasActas}/{totalActas} digitalizadas
            </strong>
            <button
              className="mark-all-btn"
              type="button"
              onClick={() => markAllActas(selectedOffice.id, selectedActaType)}
              disabled={digitalizadasActas === totalActas}
            >
              Marcar todo
            </button>
            <button
              className="mark-all-btn"
              type="button"
              onClick={() => unmarkAllActas(selectedOffice.id, selectedActaType)}
              disabled={digitalizadasActas === 0}
            >
              Desmarcar todo
            </button>
          </div>

          <div className="acts-checklist-summary">
            <span>Hombres: <b>{digitalizadasHombres}/{totalActasHombres}</b></span>
            <span>Mujeres: <b>{digitalizadasMujeres}/{totalActasMujeres}</b></span>
            <span>Pendientes: <b>{totalActas - digitalizadasActas}</b></span>
            <span>Avance: <b>{actasProgress}%</b></span>
          </div>
          <div className="acts-checklist-progress" aria-label={`Avance de digitalización: ${actasProgress}%`}>
            <span style={{ width: `${actasProgress}%` }} />
          </div>

          <div className="acts-checklist-columns">
            {[
              { key: 'hombres', label: 'Hombres', total: totalActasHombres },
              { key: 'mujeres', label: 'Mujeres', total: totalActasMujeres },
            ].map(({ key, label, total }) => (
              <div className="acts-category" key={key}>
                <h4>{label} <span>{total} actas</span></h4>
                <div className="acts-list">
                  {Array.from({ length: total }, (_, index) => (
                    <label className="act-checkbox" key={`${key}-${index + 1}`}>
                      <input
                        type="checkbox"
                        checked={Boolean(actas[key][index])}
                        onChange={() => updateActa(selectedOffice.id, selectedActaType, key, index)}
                      />
                      <span>{selectedActaType === 'escrutinio' ? 'Acta' : 'Junta'} {index + 1}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
        )}
      </section>
    </div>
  );
}
