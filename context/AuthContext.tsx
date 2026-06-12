import React, { createContext, useContext, useState } from 'react';
import { AuthContextType, UserSession, PlanType } from '../types';

// ============================================================
// AUTH LOCAL - App personal sin nube
// No hay login ni licencias: siempre hay un único usuario local.
// Se mantiene la clave histórica KEY-PMO5M4 para que los datos
// guardados en localStorage con ese prefijo sigan funcionando.
// ============================================================

const PROFILE_STORAGE_KEY = 'local_profile';

const DEFAULT_PROFILE = {
  label: 'CARNI ESTUDIO 3D',
  avatar_url: undefined as string | undefined,
  slug: 'carni-estudio-3d',
};

const loadProfile = () => {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    return raw ? { ...DEFAULT_PROFILE, ...JSON.parse(raw) } : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
};

const buildUser = (): UserSession => {
  const profile = loadProfile();
  return {
    key: 'KEY-PMO5M4',
    uid: 'LOCAL-USER',
    email: 'local@carnilab.app',
    isAuthenticated: true,
    isAdmin: false,
    plan: 'elite',
    slug: profile.slug,
    avatar_url: profile.avatar_url,
    label: profile.label,
    daysRemaining: null,
  };
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession>(buildUser);

  const saveProfile = (patch: Partial<typeof DEFAULT_PROFILE>) => {
    const next = { ...loadProfile(), ...patch };
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next));
  };

  const updateUserLabel = async (newLabel: string): Promise<boolean> => {
    saveProfile({ label: newLabel });
    setUser(u => ({ ...u, label: newLabel }));
    return true;
  };

  const updateUserAvatar = async (url: string): Promise<boolean> => {
    saveProfile({ avatar_url: url });
    setUser(u => ({ ...u, avatar_url: url }));
    return true;
  };

  const updateUserSlug = async (newSlug: string): Promise<boolean> => {
    saveProfile({ slug: newSlug });
    setUser(u => ({ ...u, slug: newSlug }));
    return true;
  };

  // --- Funciones legacy (sin efecto en la app local) ---
  const noopOk = async () => ({ success: true, message: 'App local: no requiere cuenta' });
  const updateUserPlan = async (_newPlan: PlanType) => true;

  return (
    <AuthContext.Provider value={{
      user,
      keys: [],
      isLoadingAuth: false,
      loadingStatus: 'Local',
      authError: null,
      recoveryMode: false,
      signUp: noopOk,
      signIn: noopOk,
      resendConfirmation: async () => true,
      resetPassword: noopOk,
      logout: async () => { /* app local: no hay sesión que cerrar */ },
      generateKey: () => { },
      deleteKey: () => { },
      updateKeyPlan: async () => true,
      updateUserLabel,
      updateUserAvatar,
      updateUserPlan,
      updateUserSlug,
      updateKeyExpiry: async () => true,
      subscribeToPush: async () => false,
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
