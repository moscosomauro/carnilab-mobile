# 🚀 GUÍA COMPLETA DE CONSTRUCCIÓN CARNILAB

**Documento de Especificación Arquitectónica y Requisitos Completos**
*Esta guía contiene todas las instrucciones, stack tecnológico y características detalladas para construir la aplicación "CarniLab" desde cero.*

---

## 📋 ÍNDICE

1. [Stack Tecnológico y Dependencias](#1-stack-tecnológico-y-dependencias)
2. [Arquitectura de Datos y Seguridad](#2-arquitectura-de-datos-y-seguridad)
3. [Estructura del Proyecto](#3-estructura-del-proyecto)
4. [Contextos Globales](#4-contextos-globales)
5. [Sistema de Autenticación](#5-sistema-de-autenticación)
6. [Pantallas (Screens) - 27 Módulos](#6-pantallas-screens)
7. [Componentes Reutilizables - 26 Componentes](#7-componentes-reutilizables)
8. [Utilidades y Helpers - 9 Módulos](#8-utilidades-y-helpers)
9. [Edge Functions (Supabase) - 9 Funciones](#9-edge-functions-supabase)
10. [Sistema de Temas y UI](#10-sistema-de-temas-y-ui)
11. [Gamificación (XP, Objetivos, Insignias)](#11-gamificación)
12. [Offline Mode y PWA](#12-offline-mode-y-pwa)
13. [Capacitor (iOS/Android)](#13-capacitor-mobile)
14. [Despliegue y Producción](#14-despliegue-y-producción)

---

## 1. 🛠 STACK TECNOLÓGICO Y DEPENDENCIAS

### Frontend & Core
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "typescript": "^5.6.3",
  "vite": "^6.0.7",
  "@vitejs/plugin-react": "^4.3.4",
  "react-router-dom": "^6.28.0"
}
```

### Backend as a Service (BaaS)
```json
{
  "@supabase/supabase-js": "^2.47.10"
}
```
- **PostgreSQL** (base de datos relacional)
- **Row Level Security (RLS)** para multi-tenancy
- **Storage** para imágenes
- **Edge Functions** (Deno runtime)
- **Realtime** para mensajería

### Empaquetado Multiplataforma
```json
{
  "@capacitor/core": "^6.2.0",
  "@capacitor/cli": "^6.2.0",
  "@capacitor/android": "^6.2.0",
  "@capacitor/ios": "^6.2.0",
  "@capacitor/camera": "^6.0.2",
  "@capacitor/filesystem": "^6.0.1",
  "@capacitor/haptics": "^6.0.1",
  "@capacitor/keyboard": "^6.0.2",
  "@capacitor/splash-screen": "^6.0.2",
  "@capacitor/status-bar": "^6.0.1",
  "vite-plugin-pwa": "^0.21.1",
  "workbox-window": "^7.3.0"
}
```

### Librerías UI y Utilidades
```json
{
  "zod": "^3.23.8",
  "framer-motion": "^11.15.0",
  "embla-carousel-react": "^8.5.2",
  "lucide-react": "^0.468.0",
  "recharts": "^2.15.0",
  "d3-geo": "^3.1.1",
  "react-simple-maps": "^3.0.0",
  "i18next": "^24.0.0",
  "react-i18next": "^15.1.4",
  "react-qr-scanner": "^1.0.0-alpha.11",
  "qrcode.react": "^4.1.0",
  "jspdf": "^2.5.2",
  "html2canvas": "^1.4.1",
  "uuid": "^11.0.3",
  "web-push": "^3.6.7",
  "@sentry/react": "^8.46.0",
  "openai": "^4.77.3",
  "@google/genai": "^1.0.0"
}
```

### Styling
```json
{
  "tailwindcss": "^3.4.17",
  "autoprefixer": "^10.4.20",
  "postcss": "^8.5.1"
}
```

---

## 2. 🔐 ARQUITECTURA DE DATOS Y SEGURIDAD (SUPABASE)

### Esquema de Base de Datos

#### Tabla: `access_keys` (Sistema de Licencias)
```sql
CREATE TABLE access_keys (
  key TEXT PRIMARY KEY,
  device_id UUID REFERENCES auth.users(id),
  plan_type TEXT CHECK (plan_type IN ('basic', 'pro', 'elite')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  max_devices INTEGER DEFAULT 1,
  payment_id TEXT,
  payment_status TEXT
);
```

#### Tabla: `plants` (Colección de Plantas)
```sql
CREATE TABLE plants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_key TEXT REFERENCES access_keys(key),
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  acquisition_date DATE,
  health_status TEXT CHECK (health_status IN ('saludable', 'regular', 'critico')),
  origin TEXT,
  price NUMERIC(10,2),
  location TEXT,
  notes TEXT,
  images JSONB DEFAULT '[]',
  qr_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tabla: `crosses` (Cruces Genéticos)
```sql
CREATE TABLE crosses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_key TEXT REFERENCES access_keys(key),
  mother_id UUID REFERENCES plants(id),
  father_id UUID REFERENCES plants(id),
  pollination_date DATE,
  germination_date DATE,
  seeds_obtained INTEGER,
  seeds_germinated INTEGER,
  status TEXT CHECK (status IN ('planificada', 'en_proceso', 'completada', 'fallida')),
  notes TEXT,
  offspring_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tabla: `diary` (Diario de Cultivo)
```sql
CREATE TABLE diary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_key TEXT REFERENCES access_keys(key),
  plant_id UUID REFERENCES plants(id),
  entry_type TEXT CHECK (entry_type IN ('riego', 'fertilizacion', 'poda', 'observacion', 'trasplante')),
  date DATE NOT NULL,
  notes TEXT,
  height_cm NUMERIC(5,2),
  leaf_count INTEGER,
  photos JSONB DEFAULT '[]',
  phase TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tabla: `alerts` (Alertas y Recordatorios)
```sql
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_key TEXT REFERENCES access_keys(key),
  plant_id UUID REFERENCES plants(id),
  alert_type TEXT,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date DATE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tabla: `climate_logs` (Registros de Clima)
```sql
CREATE TABLE climate_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_key TEXT REFERENCES access_keys(key),
  date DATE NOT NULL,
  temperature NUMERIC(4,1),
  humidity NUMERIC(4,1),
  light_hours NUMERIC(3,1),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tabla: `seed_batches` (Banco de Semillas)
```sql
CREATE TABLE seed_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_key TEXT REFERENCES access_keys(key),
  cross_id UUID REFERENCES crosses(id),
  species TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  harvest_date DATE,
  stratification_status TEXT CHECK (stratification_status IN ('sin_estratificar', 'estratificando', 'lista')),
  stratification_start DATE,
  stratification_end DATE,
  viability TEXT,
  notes TEXT,
  storage_location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tabla: `shop_products` (Marketplace)
```sql
CREATE TABLE shop_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_key TEXT REFERENCES access_keys(key),
  plant_id UUID REFERENCES plants(id),
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  stock INTEGER DEFAULT 1,
  category TEXT,
  images JSONB DEFAULT '[]',
  status TEXT CHECK (status IN ('active', 'sold', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tabla: `messages` (Mensajería P2P)
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_key TEXT REFERENCES access_keys(key),
  recipient_key TEXT REFERENCES access_keys(key),
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tabla: `user_profiles` (Perfiles Públicos)
```sql
CREATE TABLE user_profiles (
  key TEXT PRIMARY KEY REFERENCES access_keys(key),
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  slug TEXT UNIQUE,
  public_gallery BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS)

**Función Helper:**
```sql
CREATE OR REPLACE FUNCTION get_current_user_key()
RETURNS TEXT AS $$
  SELECT key FROM access_keys WHERE device_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

**Políticas RLS (ejemplo para `plants`):**
```sql
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plants"
  ON plants FOR SELECT
  USING (owner_key = get_current_user_key());

CREATE POLICY "Users can insert own plants"
  ON plants FOR INSERT
  WITH CHECK (owner_key = get_current_user_key());

CREATE POLICY "Users can update own plants"
  ON plants FOR UPDATE
  USING (owner_key = get_current_user_key());

CREATE POLICY "Users can delete own plants"
  ON plants FOR DELETE
  USING (owner_key = get_current_user_key());
```

**Excepción para Marketplace:**
```sql
CREATE POLICY "Public can view active products"
  ON shop_products FOR SELECT
  USING (status = 'active');
```

### Storage Buckets

```sql
-- Crear bucket para imágenes
INSERT INTO storage.buckets (id, name, public)
VALUES ('plant-images', 'plant-images', true);

-- Política de acceso
CREATE POLICY "Users can upload own images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'plant-images' AND auth.role() = 'authenticated');
```

---

## 3. 📁 ESTRUCTURA DEL PROYECTO

```
carnilab/
├── src/
│   ├── screens/          # 27 pantallas
│   ├── components/       # 26 componentes reutilizables
│   ├── context/          # 4 contextos globales
│   ├── utils/            # 9 archivos de utilidades
│   ├── types.ts          # Todas las interfaces TypeScript
│   ├── theme.css         # Estilos globales y temas
│   ├── sw.ts             # Service Worker para PWA
│   ├── App.tsx           # Componente principal
│   ├── main.tsx          # Entry point
│   └── supabaseClient.ts # Cliente de Supabase
├── supabase/
│   ├── functions/        # 9 Edge Functions
│   └── migrations/       # Migraciones SQL
├── public/
│   ├── assets/           # Imágenes, iconos
│   └── manifest.json     # PWA manifest
├── android/              # Proyecto Capacitor Android
├── ios/                  # Proyecto Capacitor iOS
├── capacitor.config.ts   # Configuración Capacitor
├── vite.config.ts        # Configuración Vite
├── tailwind.config.js    # Configuración Tailwind
└── package.json
```

---

## 4. 🌐 CONTEXTOS GLOBALES

### 4.1 AuthContext.tsx

**Responsabilidad:** Autenticación, gestión de sesión y licencias

```typescript
interface AuthContextType {
  user: User | null;
  userKey: string | null;
  planType: PlanType | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, licenseKey: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}
```

**Funciones clave:**
- Verificación de licencia al signup
- Vinculación `device_id` ↔ `access_keys`
- Persistencia de sesión con Supabase Auth
- Recuperación automática de sesión

### 4.2 AppContext.tsx

**Responsabilidad:** Estado global de la aplicación (plantas, cruces, diario, etc.)

```typescript
interface AppContextType {
  plants: Plant[];
  crosses: Cross[];
  diary: DiaryEntry[];
  alerts: Alert[];
  climateLogs: ClimateLog[];
  seedBatches: SeedBatch[];

  // CRUD Plantas
  addPlant: (plant: PlantInput) => Promise<void>;
  updatePlant: (id: string, plant: Partial<Plant>) => Promise<void>;
  deletePlant: (id: string) => Promise<void>;

  // CRUD Cruces
  addCross: (cross: CrossInput) => Promise<void>;
  updateCross: (id: string, cross: Partial<Cross>) => Promise<void>;

  // Diario
  addDiaryEntry: (entry: DiaryEntryInput) => Promise<void>;
  updateDiaryEntry: (id: string, entry: Partial<DiaryEntry>) => Promise<void>;

  // Alertas
  addAlert: (alert: AlertInput) => Promise<void>;
  completeAlert: (id: string) => Promise<void>;

  // Eventos para gamificación
  objectiveEvents: EventEmitter<ObjectiveType>;
}
```

**Eventos emitidos:**
- `add_plant` → al agregar planta
- `diary_entry` → al crear entrada de diario
- `diary_photo` → al agregar foto en diario
- `complete_alert` → al completar alerta
- `create_cross` → al crear cruce
- `complete_cross` → al completar cruce
- `climate_log` → al registrar clima
- `start_stratification` → al estratificar semillas

### 4.3 ThemeContext.tsx

**Responsabilidad:** Tema oscuro/claro, animaciones

```typescript
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  animationsEnabled: boolean;
  setAnimationsEnabled: (enabled: boolean) => void;
}
```

### 4.4 BroadcastContext.tsx

**Responsabilidad:** Mensajes broadcast en tiempo real

```typescript
interface BroadcastContextType {
  messages: BroadcastMessage[];
  unreadCount: number;
  markAsRead: (id: string) => void;
}
```

---

## 5. 🔑 SISTEMA DE AUTENTICACIÓN

### Flujo de Login

1. Usuario ingresa email y contraseña
2. `AuthContext.login()` llama a `supabase.auth.signInWithPassword()`
3. Si exitoso, se obtiene el `user.id`
4. Query a `access_keys` WHERE `device_id = user.id`
5. Se obtiene `key`, `plan_type` y se guarda en estado global
6. Redirección al Dashboard

### Flujo de Registro

1. Usuario ingresa email, contraseña y **código de licencia**
2. Validar que el código existe en `access_keys` y está `active = true`
3. Validar que `device_id IS NULL` (no ha sido usado)
4. `supabase.auth.signUp()` crea el usuario
5. UPDATE `access_keys` SET `device_id = nuevo_user_id` WHERE `key = codigo`
6. Login automático

### Recuperación de Contraseña

1. Usuario ingresa email
2. `supabase.auth.resetPasswordForEmail(email)`
3. Supabase envía email con link de reset
4. Usuario hace clic, ingresa nueva contraseña
5. `supabase.auth.updateUser({ password: nueva })`

---

## 6. 📱 PANTALLAS (SCREENS)

### 6.1 LoginScreen.tsx
- Formulario email/password con validación Zod
- Botón "Olvidé mi contraseña"
- Link a registro
- Manejo de errores con toasts

### 6.2 Dashboard.tsx
**Características:**
- Cards de métricas: Total plantas, cruces activas, alertas pendientes
- Componente `DailyObjectivesCard` (objetivos diarios)
- Componente `BadgesPreview` (últimas insignias)
- Widget inteligente `SmartDashboardWidget` (próximos riegos, clima)
- Indicador de sincronización offline/online
- Racha de días consecutivos (🔥)

### 6.3 PlantList.tsx
- Grid de tarjetas de plantas con lazy loading
- Buscador con debounce (500ms)
- Filtros por especie, estado de salud
- Paginación con cursores
- Click en tarjeta → navigate a `/plant/:id`

### 6.4 PlantDetails.tsx
- Carrusel de imágenes con miniaturas (`ImageCarousel`)
- Datos completos: especie, origen, precio, ubicación
- Botones: Editar, Eliminar, Ver QR
- Historial de entradas de diario relacionadas
- Gráfico de evolución (altura, hojas) con `recharts`

### 6.5 AddPlant.tsx
- Formulario completo validado con Zod (`PlantSchema`)
- Upload de múltiples imágenes con preview
- Generación automática de QR code único
- Integración con cámara en mobile (Capacitor Camera)

### 6.6 Diary.tsx
**Modos de visualización:**
1. **Calendario**: Vista mensual con puntos en días con entradas
2. **Lista**: Timeline descendente (más reciente primero)
3. **Bitácora Histórica**: Accordions agrupados por planta, timeline ascendente (Día 1 → hoy)

**Funcionalidades:**
- Filtro por planta, tipo de entrada
- Detección automática de fase vegetativa (regex + días transcurridos)
- Añadir fotos desde galería o cámara
- Tracking de altura (cm) y hojas (#)

### 6.7 Crosses.tsx
- Lista de cruces con estado (planificada, en proceso, completada, fallida)
- Información genética: madre, padre(s), semillas obtenidas/germinadas
- Click → detalle con árbol genealógico

### 6.8 GenealogyScreen.tsx
- Visualizador de árbol genético animado (`GenealogyTree`)
- Niveles: Abuelos → Padres → Híbrido → Descendientes
- Click en nodo → ir a PlantDetails
- Solo disponible en plan Elite

### 6.9 GeneticCalculatorScreen.tsx
- Calculadora de predicciones genéticas
- Análisis de dominancia, rasgos esperados
- Solo disponible en plan Pro/Elite

### 6.10 SeedBankScreen.tsx
- CRUD de lotes de semillas
- Estados de estratificación: sin estratificar → estratificando → lista
- Contador de días de estratificación
- Notificaciones cuando termina estratificación

### 6.11 Alerts.tsx
- Lista de alertas pendientes y completadas
- Tipos: riego, trasplante, fertilización, custom
- Marcar como completada → trigger evento para objetivos
- Programación de notificaciones push

### 6.12 ClimateScreen.tsx
- Registro manual de temperatura, humedad, horas de luz
- Gráficos históricos con `recharts`
- Solo disponible en plan Pro/Elite

### 6.13 AIAssistant.tsx (CarniBot)
- Interfaz de chat con historial
- Prompt system: "Eres un asistente experto en plantas carnívoras..."
- Integración con OpenAI GPT o Google Gemini
- Análisis de imágenes con IA
- Solo disponible en plan Elite

### 6.14 CultivarGeneratorScreen.tsx
- Generador automático de nombres de cultivares
- Usa IA (Gemini) con prompt específico
- Historial de nombres generados
- Solo disponible en plan Elite

### 6.15 ProfileScreen.tsx
- Edición de avatar (upload a Supabase Storage)
- Edición de nombre público
- Generación/edición de slug de vivero (`carnilab.com/vivero/mi-slug`)
- Configuración de galería pública
- Estadísticas: nivel, XP total, plantas, cruces

### 6.16 PublicGallery.tsx
- Vista pública del vivero de un usuario (por slug)
- Muestra plantas públicas
- Botón de contacto → abrir chat
- No requiere autenticación (query bypass RLS con función específica)

### 6.17 InboxScreen.tsx
- Lista de conversaciones (chats P2P)
- Badges de mensajes no leídos
- Click → abrir ChatScreen

### 6.18 ChatScreen.tsx
- Mensajería en tiempo real con Supabase Realtime
- Envío de mensajes
- Indicadores de lectura
- Solo disponible en plan Pro/Elite

### 6.19 AdminKeys.tsx
- Panel de administración de licencias
- Solo accesible con rol admin
- Crear, activar, desactivar licencias
- Ver estadísticas de uso

### 6.20 AdminPrices.tsx
- Panel de administración de precios de planes
- Configuración de MercadoPago
- Solo accesible con rol admin

### 6.21 Backup.tsx
- Exportación completa de datos a JSON
- Importación de backup
- Descarga de archivo local
- Cifrado opcional

### 6.22 SystemStatus.tsx
- Estado de conexión a Supabase
- Estado del Service Worker
- Uso de localStorage
- Logs de errores

### 6.23 LandingPage.tsx
- Página inicial para usuarios no autenticados
- Presentación de features
- Comparación de planes (`PlanComparison`)
- Botón de registro

### 6.24 Lab.tsx
- Pantalla experimental para pruebas
- Solo visible en desarrollo

### 6.25 DesignConcept.tsx
- Showcase de diseño UI/UX
- Galería de componentes
- Solo visible en desarrollo

### 6.26 QRDesignShowcase.tsx
- Galería de diseños de etiquetas QR
- Generación de PDFs para impresión
- Usa `jspdf` y `html2canvas`

### 6.27 DiscoveryPrototype.tsx
- Prototipo de sistema de descubrimiento
- Recomendaciones de plantas, cruces
- Solo visible en desarrollo

---

## 7. 🧩 COMPONENTES REUTILIZABLES

### 7.1 ImageCarousel.tsx
- Carrusel de imágenes con `embla-carousel-react`
- Props: `images: string[]`, `autoplay?: boolean`
- Controles prev/next, indicadores de posición
- Lazy loading de imágenes
- Variante con miniaturas: `ImageCarouselWithThumbnails`

### 7.2 ImageLightbox.tsx
- Modal para ver imagen en pantalla completa
- Zoom, pan con gestos táctiles
- Botón de cerrar, navegación entre imágenes

### 7.3 DailyObjectivesCard.tsx
- Muestra 3-5 objetivos del día según plan
- Barra de progreso animada
- Icono de racha (🔥) con contador
- XP ganado del día
- Nivel actual y progreso al siguiente

### 7.4 BadgesDisplay.tsx
- Modal completo con tabs por categoría
- Muestra todas las insignias (desbloqueadas y bloqueadas)
- Colores por rareza (común, raro, épico, legendario)
- Progreso en % para badges no desbloqueadas
- Animación de desbloqueo

### 7.5 BadgeUnlockNotification.tsx
- Toast animado cuando se desbloquea insignia
- Aparece esquina superior derecha
- Auto-dismiss tras 5 segundos
- Efecto de brillo según rareza

### 7.6 SmartDashboardWidget.tsx
- Widget inteligente que muestra:
  - Próximos riegos (basado en último riego + N días)
  - Cruces a punto de germinar
  - Clima actual (si tiene registros recientes)
- Cambia contenido según prioridades

### 7.7 GenealogyTree.tsx
- Árbol genealógico visual con D3 o SVG custom
- Animaciones de entrada con Framer Motion
- Click en nodo → callback con plant_id
- Responsive (scroll horizontal en mobile)

### 7.8 GeneticVisualizer.tsx
- Visualización de características genéticas
- Gráficos de dominancia
- Solo plan Elite

### 7.9 ClimateChart.tsx
- Gráfico de líneas con temperatura, humedad
- Usa `recharts`
- Selector de rango de fechas

### 7.10 PhotoTimeLapse.tsx
- Componente que crea time-lapse de fotos de una planta
- Orden cronológico automático
- Controles de reproducción
- Exportación a GIF (opcional)

### 7.11 TechnicalSheet.tsx
- Ficha técnica de una planta (especie, origen, cuidados)
- Formato de tarjeta imprimible
- QR code incluido

### 7.12 QRLabel.tsx
- Generador de etiquetas QR personalizadas
- Múltiples diseños/themes
- Descarga como PNG
- Usa `qrcode.react`

### 7.13 CertificateCard.tsx
- Certificado de autenticidad para cruces
- Información genética, fecha, breeder
- Exportable a PDF

### 7.14 PlanComparison.tsx
- Tabla comparativa de planes (Basic, Pro, Elite)
- Checkmarks por feature
- Botones de compra/upgrade

### 7.15 BroadcastBanner.tsx
- Banner superior con mensajes globales
- Cierre manual
- Prioridad (info, warning, urgent)

### 7.16 NotificationToast.tsx
- Sistema de toasts personalizado
- Tipos: success, error, warning, info
- Auto-dismiss configurable
- Queue de notificaciones

### 7.17 PushNotificationManager.tsx
- Componente que gestiona permisos de notificaciones
- Suscripción a web push
- Envío de token al servidor

### 7.18 DynamicBackground.tsx
- Background animado según tema
- Partículas, gradientes
- Cambia con tema oscuro/claro

### 7.19 ThemeParticles.tsx
- Sistema de partículas decorativas
- Optimizado para performance (requestAnimationFrame)
- Desactivable en settings

### 7.20 ThemeDecorations.tsx
- Decoraciones SVG temáticas
- Elementos botánicos, hojas
- Se adaptan al tema actual

### 7.21 ParticleBackground.tsx
- Variante de background con partículas
- Configuración de densidad, velocidad

### 7.22 DesktopLayout.tsx
- Layout específico para escritorio
- Sidebar fija, contenido central
- Solo se usa en resoluciones > 1024px

### 7.23 SpeciesIcon.tsx
- Iconos customizados por especie
- Mapping: Dionaea → icono de trampa
- Fallback a icono genérico

### 7.24 AssetIcon.tsx
- Sistema de iconos desde assets locales
- Cache de SVG
- Props: `name: string`, `size?: number`

### 7.25 CustomIcons.tsx
- Colección de iconos SVG custom
- Exporta componentes React
- Usados en toda la app

### 7.26 CarniBotIcon.tsx
- Icono animado de CarniBot
- Pulso, hover effects
- Se usa en AIAssistant

---

## 8. 🔧 UTILIDADES Y HELPERS

### 8.1 validationSchemas.ts
**Todos los schemas Zod:**

```typescript
import { z } from 'zod';

export const PlantSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  species: z.string().min(1, 'La especie es requerida'),
  acquisition_date: z.string().optional(),
  health_status: z.enum(['saludable', 'regular', 'critico']).optional(),
  origin: z.string().optional(),
  price: z.number().min(0).optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  images: z.array(z.string()).default([])
});

export const DiaryEntrySchema = z.object({
  plant_id: z.string().uuid(),
  entry_type: z.enum(['riego', 'fertilizacion', 'poda', 'observacion', 'trasplante']),
  date: z.string(),
  notes: z.string().optional(),
  height_cm: z.number().min(0).optional(),
  leaf_count: z.number().int().min(0).optional(),
  photos: z.array(z.string()).default([])
});

export const CrossSchema = z.object({
  mother_id: z.string().uuid(),
  father_id: z.string().uuid(),
  pollination_date: z.string(),
  germination_date: z.string().optional(),
  seeds_obtained: z.number().int().min(0).optional(),
  seeds_germinated: z.number().int().min(0).optional(),
  status: z.enum(['planificada', 'en_proceso', 'completada', 'fallida']),
  notes: z.string().optional()
});

// ... más schemas
```

### 8.2 imageHelpers.ts
**Funciones:**
- `uploadImageToSupabase(file: File): Promise<string>` - Upload y retorna URL pública
- `resizeImage(file: File, maxWidth: number): Promise<File>` - Resize antes de upload
- `compressImage(file: File): Promise<File>` - Compresión JPEG
- `generateThumbnail(url: string): Promise<string>` - Genera thumbnail
- `getImageDimensions(file: File): Promise<{width, height}>` - Lee dimensiones

### 8.3 diaryHelpers.ts
**Funciones:**
- `detectPhase(entries: DiaryEntry[]): PhaseType` - Detecta fase vegetativa
  - Usa regex para palabras clave: "germinación", "plántula", "floración"
  - Calcula días desde primera entrada
  - Retorna: 'germinacion' | 'plantula' | 'vegetativa' | 'floracion' | 'maduracion'
- `groupEntriesByPlant(entries: DiaryEntry[]): Record<string, DiaryEntry[]>` - Agrupa por planta
- `sortEntriesByDate(entries: DiaryEntry[], asc: boolean): DiaryEntry[]` - Ordena por fecha
- `calculateGrowthRate(entries: DiaryEntry[]): number` - Tasa de crecimiento en cm/día

### 8.4 planHelpers.ts
**Funciones:**
- `canAccessFeature(planType: PlanType, feature: string): boolean` - Verifica acceso a feature
- `getPlanLimits(planType: PlanType): PlanLimits` - Retorna límites del plan
  ```typescript
  {
    maxPlants: number;
    maxCrosses: number;
    hasAI: boolean;
    hasClimate: boolean;
    hasMarketplace: boolean;
    dailyObjectives: number; // 3, 4 o 5
  }
  ```
- `upgradePlan(currentKey: string, newPlan: PlanType): Promise<void>` - Upgrade de plan

### 8.5 geminiHelpers.ts
**Funciones:**
- `analyzeImageWithGemini(imageBase64: string, prompt: string): Promise<string>` - Análisis de imagen
- `chatWithGemini(messages: Message[]): Promise<string>` - Chat con historial
- `generateCultivarName(mother: string, father: string): Promise<string>` - Genera nombre de cultivar

**Configuración:**
```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export async function analyzeImageWithGemini(base64: string, prompt: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-lite',
    contents: [
      { inlineData: { mimeType: 'image/jpeg', data: base64 } },
      { text: prompt }
    ]
  });
  return response.text();
}
```

### 8.6 dailyObjectives.ts
**Sistema de objetivos diarios:**

```typescript
export const OBJECTIVE_TEMPLATES = [
  {
    id: 'add_plant',
    type: 'add_plant' as ObjectiveType,
    title: 'Agregar Planta',
    description: 'Registra una nueva planta en tu colección',
    xpReward: 50,
    requiredPlan: 'basic' as PlanType,
    icon: '🌱',
    weight: 5
  },
  // ... 8 objetivos más
];

export const XP_LEVELS = [
  { level: 1, xp: 0, title: 'Semilla' },
  { level: 2, xp: 100, title: 'Brote' },
  { level: 3, xp: 250, title: 'Plántula' },
  // ... hasta nivel 15
];

export function calculateLevel(totalXp: number): UserXpProfile;
export function generateDailyObjectives(planType: PlanType): DailyObjective[];

// Event emitter
export const objectiveEvents = new EventEmitter<ObjectiveType>();
```

### 8.7 badges.ts
**Sistema de insignias (25 badges):**

```typescript
export const BADGES: Badge[] = [
  {
    id: 'first_plant',
    name: 'Primera Planta',
    description: 'Registra tu primera planta carnívora',
    icon: '🌱',
    category: 'collection',
    rarity: 'common',
    requirement: { type: 'plants_total', count: 1 },
    xpBonus: 25
  },
  // ... 24 badges más
];

export function calculateBadgeProgress(badge: Badge, stats: UserStats): number;
export function checkBadgeUnlock(badge: Badge, stats: UserStats): boolean;

// Event emitter
export const badgeEvents = new EventEmitter();
```

### 8.8 hooks.ts
**Custom hooks:**

```typescript
// Hook de debounce
export function useDebouncedValue<T>(value: T, delay: number): T;

// Hook de objetivos diarios
export function useDailyObjectives(): {
  objectives: DailyObjective[];
  xpProfile: UserXpProfile;
  streak: number;
  completeObjective: (id: string) => void;
  canCompleteObjective: (type: ObjectiveType) => boolean;
};

// Hook de insignias
export function useBadges(): {
  userBadges: UserBadge[];
  allBadges: Badge[];
  progress: Record<string, number>;
  recentUnlocks: Badge[];
};

// Hook de online/offline
export function useOnlineStatus(): boolean;

// Hook de tamaño de pantalla
export function useMediaQuery(query: string): boolean;
```

### 8.9 logger.ts
**Sistema de logging:**

```typescript
export const logger = {
  info: (message: string, data?: any) => void;
  error: (message: string, error?: Error) => void;
  warn: (message: string) => void;
  debug: (message: string, data?: any) => void;
};

// Integración con Sentry
export function initLogger(): void;
```

---

## 9. ⚡ EDGE FUNCTIONS (SUPABASE)

### 9.1 carni-bot-ai
**Endpoint:** `POST /functions/v1/carni-bot-ai`

**Función:** Chat con IA (proxy a OpenAI/Gemini)

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "¿Cómo cuido una Dionaea?" }
  ]
}
```

**Response:**
```json
{
  "response": "Para cuidar una Dionaea muscipula..."
}
```

**Código:**
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { OpenAI } from 'openai';

serve(async (req) => {
  const { messages } = await req.json();

  const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') });

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'Eres un experto en plantas carnívoras...' },
      ...messages
    ]
  });

  return new Response(JSON.stringify({
    response: completion.choices[0].message.content
  }));
});
```

### 9.2 analyze-cross
**Endpoint:** `POST /functions/v1/analyze-cross`

**Función:** Análisis genético de cruce con IA

**Request:**
```json
{
  "mother_species": "Dionaea muscipula",
  "father_species": "Dionaea 'Akai Ryu'"
}
```

**Response:**
```json
{
  "analysis": "Predicción genética...",
  "traits": ["color rojo", "trampas grandes"],
  "success_rate": 0.75
}
```

### 9.3 process-alerts
**Función:** Cron job que procesa alertas programadas

**Frecuencia:** Cada hora

**Lógica:**
1. Query alertas WHERE `scheduled_date = TODAY` AND `completed = false`
2. Para cada alerta, enviar push notification
3. Marcar como notificada

### 9.4 send-push
**Endpoint:** `POST /functions/v1/send-push`

**Función:** Envía notificación push a usuario

**Request:**
```json
{
  "user_key": "ABC123",
  "title": "Riego pendiente",
  "body": "Tu Dionaea necesita riego hoy",
  "data": { "alert_id": "uuid" }
}
```

**Código:**
```typescript
import webpush from 'web-push';

serve(async (req) => {
  const { user_key, title, body, data } = await req.json();

  // Get subscription from DB
  const { data: sub } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_key', user_key)
    .single();

  await webpush.sendNotification(sub.subscription, JSON.stringify({
    title, body, data
  }));

  return new Response(JSON.stringify({ success: true }));
});
```

### 9.5 mercadopago-checkout
**Endpoint:** `POST /functions/v1/mercadopago-checkout`

**Función:** Crea checkout de MercadoPago para upgrade de plan

**Request:**
```json
{
  "plan": "elite",
  "user_key": "ABC123"
}
```

**Response:**
```json
{
  "init_point": "https://www.mercadopago.com/mla/checkout/..."
}
```

### 9.6 mercadopago-webhook
**Endpoint:** `POST /functions/v1/mercadopago-webhook`

**Función:** Webhook de MercadoPago para actualizar estado de pago

**Lógica:**
1. Valida firma del webhook
2. Si pago aprobado, UPDATE `access_keys` SET `plan_type = nuevo_plan`
3. Envía email de confirmación

### 9.7 generate-image
**Endpoint:** `POST /functions/v1/generate-image`

**Función:** Genera imagen con IA (DALL-E o similar)

**Request:**
```json
{
  "prompt": "Dionaea muscipula híbrida con trampas rojas"
}
```

**Response:**
```json
{
  "image_url": "https://..."
}
```

### 9.8 get-license-by-payment
**Endpoint:** `POST /functions/v1/get-license-by-payment`

**Función:** Obtiene licencia asociada a un payment_id

### 9.9 push (legacy)
**Función:** Versión legacy de send-push

---

## 10. 🎨 SISTEMA DE TEMAS Y UI

### Configuración Tailwind (tailwind.config.js)

```javascript
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          // ... 900: '#14532d'
        },
        secondary: {
          // Purple tones
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }
    }
  },
  plugins: []
};
```

### theme.css (Estilos globales)

```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --border: #e5e7eb;
  --accent: #10b981;
}

[data-theme='dark'] {
  --bg-primary: #111827;
  --bg-secondary: #1f2937;
  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
  --border: #374151;
  --accent: #34d399;
}

.card {
  @apply bg-white dark:bg-slate-800 rounded-lg shadow-md p-4;
}

.btn-primary {
  @apply bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md transition-colors;
}

/* Animaciones personalizadas */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

### Sistema de Íconos

**Lucide React (principal):**
```tsx
import { Leaf, Droplet, Sun, Moon, ... } from 'lucide-react';

<Leaf className="w-6 h-6 text-green-500" />
```

**Iconos personalizados (CustomIcons.tsx):**
```tsx
export const VenusFlytrap: React.FC<IconProps> = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    {/* SVG path */}
  </svg>
);
```

---

## 11. 🎮 GAMIFICACIÓN

### Sistema de XP y Niveles

**15 niveles totales:**
- Nivel 1: 0 XP - "Semilla"
- Nivel 2: 100 XP - "Brote"
- Nivel 3: 250 XP - "Plántula"
- Nivel 4: 500 XP - "Cultivador"
- Nivel 5: 850 XP - "Jardinero"
- Nivel 6: 1300 XP - "Botánico"
- Nivel 7: 1900 XP - "Experto"
- Nivel 8: 2700 XP - "Hibridador"
- Nivel 9: 3800 XP - "Genetista"
- Nivel 10: 5200 XP - "Maestro"
- Nivel 11: 7000 XP - "Conservador"
- Nivel 12: 9500 XP - "Investigador"
- Nivel 13: 13000 XP - "Científico"
- Nivel 14: 17500 XP - "Sabio Verde"
- Nivel 15: 23000 XP - "Maestro Carnívoro"

**Progresión exponencial:** Cada nivel requiere ~40% más XP que el anterior

### Objetivos Diarios

**Cantidad según plan:**
- Basic: 3 objetivos/día
- Pro: 4 objetivos/día
- Elite: 5 objetivos/día

**Tipos de objetivos:**
1. **add_plant** (50 XP) - Registrar nueva planta
2. **diary_entry** (30 XP) - Escribir entrada de diario
3. **diary_photo** (40 XP) - Añadir foto en diario
4. **complete_alert** (25 XP) - Completar alerta
5. **create_cross** (75 XP) - Crear nuevo cruce
6. **complete_cross** (100 XP) - Completar cruce
7. **start_stratification** (60 XP) - Estratificar semillas
8. **climate_log** (35 XP, Pro+) - Registrar clima
9. **ai_analysis** (80 XP, Elite) - Usar análisis IA

**Sistema de Rachas:**
- Racha = días consecutivos con al menos 1 objetivo completado
- Reset a medianoche (00:00 local time)
- Indicador visual: 🔥 + número de días
- Si no se completa ningún objetivo en un día, racha se resetea a 0

**Persistencia:**
```json
// localStorage: carnilab_daily_objectives
{
  "date": "2026-03-30",
  "objectives": [...],
  "totalXpToday": 105,
  "streak": 14,
  "lastStreakDate": "2026-03-29"
}

// localStorage: carnilab_user_xp
{
  "totalXp": 2450
}
```

### Sistema de Insignias

**25 badges en 5 categorías:**

**Collection (5):**
- first_plant (común, 1 planta) - 25 XP
- collector_10 (común, 10 plantas) - 50 XP
- collector_25 (raro, 25 plantas) - 100 XP
- collector_50 (épico, 50 plantas) - 200 XP
- collector_100 (legendario, 100 plantas) - 500 XP

**Breeding (5):**
- first_cross (común, 1 cruce) - 30 XP
- breeder_5 (raro, 5 cruces completados) - 100 XP
- breeder_15 (épico, 15 cruces) - 250 XP
- breeder_master (legendario, 30 cruces) - 500 XP
- germinator (épico, 50 plantas germinadas) - 200 XP

**Dedication (6):**
- streak_7 (común, 7 días racha) - 50 XP
- streak_14 (raro, 14 días) - 100 XP
- streak_30 (épico, 30 días) - 250 XP
- streak_100 (legendario, 100 días) - 1000 XP
- diary_master (raro, 50 entradas diario) - 100 XP
- photographer (raro, 100 fotos) - 100 XP

**Mastery (6):**
- level_5 (común, nivel 5) - 50 XP
- level_10 (raro, nivel 10) - 150 XP
- level_15 (legendario, nivel 15) - 500 XP
- xp_1000 (común, 1000 XP total) - 50 XP
- xp_5000 (raro, 5000 XP) - 150 XP
- xp_15000 (épico, 15000 XP) - 300 XP

**Special (3):**
- early_adopter (legendario, especial) - 200 XP
- all_objectives (raro, día perfecto) - 75 XP
- perfect_week (épico, 7 días perfectos) - 300 XP
- seed_banker (raro, 20 lotes semillas) - 100 XP
- stratification_master (épico, 10 estratificaciones) - 200 XP

**Sistema de Rareza:**
- **Común** (gris): Background gris, sin brillo
- **Raro** (azul): Background azul claro, borde azul, shadow azul
- **Épico** (morado): Background morado, borde morado, shadow morado
- **Legendario** (dorado): Background gradiente amber-yellow, borde dorado, shadow dorado grande

**Desbloqueo automático:**
- Hook `useBadges` calcula stats cada vez que cambia AppContext
- Compara progreso vs requirements
- Si unlock → guarda en localStorage, emite evento
- `BadgeUnlockNotification` se suscribe a evento y muestra toast

---

## 12. 📴 OFFLINE MODE Y PWA

### Service Worker (src/sw.ts)

**Estrategias:**

1. **Cache First** (assets estáticos):
```typescript
const STATIC_CACHE = 'carnilab-static-v1';
const staticAssets = [
  '/',
  '/index.html',
  '/assets/logo.png',
  // ...
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(staticAssets))
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/assets/')) {
    event.respondWith(
      caches.match(event.request).then(response => response || fetch(event.request))
    );
  }
});
```

2. **Network First** (API calls):
```typescript
if (event.request.url.includes('supabase.co')) {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open('api-cache').then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
}
```

3. **Background Sync** (mutations offline):
```typescript
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-plants') {
    event.waitUntil(syncPendingChanges());
  }
});

async function syncPendingChanges() {
  const pending = await getPendingFromIndexedDB();
  for (const item of pending) {
    await fetch('/api/plants', { method: 'POST', body: JSON.stringify(item) });
  }
  await clearPendingFromIndexedDB();
}
```

### Configuración PWA (vite.config.ts)

```typescript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'CarniLab',
        short_name: 'CarniLab',
        description: 'Gestiona tu colección de plantas carnívoras',
        theme_color: '#10b981',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 }
            }
          }
        ]
      }
    })
  ]
});
```

### manifest.json

```json
{
  "name": "CarniLab - Gestión de Plantas Carnívoras",
  "short_name": "CarniLab",
  "description": "Aplicación completa para gestionar tu colección de plantas carnívoras",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#10b981",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "categories": ["productivity", "lifestyle"],
  "screenshots": [
    {
      "src": "/screenshots/dashboard.png",
      "sizes": "1280x720",
      "type": "image/png"
    }
  ]
}
```

### IndexedDB para Persistencia Local

```typescript
import { openDB } from 'idb';

const db = await openDB('carnilab-db', 1, {
  upgrade(db) {
    db.createObjectStore('plants', { keyPath: 'id' });
    db.createObjectStore('pending_sync', { keyPath: 'id' });
  }
});

// Guardar planta offline
export async function savePlantOffline(plant: Plant) {
  await db.put('plants', plant);
  await db.put('pending_sync', { id: plant.id, type: 'create_plant', data: plant });
}

// Sincronizar cuando vuelve la conexión
export async function syncWhenOnline() {
  const pending = await db.getAll('pending_sync');
  for (const item of pending) {
    await supabase.from('plants').insert(item.data);
    await db.delete('pending_sync', item.id);
  }
}
```

---

## 13. 📱 CAPACITOR (MOBILE)

### Instalación y Configuración

```bash
npm install @capacitor/core @capacitor/cli
npx cap init

# Android
npm install @capacitor/android
npx cap add android

# iOS
npm install @capacitor/ios
npx cap add ios
```

### capacitor.config.ts

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.carnilab.app',
  appName: 'CarniLab',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#10b981',
      showSpinner: false
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#10b981'
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
```

### Uso de Plugins Capacitor

**Camera:**
```typescript
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export async function takePlantPhoto() {
  const image = await Camera.getPhoto({
    resultType: CameraResultType.Base64,
    source: CameraSource.Camera,
    quality: 90
  });

  return `data:image/jpeg;base64,${image.base64String}`;
}
```

**Filesystem:**
```typescript
import { Filesystem, Directory } from '@capacitor/filesystem';

export async function saveBackupLocally(data: string) {
  await Filesystem.writeFile({
    path: 'carnilab-backup.json',
    data: data,
    directory: Directory.Documents
  });
}
```

**Haptics:**
```typescript
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export async function vibrate() {
  await Haptics.impact({ style: ImpactStyle.Light });
}
```

**Keyboard:**
```typescript
import { Keyboard } from '@capacitor/keyboard';

export function setupKeyboard() {
  Keyboard.addListener('keyboardWillShow', () => {
    // Ajustar UI
  });

  Keyboard.addListener('keyboardWillHide', () => {
    // Restaurar UI
  });
}
```

### Build Android

```bash
npm run build
npx cap sync android
npx cap open android

# En Android Studio:
# Build > Generate Signed Bundle / APK
# Seleccionar APK
# Configurar keystore
# Build
```

**android/app/build.gradle:**
```gradle
android {
    defaultConfig {
        applicationId "com.carnilab.app"
        minSdkVersion 22
        targetSdkVersion 33
        versionCode 1
        versionName "1.0.0"
    }
}
```

### Build iOS

```bash
npm run build
npx cap sync ios
npx cap open ios

# En Xcode:
# Product > Archive
# Distribute App > App Store Connect
```

**ios/App/App/Info.plist:**
```xml
<key>NSCameraUsageDescription</key>
<string>CarniLab necesita acceso a la cámara para tomar fotos de tus plantas</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>CarniLab necesita acceso a la galería para seleccionar fotos</string>
```

---

## 14. 🚀 DESPLIEGUE Y PRODUCCIÓN

### Variables de Entorno

**`.env.production`:**
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
VITE_GEMINI_API_KEY=tu_gemini_key
VITE_OPENAI_API_KEY=tu_openai_key
VITE_MERCADOPAGO_PUBLIC_KEY=tu_mp_public_key
VITE_SENTRY_DSN=tu_sentry_dsn
```

### Despliegue en Vercel

**vercel.json:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "env": {
    "VITE_SUPABASE_URL": "@supabase-url",
    "VITE_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

**Comandos:**
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Configuración Supabase Producción

**1. Crear proyecto en Supabase Dashboard**

**2. Ejecutar migraciones:**
```bash
npx supabase db push
```

**3. Desplegar Edge Functions:**
```bash
npx supabase functions deploy carni-bot-ai
npx supabase functions deploy analyze-cross
npx supabase functions deploy process-alerts
npx supabase functions deploy send-push
npx supabase functions deploy mercadopago-checkout
npx supabase functions deploy mercadopago-webhook
```

**4. Configurar secrets:**
```bash
npx supabase secrets set OPENAI_API_KEY=xxx
npx supabase secrets set GEMINI_API_KEY=xxx
npx supabase secrets set MERCADOPAGO_ACCESS_TOKEN=xxx
npx supabase secrets set WEB_PUSH_PRIVATE_KEY=xxx
```

**5. Configurar Cron Jobs:**
```sql
SELECT cron.schedule(
  'process-alerts-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://tu-proyecto.supabase.co/functions/v1/process-alerts',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

### Monitoreo (Sentry)

**src/main.tsx:**
```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0
});
```

### Performance

**Code splitting:**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui': ['framer-motion', 'lucide-react'],
          'charts': ['recharts', 'd3-geo'],
          'supabase': ['@supabase/supabase-js']
        }
      }
    }
  }
});
```

**Lazy loading de rutas:**
```typescript
const Dashboard = lazy(() => import('./screens/Dashboard'));
const PlantList = lazy(() => import('./screens/PlantList'));
// ...

<Routes>
  <Route path="/" element={<Suspense fallback={<Spinner />}><Dashboard /></Suspense>} />
  <Route path="/plants" element={<Suspense fallback={<Spinner />}><PlantList /></Suspense>} />
</Routes>
```

---

## 📝 CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Setup Inicial (Semana 1)
- [ ] Crear proyecto Vite + React + TypeScript
- [ ] Configurar Tailwind CSS
- [ ] Instalar todas las dependencias listadas
- [ ] Crear proyecto Supabase
- [ ] Ejecutar migraciones SQL (tablas + RLS)
- [ ] Configurar Supabase Storage bucket
- [ ] Crear archivo `.env` con variables

### Fase 2: Autenticación y Contextos (Semana 1-2)
- [ ] Implementar `AuthContext.tsx`
- [ ] Implementar `AppContext.tsx`
- [ ] Implementar `ThemeContext.tsx`
- [ ] Implementar `BroadcastContext.tsx`
- [ ] Crear `types.ts` con todas las interfaces
- [ ] Crear `supabaseClient.ts`
- [ ] Implementar `LoginScreen.tsx`
- [ ] Implementar sistema de licencias

### Fase 3: Plantas y Colección (Semana 2-3)
- [ ] Crear schemas de validación Zod
- [ ] Implementar `PlantList.tsx`
- [ ] Implementar `AddPlant.tsx`
- [ ] Implementar `PlantDetails.tsx`
- [ ] Implementar `ImageCarousel.tsx`
- [ ] Implementar upload de imágenes a Supabase Storage
- [ ] Implementar generación de QR codes

### Fase 4: Diario y Seguimiento (Semana 3-4)
- [ ] Implementar `Diary.tsx` (3 modos de vista)
- [ ] Implementar detección de fases vegetativas
- [ ] Implementar tracking de crecimiento
- [ ] Implementar `PhotoTimeLapse.tsx`
- [ ] Crear helpers de diario (`diaryHelpers.ts`)

### Fase 5: Genética y Cruces (Semana 4-5)
- [ ] Implementar `Crosses.tsx`
- [ ] Implementar `GenealogyScreen.tsx`
- [ ] Implementar `GenealogyTree.tsx`
- [ ] Implementar `GeneticCalculatorScreen.tsx`
- [ ] Implementar `SeedBankScreen.tsx`
- [ ] Implementar estratificación de semillas

### Fase 6: Gamificación (Semana 5)
- [ ] Implementar `dailyObjectives.ts`
- [ ] Implementar `badges.ts`
- [ ] Implementar hook `useDailyObjectives`
- [ ] Implementar hook `useBadges`
- [ ] Implementar `DailyObjectivesCard.tsx`
- [ ] Implementar `BadgesDisplay.tsx`
- [ ] Implementar `BadgeUnlockNotification.tsx`
- [ ] Integrar eventos en `AppContext`

### Fase 7: Dashboard y Widgets (Semana 5-6)
- [ ] Implementar `Dashboard.tsx`
- [ ] Implementar `SmartDashboardWidget.tsx`
- [ ] Implementar cards de métricas
- [ ] Implementar indicador de sync offline/online
- [ ] Implementar sistema de rachas

### Fase 8: IA y Features Premium (Semana 6-7)
- [ ] Configurar Edge Function `carni-bot-ai`
- [ ] Configurar Edge Function `analyze-cross`
- [ ] Implementar `AIAssistant.tsx`
- [ ] Implementar `CultivarGeneratorScreen.tsx`
- [ ] Implementar `geminiHelpers.ts`
- [ ] Implementar análisis de imágenes con IA
- [ ] Implementar `ClimateScreen.tsx`
- [ ] Implementar `ClimateChart.tsx`

### Fase 9: Alertas y Notificaciones (Semana 7)
- [ ] Implementar `Alerts.tsx`
- [ ] Configurar Edge Function `process-alerts`
- [ ] Configurar Edge Function `send-push`
- [ ] Implementar `PushNotificationManager.tsx`
- [ ] Configurar cron job en Supabase
- [ ] Implementar permisos de notificaciones

### Fase 10: Comunidad y Marketplace (Semana 8)
- [ ] Implementar `ProfileScreen.tsx`
- [ ] Implementar sistema de slugs de vivero
- [ ] Implementar `PublicGallery.tsx`
- [ ] Implementar `InboxScreen.tsx`
- [ ] Implementar `ChatScreen.tsx`
- [ ] Configurar Supabase Realtime
- [ ] Implementar marketplace (plan Elite)

### Fase 11: PWA y Offline (Semana 8-9)
- [ ] Configurar `vite-plugin-pwa`
- [ ] Crear `sw.ts` con estrategias de cache
- [ ] Implementar `manifest.json`
- [ ] Configurar IndexedDB para persistencia local
- [ ] Implementar Background Sync
- [ ] Implementar hook `useOnlineStatus`
- [ ] Añadir indicadores de estado de red

### Fase 12: Capacitor Mobile (Semana 9-10)
- [ ] Instalar Capacitor y plugins
- [ ] Configurar `capacitor.config.ts`
- [ ] Integrar Camera plugin
- [ ] Integrar Filesystem plugin
- [ ] Integrar Haptics plugin
- [ ] Configurar proyecto Android
- [ ] Configurar proyecto iOS
- [ ] Build y test en dispositivos reales

### Fase 13: Pagos y Admin (Semana 10)
- [ ] Configurar MercadoPago
- [ ] Implementar Edge Function `mercadopago-checkout`
- [ ] Implementar Edge Function `mercadopago-webhook`
- [ ] Implementar `AdminKeys.tsx`
- [ ] Implementar `AdminPrices.tsx`
- [ ] Implementar sistema de upgrade de planes

### Fase 14: UI/UX y Polish (Semana 11)
- [ ] Implementar `DynamicBackground.tsx`
- [ ] Implementar `ThemeParticles.tsx`
- [ ] Implementar `ThemeDecorations.tsx`
- [ ] Pulir animaciones con Framer Motion
- [ ] Implementar `ImageLightbox.tsx`
- [ ] Implementar sistema de toasts
- [ ] Revisar accesibilidad (ARIA labels)
- [ ] Optimizar responsive design

### Fase 15: Backup y Utilidades (Semana 11)
- [ ] Implementar `Backup.tsx`
- [ ] Implementar exportación JSON
- [ ] Implementar importación JSON
- [ ] Implementar `SystemStatus.tsx`
- [ ] Implementar `logger.ts`
- [ ] Configurar Sentry

### Fase 16: Testing (Semana 12)
- [ ] Configurar Vitest
- [ ] Tests unitarios de helpers (validación, diario, badges, objectives)
- [ ] Tests de integración de contextos
- [ ] Tests E2E con Playwright (opcional)
- [ ] Test de flujos críticos (login, add plant, create cross)

### Fase 17: Optimización y Deploy (Semana 12-13)
- [ ] Code splitting y lazy loading
- [ ] Optimización de imágenes
- [ ] Configurar Vercel
- [ ] Configurar variables de entorno de producción
- [ ] Desplegar Edge Functions
- [ ] Configurar secrets de Supabase
- [ ] Desplegar a producción
- [ ] Smoke tests en producción

### Fase 18: Documentación (Continuo)
- [ ] Documentar Edge Functions
- [ ] Documentar schemas de base de datos
- [ ] Crear README.md
- [ ] Crear guía de contribución
- [ ] Documentar APIs públicas

---

## 🎯 ESTIMACIÓN DE ESFUERZO

**Total estimado:** 12-13 semanas (3 meses) para 1 desarrollador senior

**Desglose:**
- Backend y Base de Datos: 1 semana
- Autenticación y Setup: 1 semana
- CRUD Plantas y Colección: 2 semanas
- Diario y Tracking: 1.5 semanas
- Genética y Cruces: 1.5 semanas
- Gamificación: 1 semana
- IA y Features Premium: 1.5 semanas
- Notificaciones y Alertas: 1 semana
- Comunidad y Marketplace: 1 semana
- PWA y Offline: 1 semana
- Mobile (Capacitor): 1.5 semanas
- UI/UX Polish: 1 semana
- Testing y QA: 1 semana
- Deploy y Producción: 0.5 semanas

**Consideraciones:**
- Tiempo adicional puede ser necesario para debugging
- Iteraciones de UI/UX pueden extender el timeline
- Testing exhaustivo es crítico antes de producción

---

## 🔑 PUNTOS CLAVE DE ARQUITECTURA

1. **Multi-tenancy con RLS:** Toda la seguridad se basa en `owner_key` y RLS de Supabase
2. **Validación estricta:** Zod en TODOS los inputs (frontend y Edge Functions)
3. **Event-driven gamification:** Sistema de eventos desacoplado para XP/badges
4. **Offline-first approach:** PWA con Service Worker y sincronización diferida
5. **Mobile-ready:** Capacitor permite builds nativos sin reescribir código
6. **IA como feature premium:** OpenAI/Gemini solo en planes de pago
7. **Escalabilidad:** Supabase Edge Functions escalan automáticamente
8. **Persistencia local:** localStorage + IndexedDB para datos offline
9. **Optimistic UI:** Updates locales inmediatos + sincronización en background
10. **Monitoring:** Sentry para errores, Supabase Dashboard para métricas

---

## 📚 RECURSOS Y REFERENCIAS

**Documentación oficial:**
- [React](https://react.dev)
- [TypeScript](https://www.typescriptlang.org/docs)
- [Vite](https://vitejs.dev)
- [Supabase](https://supabase.com/docs)
- [Capacitor](https://capacitorjs.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion)
- [Zod](https://zod.dev)

**APIs de terceros:**
- [OpenAI API](https://platform.openai.com/docs)
- [Google Gemini](https://ai.google.dev/docs)
- [MercadoPago](https://www.mercadopago.com.ar/developers)

---

**FIN DEL DOCUMENTO**

*Última actualización: 2026-03-30*
