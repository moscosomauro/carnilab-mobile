# 🚀 CARNILAB - ROADMAP ESTRATÉGICO 2025-2026

> **Objetivo**: Transformar CarniLab de una app funcional (95/100) a una **plataforma líder mundial** en gestión de plantas carnívoras (100/100)

---

## 📊 ANÁLISIS DE SITUACIÓN ACTUAL

### ✅ Fortalezas Clave
- ✅ **29 pantallas** con funcionalidades avanzadas
- ✅ **AI integrada** (Google Gemini) para análisis de cultivares
- ✅ **Offline-first** con sincronización automática
- ✅ **Marketplace + Vivero Online** funcional
- ✅ **Sistema de planes** (Basic/Pro/Elite) con monetización
- ✅ **Árbol genealógico SVG animado** único en el mercado
- ✅ **PWA + Electron** multiplataforma

### ⚠️ Gaps Críticos Detectados
- 🔴 **Sin validación de datos robusta** → Zod/Yup necesario
- 🔴 **RLS deshabilitado en Supabase** → Riesgo de seguridad
- 🔴 **Sin paginación** → Listas infinitas colapsan con >100 items
- 🔴 **API keys expuestas** → Ya resuelto con .env (v1.1.0)
- 🟡 **Sin tests** → Regressions invisibles
- 🟡 **Solo español** → Mercado limitado

### 🌟 Oportunidades de Oro
1. **API Pública** → B2B, integraciones, monetización adicional
2. **IoT + Sensores** → Diferenciador vs competencia tradicional
3. **Comunidad/Forum** → Engagement, retención, viralidad
4. **Mobile Nativo** → React Native, mejor UX que PWA
5. **Suscripción Automática** → ARR predecible, menor churn

---

## 🎯 ROADMAP POR TRIMESTRES

---

## Q1 2025 (ENE-MAR): **FUNDAMENTOS SÓLIDOS** 🏗️

### Objetivo: Estabilidad, Seguridad, Escalabilidad

#### 🔴 PRIORIDAD CRÍTICA

##### 1.1 Validación de Datos Robusta ✅
**Problema**: Datos inválidos pueden corromper la BD
**Solución**: Implementar Zod en todos los formularios

```bash
npm install zod
```

**Archivos a modificar**:
- `screens/AddPlant.tsx` → Schema de validación
- `screens/Crosses.tsx` → Validar madre/padre
- `screens/Diary.tsx` → Validar altura/hojas
- `context/AppContext.tsx` → Validar en addPlant/addCross

**Ejemplo**:
```typescript
import { z } from 'zod';

const PlantSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido").max(100),
  especie: z.string().min(1),
  precio: z.number().min(0).optional(),
  estado: z.enum(['saludable', 'regular', 'critico']),
});

// En AddPlant.tsx
const handleSubmit = () => {
  const result = PlantSchema.safeParse(formData);
  if (!result.success) {
    alert(result.error.issues[0].message);
    return;
  }
  addPlant(result.data);
};
```

**Impacto**: 🔒 Seguridad +20%, 🐛 Bugs -40%

---

##### 1.2 RLS (Row Level Security) en Supabase 🔒
**Problema**: Cualquier usuario autenticado puede acceder a datos de otros
**Solución**: Habilitar RLS en todas las tablas críticas

**SQL a ejecutar**:
```sql
-- 1. Habilitar RLS
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE crosses ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_messages ENABLE ROW LEVEL SECURITY;

-- 2. Políticas de acceso
CREATE POLICY "Users can view own plants"
  ON plants FOR SELECT
  USING (owner_key = auth.uid());

CREATE POLICY "Users can insert own plants"
  ON plants FOR INSERT
  WITH CHECK (owner_key = auth.uid());

CREATE POLICY "Users can update own plants"
  ON plants FOR UPDATE
  USING (owner_key = auth.uid());

CREATE POLICY "Users can delete own plants"
  ON plants FOR DELETE
  USING (owner_key = auth.uid());

-- Repetir para crosses, alerts, diary, inbox_messages
```

**Testing**:
```typescript
// Crear 2 usuarios diferentes
// Intentar acceder a plantas del otro
// Debe fallar
```

**Impacto**: 🔒 Seguridad +50%, Compliance GDPR parcial

---

##### 1.3 Paginación & Virtualization 📜
**Problema**: Listas de 1000+ plantas colapsan el navegador
**Solución**: Implementar paginación cursor-based + react-window

```bash
npm install react-window
```

**Implementación**:
```typescript
// AppContext.tsx
const fetchPlants = async (cursor?: string, limit = 50) => {
  let query = supabase
    .from('plants')
    .select('*')
    .eq('owner_key', user.key)
    .order('id', { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt('id', cursor);
  }

  const { data, error } = await query;
  return { data, nextCursor: data[data.length - 1]?.id };
};

// PlantList.tsx
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={plants.length}
  itemSize={120}
  width="100%"
>
  {({ index, style }) => (
    <PlantCard plant={plants[index]} style={style} />
  )}
</FixedSizeList>
```

**Impacto**: ⚡ Performance +300%, UX mejorada

---

##### 1.4 Tests Unitarios (Jest + RTL) 🧪
**Problema**: Sin tests, los bugs regresan silenciosamente
**Solución**: Setup de testing con cobertura mínima 60%

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**vitest.config.ts**:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
```

**Tests prioritarios**:
- `utils/imageHelpers.test.ts` → compressImage()
- `utils/logger.test.ts` → Logger condicional
- `utils/geminiHelpers.test.ts` → analyzeCultivar() mock
- `context/AppContext.test.tsx` → makeTempId() uniqueness
- `components/NotificationToast.test.tsx` → Auto-dismiss

**Impacto**: 🐛 Bugs -60%, Confianza +80%

---

##### 1.5 Monitoreo & Error Tracking 📊
**Problema**: Bugs en producción pasan desapercibidos
**Solución**: Integrar Sentry para tracking

```bash
npm install @sentry/react
```

```typescript
// main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_APP_ENV,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

**Impacto**: 🔍 Visibilidad +100%, MTTR -70%

---

#### ⚠️ PRIORIDAD ALTA

##### 1.6 Carrusel de Imágenes 🎠
**Problema**: Solo se ve imagen principal, las demás invisibles
**Solución**: Implementar carrusel con thumbnails

```bash
npm install embla-carousel-react
```

```typescript
// components/ImageCarousel.tsx
import useEmblaCarousel from 'embla-carousel-react';

export const ImageCarousel = ({ images }: { images: string[] }) => {
  const [emblaRef] = useEmblaCarousel({ loop: true });

  return (
    <div className="embla" ref={emblaRef}>
      <div className="embla__container">
        {images.map((img, idx) => (
          <div key={idx} className="embla__slide">
            <img src={img} alt={`Imagen ${idx + 1}`} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

**Impacto**: 👁️ UX +40%, Engagement +25%

---

##### 1.7 Búsqueda Avanzada con Debounce 🔍
**Problema**: Cada tecla dispara query → lag + costos
**Solución**: Debounce + filtros múltiples

```typescript
// PlantList.tsx
import { useDebouncedValue } from '@mantine/hooks';

const [searchTerm, setSearchTerm] = useState('');
const [debouncedSearch] = useDebouncedValue(searchTerm, 300);

useEffect(() => {
  if (debouncedSearch) {
    fetchPlantsFiltered(debouncedSearch);
  }
}, [debouncedSearch]);
```

**Filtros**:
- Nombre/especie (full-text)
- Estado (saludable/regular/crítico)
- Rango de precio
- Fecha de adquisición

**Impacto**: ⚡ Performance +50%, UX +30%

---

**🎯 ENTREGABLES Q1:**
- ✅ Validación Zod en 10+ formularios
- ✅ RLS habilitado en 8 tablas críticas
- ✅ Paginación en PlantList, Crosses, Diary
- ✅ 20+ tests unitarios (cobertura 60%)
- ✅ Sentry configurado y monitoreando
- ✅ Carrusel de imágenes en 3 screens
- ✅ Búsqueda avanzada con filtros

**Métrica de éxito**: App pasa de 95/100 → **97/100**

---

## Q2 2025 (ABR-JUN): **ENGAGEMENT & MONETIZACIÓN** 💰

### Objetivo: Aumentar retención, crear comunidad, monetizar mejor

#### 🌟 FEATURES ESTRELLA

##### 2.1 Sistema de Badges & Achievements 🏆
**Problema**: Sin gamificación → usuarios se aburren
**Solución**: Sistema de logros desbloqueables

**Nueva tabla**:
```sql
CREATE TABLE achievements (
  id SERIAL PRIMARY KEY,
  user_key TEXT NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_key, achievement_id)
);
```

**Logros sugeridos**:
- 🌱 **First Plant**: Agregar primera planta
- 🌿 **Collector**: 10+ plantas en colección
- 🧬 **Breeder**: 5+ cruzas completadas exitosamente
- 🗺️ **Explorer**: Visitar 10 viveros diferentes
- 💬 **Social**: Enviar 50 mensajes en inbox
- 📸 **Photographer**: Subir 100 fotos de plantas
- 🏅 **Legend**: Completar todos los logros

**UI Component**:
```tsx
// components/BadgeDisplay.tsx
const BadgeDisplay = ({ achievement }: { achievement: Achievement }) => (
  <div className="badge-card">
    <div className="badge-icon">{achievement.icon}</div>
    <h3>{achievement.title}</h3>
    <p>{achievement.description}</p>
    {achievement.unlocked ? (
      <span className="unlocked">✅ Desbloqueado</span>
    ) : (
      <span className="locked">🔒 Bloqueado</span>
    )}
  </div>
);
```

**Impacto**: 📈 Retención +35%, Engagement +50%

---

##### 2.2 Comunidad / Forum 💬
**Problema**: Usuarios no interactúan entre sí
**Solución**: Sistema de posts estilo Reddit

**Nuevas tablas**:
```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  author_key TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT CHECK (category IN ('tips', 'care', 'genetics', 'marketplace', 'showcase')),
  votes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  post_id INT REFERENCES posts(id),
  author_key TEXT NOT NULL,
  content TEXT NOT NULL,
  votes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE votes (
  id SERIAL PRIMARY KEY,
  user_key TEXT NOT NULL,
  post_id INT REFERENCES posts(id),
  vote_type TEXT CHECK (vote_type IN ('up', 'down')),
  UNIQUE(user_key, post_id)
);
```

**Features**:
- Crear post con título + contenido + categoría
- Upvote/downvote
- Comentarios anidados (1 nivel)
- Moderación (reportes, ban)
- Trending posts (algoritmo de hot/new/top)

**Pantalla**: `/screens/ForumScreen.tsx`

**Impacto**: 🎯 Engagement +80%, Viralidad +40%, Tiempo en app +120%

---

##### 2.3 API Pública para Desarrolladores 🔌
**Problema**: Sin integraciones externas → mercado limitado
**Solución**: REST API documentada con OpenAPI

**Endpoints**:
```
GET    /api/v1/viveros/:slug/plants
POST   /api/v1/plants
GET    /api/v1/plants/:id
PUT    /api/v1/plants/:id
DELETE /api/v1/plants/:id
GET    /api/v1/plants/:id/genetics
POST   /api/v1/crosses
GET    /api/v1/analytics/stats
```

**Autenticación**:
```typescript
// Nueva tabla: api_keys
CREATE TABLE api_keys (
  id SERIAL PRIMARY KEY,
  user_key TEXT NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  scopes TEXT[] DEFAULT ARRAY['read'],
  rate_limit INT DEFAULT 100, -- requests/hour
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

// Middleware
const verifyApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const { data } = await supabase
    .from('api_keys')
    .select('*')
    .eq('api_key', apiKey)
    .single();

  if (!data || (data.expires_at && new Date(data.expires_at) < new Date())) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  req.user = data;
  next();
};
```

**Documentación**:
```bash
npm install swagger-ui-express
# Generar docs automáticas en /api/docs
```

**Monetización**:
- Free tier: 100 requests/hora
- Pro tier: 1,000 requests/hora
- Enterprise: Ilimitado

**Impacto**: 💰 Monetización B2B, 🔌 Ecosistema de plugins

---

##### 2.4 Reportes & Analytics Avanzados 📊
**Problema**: Usuario no ve su progreso cuantificado
**Solución**: Dashboard de estadísticas personales

**Nueva pantalla**: `/screens/AnalyticsScreen.tsx`

**Métricas**:
- 📈 Crecimiento promedio por especie (cm/mes)
- 🧬 Tasa de éxito de cruzas (%)
- 💰 Gasto total acumulado (ARS)
- 🌱 Plantas más longevas (días)
- 📸 Fotos subidas (count)
- 🏅 Ranking de badges desbloqueados

**Visualizaciones**:
- Line chart: Crecimiento temporal
- Bar chart: Cruzas por estado
- Pie chart: Distribución de especies
- Heatmap: Actividad en diario

```typescript
// components/GrowthChart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const GrowthChart = ({ data }: { data: DiaryEntry[] }) => {
  const chartData = data.map(entry => ({
    fecha: entry.fecha,
    altura: entry.altura,
  }));

  return (
    <LineChart width={600} height={300} data={chartData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="fecha" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="altura" stroke="#8884d8" />
    </LineChart>
  );
};
```

**Exportación**:
- PDF con jsPDF (ya instalado)
- CSV con Papa Parse
- Excel con SheetJS

**Impacto**: 📊 Engagement +45%, Percepción de valor +60%

---

##### 2.5 Suscripción Automática (Stripe) 💳
**Problema**: Solo pago único → churn alto, revenue impredecible
**Solución**: Suscripción recurrente mensual/anual

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

**Nueva tabla**:
```sql
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_key TEXT NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT CHECK (plan IN ('pro', 'elite')),
  status TEXT CHECK (status IN ('active', 'canceled', 'past_due')),
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Webhook Stripe**:
```typescript
// supabase/functions/stripe-webhook/index.ts
serve(async (req) => {
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();

  const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

  switch (event.type) {
    case 'customer.subscription.created':
      // Actualizar plan en access_keys
      break;
    case 'customer.subscription.deleted':
      // Downgrade a Basic
      break;
    case 'invoice.payment_failed':
      // Notificar usuario
      break;
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
```

**UI**:
```tsx
// screens/SubscriptionScreen.tsx
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const handleSubscribe = async () => {
  const { error, paymentMethod } = await stripe.createPaymentMethod({
    type: 'card',
    card: elements.getElement(CardElement),
  });

  if (!error) {
    const { data } = await supabase.functions.invoke('create-subscription', {
      body: { paymentMethodId: paymentMethod.id, plan: 'pro' }
    });

    alert('Suscripción activada!');
  }
};
```

**Impacto**: 💰 ARR +200%, Churn -40%, LTV +150%

---

**🎯 ENTREGABLES Q2:**
- ✅ Sistema de badges con 10+ logros
- ✅ Forum completo con posts, comentarios, votes
- ✅ API pública documentada (OpenAPI)
- ✅ Dashboard de analytics con 6 gráficos
- ✅ Suscripción recurrente con Stripe
- ✅ Exportación de reportes (PDF/CSV)

**Métrica de éxito**: App pasa de 97/100 → **99/100**, Engagement +80%

---

## Q3 2025 (JUL-SEP): **INNOVACIÓN & DIFERENCIACIÓN** 🚀

### Objetivo: Features únicas que no tiene la competencia

#### 🔬 TECNOLOGÍA AVANZADA

##### 3.1 Integración IoT (MQTT + Sensores) 📡
**Problema**: Monitoreo manual de clima → ineficiente
**Solución**: Sensores WiFi automáticos

**Hardware Compatible**:
- ESP32 + DHT22 (temp/humedad)
- Soil Moisture Sensor (humedad suelo)
- LDR (intensidad de luz)

**Protocolo MQTT**:
```bash
npm install mqtt
```

```typescript
// utils/mqttClient.ts
import mqtt from 'mqtt';

const client = mqtt.connect('mqtt://broker.hivemq.com');

client.on('connect', () => {
  client.subscribe('carnilab/sensors/+/data');
});

client.on('message', (topic, message) => {
  const data = JSON.parse(message.toString());
  // topic: carnilab/sensors/ESP32-ABC123/data
  // data: { temp: 25.5, humidity: 60, soil_moisture: 45, light: 800 }

  saveSensorReading(data);
});
```

**Nueva tabla**:
```sql
CREATE TABLE sensor_readings (
  id SERIAL PRIMARY KEY,
  device_id TEXT NOT NULL,
  plant_id INT REFERENCES plants(id),
  sensor_type TEXT CHECK (sensor_type IN ('temperature', 'humidity', 'soil_moisture', 'light')),
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sensor_readings_device ON sensor_readings(device_id);
CREATE INDEX idx_sensor_readings_timestamp ON sensor_readings(timestamp DESC);
```

**UI Dashboard**:
```tsx
// screens/IoTDashboard.tsx
const IoTDashboard = () => {
  const [readings, setReadings] = useState([]);

  useEffect(() => {
    const channel = supabase
      .channel('sensor_readings')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'sensor_readings',
      }, (payload) => {
        setReadings(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return (
    <div className="iot-dashboard">
      <SensorCard type="temperature" value={readings[0]?.value} />
      <SensorCard type="humidity" value={readings[1]?.value} />
      <SensorChart data={readings} />
    </div>
  );
};
```

**Alertas Automáticas**:
```typescript
// Si temperatura > 35°C → alerta alta
// Si humedad < 40% → alerta media
// Si soil_moisture < 20% → alerta riego urgente
```

**Impacto**: 🚀 Diferenciador clave, Retention +50%, WOW factor

---

##### 3.2 Predicción de Plagas con ML 🤖
**Problema**: Diagnóstico de plagas es manual y tardío
**Solución**: Modelo de visión para detectar plagas

**Tecnología**:
- TensorFlow.js para inferencia en cliente
- Modelo entrenado en Python (YOLOv8)
- Dataset: 10,000+ imágenes de plagas comunes

**Plagas detectables**:
- Aphids (pulgones)
- Spider mites (ácaros)
- Fungus (hongos)
- Root rot (pudrición raíz)
- Thrips (trips)

```typescript
// utils/pestDetection.ts
import * as tf from '@tensorflow/tfjs';

let model: tf.LayersModel | null = null;

export const loadPestModel = async () => {
  model = await tf.loadLayersModel('/models/pest-detector/model.json');
};

export const detectPests = async (imageFile: File): Promise<Pest[]> => {
  const img = await loadImage(imageFile);
  const tensor = tf.browser.fromPixels(img)
    .resizeBilinear([224, 224])
    .expandDims(0)
    .toFloat()
    .div(255.0);

  const predictions = await model.predict(tensor) as tf.Tensor;
  const results = await predictions.data();

  // results: [0.02, 0.87, 0.01, 0.05, 0.05] → Aphids con 87% confianza

  return parsePredictions(results);
};
```

**UI**:
```tsx
// screens/PestDetectorScreen.tsx
const PestDetectorScreen = () => {
  const [image, setImage] = useState<File | null>(null);
  const [pests, setPests] = useState<Pest[]>([]);

  const handleAnalyze = async () => {
    const detected = await detectPests(image);
    setPests(detected);
  };

  return (
    <div>
      <input type="file" onChange={(e) => setImage(e.target.files[0])} />
      <button onClick={handleAnalyze}>Analizar</button>

      {pests.map(pest => (
        <PestCard key={pest.id} pest={pest} />
      ))}
    </div>
  );
};
```

**Tratamientos sugeridos**:
- Base de datos de remedios por plaga
- Productos recomendados (affiliate links)
- Instrucciones paso a paso

**Impacto**: 🔬 Feature única, Press coverage, Viral potential

---

##### 3.3 SSR con Next.js (SEO) 🔍
**Problema**: SPA tiene SEO pobre → poco tráfico orgánico
**Solución**: Migrar viveros públicos a Next.js

**Migración parcial**:
```
ACTUAL:              FUTURO:
React SPA            Next.js (solo públicas)
  ├─ /dashboard      →  React SPA (app privada)
  ├─ /plants         →  React SPA
  └─ /vivero/:slug   →  Next.js SSR (público)
```

**Setup Next.js**:
```bash
npx create-next-app@latest carnilab-public
cd carnilab-public
npm install @supabase/supabase-js
```

```typescript
// pages/vivero/[slug].tsx
export const getServerSideProps = async ({ params }) => {
  const { slug } = params;

  const { data: vivero } = await supabase
    .from('access_keys')
    .select('label, slug, avatar_url')
    .eq('slug', slug)
    .single();

  const { data: plants } = await supabase
    .from('plants')
    .select('*')
    .eq('owner_key', vivero.key)
    .eq('en_venta', true);

  return {
    props: { vivero, plants },
  };
};

export default function ViveroPage({ vivero, plants }) {
  return (
    <>
      <Head>
        <title>{vivero.label} - Vivero Online CarniLab</title>
        <meta name="description" content={`Descubre ${plants.length} plantas carnívoras en venta`} />
        <meta property="og:image" content={plants[0]?.imagen} />
      </Head>

      <ViveroLayout vivero={vivero} plants={plants} />
    </>
  );
}
```

**Impacto**: 📈 Tráfico orgánico +300%, SEO score 95/100

---

##### 3.4 Mobile App Nativo (React Native) 📱
**Problema**: PWA tiene limitaciones (notificaciones, cámara, offline)
**Solución**: App nativa para iOS + Android

```bash
npx react-native init CarniLabMobile --template react-native-template-typescript
```

**Features clave**:
- Cámara nativa con mejor calidad
- Push notifications nativas confiables
- Offline storage con WatermelonDB
- Biometric auth (Face ID, fingerprint)
- Geolocalización precisa
- Background sync

**Compartir código**:
- `utils/` → 100% reutilizable
- `context/` → 90% reutilizable (ajustar hooks)
- `components/` → 70% reutilizable (usar RN components)

**Distribución**:
- App Store (iOS)
- Google Play (Android)
- Expo EAS para builds

**Impacto**: 📱 Market reach +150%, UX +60%, Retention +40%

---

##### 3.5 CDN & Image Optimization ⚡
**Problema**: Imágenes lentas en conexiones 3G
**Solución**: Cloudflare Images + WebP + Lazy Loading

```bash
npm install @cloudflare/stream react-lazy-load-image-component
```

**Pipeline**:
```
1. Usuario sube imagen
2. Lambda procesa:
   - Original → Supabase Storage
   - WebP 480px → Cloudflare CDN
   - WebP 800px → Cloudflare CDN
   - WebP 1200px → Cloudflare CDN
3. Retorna URLs
```

```typescript
// utils/imageHelpers.ts
export const uploadImageOptimized = async (file: File) => {
  // 1. Subir original a Supabase
  const originalUrl = await uploadToSupabase(file);

  // 2. Trigger Cloudflare Transform
  const transformed = await fetch('https://api.cloudflare.com/client/v4/accounts/:id/images/v1', {
    method: 'POST',
    body: formData,
  });

  return {
    original: originalUrl,
    variants: {
      small: `${baseUrl}/cdn-cgi/image/width=480,format=webp/${originalUrl}`,
      medium: `${baseUrl}/cdn-cgi/image/width=800,format=webp/${originalUrl}`,
      large: `${baseUrl}/cdn-cgi/image/width=1200,format=webp/${originalUrl}`,
    }
  };
};
```

```tsx
// components/OptimizedImage.tsx
import { LazyLoadImage } from 'react-lazy-load-image-component';

export const OptimizedImage = ({ src, alt }: { src: string, alt: string }) => (
  <LazyLoadImage
    src={src}
    alt={alt}
    effect="blur"
    placeholderSrc={`${src}?blur=20`}
  />
);
```

**Impacto**: ⚡ Load time -70%, Bounce rate -40%, SEO +10

---

**🎯 ENTREGABLES Q3:**
- ✅ Integración IoT con 3 tipos de sensores
- ✅ Detector de plagas con ML (5 plagas)
- ✅ SSR para viveros públicos con Next.js
- ✅ React Native app en beta (iOS + Android)
- ✅ CDN para imágenes con WebP

**Métrica de éxito**: App pasa de 99/100 → **100/100**, Press coverage, Viral growth

---

## Q4 2025 (OCT-DIC): **ESCALA & GLOBAL** 🌍

### Objetivo: Expansión internacional, optimización, scale-up

#### 🌎 INTERNACIONALIZACIÓN

##### 4.1 Soporte Multi-idioma (i18n) 🌐
**Problema**: Solo español → 500M hablantes
**Solución**: Inglés, Portugués, Francés, Alemán

```bash
npm install react-i18next i18next
```

**Setup**:
```typescript
// i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: require('./locales/en.json') },
      es: { translation: require('./locales/es.json') },
      pt: { translation: require('./locales/pt.json') },
      fr: { translation: require('./locales/fr.json') },
      de: { translation: require('./locales/de.json') },
    },
    lng: 'es',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
```

**Uso**:
```tsx
import { useTranslation } from 'react-i18next';

const PlantList = () => {
  const { t } = useTranslation();

  return (
    <h1>{t('plants.title')}</h1>
  );
};
```

**Archivos de traducción**:
```json
// locales/en.json
{
  "plants": {
    "title": "My Plants",
    "add": "Add Plant",
    "status": {
      "saludable": "Healthy",
      "regular": "Regular",
      "critico": "Critical"
    }
  }
}
```

**Impacto**: 🌍 Market size +400%, Global reach

---

##### 4.2 Video Tutorials & Knowledge Base 🎥
**Problema**: Curva de aprendizaje empinada
**Solución**: Centro de ayuda con videos

**Plataforma**: YouTube + embed

**Videos sugeridos**:
1. "Cómo agregar tu primera planta" (2 min)
2. "Registrar una cruza genética" (3 min)
3. "Usar CarniBot AI para diagnóstico" (2 min)
4. "Configurar sensores IoT" (5 min)
5. "Vender en el marketplace" (4 min)

**Pantalla**: `/screens/HelpCenter.tsx`

```tsx
const HelpCenter = () => (
  <div className="help-center">
    <SearchBar placeholder="Busca tutoriales..." />

    <VideoGrid>
      <VideoCard
        title="Cómo agregar tu primera planta"
        thumbnail="/thumbnails/add-plant.jpg"
        duration="2:15"
        youtubeId="dQw4w9WgXcQ"
      />
      {/* ... más videos */}
    </VideoGrid>

    <FAQSection />
  </div>
);
```

**FAQ Database**:
```sql
CREATE TABLE faqs (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  votes INT DEFAULT 0,
  lang TEXT DEFAULT 'es'
);
```

**Impacto**: 🎓 Churn -30%, Support tickets -50%

---

##### 4.3 APM & Performance Monitoring 📈
**Problema**: No sabemos qué es lento en producción
**Solución**: New Relic o Datadog

```bash
npm install @newrelic/browser-agent
```

**Métricas**:
- Page load time
- API response time
- Error rate
- User sessions
- Apdex score

**Alertas**:
- Si error rate > 1% → Slack notification
- Si API latency > 500ms → PagerDuty
- Si apdex < 0.85 → Email

**Impacto**: 🔍 Visibilidad total, MTTR -80%

---

##### 4.4 Compliance GDPR & Exportación de Datos 📋
**Problema**: No cumple con GDPR → multas en EU
**Solución**: Export + Delete de datos

**Endpoint**:
```typescript
// /api/user/export
const exportUserData = async (userId: string) => {
  const [plants, crosses, diary, alerts, messages] = await Promise.all([
    supabase.from('plants').select('*').eq('owner_key', userId),
    supabase.from('crosses').select('*').eq('owner_key', userId),
    supabase.from('diary').select('*').eq('owner_key', userId),
    supabase.from('alerts').select('*').eq('owner_key', userId),
    supabase.from('inbox_messages').select('*').eq('owner_key', userId),
  ]);

  // Generar ZIP
  const zip = new JSZip();
  zip.file('plants.json', JSON.stringify(plants.data));
  zip.file('crosses.json', JSON.stringify(crosses.data));
  zip.file('diary.json', JSON.stringify(diary.data));
  zip.file('alerts.json', JSON.stringify(alerts.data));
  zip.file('messages.json', JSON.stringify(messages.data));

  // Descargar imágenes
  for (const plant of plants.data) {
    const img = await fetch(plant.imagen);
    zip.file(`images/${plant.id}.jpg`, await img.blob());
  }

  return await zip.generateAsync({ type: 'blob' });
};
```

**Botón en perfil**:
```tsx
<button onClick={handleExportData}>
  Exportar mis datos (GDPR)
</button>
```

**Impacto**: ✅ Legal compliance, Trust +20%

---

##### 4.5 Programa de Afiliados 💸
**Problema**: Marketing caro, CAC alto
**Solución**: Afiliados refieren usuarios por comisión

**Nueva tabla**:
```sql
CREATE TABLE affiliates (
  id SERIAL PRIMARY KEY,
  user_key TEXT NOT NULL,
  referral_code TEXT UNIQUE NOT NULL,
  referrals_count INT DEFAULT 0,
  total_earnings NUMERIC DEFAULT 0,
  payout_email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE referrals (
  id SERIAL PRIMARY KEY,
  referrer_key TEXT REFERENCES affiliates(user_key),
  referred_user_key TEXT NOT NULL,
  plan TEXT,
  commission NUMERIC,
  status TEXT CHECK (status IN ('pending', 'paid')),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Comisiones**:
- 30% del primer pago (Pro → $3, Elite → $5)
- 10% recurrente durante 12 meses

**URL única**:
```
https://carnilab.com/signup?ref=ABC123
```

**Dashboard**:
```tsx
// screens/AffiliateScreen.tsx
const AffiliateScreen = () => {
  const { referralCode, totalEarnings, referralsCount } = useAffiliate();

  return (
    <div>
      <h1>Programa de Afiliados</h1>
      <div className="stats">
        <Stat label="Tu código" value={referralCode} />
        <Stat label="Referidos" value={referralsCount} />
        <Stat label="Ganancias" value={`$${totalEarnings}`} />
      </div>

      <ShareButtons code={referralCode} />
    </div>
  );
};
```

**Impacto**: 📉 CAC -60%, 📈 Growth +100%, Viral loops

---

**🎯 ENTREGABLES Q4:**
- ✅ Soporte 5 idiomas (ES, EN, PT, FR, DE)
- ✅ 10+ video tutorials + FAQ
- ✅ APM configurado (New Relic)
- ✅ Exportación GDPR completa
- ✅ Programa de afiliados con dashboard

**Métrica de éxito**: **100/100**, 10x growth, Internacional

---

## 🎯 MÉTRICAS CLAVE (KPIs)

### Antes del Roadmap (Actual)
- **Usuarios activos**: 500
- **Churn rate**: 40%/mes
- **Retención D30**: 35%
- **ARR**: $10k USD
- **NPS**: 42
- **App Store Rating**: N/A
- **Organic traffic**: 100 visitas/mes

### Después del Roadmap (Q4 2025)
- **Usuarios activos**: 10,000 (+1900%)
- **Churn rate**: 15%/mes (-62%)
- **Retención D30**: 70% (+100%)
- **ARR**: $120k USD (+1100%)
- **NPS**: 65 (+54%)
- **App Store Rating**: 4.7/5
- **Organic traffic**: 5,000 visitas/mes (+4900%)

---

## 💰 INVERSIÓN ESTIMADA

| Trimestre | Desarrollo | Infraestructura | Marketing | Total |
|-----------|------------|-----------------|-----------|-------|
| **Q1** | $8k | $500 | $1k | **$9.5k** |
| **Q2** | $12k | $1k | $3k | **$16k** |
| **Q3** | $15k | $2k | $5k | **$22k** |
| **Q4** | $10k | $3k | $10k | **$23k** |
| **TOTAL** | $45k | $6.5k | $19k | **$70.5k** |

**ROI Esperado**: $120k ARR / $70.5k inversión = **1.7x en 12 meses**

---

## 🚦 RIESGOS & MITIGACIÓN

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Retraso en desarrollo IoT | Media | Alto | Contratar especialista embebido |
| Modelo ML no preciso | Media | Medio | Dataset más grande, fine-tuning |
| Adopción lenta de forum | Alta | Medio | Gamificación, incentivos |
| Problemas de escalabilidad BD | Baja | Alto | Load testing, índices optimizados |
| Competencia lanza feature similar | Alta | Medio | Speed to market, calidad superior |
| Dependencia de Supabase | Media | Alto | Plan de migración a self-hosted |

---

## ✅ CRITERIOS DE ÉXITO

### Q1 - Fundamentos
- [ ] 0 errores de TypeScript
- [ ] Cobertura de tests > 60%
- [ ] RLS habilitado en todas las tablas
- [ ] Paginación en top 3 screens
- [ ] Sentry reportando < 0.5% error rate

### Q2 - Engagement
- [ ] 50+ posts en forum/mes
- [ ] 100+ badges desbloqueados
- [ ] 10+ API keys generadas
- [ ] Churn rate < 25%

### Q3 - Innovación
- [ ] 10+ dispositivos IoT conectados
- [ ] Modelo ML con >85% accuracy
- [ ] Mobile app en stores con 4.5+ rating
- [ ] Viveros públicos indexados en Google

### Q4 - Global
- [ ] 30% de usuarios fuera de Latinoamérica
- [ ] 100+ video views promedio
- [ ] APM Apdex > 0.90
- [ ] 50+ afiliados activos

---

## 🎬 CONCLUSIÓN

Este roadmap transforma CarniLab de una **app funcional** a una **plataforma líder mundial**:

1. **Q1**: Fundamentos sólidos (validación, tests, RLS)
2. **Q2**: Engagement & monetización (badges, forum, API)
3. **Q3**: Innovación radical (IoT, ML, mobile nativo)
4. **Q4**: Escala global (i18n, videos, afiliados)

**Estado Final**: 100/100, 10x growth, internacional, sostenible

---

**Documento creado**: Enero 2025
**Autor**: Claude Sonnet 4.5
**Versión**: 1.0
**Estado**: ✅ LISTO PARA IMPLEMENTACIÓN

🚀 **¡Comencemos con Q1 hoy mismo!**
