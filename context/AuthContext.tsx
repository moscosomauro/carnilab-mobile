import React, { createContext, useContext, useState, useEffect } from 'react';
import { AccessKey, AuthContextType, UserSession, PlanType } from '../types';
import { supabase } from '../supabaseClient';
import { logger } from '../utils/logger';
// OR just update types.ts. I'll check types.ts first, but for now I'll edit this file's context definition 
// assuming I can cast it, but better to edit types.ts.
// Actually, I can't easily see types.ts content right now without a read, but I should probably just edit types.ts next.
// For now, I'll update the Context Provider in this file, and then I MUST update types.ts.

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Clave maestra para entrar al admin panel - Ahora configurable desde .env
const MASTER_ADMIN_KEY = import.meta.env.VITE_ADMIN_PASSWORD || "CARNI-ADMIN-2024";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [keys, setKeys] = useState<AccessKey[]>([]);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [recoveryMode, setRecoveryMode] = useState(false); // Estado para recovery

  // 1. Verificar sesión al inicio
  useEffect(() => {
    // Definimos una bandera para saber si ya estamos cargando algo
    let isInitialCheckDone = false;
    let isMounted = true; // Para evitar actualizaciones de estado en componentes desmontados

    const init = async () => {
      await checkSession();
      isInitialCheckDone = true;
    };

    init();

    // Escuchar cambios de sesión de Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.debug("Auth Event:", event);

      // CRITICAL: Detectar recuperación aquí, al nivel más alto
      if (event === 'PASSWORD_RECOVERY') {
        if (isMounted) {
          setRecoveryMode(true);
          logger.info("Modo Recuperación Activado Globalmente");
        }
      } else {
        // Si no es un evento de recuperación, asegurar que el modo de recuperación esté desactivado
        if (isMounted && recoveryMode) {
          setRecoveryMode(false);
        }
      }

      // Usamos la bandera para evitar procesar eventos durante el init si ya checkSession lo hace
      if (isInitialCheckDone && isMounted) {
        if (event === 'SIGNED_IN' && session) {
          if (!user || user.uid !== session.user.id) {
            await loadUserLicense(session.user);
          }
        }
      }

      if (event === 'SIGNED_OUT' || (event === 'USER_UPDATED' && !session)) {
        // Solo limpiamos si realmente no hay sesión en el evento
        if (!session && isMounted) {
          logger.warn("Auth event: SIGNED_OUT - Clearing state");
          setUser(null);
          clearLocalData();
          localStorage.removeItem('user_session');
          setLoadingStatus('Sesión cerrada');
          setIsLoadingAuth(false); // Asegurarse de que el loading se desactive
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Cargar claves solo si soy admin
  useEffect(() => {
    if (user?.isAdmin) {
      fetchKeys();
    }
  }, [user]);

  const clearLocalData = () => {
    localStorage.removeItem('plants');
    localStorage.removeItem('crosses');
    localStorage.removeItem('alerts');
    localStorage.removeItem('diary');
    localStorage.removeItem('inbox');
  };

  const checkSession = async () => {
    setIsLoadingAuth(true);
    setLoadingStatus('Verificando sesión...');

    try {
      // 1. Intentar Admin Local Primero (Legacy/Backdoor)
      const localAdmin = localStorage.getItem('user_session');
      if (localAdmin) {
        try {
          const parsed = JSON.parse(localAdmin);
          if (parsed.isAdmin && parsed.uid === 'ADMIN-DEVICE-MASTER') {
            setUser(parsed);
            setIsLoadingAuth(false);
            return;
          }
        } catch (e) {
          logger.error("Local admin parse error", e);
        }
      }

      // 2. Intentar Sesión de Supabase
      const { data, error } = await supabase.auth.getSession();

      if (error) throw error;

      if (data?.session?.user) {
        await loadUserLicense(data.session.user);
      } else {
        setLoadingStatus('Invitado');
      }
    } catch (error) {
      logger.warn("Session check failed:", error);
      setLoadingStatus('No se pudo verificar la sesión');
    } finally {
      // Garantizar que la UI se libere después de cargar el usuario (o fallar)
      setIsLoadingAuth(false);
    }
  };

  const calculateDaysRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const now = new Date();
    const exp = new Date(expiresAt);
    const diffTime = exp.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Función crítica: Vincula el Auth User con la Tabla de Licencias
  const loadUserLicense = async (sbUser: any) => {
    try {
      // Buscamos la licencia donde device_id sea igual al ID del usuario
      const { data: license, error } = await supabase
        .from('access_keys')
        .select('*')
        .eq('device_id', sbUser.id)
        .maybeSingle();

      if (error) {
        console.error("Error loading license:", error);
        return;
      }

      if (license) {
        // Verificar expiración
        const daysRemaining = calculateDaysRemaining(license.expires_at);

        // Si la licencia expiró hace más de 1 día, bloquear acceso
        if (daysRemaining !== null && daysRemaining < -1) {
          setAuthError("Tu licencia ha expirado. Por favor contacta al administrador.");
          await supabase.auth.signOut();
          return;
        }

        const sessionUser: UserSession = {
          key: license.key,
          uid: sbUser.id,
          email: sbUser.email,
          isAuthenticated: true,
          isAdmin: false,
          plan: license.plan || 'basic',
          slug: license.slug,
          avatar_url: license.avatar_url,
          label: license.label || sbUser.user_metadata?.full_name || 'Usuario',
          daysRemaining: daysRemaining
        };
        setUser(sessionUser);
        setAuthError(null);
        setLoadingStatus('Usuario cargado correctamente');
      } else {
        console.warn("Usuario autenticado sin licencia vinculada");
        setAuthError("No se encontró una licencia vinculada a este correo.");
        await supabase.auth.signOut();
      }
    } catch (e: any) {
      console.error(e);
      setAuthError("Error crítico al cargar tu sesión. Reintenta.");
    }
  };

  // --- ACTIONS ---

  const signUp = async (email: string, pass: string, name: string, licenseKey?: string): Promise<{ success: boolean; message: string }> => {
    try {
      const cleanEmail = email.trim();
      const cleanPass = pass.trim();
      const cleanKey = licenseKey?.trim().toUpperCase();

      let targetKey = cleanKey;

      // 1. Manejo de Licencia
      if (cleanKey) {
        // Verificar si la licencia existe
        const { data: keyData, error: keyError } = await supabase
          .from('access_keys')
          .select('*')
          .ilike('key', cleanKey)
          .maybeSingle();

        if (keyError || !keyData) {
          return { success: false, message: 'La Licencia ingresada no existe.' };
        }
        if (keyData.device_id) {
          return { success: false, message: 'Esta licencia ya está en uso.' };
        }
        targetKey = keyData.key;
      }

      // 2. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPass,
        options: {
          data: { full_name: name },
          emailRedirectTo: window.location.origin
        }
      });

      if (authError) return { success: false, message: authError.message };
      if (!authData.user) return { success: false, message: 'Error al crear usuario.' };

      const userId = authData.user.id;

      // 3. Vincular o Crear Licencia
      if (targetKey) {
        // Vincular licencia existente
        await supabase
          .from('access_keys')
          .update({ device_id: userId, label: name })
          .eq('key', targetKey);
      } else {
        // CREAR LICENCIA GRATUITA
        const freeKey = 'FREE-' + Math.random().toString(36).substr(2, 6).toUpperCase();
        const slug = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substr(2, 4)}`;

        await supabase.from('access_keys').insert({
          key: freeKey,
          label: name,
          device_id: userId,
          plan: 'basic',
          slug: slug
        });
      }

      const emailConfirmationRequired = authData.user && !authData.session;
      if (emailConfirmationRequired) {
        return { success: true, message: 'EMAIL_CONFIRMATION_REQUIRED' };
      }

      return { success: true, message: 'Cuenta creada exitosamente' };

    } catch (e: any) {
      return { success: false, message: e.message || 'Error desconocido' };
    }
  };

  const signIn = async (email: string, pass: string): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = email.trim();
    const cleanPass = pass.trim();

    // Backdoor Admin
    if (cleanEmail.toUpperCase() === 'ADMIN' && cleanPass === MASTER_ADMIN_KEY) {
      const adminSession: UserSession = {
        key: 'ADMIN-KEY',
        uid: 'ADMIN-DEVICE-MASTER',
        email: 'admin@carnilab.com',
        isAuthenticated: true,
        isAdmin: true,
        plan: 'elite',
        slug: 'carni-admin-official',
        label: 'Super Admin'
      };
      setUser(adminSession);
      localStorage.setItem('user_session', JSON.stringify(adminSession));
      return { success: true, message: 'Bienvenido Admin' };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPass
    });

    if (error) {
      return { success: false, message: error.message || 'Credenciales incorrectas' };
    }

    return { success: true, message: 'Ingresando...' };
  };

  const resendConfirmation = async (email: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      return !error;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#/login?type=recovery`, // Redirigir al login con hash
      });
      if (error) return { success: false, message: error.message };
      return { success: true, message: 'Correo de recuperación enviado.' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  };


  const logout = async () => {
    try {
      // Intentar cerrar sesión en el servidor
      const { error } = await supabase.auth.signOut();
      if (error) console.warn("Error signing out from Supabase:", error);
    } catch (e) {
      console.error("Unexpected error during logout:", e);
    } finally {
      // SIEMPRE limpiar el estado local, falle o no el servidor
      setUser(null);
      clearLocalData();
      localStorage.removeItem('user_session'); // Legacy admin clean

      // Forzar limpieza de tokens de Supabase en localStorage si existen
      // Esto es un hack por si el cliente de Supabase falla en limpiar
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
          localStorage.removeItem(key);
        }
      });
    }
  };

  // --- ADMIN FUNCTIONS ---

  const fetchKeys = async () => {
    try {
      // 1. Intentar usar la función RPC segura (Bypass RLS para Backdoor Admin)
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_all_keys_secure');

      let finalData = rpcData;
      let finalError = rpcError;

      // 2. Si RPC falla (ej: no existe la función o permisos), intentar select normal
      if (rpcError) {
        console.warn("RPC fetchKeys failed, falling back to standard select", rpcError);
        const { data: stdData, error: stdError } = await supabase.from('access_keys').select('*').order('created_at', { ascending: false });
        finalData = stdData;
        finalError = stdError;
      }

      if (!finalError && finalData) {
        const mappedKeys: AccessKey[] = finalData.map((k: any) => ({
          key: k.key,
          label: k.label,
          deviceId: k.device_id, // Aquí vendrá el UUID del usuario
          createdAt: k.created_at,
          expiresAt: k.expires_at,
          plan: k.plan || 'basic',
          slug: k.slug
        }));
        setKeys(mappedKeys);
      }
    } catch (e) {
      console.error("Critical error fetching keys", e);
    }
  };

  const generateKey = async (label: string, daysValid: number | null, plan: PlanType) => {
    const newKeyString = 'KEY-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    const slug = `${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substr(2, 4)}`;

    let expirationDate = null;
    if (daysValid) {
      const date = new Date();
      date.setDate(date.getDate() + daysValid);
      expirationDate = date.toISOString();
    }

    const { error } = await supabase.from('access_keys').insert({
      key: newKeyString,
      label: label,
      expires_at: expirationDate,
      device_id: null,
      plan: plan,
      slug: slug
    });

    if (!error) fetchKeys();
  };

  const deleteKey = async (keyToDelete: string) => {
    const { error } = await supabase.from('access_keys').delete().eq('key', keyToDelete);
    if (!error) setKeys(prev => prev.filter(k => k.key !== keyToDelete));
  };

  const updateKeyPlan = async (keyTarget: string, newPlan: PlanType): Promise<boolean> => {
    const { error } = await supabase.from('access_keys').update({ plan: newPlan }).eq('key', keyTarget);
    if (error) return false;
    setKeys(prev => prev.map(k => k.key === keyTarget ? { ...k, plan: newPlan } : k));
    return true;
  };

  const updateUserLabel = async (newLabel: string): Promise<boolean> => {
    if (!user) return false;
    const { error } = await supabase.from('access_keys').update({ label: newLabel }).eq('key', user.key);
    if (error) return false;
    setUser({ ...user, label: newLabel });
    return true;
  };

  const updateUserAvatar = async (url: string): Promise<boolean> => {
    if (!user) return false;
    // Guardamos la URL en la tabla access_keys para persistencia
    const { error } = await supabase.from('access_keys').update({ avatar_url: url }).eq('key', user.key);

    if (error) {
      console.error("Error updating avatar:", error);
      throw new Error(`DB Update Failed: ${error.message}`);
    }

    setUser({ ...user, avatar_url: url });
    return true;
  };

  const updateUserPlan = async (newPlan: PlanType): Promise<boolean> => {
    if (!user) return false;
    const { error } = await supabase.from('access_keys').update({ plan: newPlan }).eq('device_id', user.uid);
    if (error) return false;
    setUser({ ...user, plan: newPlan });
    return true;
  };

  const updateUserSlug = async (newSlug: string): Promise<boolean> => {
    if (!user) return false;
    // We update in DB as a backup, though Discovery already does it. 
    // The Main Goal is updating the local state.
    const { error } = await supabase.from('access_keys').update({ slug: newSlug }).eq('device_id', user.uid);
    if (error) {
      console.warn("Error syncing slug in AuthContext", error);
      return false;
    }
    setUser({ ...user, slug: newSlug });
    return true;
  };

  const updateKeyExpiry = async (keyTarget: string, newDate: string | null): Promise<boolean> => {
    const { error } = await supabase.from('access_keys').update({ expires_at: newDate }).eq('key', keyTarget);
    if (error) {
      console.error("Error updating expiry:", error);
      return false;
    }
    setKeys(prev => prev.map(k => k.key === keyTarget ? { ...k, expiresAt: newDate } : k));
    return true;
  };

  // --- PUSH NOTIFICATIONS ---

  const VAPID_PUBLIC_KEY = "BBoKBOo28U2-XV99zuZ1-y1LJoxJLc24rd-9WmyUZ5mQQGbaMCtV-M0HJMNCT2r0Bx2f0kzNpI_a-INftYAenW0";

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPush = async (): Promise<boolean> => {
    if (!user) return false;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn("Push messages not supported");
      return false;
    }

    try {
      // 1. Request Permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error("Permission denied");
      }

      // 2. Get SW Registration
      const registration = await navigator.serviceWorker.ready;

      // 3. Subscribe
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // 4. Send to Supabase
      const subJSON = subscription.toJSON();

      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: user.uid,
        endpoint: subJSON.endpoint,
        p256dh: subJSON.keys?.p256dh,
        auth: subJSON.keys?.auth,
        user_agent: navigator.userAgent
      }, { onConflict: 'endpoint' });

      if (error) throw error;

      console.log("Push Subscribed Successfully");
      return true;

    } catch (e) {
      console.error("Error subscribing to push:", e);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      keys,
      isLoadingAuth,
      loadingStatus,
      authError,
      recoveryMode,
      signUp,
      signIn,
      resendConfirmation,
      resetPassword,
      logout,
      generateKey,
      deleteKey,
      updateKeyPlan,
      updateUserLabel,
      updateUserAvatar,
      updateUserPlan,
      updateUserSlug,
      updateKeyExpiry,
      subscribeToPush // Expose to UI
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};