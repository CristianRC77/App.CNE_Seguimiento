import { useEffect, useMemo, useRef, useState } from 'react';
import { initialOfficesData } from './assets/data/initialOffices';
import {
  normalizeCircunscription,
  getCompletionPercentage,
  statusInfo,
  milestones,
  USER_ROLES,
} from './assets/constants/cneConstants';
import {
  getCachedSeguimiento,
  loadSeguimiento,
  saveSeguimiento,
  subscribeToSeguimiento,
} from './assets/data/seguimientoService';
import {
  getStoredAuthSession,
  logout,
  getTokenExpirationTime,
  refreshAuthToken,
  getAuthToken,
  isTokenExpiringsoon,
} from './assets/data/authService';
import { exportOfficesToCSV } from './assets/utils/exportUtils';
import Sidebar from './assets/components/Sidebar';
import LoginModal from './assets/components/LoginModal';
import DashboardHeader from './assets/components/DashboardHeader';
import MetricsGrid from './assets/components/MetricsGrid';
import OverviewCharts from './assets/components/OverviewCharts';
import OfficesTable from './assets/components/OfficesTable';
import MilestoneEditor from './assets/components/MilestoneEditor';
import './App.css';

// Determina el estado visual de una zona a partir de sus hitos y actas.
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

// Cuenta las actas de escrutinio marcadas para hombres y mujeres.
const getDigitalizedScrutinyActs = (office) => {
  const scrutinyActs = office.actasDigitalizadas?.escrutinio || {};
  return [...(scrutinyActs.hombres || []), ...(scrutinyActs.mujeres || [])]
    .filter(Boolean)
    .length;
};

// Cuenta las actas de instalación que ya fueron digitalizadas.
const getDigitalizedInstallationActs = (office) => {
  const installationActs = office.actasDigitalizadas?.instalacion || {};
  return [...(installationActs.hombres || []), ...(installationActs.mujeres || [])]
    .filter(Boolean)
    .length;
};

// Calcula el total esperado de actas: tres de escrutinio y una de instalación por junta.
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

  // El avance combina hitos y digitalización de actas de instalación y escrutinio.
  const calculatedProgress = Math.round((
    completedBeforeDigitalization + scrutinyProgress + installationProgress
  ) / milestones.length * 100);
  const allMilestonesComplete = milestones.every(
    (milestone) => office.milestones?.[milestone.id]
  );
  const allActsComplete = areActasComplete(office, 'escrutinio')
    && areActasComplete(office, 'instalacion');

  // El redondeo nunca puede ocultar un hito o acta pendiente.
  return calculatedProgress >= 100 && (!allMilestonesComplete || !allActsComplete)
    ? 99
    : calculatedProgress;
};

// Indica si todas las actas de un tipo fueron digitalizadas.
const areActasComplete = (office, type) => {
  const totalActas = getTotalActas(office, type);
  const digitalizedActas = type === 'escrutinio'
    ? getDigitalizedScrutinyActs(office)
    : getDigitalizedInstallationActs(office);
  return totalActas > 0 && digitalizedActas === totalActas;
};

// Prepara los datos locales de respaldo cuando la API todavía no está disponible.
const createInitialOffices = () => initialOfficesData.map((office) => ({
  ...office,
  actasDigitalizadas: {
    escrutinio: { hombres: [], mujeres: [] },
    instalacion: { hombres: [], mujeres: [] },
  },
  milestones: milestones.reduce((result, milestone) => {
    result[milestone.id] = false;
    return result;
  }, {}),
}));

const normalizeActas = (office) => {
  const normalizeType = (type, multiplier) => {
    const savedActas = office.actasDigitalizadas?.[type] || {};
    const totalHombres = office.juntasMen * multiplier;
    const totalMujeres = office.juntasWomen * multiplier;

    // Siempre se crean arreglos del tamaño esperado, incluso si MongoDB no tiene datos.
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

// Completa campos faltantes y recalcula el avance antes de guardar en el estado de React.
const normalizeOffices = (offices) => offices.map((office) => {
  const actasDigitalizadas = normalizeActas(office);
  
  // Los hitos son la fuente de verdad. Solo usamos el campo del servidor si existe.
  // No usamos office.progress para determinar hitos - progress se calcula DESDE los hitos.
  const normalizedMilestones = milestones.reduce((result, milestone) => {
    result[milestone.id] = Boolean(office.milestones?.[milestone.id]);
    return result;
  }, {});

  // Marcar hitos de digitalización basado en actas completadas
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

  // Estas zonas siguen existiendo en la base de datos, pero no participan
  // en los indicadores generales ni en los listados operativos.
  return (country === 'CUBA' && zone.includes('HABANA'))
    || (country === 'VENEZUELA' && ['CARACAS', 'VALENCIA'].includes(zone));
};

// Un reporte de una etapa incluye también las zonas que ya avanzaron a etapas posteriores.
const matchesReportStatus = (office, selectedLabel) => {
  if (selectedLabel === 'Todas') return true;

  const statusOrder = Object.keys(statusInfo);
  const selectedStatus = statusOrder.find((status) => statusInfo[status].label === selectedLabel);
  const currentStatus = getOfficeStatus(office);

  if (!selectedStatus) return false;
  if (selectedStatus === 'sinEmpezar') return currentStatus === selectedStatus;

  return statusOrder.indexOf(currentStatus) >= statusOrder.indexOf(selectedStatus);
};

const reconcileOffices = (offices) => {
  const initialByKey = new Map(initialOfficesData.map((office) => [getOfficeKey(office), office]));

  // Conserva datos locales complementarios y reemplaza los valores con los del servidor.
  return normalizeOffices(offices.map((office, index) => ({
    ...(initialByKey.get(getOfficeKey(office)) || {}),
    ...office,
    id: office.id || index + 1,
  })));
};

export default function App() {
  // Estos estados controlan la pestaña activa, filtros, selección y sincronización.
  const [activeTab, setActiveTab] = useState('resumen');
  const [authSession, setAuthSession] = useState(getStoredAuthSession);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
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
  // La fuente completa se conserva, pero esta lista alimenta las vistas operativas.
  const participatingOffices = offices.filter((office) => !isExcludedFromGeneralPercentage(office));
  const editableOffices = authSession?.user.rol === USER_ROLES.GENERAL
    ? participatingOffices
    : participatingOffices.filter((office) => (
      normalizeCircunscription(office.circunscription)
      === normalizeCircunscription(authSession?.user.circunscripcion)
    ));

  const handleProtectedTabClick = () => {
    if (!authSession) {
      setIsLoginModalOpen(true);
      return;
    }
    setActiveTab('avances');
  };

  const handleLoginSuccess = (session) => {
    setAuthSession(session);
    setIsLoginModalOpen(false);
    setActiveTab('avances');
  };

  const handleLogout = () => {
    logout();
    setAuthSession(null);
    setIsLoginModalOpen(false);
    setSelectedActaType(null);
    setActiveTab('resumen');
  };

  useEffect(() => {
    let active = true;

    const cachedOffices = getCachedSeguimiento();

    // El polling mantiene la pantalla actualizada cuando otro usuario guarda cambios.
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

    // Carga el estado central al iniciar y usa la caché como respaldo si falla la API.
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

  // Monitorea la expiración del token y lo refresca automáticamente 15 minutos antes de expirar.
  useEffect(() => {
    if (!authSession?.token) return;

    let refreshTimer;

    const scheduleTokenRefresh = () => {
      const expirationTime = getTokenExpirationTime(authSession.token);
      if (!expirationTime) return;

      // Calcula cuándo hacer refresh: 15 minutos antes de la expiración
      const refreshTime = expirationTime - (15 * 60 * 1000);
      const now = Date.now();
      const msUntilRefresh = refreshTime - now;

      if (msUntilRefresh <= 0) {
        // El token está por expirar en menos de 15 minutos, refresca ahora
        void refreshAuthToken();
        // Vuelve a programar el refresh en 1 minuto
        refreshTimer = setTimeout(() => scheduleTokenRefresh(), 60000);
      } else {
        // Programa el refresh para más tarde
        refreshTimer = setTimeout(async () => {
          const success = await refreshAuthToken();
          if (success) {
            // Si se renovó exitosamente, vuelve a programar
            scheduleTokenRefresh();
          } else {
            // Si falló, intenta de nuevo en 1 minuto
            refreshTimer = setTimeout(() => scheduleTokenRefresh(), 60000);
          }
        }, msUntilRefresh);
      }
    };

    scheduleTokenRefresh();

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
    };
  }, [authSession?.token]);

  // Guarda una modificación y evita perder cambios concurrentes usando dataVersion.
  const persistOffices = async (nextOffices, changedId, errorMessage) => {
    const operationId = saveSequenceRef.current + 1;
    saveSequenceRef.current = operationId;
    isSavingRef.current = true;
    setOffices(nextOffices);
    setSyncStatus('Guardando...');

    // Las escrituras se serializan para evitar conflictos entre cambios rápidos.
    const saveTask = saveQueueRef.current.then(async () => {
      let retryCount = 0;
      const maxRetries = 2;

      const attemptSave = async () => {
        try {
          // Paso 1: Asegurar que el token es válido
          let currentToken = getAuthToken();
          if (!currentToken) {
            throw new Error('No hay sesión activa.');
          }

          // Si el token está por expirar o ya expiró, refresca ANTES de cualquier operación
          if (isTokenExpiringsoon(currentToken)) {
            console.log('Token por expirar, refrescando antes de guardar...');
            const refreshed = await refreshAuthToken();
            if (!refreshed) {
              throw new Error('No se pudo refrescar el token.');
            }
            currentToken = getAuthToken();
            console.log('Token refrescado exitosamente.');
          }

          // Paso 2: Cargar datos actuales del servidor (con token válido)
          console.log('Cargando datos actuales del servidor...');
          const currentOffices = await loadSeguimiento();
          
          // Paso 3: Encontrar la oficina modificada
          const changedOffice = nextOffices.find((office) => office.id === changedId);
          const currentOffice = currentOffices.find(
            (office) => office.zoneCode === changedOffice?.zoneCode
          );

          if (!changedOffice || !currentOffice) {
            throw new Error(
              `No se encontró la oficina (ID: ${changedId}, Zona: ${changedOffice?.zoneCode}). `
              + 'Puede haber sido eliminada por otro usuario.'
            );
          }

          console.log(
            `Preparando guardado para zona ${changedOffice.zoneCode} `
            + `(versión: ${currentOffice.dataVersion} → ${currentOffice.dataVersion + 1})`
          );

          // Paso 4: Preparar datos para guardar (mantener dataVersion del servidor)
          const officesToSave = currentOffices.map((office) => (
            office.zoneCode === changedOffice.zoneCode
              ? { ...changedOffice, dataVersion: currentOffice.dataVersion, id: currentOffice.id }
              : office
          ));

          // Paso 5: Guardar solo la zona modificada
          console.log(`Guardando cambios en el servidor...`);
          const result = await saveSeguimiento(officesToSave, [changedOffice.zoneCode]);

          // Paso 6: Validar respuesta del servidor
          if (!result.offices || !Array.isArray(result.offices)) {
            throw new Error('El servidor devolvió una respuesta inválida.');
          }

          // Paso 7: Actualizar estado local si esta operación sigue siendo la actual
          if (operationId === saveSequenceRef.current) {
            setOffices(reconcileOffices(result.offices));
            setSyncStatus('Guardado correctamente');
            console.log(
              `✅ Guardado exitoso para zona ${changedOffice.zoneCode}. `
              + `${result.updated} zona(s) actualizada(s).`
            );
          } else {
            console.log('Esta operación fue cancelada por una más reciente.');
          }
        } catch (error) {
          console.error(errorMessage, error);
          if (operationId !== saveSequenceRef.current) {
            console.log('Error en operación cancelada, ignorando.');
            return;
          }

          // Manejar diferentes tipos de errores
          if (error.status === 401) {
            // Token expirado o inválido
            if (retryCount < maxRetries) {
              console.log(
                `Error 401 (sesión expirada), intento ${retryCount + 1}/${maxRetries}...`
              );
              retryCount++;
              try {
                const refreshed = await refreshAuthToken();
                if (refreshed) {
                  console.log('Token refrescado en manejo de error, reintentando...');
                  return attemptSave();
                }
              } catch (refreshError) {
                console.error('No se pudo refrescar en manejo de error.', refreshError);
              }
            }
            handleLogout();
            setSyncStatus('La sesión expiró. Por favor, inicia sesión de nuevo.');
          } else if (error.status === 403) {
            setSyncStatus('No tienes permisos para modificar esta circunscripción.');
          } else if (error.status === 409) {
            // Conflicto: datos modificados por otro usuario
            console.log('Conflicto detectado: datos modificados por otro usuario.');
            try {
              const currentOffices = await loadSeguimiento();
              setOffices(reconcileOffices(currentOffices));
              setSyncStatus('Se recargaron cambios centrales (actualizado por otro usuario)');
            } catch (reloadError) {
              console.error('No se pudo recargar después de conflicto.', reloadError);
              setSyncStatus('Error al sincronizar conflicto');
            }
          } else {
            // Otros errores
            setSyncStatus(`Error al guardar: ${error.message}`);
          }
        } finally {
          if (operationId === saveSequenceRef.current) {
            isSavingRef.current = false;
          }
        }
      };

      return attemptSave();
    });

    saveQueueRef.current = saveTask.catch((error) => {
      console.error('La cola de guardado no pudo continuar.', error);
    });
    await saveTask;
  };

  const filteredOffices = useMemo(() => {
    // Los filtros se aplican sobre las zonas participantes, no sobre las excluidas.
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

  // Aplica los filtros independientes de la vista de reportes.
  const reportOffices = useMemo(() => {
    return participatingOffices.filter((office) => {
      const matchesStatus = matchesReportStatus(office, reportFilter);
      const matchesCircunscription = reportCircunscriptionFilter === 'Todas'
        || office.circunscription === reportCircunscriptionFilter;
      return matchesStatus && matchesCircunscription;
    });
  }, [participatingOffices, reportFilter, reportCircunscriptionFilter]);

  const reportStatusCounts = useMemo(() => (
    Object.entries(statusInfo).map(([status, info]) => ({
      status,
      label: info.label,
      count: reportOffices.filter((office) => getOfficeStatus(office) === status).length,
    }))
  ), [reportOffices]);

  // Centraliza las métricas que se muestran en las tarjetas y gráficos.
  const stats = useMemo(() => {
    // Escrutinio tiene tres actas por junta; instalación tiene una por junta.
    const totalScrutinyActs = participatingOffices.reduce(
      (sum, office) => sum + getTotalActas(office, 'escrutinio'),
      0
    );
    const totalInstallationActs = participatingOffices.reduce(
      (sum, office) => sum + getTotalActas(office, 'instalacion'),
      0
    );
    const digitizedActs = participatingOffices.reduce(
      (sum, office) => sum + getDigitalizedScrutinyActs(office),
      0
    );
    const digitizedInstallationActs = participatingOffices.reduce(
      (sum, office) => sum + getDigitalizedInstallationActs(office),
      0
    );
    // El total general incluye ambos tipos; no se usa como denominador de un tipo.
    const totalActs = totalScrutinyActs + totalInstallationActs;

    return {
      total: participatingOffices.length,
      completed: participatingOffices.filter((office) => getOfficeStatus(office) === 'finalizado').length,
      excludedGeneralPercentage: offices.filter(isExcludedFromGeneralPercentage).length,
      average: participatingOffices.length
        ? Math.round(participatingOffices.reduce((sum, office) => sum + getGeneralProgress(office), 0) / participatingOffices.length)
        : 0,
      electors: participatingOffices.reduce((sum, office) => sum + office.electors, 0),
      juntas: participatingOffices.reduce((sum, office) => sum + office.juntas, 0),
      totalScrutinyActs,
      totalActs,
      totalInstallationActs,
      digitizedZones: participatingOffices.filter(
        (office) => getDigitalizedScrutinyActs(office) === office.juntas * 3
      ).length,
      digitizedActs,
      digitizedActsProgress: getCompletionPercentage(digitizedActs, totalScrutinyActs),
      digitizedInstallationActs,
      installationActsProgress: getCompletionPercentage(
        digitizedInstallationActs,
        totalInstallationActs
      ),
    };
  }, [offices, participatingOffices]);

  // Marca o desmarca un hito respetando el orden del proceso electoral.
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

  // Cambia una sola acta y actualiza el hito de digitalización correspondiente.
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

  // Marca en una sola operación todas las actas de una zona y tipo.
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

  // Revierte la digitalización masiva de actas para permitir correcciones.
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

  // Si la selección deja de existir, se muestra la primera zona disponible.
  const selectedOffice = editableOffices.find((office) => office.id === selectedId)
    || editableOffices[0];

  return (
    <div className="dashboard-container">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onProtectedTabClick={handleProtectedTabClick}
        authSession={authSession}
        onLogout={handleLogout}
      />

      <main className="main-content">
        <DashboardHeader activeTab={activeTab} />
        <MetricsGrid stats={stats} />

        {/* Informa al usuario si los datos están cargando, sincronizados o guardados localmente. */}
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
            authSession && selectedOffice ? (
              <MilestoneEditor
                offices={editableOffices}
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
            ) : (
              <div className="tab-view empty-results">
                No hay zonas disponibles para tu circunscripción.
              </div>
            )
          )}

          {/* Vista: REPORTES */}
          {activeTab === 'reportes' && (
            <div className="tab-view reports-container">
              <h2>Reportes de seguimiento</h2>
              <small>
                Selecciona una circunscripción o una etapa. Las etapas incluyen también las zonas que ya avanzaron.
              </small>
            <p />
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
                    ? `oficinas que alcanzaron "${reportFilter}"`
                    : reportCircunscriptionFilter !== 'Todas'
                      ? `oficinas de ${reportCircunscriptionFilter}`
                      : 'Zonas electorales'}
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
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}