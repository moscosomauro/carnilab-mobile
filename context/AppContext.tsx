import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Plant, Cross, Alert, DiaryEntry, ClimateLog, InboxMessage, SeedBatch } from '../types';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { syncPendingImages } from '../utils/imageHelpers';
import { objectiveEvents } from '../utils/dailyObjectives';

interface PendingAction {
  id: string;
  type: 'ADD_PLANT' | 'ADD_CROSS' | 'ADD_ALERT' | 'ADD_DIARY' | 'ADD_CLIMATE' | 'UPDATE_PLANT' | 'UPDATE_CROSS' | 'UPDATE_DIARY' | 'ADD_SEED_BATCH' | 'UPDATE_SEED_BATCH';
  payload: any;
  timestamp: number;
}

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
  // Offline V3
  offlineMode: boolean;
  toggleOfflineMode: () => void;
  pendingQueueLength: number;
  syncPendingActions: () => Promise<void>;
  // ✅ Error Toast System
  errorToast: string | null;
  showErrorToast: (message: string) => void;
  dismissErrorToast: () => void;
  // ✅ Pagination System
  plantsHasMore: boolean;
  crossesHasMore: boolean;
  diaryHasMore: boolean;
  loadMorePlants: () => Promise<void>;
  loadMoreCrosses: () => Promise<void>;
  loadMoreDiary: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper para timeouts de red
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

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineMode, setOfflineMode] = useState(false); // Manual Override
  const [pendingQueueLength, setPendingQueueLength] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // ✅ Error Toast State
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // ✅ Pagination State
  const [plantsHasMore, setPlantsHasMore] = useState(true);
  const [crossesHasMore, setCrossesHasMore] = useState(true);
  const [diaryHasMore, setDiaryHasMore] = useState(true);
  const [plantsCursor, setPlantsCursor] = useState<number | null>(null);
  const [crossesCursor, setCrossesCursor] = useState<number | null>(null);
  const [diaryCursor, setDiaryCursor] = useState<number | null>(null);
  const PAGE_SIZE = 20;

  // 🔒 LOCK REAL para evitar 2 addCross simultáneos (causa “una sí / una no”)
  const addCrossLockRef = useRef(false);



  // ✅ tempId sin colisiones usando UUID + timestamp para garantizar unicidad
  const makeTempId = () => {
    // Genera un ID único garantizado usando UUID v4
    // Mantenemos number por compatibilidad pero usando hash del UUID
    const uuid = uuidv4();
    // Convertimos los primeros 8 caracteres del UUID a un número
    const hash = parseInt(uuid.replace(/-/g, '').substring(0, 8), 16);
    return Date.now() + hash;
  };

  useEffect(() => {
    // Init Offline Mode from local storage
    const storedMode = localStorage.getItem('offline_mode');
    if (storedMode === 'true') setOfflineMode(true);

    // Init Queue Length
    const queue = JSON.parse(localStorage.getItem('pending_actions') || '[]');
    setPendingQueueLength(queue.length);
  }, []);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      if (!offlineMode) {
        logger.info("App is Online - Attempting Sync");
        syncPendingActions();
        // También sincronizar imágenes pendientes
        try {
          const synced = await syncPendingImages();
          if (synced > 0) {
            logger.info(`Sincronizadas ${synced} imágenes pendientes`);
          }
        } catch (e) {
          logger.warn("Error sincronizando imágenes pendientes:", e);
        }
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      logger.warn("App is Offline");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (user && user.isAuthenticated) {
      loadFromLocal();
      fetchData();

      const channel = supabase
        .channel('public:inbox_messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'inbox_messages',
            filter: `owner_key=eq.${user.key}`
          },
          (payload) => {
            logger.info('¡Nuevo mensaje recibido en Realtime!', payload);
            const newMessage = payload.new as InboxMessage;
            setInbox(prev => [newMessage, ...prev]);
            if (navigator.vibrate) navigator.vibrate(200);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };

    } else {
      setPlants([]);
      setCrosses([]);
      setAlerts([]);
      setDiary([]);
      setClimateLogs([]);
      setInbox([]);
      setSeedBank([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const saveToLocal = (key: string, data: any) => {
    try {
      if (user?.key) localStorage.setItem(`${user.key}_${key}`, JSON.stringify(data));
    } catch (e: any) {
      console.warn("LocalStorage Quota Exceeded. Cleaning up...");
      // Optional: Clear old caches if needed
      // localStorage.clear(); 
    }
  };

  const loadFromLocal = () => {
    if (!user) return;

    const localPlants = localStorage.getItem(`${user.key}_plants`);
    if (localPlants) setPlants(JSON.parse(localPlants));

    const localCrosses = localStorage.getItem(`${user.key}_crosses`);
    if (localCrosses) setCrosses(JSON.parse(localCrosses));

    const localAlerts = localStorage.getItem(`${user.key}_alerts`);
    if (localAlerts) setAlerts(JSON.parse(localAlerts));

    const localDiary = localStorage.getItem(`${user.key}_diary`);
    if (localDiary) setDiary(JSON.parse(localDiary));

    const localClimate = localStorage.getItem(`${user.key}_climate`);
    if (localClimate) setClimateLogs(JSON.parse(localClimate));

    const localInbox = localStorage.getItem(`${user.key}_inbox`);
    if (localInbox) setInbox(JSON.parse(localInbox));

    const localSeedBank = localStorage.getItem(`${user.key}_seedbank`);
    if (localSeedBank) setSeedBank(JSON.parse(localSeedBank));
  };

  const fetchData = async () => {
    if (!user) return;
    console.log("Fetching data from Supabase for user:", user.key);
    setLoadingError(null);

    try {
      // ✅ Cargar solo primera página (20 items) - resto se carga con paginación
      const results = await Promise.allSettled([
        withTimeout(supabase.from('plants').select('*').eq('owner_key', user.key).order('id', { ascending: false }).limit(PAGE_SIZE)),
        withTimeout(supabase.from('crosses').select('*').eq('owner_key', user.key).order('id', { ascending: false }).limit(PAGE_SIZE)),
        withTimeout(supabase.from('alerts').select('*').eq('owner_key', user.key).order('id', { ascending: false })),
        withTimeout(supabase.from('diary').select('*').eq('owner_key', user.key).order('id', { ascending: false }).limit(PAGE_SIZE)),
        withTimeout(supabase.from('climate_logs').select('*').eq('owner_key', user.key).order('date', { ascending: false }).limit(50)),
        withTimeout(supabase.from('seed_bank').select('*').eq('owner_key', user.key).order('id', { ascending: false }))
      ]);

      const [plantsRes, crossesRes, alertsRes, diaryRes, climateRes, seedBankRes] = results;

      if (plantsRes.status === 'fulfilled') {
        if (!plantsRes.value.error) {
          const plantsData = plantsRes.value.data;
          setPlants(prev => {
            const syncing = prev.filter(p => (p as any).isSyncing);
            const offline = prev.filter((p: any) => typeof p.id === 'number' && p.id > 100000000000 && !(p as any).isSyncing);
            
            const existingIds = new Set([...syncing, ...offline].map((p: any) => p.id));
            const newPlants = plantsData.filter((p: any) => !existingIds.has(p.id));
            
            const mergedPlants = [...syncing, ...offline, ...newPlants];
            saveToLocal('plants', mergedPlants);
            return mergedPlants;
          });

          // ✅ Setear cursor y hasMore para paginación
          if (plantsData.length > 0) {
            setPlantsCursor(plantsData[plantsData.length - 1].id);
            setPlantsHasMore(plantsData.length === PAGE_SIZE);
          } else {
            setPlantsHasMore(false);
          }
        } else {
          logger.error("Error fetching plants:", plantsRes.value.error);
        }
      } else {
        logger.error("Error fetching plants:", plantsRes.reason);
      }

      if (crossesRes.status === 'fulfilled') {
        if (!crossesRes.value.error) {
          const crossesData = crossesRes.value.data;
          setCrosses(prev => {
            const syncing = prev.filter(c => (c as any).isSyncing);
            return [...syncing, ...crossesData];
          });
          saveToLocal('crosses', crossesData);

          // ✅ Setear cursor y hasMore para paginación
          if (crossesData.length > 0) {
            setCrossesCursor(crossesData[crossesData.length - 1].id);
            setCrossesHasMore(crossesData.length === PAGE_SIZE);
          } else {
            setCrossesHasMore(false);
          }
        } else {
          logger.error("Error fetching crosses:", crossesRes.value.error);
        }
      } else {
        logger.error("Error fetching crosses:", crossesRes.reason);
      }

      if (alertsRes.status === 'fulfilled') {
        if (!alertsRes.value.error) {
          setAlerts(alertsRes.value.data);
          saveToLocal('alerts', alertsRes.value.data);
        }
      }

      if (diaryRes.status === 'fulfilled') {
        if (!diaryRes.value.error) {
          const diaryData = diaryRes.value.data;
          setDiary(diaryData);
          saveToLocal('diary', diaryData);

          // ✅ Setear cursor y hasMore para paginación
          if (diaryData.length > 0) {
            setDiaryCursor(diaryData[diaryData.length - 1].id);
            setDiaryHasMore(diaryData.length === PAGE_SIZE);
          } else {
            setDiaryHasMore(false);
          }
        }
      }

      if (climateRes.status === 'fulfilled') {
        if (!climateRes.value.error) {
          setClimateLogs(climateRes.value.data);
          saveToLocal('climate', climateRes.value.data);
        }
      }

      if (seedBankRes.status === 'fulfilled') {
        if (!seedBankRes.value.error) {
          const seedData = seedBankRes.value.data;
          setSeedBank(prev => {
            const syncing = prev.filter(s => (s as any).isSyncing);
            return [...syncing, ...seedData];
          });
          saveToLocal('seedbank', seedData);
        }
      }

      await fetchInbox();

    } catch (e: any) {
      logger.error("Critical Network error fetching data:", e);
      setLoadingError(e.message || "Error crítico de conexión");
    }
  };

  const fetchInbox = async () => {
    if (!user) return;
    const { data: inboxData, error: errIn } = await supabase
      .from('inbox_messages')
      .select('*')
      .eq('owner_key', user.key)
      .order('created_at', { ascending: false });

    if (errIn) {
      logger.error("Error fetching inbox:", errIn);
    } else if (inboxData) {
      if (JSON.stringify(inboxData) !== JSON.stringify(inbox)) {
        setInbox(inboxData);
        saveToLocal('inbox', inboxData);
      }
    }
  };

  // --- COLA OFFLINE ---
  const queueAction = (type: PendingAction['type'], payload: any) => {
    logger.info("Queuing action (Offline):", type);
    try {
      const queue: PendingAction[] = JSON.parse(localStorage.getItem('pending_actions') || '[]');
      queue.push({
        id: makeTempId().toString(),
        type,
        payload: { ...payload, owner_key: user?.key },
        timestamp: Date.now()
      });
      localStorage.setItem('pending_actions', JSON.stringify(queue));
      setPendingQueueLength(queue.length);
    } catch (e) {
      logger.error("LocalStorage Full on Queueing:", e);
      // Optional: Alert user or fail gracefully
    }
  };

  const syncPendingActions = async () => {
    const fullQueue: PendingAction[] = JSON.parse(localStorage.getItem('pending_actions') || '[]');

    if (fullQueue.length === 0) {
      await fetchData();
      return;
    }

    // ✅ OPTIMIZADO: Aumentado a 20 items por batch con sincronización paralela
    const BATCH_SIZE = 20;
    const batch = fullQueue.slice(0, BATCH_SIZE);
    const remaining = fullQueue.slice(BATCH_SIZE);

    logger.info(`Syncing batch: ${batch.length} items. Remaining: ${remaining.length}`);
    setIsSyncing(true);

    // ✅ Sincronización PARALELA con Promise.allSettled para mejor performance
    const syncAction = async (action: PendingAction) => {
      try {
        let error = null;

        if (action.type === 'ADD_PLANT') {
          ({ error } = await supabase.from('plants').insert(action.payload));
        } else if (action.type === 'ADD_CROSS') {
          ({ error } = await supabase.from('crosses').insert(action.payload));
        } else if (action.type === 'ADD_ALERT') {
          ({ error } = await supabase.from('alerts').insert(action.payload));
        } else if (action.type === 'ADD_DIARY') {
          ({ error } = await supabase.from('diary').insert(action.payload));
        } else if (action.type === 'ADD_CLIMATE') {
          ({ error } = await supabase.from('climate_logs').insert(action.payload));
        } else if (action.type === 'UPDATE_PLANT') {
          // Conflict Resolution Check
          const { data: serverPlant } = await supabase.from('plants').select('updated_at').eq('id', action.payload.id).single();
          if (serverPlant && serverPlant.updated_at && new Date(serverPlant.updated_at).getTime() > action.timestamp) {
            throw new Error(`Conflicto (Planta): El servidor tiene una versión más reciente.`);
          }
          const { id, ...updates } = action.payload;
          ({ error } = await supabase.from('plants').update(updates).eq('id', id));
        } else if (action.type === 'UPDATE_CROSS') {
          // Conflict Resolution Check
          const { data: serverCross } = await supabase.from('crosses').select('updated_at').eq('id', action.payload.id).single();
          if (serverCross && serverCross.updated_at && new Date(serverCross.updated_at).getTime() > action.timestamp) {
            throw new Error(`Conflicto (Cruza): El servidor tiene una versión más reciente.`);
          }
          const { id, ...updates } = action.payload;
          ({ error } = await supabase.from('crosses').update(updates).eq('id', id));
        } else if (action.type === 'UPDATE_DIARY') {
           // Basic update for formatting consistency
           const { id, ...updates } = action.payload;
           ({ error } = await supabase.from('diary').update(updates).eq('id', id));
        } else if (action.type === 'ADD_SEED_BATCH') {
          ({ error } = await supabase.from('seed_bank').insert(action.payload));
        } else if (action.type === 'UPDATE_SEED_BATCH') {
          const { id, ...updates } = action.payload;
          ({ error } = await supabase.from('seed_bank').update(updates).eq('id', id));
        }

        if (error) throw error;
        return { success: true, action };
      } catch (e: any) {
        logger.error("Error syncing action:", action.type, e);
        return { success: false, action, errorMsg: e.message };
      }
    };

    // Ejecutar todas las acciones en paralelo
    const results = await Promise.allSettled(batch.map(syncAction));

    // Separar acciones fallidas para reintento
    const failedFromBatch: PendingAction[] = [];
    results.forEach((result) => {
      if (result.status === 'fulfilled' && !result.value.success) {
        failedFromBatch.push(result.value.action);
      }
    });

    const newQueue = [...failedFromBatch, ...remaining];
    localStorage.setItem('pending_actions', JSON.stringify(newQueue));
    setPendingQueueLength(newQueue.length);

    // ✅ Mostrar error toast si hubo fallos
    if (failedFromBatch.length > 0) {
      const conflictMsg = results.find(r => r.status === 'fulfilled' && !r.value.success && (r.value as any).errorMsg?.includes('Conflicto'));
      if (conflictMsg) {
         showErrorToast(`Sincronización pausada: ${(conflictMsg as any).value.errorMsg}. Los datos locales fueron cancelados por seguridad.`);
         // Optionally remove the conflicting actions from queue to prevent infinite failing loops
         const remainingNoConflicts = newQueue.filter(q => {
            const resultWithErr = results.find(r => r.status === 'fulfilled' && !r.value.success && (r.value as any).action.id === q.id);
            if (resultWithErr && (resultWithErr as any).value.errorMsg?.includes('Conflicto')) return false; // dismiss conflicts
            return true;
         });
         localStorage.setItem('pending_actions', JSON.stringify(remainingNoConflicts));
         setPendingQueueLength(remainingNoConflicts.length);
      } else {
         showErrorToast(`No se pudieron sincronizar ${failedFromBatch.length} elemento(s). Reintentando...`);
      }
    }

    await fetchData();
    setIsSyncing(false);
  };

  // ✅ Error Toast Helpers
  const showErrorToast = (message: string) => {
    setErrorToast(message);
    // Auto-hide después de 5 segundos
    setTimeout(() => setErrorToast(null), 5000);
  };

  const dismissErrorToast = () => {
    setErrorToast(null);
  };

  const toggleOfflineMode = () => {
    setOfflineMode(prev => {
      const next = !prev;
      localStorage.setItem('offline_mode', String(next));
      if (!next && navigator.onLine) {
        syncPendingActions();
      }
      return next;
    });
  };

  const syncData = async () => {
    await syncPendingActions();
  };

  const restoreData = async (backupData: any): Promise<boolean> => {
    if (!user || !navigator.onLine) return false;
    setIsSyncing(true);
    try {
      if (backupData.plants?.length) {
        const plantsToInsert = backupData.plants.map((p: any) => {
          const { id, ...rest } = p;
          return { ...rest, owner_key: user.key };
        });
        await supabase.from('plants').insert(plantsToInsert);
      }

      if (backupData.crosses?.length) {
        const crossesToInsert = backupData.crosses.map((c: any) => {
          const { id, ...rest } = c;
          return { ...rest, owner_key: user.key };
        });
        await supabase.from('crosses').insert(crossesToInsert);
      }

      if (backupData.alerts?.length) {
        const alertsToInsert = backupData.alerts.map((a: any) => {
          const { id, ...rest } = a;
          return { ...rest, owner_key: user.key };
        });
        await supabase.from('alerts').insert(alertsToInsert);
      }

      if (backupData.climateLogs?.length) {
        const climateToInsert = backupData.climateLogs.map((c: any) => {
          const { id, ...rest } = c;
          return { ...rest, owner_key: user.key };
        });
        await supabase.from('climate_logs').insert(climateToInsert);
      }

      if (backupData.diary?.length) {
        const diaryToInsert = backupData.diary.map((d: any) => {
          const { id, ...rest } = d;
          return { ...rest, owner_key: user.key };
        });
        await supabase.from('diary').insert(diaryToInsert);
      }

      if (backupData.seedBank?.length) {
        const seedBankToInsert = backupData.seedBank.map((s: any) => {
          const { id, ...rest } = s;
          return { ...rest, owner_key: user.key };
        });
        await supabase.from('seed_bank').insert(seedBankToInsert);
      }

      await fetchData();
      setIsSyncing(false);
      return true;
    } catch (e) {
      console.error("Error restoring data", e);
      setIsSyncing(false);
      return false;
    }
  };

  // --- ACTIONS ---

  const addPlant = async (plant: Omit<Plant, 'id'>): Promise<Plant | null> => {
    if (!user) {
      console.error('[AppContext] addPlant: Usuario no autenticado');
      return null;
    }

    console.log('[AppContext] addPlant llamado con:', plant);
    const tempPlant: Plant = { ...plant, id: makeTempId() };
    const newPlants = [tempPlant, ...plants];
    setPlants(newPlants);
    saveToLocal('plants', newPlants);

    if (navigator.onLine && !offlineMode) {
      console.log("[AppContext] addPlant: Enviando a Supabase...");
      try {
        // Timeout reducido a 15 segundos para evitar cuelgues largos
        const { data, error } = await withTimeout(
          supabase.from('plants').insert({ ...plant, owner_key: user.key }).select().single(),
          15000
        ) as any;

        console.log('[AppContext] addPlant: Respuesta de Supabase:', { data, error });

        if (error) {
          console.error("[AppContext] addPlant: Error de Supabase:", error);
          queueAction('ADD_PLANT', { ...plant, owner_key: user.key });
          return tempPlant;
        }

        if (data) {
          console.log('[AppContext] addPlant: Guardado exitoso con ID:', data.id);
          const finalPlants = newPlants.map(p => p.id === tempPlant.id ? data : p);
          setPlants(finalPlants);
          saveToLocal('plants', finalPlants);

          // Trigger objetivo diario
          objectiveEvents.emit('add_plant');

          // Registro en diario (sin await para no bloquear)
          addDiaryEntry({
            planta_nombre: plant.nombre,
            planta_especie: plant.especie,
            fecha: new Date().toISOString().split('T')[0],
            tipo: 'observacion',
            descripcion: `Nueva planta agregada: ${plant.nombre}`,
            imagen: plant.imagen
          }).catch(e => console.warn('Error agregando entrada de diario:', e));

          return data;
        }

        // Sin data ni error - guardar offline
        console.warn('[AppContext] addPlant: Sin data ni error, guardando offline');
        queueAction('ADD_PLANT', { ...plant, owner_key: user.key });
        return tempPlant;

      } catch (error: any) {
        console.error("Supabase Error:", error);
        // En timeout, guardar offline sin mostrar error
        if (error.message === 'Request timed out') {
          console.log('[AppContext] addPlant: Timeout, guardando offline');
          queueAction('ADD_PLANT', { ...plant, owner_key: user.key });
          return tempPlant;
        }
        // Guardar offline y retornar tempPlant para no bloquear
        queueAction('ADD_PLANT', { ...plant, owner_key: user.key });
        return tempPlant;
      }
    } else {
      queueAction('ADD_PLANT', plant);
      return tempPlant;
    }
  };

  const updatePlant = async (plant: Plant): Promise<boolean> => {
    const oldPlants = [...plants];
    setPlants(prev => prev.map(p => p.id === plant.id ? plant : p));

    if (navigator.onLine) {
      try {
        const { id, ...updates } = plant;
        const { error } = await withTimeout(
          supabase.from('plants').update(updates).eq('id', id)
        ) as any;
        if (error) throw error;
        return true;
      } catch (error: any) {
        console.error("Error updating plant", error);
        window.alert(`Error al actualizar: ${error.message}`);
        setPlants(oldPlants);
        return false;
      }
    } else {
      queueAction('UPDATE_PLANT', plant);
      saveToLocal('plants', plants.map(p => p.id === plant.id ? plant : p));
      return true;
    }
  };

  // ✅ addCross arreglado (lock + tempId único + flujo consistente)
  const addCross = async (cross: Omit<Cross, 'id'>, tempId?: number): Promise<{ success: boolean; error?: string }> => {
    console.log('[AppContext] addCross llamado con:', { cross, tempId });

    if (!user) {
      console.error('[AppContext] addCross: Usuario no autenticado');
      return { success: false, error: "Usuario no autenticado" };
    }

    // 🔒 evita doble submit simultáneo
    if (addCrossLockRef.current) {
      console.warn('[AppContext] addCross: Lock activo, rechazando');
      return { success: false, error: "Guardado en progreso. Esperá 1 segundo y reintentá." };
    }
    addCrossLockRef.current = true;
    console.log('[AppContext] addCross: Lock adquirido');

    // ✅ Solo incluir campos que existen en la tabla de Supabase
    const cleanCross = {
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
      notas: cross.notas || '',
      madre_imagen: (cross as any).madre_imagen || null,
      padre_imagen: (cross as any).padre_imagen || null,
      hibrido_imagen: (cross as any).hibrido_imagen || null, // La columna debe existir en Supabase
      owner_key: user.key
    };

    let actualTempId = tempId ?? makeTempId();

    // Optimistic: si no viene tempId, creamos uno local
    if (!tempId) {
      const tempCross: any = { ...cleanCross, id: actualTempId, isSyncing: true };
      setCrosses(prev => {
        const updated = [tempCross, ...prev];
        saveToLocal('crosses', updated);
        return updated;
      });
    }

    try {
      if (navigator.onLine && !offlineMode) {
        console.log('[AppContext] addCross: Enviando a Supabase:', cleanCross);

        const { data, error } = await withTimeout(
          supabase.from('crosses').insert(cleanCross).select().single()
        ) as any;

        console.log('[AppContext] addCross: Respuesta de Supabase:', { data, error });

        if (error) {
          console.error('[AppContext] addCross: Error de Supabase:', error);
          throw error;
        }

        if (data) {
          console.log('[AppContext] addCross: Cruza guardada con ID:', data.id);
          setCrosses(prev => {
            const updated = prev.map((c: any) =>
              c.id === actualTempId ? { ...data, isSyncing: false } : c
            );
            saveToLocal('crosses', updated);
            return updated;
          });

          // Trigger objetivo diario
          objectiveEvents.emit('create_cross');

          return { success: true };
        }

        console.warn('[AppContext] addCross: Respuesta vacía del servidor');
        return { success: false, error: "Respuesta vacía del servidor" };
      }

      // Offline: encolamos y marcamos que ya no está “syncing” eternamente
      queueAction('ADD_CROSS', cleanCross);

      setCrosses(prev => {
        const updated = prev.map((c: any) =>
          c.id === actualTempId ? { ...c, isSyncing: false } : c
        );
        saveToLocal('crosses', updated);
        return updated;
      });

      return { success: true };

    } catch (error: any) {
      console.error('[AppContext] addCross: Error capturado:', error);
      setCrosses(prev => {
        const updated = prev.map((c: any) =>
          c.id === actualTempId
            ? { ...c, isSyncing: false, estado: 'fallida' as const, errorMessage: error.message || "Error desconocido" }
            : c
        );
        saveToLocal('crosses', updated);
        return updated;
      });
      console.error("Supabase Error Cross:", error?.message || error);
      return { success: false, error: error?.message || "Error desconocido" };
    } finally {
      console.log('[AppContext] addCross: Liberando lock');
      addCrossLockRef.current = false;
    }
  };

  const addAlert = async (newAlert: Omit<Alert, 'id'>): Promise<boolean> => {
    if (!user) return false;

    const tempAlert: Alert = { ...newAlert, id: makeTempId(), notified: false, completada: false };
    const newAlerts = [tempAlert, ...alerts];
    setAlerts(newAlerts);
    saveToLocal('alerts', newAlerts);

    if (navigator.onLine) {
      const { data } = await supabase
        .from('alerts')
        .insert({ ...newAlert, notified: false, owner_key: user.key })
        .select()
        .single();

      if (data) {
        const finalAlerts = newAlerts.map(a => a.id === tempAlert.id ? data : a);
        setAlerts(finalAlerts);
        saveToLocal('alerts', finalAlerts);
        return true;
      }
    } else {
      queueAction('ADD_ALERT', { ...newAlert, notified: false });
      return true;
    }
    return false;
  };

  const addDiaryEntry = async (entry: Omit<DiaryEntry, 'id'>): Promise<boolean> => {
    if (!user) {
      console.error('[AppContext] addDiaryEntry: Usuario no autenticado');
      return false;
    }

    console.log('[AppContext] addDiaryEntry llamado con:', entry);

    const tempEntry: DiaryEntry = { ...entry, id: makeTempId() };
    const newDiary = [tempEntry, ...diary];
    setDiary(newDiary);
    saveToLocal('diary', newDiary);

    if (navigator.onLine && !offlineMode) {
      try {
        console.log('[AppContext] addDiaryEntry: Enviando a Supabase...');
        const { data, error } = await supabase
          .from('diary')
          .insert({ ...entry, owner_key: user.key })
          .select()
          .single();

        console.log('[AppContext] addDiaryEntry: Respuesta de Supabase:', { data, error });

        if (error) {
          console.error('[AppContext] addDiaryEntry: Error de Supabase:', error);
          queueAction('ADD_DIARY', { ...entry, owner_key: user.key });
          return false;
        }

        if (data) {
          console.log('[AppContext] addDiaryEntry: Guardado exitoso con ID:', data.id);
          const finalDiary = newDiary.map(d => d.id === tempEntry.id ? data : d);
          setDiary(finalDiary);
          saveToLocal('diary', finalDiary);

          // Trigger objetivos diarios
          objectiveEvents.emit('diary_entry');
          if (entry.imagen || (entry.imagenes && entry.imagenes.length > 0)) {
            objectiveEvents.emit('diary_photo');
          }

          return true;
        }

        return false;
      } catch (err: any) {
        console.error('[AppContext] addDiaryEntry: Error crítico:', err);
        queueAction('ADD_DIARY', { ...entry, owner_key: user.key });
        return false;
      }
    } else {
      console.log('[AppContext] addDiaryEntry: Modo offline, encolando');
      queueAction('ADD_DIARY', { ...entry, owner_key: user.key });
    }
    return true;
  };

  const updateDiaryEntry = async (entry: DiaryEntry): Promise<boolean> => {
    const oldDiary = [...diary];
    setDiary(prev => prev.map(e => e.id === entry.id ? entry : e));
    saveToLocal('diary', diary.map(e => e.id === entry.id ? entry : e));

    if (navigator.onLine) {
      try {
        const { id, ...updates } = entry;
        const { error } = await supabase.from('diary').update(updates).eq('id', id);
        if (error) throw error;
        return true;
      } catch (error: any) {
        console.error("Error updating diary entry", error);
        window.alert(`Error al actualizar: ${error.message}`);
        setDiary(oldDiary);
        return false;
      }
    } else {
      queueAction('UPDATE_DIARY', entry);
      return true;
    }
  };

  const deleteDiaryEntry = async (id: number): Promise<boolean> => {
    setDiary(prev => prev.filter(e => e.id !== id));
    const newDiary = diary.filter(e => e.id !== id);
    saveToLocal('diary', newDiary);

    if (navigator.onLine) {
      await supabase.from('diary').delete().eq('id', id);
    }
    return true;
  };

  const addClimateLog = async (log: Omit<ClimateLog, 'id'>): Promise<boolean> => {
    if (!user) return false;

    const tempLog: ClimateLog = { ...log, id: makeTempId() };
    const newLogs = [tempLog, ...climateLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setClimateLogs(newLogs);
    saveToLocal('climate', newLogs);

    if (navigator.onLine) {
      const { data, error } = await supabase
        .from('climate_logs')
        .insert({ ...log, owner_key: user.key })
        .select()
        .single();

      if (error) {
        console.error("Error saving climate:", error);
        return false;
      } else if (data) {
        const finalLogs = newLogs.map(l => l.id === tempLog.id ? data : l);
        setClimateLogs(finalLogs);
        saveToLocal('climate', finalLogs);

        // Trigger objetivo diario
        objectiveEvents.emit('climate_log');

        return true;
      }
    } else {
      queueAction('ADD_CLIMATE', log);
      // Trigger objetivo diario incluso offline
      objectiveEvents.emit('climate_log');
      return true;
    }
    return false;
  };

  const deletePlant = async (id: number): Promise<boolean> => {
    setPlants(prev => prev.filter(p => p.id !== id));
    if (navigator.onLine) await supabase.from('plants').delete().eq('id', id);
    return true;
  };

  const deleteCross = async (id: number): Promise<boolean> => {
    setCrosses(prev => prev.filter(c => c.id !== id));
    if (navigator.onLine) await supabase.from('crosses').delete().eq('id', id);
    return true;
  };

  const updateCross = async (cross: Cross): Promise<boolean> => {
    // Obtener estado anterior para detectar cambio a completada
    const previousCross = crosses.find(c => c.id === cross.id);
    const justCompleted = cross.estado === 'completada' && previousCross?.estado !== 'completada';

    setCrosses(prev => prev.map(c => c.id === cross.id ? cross : c));
    saveToLocal('crosses', crosses.map(c => c.id === cross.id ? cross : c));

    if (navigator.onLine) {
      const updates = { ...cross } as any;
      delete updates.id;
      const { error } = await supabase.from('crosses').update(updates).eq('id', (cross as any).id);
      if (error) {
        console.error("Error update cross", error);
        return false;
      }
    } else {
      queueAction('UPDATE_CROSS', cross);
    }

    // Trigger objetivo diario si se completó la cruza
    if (justCompleted) {
      objectiveEvents.emit('complete_cross');
    }

    return true;
  };

  const completeAlert = async (id: number): Promise<boolean> => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, completada: true } : a));
    if (activeNotification?.id === id) setActiveNotification(null);
    if (navigator.onLine) await supabase.from('alerts').update({ completada: true }).eq('id', id);

    // Trigger objetivo diario
    objectiveEvents.emit('complete_alert');

    return true;
  };

  const addSeedBatch = async (batch: Omit<SeedBatch, 'id'>): Promise<boolean> => {
    if (!user) {
      console.error('[AppContext] addSeedBatch: Usuario no autenticado');
      return false;
    }

    console.log('[AppContext] addSeedBatch llamado con:', batch);

    const tempBatch: SeedBatch = { ...batch, id: makeTempId(), isSyncing: true };
    const newBank = [tempBatch, ...seedBank];
    setSeedBank(newBank);
    saveToLocal('seedbank', newBank);

    if (navigator.onLine && !offlineMode) {
      try {
        console.log('[AppContext] addSeedBatch: Enviando a Supabase...');
        const { data, error } = await supabase
          .from('seed_bank')
          .insert({ ...batch, owner_key: user.key })
          .select()
          .single();

        console.log('[AppContext] addSeedBatch: Respuesta de Supabase:', { data, error });

        if (error) {
          console.error('[AppContext] addSeedBatch: Error de Supabase:', error);
          // Marcar como fallido pero mantener en local para reintentar
          const failedBank = newBank.map(s => s.id === tempBatch.id ? { ...s, isSyncing: false } : s);
          setSeedBank(failedBank);
          saveToLocal('seedbank', failedBank);
          // Encolar para reintento offline
          queueAction('ADD_SEED_BATCH', { ...batch, owner_key: user.key });
          return false;
        }

        if (data) {
          console.log('[AppContext] addSeedBatch: Guardado exitoso con ID:', data.id);
          const finalBank = newBank.map(s => s.id === tempBatch.id ? { ...data, isSyncing: false } : s);
          setSeedBank(finalBank);
          saveToLocal('seedbank', finalBank);

          // Trigger objetivo diario si está estratificando
          if (batch.estado === 'estratificando') {
            objectiveEvents.emit('start_stratification');
          }

          return true;
        }

        console.warn('[AppContext] addSeedBatch: Respuesta vacía del servidor');
        return false;

      } catch (err: any) {
        console.error('[AppContext] addSeedBatch: Error crítico:', err);
        // Encolar para reintento
        queueAction('ADD_SEED_BATCH', { ...batch, owner_key: user.key });
        return false;
      }
    } else {
      console.log('[AppContext] addSeedBatch: Modo offline, encolando acción');
      queueAction('ADD_SEED_BATCH', { ...batch, owner_key: user.key });
      // Marcar como no syncing ya que está encolado
      const offlineBank = newBank.map(s => s.id === tempBatch.id ? { ...s, isSyncing: false } : s);
      setSeedBank(offlineBank);
      saveToLocal('seedbank', offlineBank);
    }
    return true;
  };

  const updateSeedBatch = async (batch: SeedBatch): Promise<boolean> => {
    console.log('[AppContext] updateSeedBatch llamado con:', batch);

    // Actualizar estado local inmediatamente (optimistic)
    setSeedBank(prev => {
      const updated = prev.map(s => s.id === batch.id ? { ...batch, isSyncing: true } : s);
      saveToLocal('seedbank', updated);
      return updated;
    });

    if (navigator.onLine && !offlineMode) {
      try {
        // Remover campos que no van a Supabase
        const { id, isSyncing, ...updates } = batch as any;

        console.log('[AppContext] updateSeedBatch: Enviando a Supabase:', { id, updates });

        const { data, error } = await supabase
          .from('seed_bank')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        console.log('[AppContext] updateSeedBatch: Respuesta de Supabase:', { data, error });

        if (error) {
          console.error('[AppContext] updateSeedBatch: Error de Supabase:', error);
          // Encolar para reintento
          queueAction('UPDATE_SEED_BATCH', batch);
          // Marcar como no syncing pero mantener cambios locales
          setSeedBank(prev => {
            const updated = prev.map(s => s.id === batch.id ? { ...batch, isSyncing: false } : s);
            saveToLocal('seedbank', updated);
            return updated;
          });
          return false;
        }

        if (data) {
          console.log('[AppContext] updateSeedBatch: Actualización exitosa');
          setSeedBank(prev => {
            const updated = prev.map(s => s.id === batch.id ? { ...data, isSyncing: false } : s);
            saveToLocal('seedbank', updated);
            return updated;
          });
          return true;
        }

        return false;

      } catch (err: any) {
        console.error('[AppContext] updateSeedBatch: Error crítico:', err);
        queueAction('UPDATE_SEED_BATCH', batch);
        return false;
      }
    } else {
      console.log('[AppContext] updateSeedBatch: Modo offline, encolando');
      queueAction('UPDATE_SEED_BATCH', batch);
      // Marcar como no syncing
      setSeedBank(prev => {
        const updated = prev.map(s => s.id === batch.id ? { ...batch, isSyncing: false } : s);
        saveToLocal('seedbank', updated);
        return updated;
      });
    }
    return true;
  };

  const deleteSeedBatch = async (id: number): Promise<boolean> => {
    setSeedBank(prev => prev.filter(s => s.id !== id));
    saveToLocal('seedbank', seedBank.filter(s => s.id !== id));
    if (navigator.onLine) await supabase.from('seed_bank').delete().eq('id', id);
    return true;
  };

  const deleteAlert = async (id: number): Promise<boolean> => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    if (navigator.onLine) await supabase.from('alerts').delete().eq('id', id);
    return true;
  };

  const markMessageRead = async (id: number) => {
    setInbox(prev => prev.map(msg => msg.id === id ? { ...msg, is_read: true } : msg));
    if (navigator.onLine) {
      await supabase.from('inbox_messages').update({ is_read: true }).eq('id', id);
    }
  };

  const dismissNotification = () => setActiveNotification(null);

  // ✅ PAGINATION FUNCTIONS
  const loadMorePlants = async () => {
    if (!user || !plantsHasMore || isSyncing) return;

    setIsSyncing(true);
    try {
      let query = supabase
        .from('plants')
        .select('*')
        .eq('owner_key', user.key)
        .order('id', { ascending: false })
        .limit(PAGE_SIZE);

      if (plantsCursor) {
        query = query.lt('id', plantsCursor);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        setPlants(prev => [...prev, ...data]);
        setPlantsCursor(data[data.length - 1].id);

        if (data.length < PAGE_SIZE) {
          setPlantsHasMore(false);
        }
      } else {
        setPlantsHasMore(false);
      }
    } catch (error) {
      logger.error('Error loading more plants:', error);
      showErrorToast('Error al cargar más plantas');
    } finally {
      setIsSyncing(false);
    }
  };

  const loadMoreCrosses = async () => {
    if (!user || !crossesHasMore || isSyncing) return;

    setIsSyncing(true);
    try {
      let query = supabase
        .from('crosses')
        .select('*')
        .eq('owner_key', user.key)
        .order('id', { ascending: false })
        .limit(PAGE_SIZE);

      if (crossesCursor) {
        query = query.lt('id', crossesCursor);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        setCrosses(prev => [...prev, ...data]);
        setCrossesCursor(data[data.length - 1].id);

        if (data.length < PAGE_SIZE) {
          setCrossesHasMore(false);
        }
      } else {
        setCrossesHasMore(false);
      }
    } catch (error) {
      logger.error('Error loading more crosses:', error);
      showErrorToast('Error al cargar más cruzas');
    } finally {
      setIsSyncing(false);
    }
  };

  const loadMoreDiary = async () => {
    if (!user || !diaryHasMore || isSyncing) return;

    setIsSyncing(true);
    try {
      let query = supabase
        .from('diary')
        .select('*')
        .eq('owner_key', user.key)
        .order('id', { ascending: false })
        .limit(PAGE_SIZE);

      if (diaryCursor) {
        query = query.lt('id', diaryCursor);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        setDiary(prev => [...prev, ...data]);
        setDiaryCursor(data[data.length - 1].id);

        if (data.length < PAGE_SIZE) {
          setDiaryHasMore(false);
        }
      } else {
        setDiaryHasMore(false);
      }
    } catch (error) {
      logger.error('Error loading more diary entries:', error);
      showErrorToast('Error al cargar más entradas del diario');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    const runChecks = () => {
      const now = new Date().getTime();
      let notificationFound = false;

      const updatedAlerts = alerts.map(alert => {
        if (alert.completada || alert.notified) return alert;

        const alertTime = new Date(alert.fecha).getTime();
        const diffMinutes = (alertTime - now) / 1000 / 60;

        if (diffMinutes > -60 && diffMinutes <= 30) {
          if (!notificationFound) {
            setActiveNotification(alert);
            notificationFound = true;
          }
          if (navigator.onLine) supabase.from('alerts').update({ notified: true }).eq('id', alert.id);
          return { ...alert, notified: true };
        }
        return alert;
      });

      if (JSON.stringify(updatedAlerts) !== JSON.stringify(alerts)) {
        setAlerts(updatedAlerts);
        saveToLocal('alerts', updatedAlerts);
      }

      if (navigator.onLine) fetchInbox();
    };

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
        isOnline,
        isSyncing,
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
        refreshInbox: fetchInbox,
        dismissNotification,
        syncData,
        restoreData,
        loadingError,
        fetchData,
        setCrosses,
        // Seed Bank
        seedBank,
        addSeedBatch,
        updateSeedBatch,
        deleteSeedBatch,
        // Shared
        offlineMode,
        toggleOfflineMode,
        pendingQueueLength,
        syncPendingActions,
        // Error Toast
        errorToast,
        showErrorToast,
        dismissErrorToast,
        // Pagination
        plantsHasMore,
        crossesHasMore,
        diaryHasMore,
        loadMorePlants,
        loadMoreCrosses,
        loadMoreDiary
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
