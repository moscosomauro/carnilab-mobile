

export interface Plant {
  id: number;
  nombre: string;
  especie: string;
  fecha_adquisicion?: string;
  origen?: string;
  precio?: number | null;
  estado: 'saludable' | 'regular' | 'critico';
  ubicacion?: string;
  notas?: string;
  imagen: string | null;
  images?: PlantImage[]; // New for Vivero 2.0
  en_venta?: boolean;
  precio_venta?: number | null;
  // Detalles de cultivo (rediseño 2026)
  iluminacion?: string;
  humedad?: string;
  sustrato?: string;
  tamano_maceta?: string;
  etiquetas?: string[];
  // Plan de polinización: marca de floración para la matriz de cruzas
  en_floracion?: boolean;
  fecha_floracion?: string;
}

export interface PlantImage {
  id: string;
  plant_id: number;
  image_url: string;
  display_order: number;
}

export interface ExtraParent {
  id: string; // Identificador temporal para la UI
  nombre: string;
  especie: string;
  imagen: string | null;
}

export interface Cross {
  id: number;
  nombre: string;
  madre_nombre: string;
  madre_especie: string;
  padre_nombre: string;
  padre_especie: string;
  // Lista de padres adicionales (donantes extra)
  padres_extra?: ExtraParent[];
  objetivo?: string; // Objetivo de la cruza (rediseño 2026)
  fecha_cruza: string;
  fecha_germinacion: string | null;
  semillas_obtenidas: number;
  plantas_germinadas: number;
  estado: 'en_proceso' | 'completada' | 'fallida';
  notas: string;
  madre_imagen?: string | null;
  padre_imagen?: string | null;
  hibrido_imagen?: string | null; // Nuevo: Foto del híbrido resultante
  isSyncing?: boolean; // Propiedad para UI optimista
  errorMessage?: string; // Nuevo: Detalle del error si falla

  // === Gestión de polinización (móvil 2026) — todo opcional, no rompe escritorio ===
  // Estado del ciclo de polinización (más rico que `estado`).
  estado_polinizacion?: 'programada' | 'pendiente' | 'hecha' | 'vencida';
  // Planificación
  fecha_programada?: string;        // día planificado para polinizar
  hora_programada?: string;         // "11:00"
  ubicacion?: string;               // invernadero / área
  prioridad?: 'baja' | 'media' | 'alta';
  recordatorio?: boolean;           // avisar el día programado
  fuente_polen?: string;            // de dónde sale el polen
  etiqueta?: string;                // código/etiqueta (ej. "S8-001")
  // Registro del evento de polinización
  fecha_polinizacion?: string;
  hora_polinizacion?: string;
  checklist?: PollinationChecklist;
  temp?: number | null;             // °C al polinizar
  humedad?: number | null;          // % al polinizar
  expectativa_capsula?: string;
  // Seguimiento de cápsula / cosecha
  capsula_estado?: 'desarrollo' | 'maduro' | 'cosechada';
  cosecha_estimada?: string;        // fecha estimada de cosecha
  semillas_estimadas?: number | null;
  fotos?: string[];                 // fotos vinculadas a la cruza
}

export interface PollinationChecklist {
  polen_aplicado?: boolean;
  estigma_receptivo?: boolean;
  pincel_limpio?: boolean;
  etiqueta_colocada?: boolean;
  aislamiento_aplicado?: boolean;
}

export interface Alert {
  id: number;
  tipo: string;
  planta: string;
  mensaje: string;
  prioridad: 'alta' | 'media' | 'baja';
  fecha: string; // Fecha de vencimiento
  completada: boolean;
  notified?: boolean;
  icon?: string;
  color?: string;
}

export interface DiaryEntry {
  id: number;
  planta_nombre: string;
  planta_especie: string;
  fecha: string;
  tipo: 'riego' | 'fertilizacion' | 'poda' | 'observacion';
  descripcion: string;
  imagen: string | null; // Mantener por compatibilidad
  imagenes?: string[]; // Nuevo: múltiples fotos
  altura?: number;
  hojas?: number;
  owner_key?: string;
}

export interface ClimateLog {
  id: number;
  date: string;
  temp_max: number;
  temp_min: number;
  humidity: number;
  notes?: string;
}

export interface InboxMessage {
  id: number;
  sender_name: string;
  sender_contact: string; // Coincide con SQL
  message: string;
  plant_name?: string;
  plant_id?: number;
  is_read: boolean; // Coincide con SQL
  created_at: string;
}

// SHOP TYPES
export interface ShopProduct {
  id: number;
  owner_key: string;
  title: string;
  description?: string;
  price: number;
  stock: number;
  image_url: string;
  category: 'plant' | 'supply' | 'merch';
  active: boolean;
  is_featured?: boolean;
  created_at?: string;
}

export interface ShopOrder {
  id: number;
  owner_key: string;
  customer_name: string;
  customer_contact: string;
  items: {
    id: number;
    title: string;
    price: number;
    qty: number;
  }[];
  total: number;
  status: 'pending' | 'paid' | 'shipped' | 'cancelled';
  created_at: string;
}

// AUTH TYPES
export type PlanType = 'basic' | 'pro' | 'elite';

export interface AccessKey {
  key: string;
  createdAt: string;
  expiresAt: string | null; // null = permanente
  deviceId: string | null; // AHORA SE USARÁ COMO USER_ID DE SUPABASE
  label: string; // Nombre del usuario o nota
  plan: PlanType;
  slug?: string; // Enlace público del vivero
  avatar_url?: string; // Foto de perfil
}

export interface UserSession {
  key: string; // La licencia vinculada (necesaria para filtrar datos)
  uid: string; // El ID de usuario de Supabase Auth
  email: string;
  isAuthenticated: boolean;
  isAdmin: boolean;
  plan: PlanType;
  slug?: string;
  avatar_url?: string;
  label?: string; // Nombre público local
  daysRemaining?: number | null; // null = infinito
}

export interface AuthContextType {
  user: UserSession | null;
  keys: AccessKey[];
  isLoadingAuth: boolean;
  loadingStatus: string;
  authError: string | null;
  recoveryMode: boolean; // Add to type
  signUp: (email: string, pass: string, name: string, licenseKey: string) => Promise<{ success: boolean; message: string }>;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; message: string }>;
  resendConfirmation: (email: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>; // NUEVO
  logout: () => Promise<void>;
  generateKey: (label: string, daysValid: number | null, plan: PlanType) => void;
  deleteKey: (key: string) => void;
  updateKeyPlan: (key: string, newPlan: PlanType) => Promise<boolean>;
  updateUserLabel: (newLabel: string) => Promise<boolean>;
  updateUserAvatar: (url: string) => Promise<boolean>;
  updateUserPlan: (newPlan: PlanType) => Promise<boolean>;
  updateUserSlug: (newSlug: string) => Promise<boolean>;
  updateKeyExpiry: (key: string, newDate: string | null) => Promise<boolean>;
  subscribeToPush: () => Promise<boolean>; // NUEVO
}

export interface SystemMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  active: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface SeedBatch {
  id: number;
  nombre: string;
  especie?: string;
  cantidad: number;
  fecha_ingreso: string;
  origen: 'propia' | 'externa';
  cross_id?: number | null;
  estado: 'almacenada' | 'estratificando' | 'sembrada' | 'agotada';
  inicio_estratificacion?: string | null;
  fin_estratificacion?: string | null;
  notas?: string;
  // Rediseño 2026
  germinacion?: number; // % de germinación actual
  ubicacion?: string;   // p.ej. "Cámara fría 1 · Estante B"
  owner_key?: string;
  isSyncing?: boolean;
}

// =============================================
// GENETIC ANALYSIS TYPES (Lab / AI Vision)
// =============================================

export interface ColorationAnalysis {
  dominant: string; // "red" | "green" | "mixed"
  percentage: number;
  description: string;
}

export interface TrapSizeAnalysis {
  category: 'miniature' | 'small' | 'medium' | 'large' | 'giant';
  estimated_cm: number;
}

export interface TeethAnalysis {
  type: 'short' | 'medium' | 'long' | 'fused';
  description: string;
}

export interface VigorAnalysis {
  level: 'low' | 'medium' | 'high';
  score: number; // 1-10
}

export interface GeneticAnalysisResult {
  coloration: ColorationAnalysis;
  trap_size: TrapSizeAnalysis;
  teeth_shape: TeethAnalysis;
  vigor: VigorAnalysis;
  anthocyanins: {
    present: boolean;
    intensity: 'none' | 'light' | 'moderate' | 'strong';
  };
  growth_pattern: {
    type: 'upright' | 'prostrate' | 'rosette';
    description: string;
  };
  traits: string[]; // Lista de rasgos identificados
  raw_analysis: string; // Texto completo de la IA
  confidence?: number; // 0.0 - 1.0
}

export interface CrossAnalysis {
  id: string;
  cross_id: number;
  owner_key: string;
  image_url: string;
  image_type: 'progeny' | 'mother' | 'father';
  analysis_result: GeneticAnalysisResult;
  confidence_score: number;
  model_used: string;
  created_at: string;
  updated_at: string;
}

export interface ProgenyPhoto {
  id: string;
  cross_id: number;
  owner_key: string;
  image_url: string;
  label?: string;
  notes?: string;
  analysis_id?: string | null;
  analysis?: CrossAnalysis | null; // Populated on fetch
  created_at: string;
}

// =============================================
// DAILY OBJECTIVES SYSTEM
// =============================================

export type ObjectiveType =
  | 'add_plant'
  | 'diary_entry'
  | 'diary_photo'
  | 'complete_alert'
  | 'climate_log'
  | 'create_cross'
  | 'complete_cross'
  | 'start_stratification'
  | 'ai_analysis';

export interface DailyObjective {
  id: string;
  type: ObjectiveType;
  title: string;
  description: string;
  xpReward: number;
  requiredPlan: PlanType;
  isCompleted: boolean;
  completedAt?: string;
  icon: string;
}

export interface DailyObjectivesState {
  date: string; // YYYY-MM-DD
  objectives: DailyObjective[];
  totalXpToday: number;
  streak: number;
  lastStreakDate: string | null;
}

export interface UserXpProfile {
  totalXp: number;
  level: number;
  currentLevelXp: number;
  xpToNextLevel: number;
}

// =============================================
// BADGE / ACHIEVEMENT SYSTEM
// =============================================

export type BadgeCategory = 'collection' | 'breeding' | 'dedication' | 'mastery' | 'special';

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  requirement: {
    type: string;
    count: number;
  };
  xpBonus: number;
}

export interface UserBadge {
  badgeId: string;
  unlockedAt: string;
  progress: number; // 0-100
}

export interface BadgesState {
  earnedBadges: UserBadge[];
  totalBadgesEarned: number;
  lastUnlockedBadge: string | null;
}