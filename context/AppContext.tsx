import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Plant, Cross, Alert, DiaryEntry, ClimateLog, InboxMessage, SeedBatch } from '../types';
import { useAuth } from './AuthContext';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { objectiveEvents } from '../utils/dailyObjectives';
import { loadTable, saveTable, migrateFromLocalStorage, addTombstone, TableKey } from '../db/localDb';
import { stamp } from '../db/sync';
import { syncNow, isPaired } from '../db/syncClient';
import { syncCloudNow, cloudReady } from '../db/syncCloud';
import { notifyOS } from '../utils/notifications';

// ============================================================
// APP CONTEXT - 100% LOCAL
// Todos los datos viven en este dispositivo (localStorage).
// No hay nube, ni cola de sincronización, ni paginación remota.
// La sincronización entre dispositivos llega en la fase de
// sync por Wi-Fi (la PC como punto de encuentro).
// ============================================================

interface AppContextType {
  plants: Plant[];
  crosses: Cross[];
  alerts: Alert[];
  diary: DiaryEntry[];
  climateLogs: ClimateLog[];
  inbox: InboxMessage[];
  seedBank: SeedBatch[];
  activeNotification: Alert | null;
  isOnline: boolean;
  isSyncing: boolean;
  addPlant: (plant: Omit<Plant, 'id'>) => Promise<Plant | null>;
  updatePlant: (plant: Plant) => Promise<boolean>;
  deletePlant: (id: number) => Promise<boolean>;
  addCross: (cross: Omit<Cross, 'id'>, tempId?: number) => Promise<{ success: boolean; error?: string }>;
  deleteCross: (id: number) => Promise<boolean>;
  updateCross: (cross: Cross) => Promise<boolean>;
  addDiaryEntry: (entry: Omit<DiaryEntry, 'id'>) => Promise<boolean>;
  updateDiaryEntry: (entry: DiaryEntry) => Promise<boolean>;
  deleteDiaryEntry: (id: number) => Promise<boolean>;
  addSeedBatch: (batch: Omit<SeedBatch, 'id'>) => Promise<boolean>;
  updateSeedBatch: (batch: SeedBatch) => Promise<boolean>;
  deleteSeedBatch: (id: number) => Promise<boolean>;
  addAlert: (alert: Omit<Alert, 'id'>) => Promise<boolean>;
  completeAlert: (id: number) => Promise<boolean>;
  deleteAlert: (id: number) => Promise<boolean>;
  addClimateLog: (log: Omit<ClimateLog, 'id'>) => Promise<boolean>;
  markMessageRead: (id: number) => Promise<void>;
  refreshInbox: () => Promise<void>;
  dismissNotification: () => void;
  syncData: () => Promise<void>;
  restoreData: (data: any) => Promise<boolean>;
  loadingError: string | null;
  fetchData: () => Promise<void>;
  setCrosses: React.Dispatch<React.SetStateAction<Cross[]>>;
  // Legacy offline (la app es siempre local ahora)
  offlineMode: boolean;
  toggleOfflineMode: () => void;
  pendingQueueLength: number;
  syncPendingActions: () => Promise<void>;
  // Error Toast System
  errorToast: string | null;
  showErrorToast: (message: string) => void;
  dismissErrorToast: () => void;
  // Pagination (legacy: todo está cargado en memoria)
  plantsHasMore: boolean;
  crossesHasMore: boolean;
  diaryHasMore: boolean;
  loadMorePlants: () => Promise<void>;
  loadMoreCrosses: () => Promise<void>;
  loadMoreDiary: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper para timeouts (lo siguen importando otras pantallas)
export const withTimeout = (promise: any, ms = 60000) => {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timed out')), ms)
  );
  return Promise.race([Promise.resolve(promise), timeout]);
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [plants, setPlants] = useState<Plant[]>([]);
  const [crosses, setCrosses] = useState<Cross[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [diary, setDiary] = useState<DiaryEntry[]>([]);
  const [climateLogs, setClimateLogs] = useState<ClimateLog[]>([]);
  const [inbox, setInbox] = useState<InboxMessage[]>([]);
  const [seedBank, setSeedBank] = useState<SeedBatch[]>([]);
  const [activeNotification, setActiveNotification] = useState<Alert | null>(null);
  const [loadingError] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // 🔒 Lock para evitar 2 addCross simultáneos
  const addCrossLockRef = useRef(false);

  // ID local único (number, compatible con los IDs históricos)
  const makeTempId = () => {
    const uuid = uuidv4();
    const hash = parseInt(uuid.replace(/-/g, '').substring(0, 8), 16);
    return Date.now() + hash;
  };

  // Persiste un array a IndexedDB (fire-and-forget; la UI ya se actualizó vía setState)
  const saveToLocal = (key: string, data: any) => {
    // 'inbox' es legacy y queda solo en memoria (sin nube no llegan mensajes nuevos)
    if (key === 'inbox') return;
    saveTable(key as TableKey, data).catch((e: any) => {
      logger.error('Error guardando en IndexedDB', key, e);
      showErrorToast('No se pudieron guardar los datos en el dispositivo.');
    });
  };

  const loadFromLocal = async () => {
    if (!user) return;
    try {
      const [p, c, a, d, cl, sb] = await Promise.all([
        loadTable<Plant>('plants'),
        loadTable<Cross>('crosses'),
        loadTable<Alert>('alerts'),
        loadTable<DiaryEntry>('diary'),
        loadTable<ClimateLog>('climate'),
        loadTable<SeedBatch>('seedbank'),
      ]);
      // Orden descendente por id (lo más nuevo primero), como esperaban las pantallas
      const byIdDesc = (x: any, y: any) => (y.id || 0) - (x.id || 0);
      setPlants(p.sort(byIdDesc));
      setCrosses(c.sort(byIdDesc));
      setAlerts(a.sort(byIdDesc));
      setDiary(d.sort(byIdDesc));
      setClimateLogs(cl.sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime()));
      setSeedBank(sb.sort(byIdDesc));
    } catch (e) {
      logger.error('Error cargando desde IndexedDB', e);
    }
  };

  useEffect(() => {
    if (user && user.isAuthenticated) {
      // Migración única localStorage -> IndexedDB, luego cargar
      migrateFromLocalStorage(user.key)
        .catch(e => logger.error('Error en migración a IndexedDB', e))
        .finally(() => loadFromLocal());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchData = async () => {
    await loadFromLocal();
  };

  // Auto-sync por Wi-Fi: al abrir y cada 45s si el dispositivo está emparejado
  useEffect(() => {
    if (!user?.isAuthenticated || !isPaired()) return;
    let cancelled = false;
    const run = async () => {
      const r = await syncNow();
      if (r.ok && !cancelled) await loadFromLocal();
    };
    run();
    const iv = setInterval(run, 45000);
    return () => { cancelled = true; clearInterval(iv); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Auto-sync por la nube (Supabase): al abrir, al recuperar internet y cada 60s
  // si hay código de espacio configurado. Es lo que permite capturar en el campo
  // con el iPhone sin la PC y que el escritorio baje todo al prender la PC.
  useEffect(() => {
    if (!user?.isAuthenticated) return;
    let cancelled = false;
    const run = async () => {
      if (!cloudReady() || !navigator.onLine) return;
      const r = await syncCloudNow();
      if (r.ok && !cancelled) await loadFromLocal();
    };
    run();
    const iv = setInterval(run, 60000);
    window.addEventListener('online', run);
    return () => { cancelled = true; clearInterval(iv); window.removeEventListener('online', run); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ✅ Error Toast Helpers
  const showErrorToast = (message: string) => {
    setErrorToast(message);
    setTimeout(() => setErrorToast(null), 5000);
  };

  const dismissErrorToast = () => setErrorToast(null);

  // --- BACKUP / RESTORE ---

  const restoreData = async (backupData: any): Promise<boolean> => {
    if (!user) return false;
    try {
      const mergeById = <T extends { id: number }>(current: T[], incoming: any[] | undefined): T[] => {
        if (!incoming?.length) return current;
        const existingIds = new Set(current.map(i => i.id));
        const news = incoming.map((item: any) => {
          if (item.id == null || existingIds.has(item.id)) {
            return { ...item, id: makeTempId() };
          }
          return item;
        });
        return [...news, ...current];
      };

      const newPlants = mergeById(plants, backupData.plants);
      const newCrosses = mergeById(crosses, backupData.crosses);
      const newAlerts = mergeById(alerts, backupData.alerts);
      const newClimate = mergeById(climateLogs, backupData.climateLogs);
      const newDiary = mergeById(diary, backupData.diary);
      const newSeedBank = mergeById(seedBank, backupData.seedBank);

      setPlants(newPlants); saveToLocal('plants', newPlants);
      setCrosses(newCrosses); saveToLocal('crosses', newCrosses);
      setAlerts(newAlerts); saveToLocal('alerts', newAlerts);
      setClimateLogs(newClimate); saveToLocal('climate', newClimate);
      setDiary(newDiary); saveToLocal('diary', newDiary);
      setSeedBank(newSeedBank); saveToLocal('seedbank', newSeedBank);

      return true;
    } catch (e) {
      logger.error('Error restaurando backup', e);
      return false;
    }
  };

  // --- ACTIONS ---

  const addPlant = async (plant: Omit<Plant, 'id'>): Promise<Plant | null> => {
    if (!user) return null;

    const newPlant: Plant = stamp({ ...plant, id: makeTempId() });
    const newPlants = [newPlant, ...plants];
    setPlants(newPlants);
    saveToLocal('plants', newPlants);

    // Trigger objetivo diario
    objectiveEvents.emit('add_plant');

    // Registro automático en diario
    addDiaryEntry({
      planta_nombre: plant.nombre,
      planta_especie: plant.especie,
      fecha: new Date().toISOString().split('T')[0],
      tipo: 'observacion',
      descripcion: `Nueva planta agregada: ${plant.nombre}`,
      imagen: plant.imagen
    } as Omit<DiaryEntry, 'id'>).catch(e => logger.warn('Error agregando entrada de diario:', e));

    return newPlant;
  };

  const updatePlant = async (plant: Plant): Promise<boolean> => {
    setPlants(prev => {
      const updated = prev.map(p => p.id === plant.id ? stamp(plant) : p);
      saveToLocal('plants', updated);
      return updated;
    });
    return true;
  };

  const deletePlant = async (id: number): Promise<boolean> => {
    setPlants(prev => {
      const updated = prev.filter(p => p.id !== id);
      saveToLocal('plants', updated);
      return updated;
    });
    await addTombstone('plants', id);
    return true;
  };

  const addCross = async (cross: Omit<Cross, 'id'>, tempId?: number): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Usuario no disponible' };

    if (addCrossLockRef.current) {
      return { success: false, error: 'Guardado en progreso. Esperá 1 segundo y reintentá.' };
    }
    addCrossLockRef.current = true;

    try {
      const cleanCross: any = {
        nombre: cross.nombre,
        madre_nombre: cross.madre_nombre,
        madre_especie: cross.madre_especie || 'Desconocida',
        padre_nombre: cross.padre_nombre,
        padre_especie: cross.padre_especie || 'Desconocida',
        padres_extra: (cross as any).padres_extra || [],
        fecha_cruza: cross.fecha_cruza,
        fecha_germinacion: (cross as any).fecha_germinacion || null,
        semillas_obtenidas: cross.semillas_obtenidas || 0,
        plantas_germinadas: cross.plantas_germinadas || 0,
        estado: cross.estado || 'en_proceso',
        objetivo: (cross as any).objetivo || '',
        notas: cross.notas || '',
        madre_imagen: (cross as any).madre_imagen || null,
        padre_imagen: (cross as any).padre_imagen || null,
        hibrido_imagen: (cross as any).hibrido_imagen || null,
      };

      // Gestión de polinización (móvil 2026): conservar campos nuevos si vienen
      const polFields = [
        'estado_polinizacion', 'fecha_programada', 'hora_programada', 'ubicacion',
        'prioridad', 'recordatorio', 'fuente_polen', 'etiqueta',
        'fecha_polinizacion', 'hora_polinizacion', 'checklist', 'temp', 'humedad',
        'expectativa_capsula', 'capsula_estado', 'cosecha_estimada', 'semillas_estimadas', 'fotos',
      ] as const;
      for (const f of polFields) {
        if ((cross as any)[f] !== undefined) cleanCross[f] = (cross as any)[f];
      }

      const id = tempId ?? makeTempId();

      const stampedCross = stamp({ ...cleanCross, id, isSyncing: false });
      setCrosses(prev => {
        // Si venía un tempId (reintento), reemplazar; si no, agregar
        const exists = prev.some((c: any) => c.id === id);
        const updated = exists
          ? prev.map((c: any) => c.id === id ? stampedCross : c)
          : [stampedCross, ...prev];
        saveToLocal('crosses', updated);
        return updated;
      });

      // Trigger objetivo diario
      objectiveEvents.emit('create_cross');

      return { success: true };
    } catch (error: any) {
      logger.error('Error agregando cruza', error);
      return { success: false, error: error?.message || 'Error desconocido' };
    } finally {
      addCrossLockRef.current = false;
    }
  };

  const updateCross = async (cross: Cross): Promise<boolean> => {
    const previousCross = crosses.find(c => c.id === cross.id);
    const justCompleted = cross.estado === 'completada' && previousCross?.estado !== 'completada';

    setCrosses(prev => {
      const updated = prev.map(c => c.id === cross.id ? stamp(cross) : c);
      saveToLocal('crosses', updated);
      return updated;
    });

    if (justCompleted) {
      objectiveEvents.emit('complete_cross');
    }
    return true;
  };

  const deleteCross = async (id: number): Promise<boolean> => {
    setCrosses(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveToLocal('crosses', updated);
      return updated;
    });
    await addTombstone('crosses', id);
    return true;
  };

  const addDiaryEntry = async (entry: Omit<DiaryEntry, 'id'>): Promise<boolean> => {
    if (!user) return false;

    const newEntry: DiaryEntry = stamp({ ...entry, id: makeTempId() });
    setDiary(prev => {
      const updated = [newEntry, ...prev];
      saveToLocal('diary', updated);
      return updated;
    });

    // Trigger objetivos diarios
    objectiveEvents.emit('diary_entry');
    if (entry.imagen || (entry.imagenes && entry.imagenes.length > 0)) {
      objectiveEvents.emit('diary_photo');
    }
    return true;
  };

  const updateDiaryEntry = async (entry: DiaryEntry): Promise<boolean> => {
    setDiary(prev => {
      const updated = prev.map(e => e.id === entry.id ? stamp(entry) : e);
      saveToLocal('diary', updated);
      return updated;
    });
    return true;
  };

  const deleteDiaryEntry = async (id: number): Promise<boolean> => {
    setDiary(prev => {
      const updated = prev.filter(e => e.id !== id);
      saveToLocal('diary', updated);
      return updated;
    });
    await addTombstone('diary', id);
    return true;
  };

  const addAlert = async (newAlert: Omit<Alert, 'id'>): Promise<boolean> => {
    if (!user) return false;

    const alert: Alert = stamp({ ...newAlert, id: makeTempId(), notified: false, completada: false });
    setAlerts(prev => {
      const updated = [alert, ...prev];
      saveToLocal('alerts', updated);
      return updated;
    });
    return true;
  };

  const completeAlert = async (id: number): Promise<boolean> => {
    setAlerts(prev => {
      const updated = prev.map(a => a.id === id ? stamp({ ...a, completada: true }) : a);
      saveToLocal('alerts', updated);
      return updated;
    });
    if (activeNotification?.id === id) setActiveNotification(null);

    // Trigger objetivo diario
    objectiveEvents.emit('complete_alert');
    return true;
  };

  const deleteAlert = async (id: number): Promise<boolean> => {
    setAlerts(prev => {
      const updated = prev.filter(a => a.id !== id);
      saveToLocal('alerts', updated);
      return updated;
    });
    await addTombstone('alerts', id);
    return true;
  };

  const addClimateLog = async (log: Omit<ClimateLog, 'id'>): Promise<boolean> => {
    if (!user) return false;

    const newLog: ClimateLog = stamp({ ...log, id: makeTempId() });
    setClimateLogs(prev => {
      const updated = [newLog, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      saveToLocal('climate', updated);
      return updated;
    });

    // Trigger objetivo diario
    objectiveEvents.emit('climate_log');
    return true;
  };

  const addSeedBatch = async (batch: Omit<SeedBatch, 'id'>): Promise<boolean> => {
    if (!user) return false;

    const newBatch: SeedBatch = stamp({ ...batch, id: makeTempId(), isSyncing: false });
    setSeedBank(prev => {
      const updated = [newBatch, ...prev];
      saveToLocal('seedbank', updated);
      return updated;
    });

    if (batch.estado === 'estratificando') {
      objectiveEvents.emit('start_stratification');
    }
    return true;
  };

  const updateSeedBatch = async (batch: SeedBatch): Promise<boolean> => {
    setSeedBank(prev => {
      const updated = prev.map(s => s.id === batch.id ? stamp({ ...batch, isSyncing: false }) : s);
      saveToLocal('seedbank', updated);
      return updated;
    });
    return true;
  };

  const deleteSeedBatch = async (id: number): Promise<boolean> => {
    setSeedBank(prev => {
      const updated = prev.filter(s => s.id !== id);
      saveToLocal('seedbank', updated);
      return updated;
    });
    await addTombstone('seedbank', id);
    return true;
  };

  // --- INBOX (legacy: solo mensajes ya guardados localmente) ---

  const markMessageRead = async (id: number) => {
    setInbox(prev => {
      const updated = prev.map(msg => msg.id === id ? { ...msg, is_read: true } : msg);
      saveToLocal('inbox', updated);
      return updated;
    });
  };

  const refreshInbox = async () => { /* sin nube no hay mensajes nuevos */ };

  const dismissNotification = () => setActiveNotification(null);

  // --- CHEQUEO DE ALERTAS (cada minuto) ---
  useEffect(() => {
    if (!user) return;

    const runChecks = () => {
      const now = new Date().getTime();
      let notificationFound = false;
      const justDue: Alert[] = [];

      const updatedAlerts = alerts.map(alert => {
        if (alert.completada || alert.notified) return alert;

        const alertTime = new Date(alert.fecha).getTime();
        const diffMinutes = (alertTime - now) / 1000 / 60;

        if (diffMinutes > -60 && diffMinutes <= 30) {
          if (!notificationFound) {
            setActiveNotification(alert);
            notificationFound = true;
          }
          justDue.push(alert);
          return { ...alert, notified: true };
        }
        return alert;
      });

      if (JSON.stringify(updatedAlerts) !== JSON.stringify(alerts)) {
        setAlerts(updatedAlerts);
        saveToLocal('alerts', updatedAlerts);
        // Notificación local del SO (Windows nativo vía Electron, o Web Notification
        // en navegador/PWA) por cada alerta que acaba de vencer. Fase 5.
        justDue.forEach(a => {
          const titulo = a.planta && a.planta !== 'General' ? `${a.planta} · CarniLab` : 'CarniLab';
          notifyOS(titulo, a.mensaje, `alert-${a.id}`);
        });
      }
    };

    runChecks();
    const intervalId = setInterval(runChecks, 60000);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerts, user]);

  return (
    <AppContext.Provider
      value={{
        plants,
        crosses,
        alerts,
        diary,
        climateLogs,
        inbox,
        activeNotification,
        isOnline: true,
        isSyncing: false,
        addPlant,
        updatePlant,
        deletePlant,
        addCross,
        deleteCross,
        updateCross,
        addDiaryEntry,
        updateDiaryEntry,
        deleteDiaryEntry,
        addAlert,
        completeAlert,
        deleteAlert,
        addClimateLog,
        markMessageRead,
        refreshInbox,
        dismissNotification,
        syncData: async () => { await loadFromLocal(); },
        restoreData,
        loadingError,
        fetchData,
        setCrosses,
        // Seed Bank
        seedBank,
        addSeedBatch,
        updateSeedBatch,
        deleteSeedBatch,
        // Legacy offline
        offlineMode: false,
        toggleOfflineMode: () => { },
        pendingQueueLength: 0,
        syncPendingActions: async () => { },
        // Error Toast
        errorToast,
        showErrorToast,
        dismissErrorToast,
        // Pagination (todo en memoria)
        plantsHasMore: false,
        crossesHasMore: false,
        diaryHasMore: false,
        loadMorePlants: async () => { },
        loadMoreCrosses: async () => { },
        loadMoreDiary: async () => { },
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within an AppProvider');
  return context;
};
